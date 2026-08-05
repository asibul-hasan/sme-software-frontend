import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Hrm1321DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';

/**
 * One row of the approval inbox. Field names mirror the backend
 * `Hrm1301LeaveApplicationDto` exactly (snake_case) so the common-table
 * `ColumnDef.field` values bind straight through.
 */
export interface LeaveRequest {
  leave_application_no: number;
  employee_no: number;
  employee_id?: string | null;
  employee_name?: string | null;
  department_no?: number | null;
  department_name?: string | null;
  designation_no?: number | null;
  designation_name?: string | null;
  leave_type_no: number;
  leave_type_name?: string | null;
  from_date: string;
  to_date: string;
  total_days: number;
  is_half_day?: number | null;
  leave_year: number;
  reason?: string | null;
  status: number;
  reliever_employee_no?: number | null;
  reliever_name?: string | null;
  attachment_path?: string | null;
  decision_remarks?: string | null;
  /**
   * The approval state for the CURRENT approver, relative to the layer they sit on:
   * 'PENDING' (on my layer now — I can act), 'WAITING' (an earlier layer is still deciding),
   * 'APPROVED' (my layer already passed). Server-authoritative.
   */
  approval_state?: 'PENDING' | 'WAITING' | 'APPROVED' | string | null;
  /** True only when this approver may approve/reject this leave right now. */
  can_act?: boolean | null;
  /** Client-side only — bulk-approval checkbox. */
  selected?: number | boolean;
}

/** Balance snapshot shown beside the decision panel. */
export interface LeaveBalanceSnapshot {
  entitled_days: number;
  accrued_days: number;
  consumed_days: number;
  carried_forward: number;
  available_days: number;
}

const EMPTY_BALANCE: LeaveBalanceSnapshot = {
  entitled_days: 0,
  accrued_days: 0,
  consumed_days: 0,
  carried_forward: 0,
  available_days: 0,
};

@Injectable()
export class Hrm1321ModelService {
  private data = inject(Hrm1321DataService);
  private toastr = inject(ToastrService);

  readonly requests = signal<LeaveRequest[]>([]);
  readonly selectedRequest = signal<LeaveRequest | null>(null);
  readonly balance = signal<LeaveBalanceSnapshot>(EMPTY_BALANCE);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  readonly pendingCount = computed(() => this.requests().length);

  // ── Loads ────────────────────────────────────────────────────────────────

  /** The filter values the list is currently loaded with — every filter is server-side. */
  private filters: {
    status?: number | null;
    department_no?: number | null;
    designation_no?: number | null;
    employee_no?: number | null;
    leave_type_no?: number | null;
  } = {};

  /**
   * (Re)load the approval list from the server. Pass a partial filter set to change filters; it is
   * merged over the current ones, so any single filter change re-queries with all of them. Called
   * with no argument (e.g. after an approval) to reload with the same filters.
   */
  loadApprovalList(filters?: Partial<typeof this.filters>): void {
    if (filters !== undefined) this.filters = { ...filters };
    this.isLoading.set(true);
    this.data.loadApprovalList(this.filters).subscribe({
      next: (res) => {
        const rows = isSuccess(res) && res.data ? res.data : [];
        this.requests.set(rows.map((r) => ({ ...r, selected: 0 })));
        // Keep the current selection if it survived the reload, else clear it.
        const keep = this.selectedRequest()
          ? rows.find((r) => r.leave_application_no === this.selectedRequest()!.leave_application_no)
          : null;
        this.selectRequest(keep ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.requests.set([]);
        this.selectRequest(null);
        this.isLoading.set(false);
        this.toastr.error('Failed to load leave requests');
      },
    });
  }

  selectRequest(req: LeaveRequest | null): void {
    this.selectedRequest.set(req);
    if (!req) {
      this.balance.set(EMPTY_BALANCE);
      return;
    }
    this.data.loadBalance(req.employee_no, req.leave_type_no, req.leave_year).subscribe({
      next: (res) => {
        const b = isSuccess(res) && res.data ? res.data : null;
        this.balance.set(b ? { ...EMPTY_BALANCE, ...b } : EMPTY_BALANCE);
      },
      error: () => this.balance.set(EMPTY_BALANCE),
    });
  }

  // ── Decisions ────────────────────────────────────────────────────────────

  /** Approve one request. Remarks are optional per the business document. */
  approve(no: number, remarks?: string): void {
    this.decide(this.data.approve(no, remarks), 'Leave approved');
  }

  /** Reject one request. The backend rejects the call without a reason. */
  reject(no: number, remarks: string): void {
    this.decide(this.data.reject(no, remarks), 'Leave rejected');
  }

  /** Bulk-approve every checked row (doc: "allowing bulk multi-approval"). */
  approveSelected(remarks?: string): void {
    // Only rows on THIS approver's layer can be approved — a Waiting/Passed row would be
    // rejected server-side, so never send it.
    const checked = this.requests().filter((r) => r.selected && r.can_act === true);
    if (!checked.length) return;
    this.isSaving.set(true);
    let done = 0;
    let succeeded = 0;
    checked.forEach((r) => {
      this.data.approve(r.leave_application_no, remarks).subscribe({
        next: () => { succeeded++; this.afterBulk(++done, checked.length, succeeded); },
        error: () => this.afterBulk(++done, checked.length, succeeded),
      });
    });
  }

  private afterBulk(done: number, total: number, succeeded: number): void {
    if (done < total) return;
    this.isSaving.set(false);
    if (succeeded > 0) {
      this.toastr.success(`${succeeded} leave request(s) approved`);
    }
    this.loadApprovalList();
  }

  private decide(call: ReturnType<Hrm1321DataService['approve']>, message: string): void {
    this.isSaving.set(true);
    call.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (isSuccess(res)) {
          this.toastr.success(message);
          this.loadApprovalList();
        }
        // Non-success responses (4xx wrapped in body) — the global interceptor handles the toast.
      },
      // HTTP errors (400/500) — the global apiErrorInterceptor already shows the toast.
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  toggleRowSelection(no: number, checked: boolean | number): void {
    this.requests.update((rows) =>
      rows.map((r) => (r.leave_application_no === no ? { ...r, selected: checked } : r)),
    );
  }
}
