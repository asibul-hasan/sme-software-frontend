import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, Subject, debounceTime } from 'rxjs';
import { Hrm1301DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface LeaveApplication extends BaseEntity {
  leave_application_no: number;
  employee_no: number;
  leave_type_no: number;
  from_date: string;
  to_date: string;
  total_days: number;
  is_half_day: number;
  leave_year?: number | null;
  reason?: string | null;
  status: number;
  approved_by?: number | null;
  approved_at?: string | null;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
  reliever_employee_no?: number | null;
  reliever_name?: string | null;
  attachment_path?: string | null;
  /** Server-authoritative: the applicant may still edit until an approver acts. */
  can_edit?: boolean | null;
  decision_remarks?: string | null;
}

export interface LeaveBalance {
  employee_no: number; leave_type_no: number; leave_year: number;
  entitled_days: number; accrued_days: number; consumed_days: number; carried_forward: number; available_days: number;
}

export interface LeaveTypeOption {
  leave_type_no: number; leave_type_id: string; leave_type_name: string; is_paid: number;
}

type LeaveAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** State + form + leave workflow orchestration for HRM_1301 – Leave Application. */
@Injectable()
export class Hrm1301ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1301DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  leaves        = signal<LeaveApplication[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  leaveTypes    = signal<LeaveTypeOption[]>([]);
  balance       = signal<LeaveBalance | null>(null);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  activeTab     = signal<'application' | 'balance'>('application');
  balanceLeaveType = signal<number | null>(null);

  filterFromDate = signal<string>(this.getFirstDayOfMonth());
  filterToDate = signal<string>(this.getLastDayOfMonth());
  balanceHistory = signal<LeaveApplication[]>([]);
  filterBalance = signal<LeaveBalance | null>(null);

  private refreshBalance$ = new Subject<void>();
  private refreshHistory$ = new Subject<void>();

  constructor() {
    this.refreshBalance$.pipe(debounceTime(150)).subscribe(() => this.executeRefreshBalance());
    this.refreshHistory$.pipe(debounceTime(150)).subscribe(() => this.executeRefreshFilteredHistory());
  }

  private getFirstDayOfMonth(): string {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }

  private getLastDayOfMonth(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  }

  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }
  leaveTypeName(no?: number | null): string {
    return this.leaveTypes().find((t) => t.leave_type_no === no)?.leave_type_name ?? '';
  }

  /**
   * Status: 1=Draft 2=Applied 3=Approved 4=Rejected 5=Cancelled.
   *
   * There is no Submit step — saving applies the leave immediately. The applicant keeps
   * ownership (may edit) until the FIRST approver acts; `canEdit` carries that decision
   * from the server, so the UI can't disagree with what the API will allow.
   */
  readonly canEdit = signal(true);
  readonly isEditable = computed(
    () => (this.status() === 1 || this.status() === 2) && this.canEdit(),
  );

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.leaves()
      .filter((l) => this.employeeName(l.employee_no).toLowerCase().includes(term) || (l.from_date || '').includes(term))
      .sort((a, b) => b.leave_application_no - a.leave_application_no);
  });

  refreshFilteredHistory(): void {
    this.refreshHistory$.next();
  }

  private executeRefreshFilteredHistory(): void {
    const emp = this.form?.get('employee_no')?.value;
    if (!emp) {
      this.balanceHistory.set([]);
      this.filterBalance.set(null);
      return;
    }
    this.data.loadFilteredHistory(emp, this.balanceLeaveType(), this.filterFromDate(), this.filterToDate()).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.balanceHistory.set(res.data); }
    });
    
    const filterType = this.balanceLeaveType();
    if (filterType) {
      const year = this.filterFromDate() ? new Date(this.filterFromDate()).getFullYear() : undefined;
      this.data.loadBalance(emp, filterType, year).subscribe({
        next: (res) => { if (isSuccess(res) && res.data) this.filterBalance.set(res.data); }
      });
    } else {
      this.filterBalance.set(null);
    }
  }

  applicant = computed(() => {
    const empNo = this.form?.get('employee_no')?.value;
    if (!empNo) return null;
    return this.employees().find(e => e.employee_no === empNo) || null;
  });

  relievers = computed(() => {
    const app = this.applicant();
    if (!app) return [];
    return this.employees().filter(e => e.department_no === app.department_no && e.employee_no !== app.employee_no);
  });

  form!: FormGroup;

  initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      leave_application_no: [null],
      employee_no:          [null, [Validators.required]],
      leave_type_no:        [null, [Validators.required]],
      from_date:            [today, [Validators.required]],
      to_date:              [today, [Validators.required]],
      is_half_day:          [0],
      reason:               [''],
      need_reliever:        [0],
      reliever_employee_no: [null],
      attachment_path:      [null],
      is_active:            [1],
    });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
  }
  loadLeaveTypes(): void {
    this.data.loadLeaveTypes().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.leaveTypes.set(res.data); },
    });
  }

  refreshBalance(): void {
    this.refreshBalance$.next();
  }

  private executeRefreshBalance(): void {
    const emp = this.form.get('employee_no')?.value;
    const type = this.form.get('leave_type_no')?.value;
    const from = this.form.get('from_date')?.value as string;
    
    // Always refresh history when form selection changes
    this.refreshFilteredHistory();

    if (!emp || !type) { this.balance.set(null); return; }
    const year = from ? new Date(from).getFullYear() : undefined;
    this.data.loadBalance(emp, type, year).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.balance.set(res.data); },
    });
  }

  loadLeaves(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadLeaves().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.leaves.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((l) => l.leave_application_no === reselectNo) : null;
            this.selectLeave(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load leave applications'),
    });
  }

  selectLeave(item: LeaveApplication): void {
    this.selectedNo.set(item.leave_application_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadLeaveDetail(item.leave_application_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          // Server decides: editable only while pending AND no approver has acted.
          this.canEdit.set(d.can_edit !== false);
          this.form.patchValue({
            leave_application_no: d.leave_application_no,
            employee_no:          d.employee_no,
            leave_type_no:        d.leave_type_no,
            from_date:            (d.from_date ?? '').slice(0, 10),
            to_date:              (d.to_date ?? '').slice(0, 10),
            is_half_day:          d.is_half_day ?? 0,
            reason:               d.reason,
            need_reliever:        d.reliever_employee_no ? 1 : 0,
            reliever_employee_no: d.reliever_employee_no,
            attachment_path:      d.attachment_path,
            is_active:            d.is_active,
          }, { emitEvent: false });
          this.refreshBalance();
        }
      },
      error: () => this.toastr.error('Failed to load leave details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();

    const payload = {
      leave_application_no: val.leave_application_no,
      employee_no:          val.employee_no,
      leave_type_no:        val.leave_type_no,
      from_date:            val.from_date,
      to_date:              val.to_date,
      is_half_day:          val.is_half_day ? 1 : 0,
      // No separate Submit step: saving IS applying. The backend routes the
      // application into the configured approval workflow and owns the status.
      reason:               val.reason,
      reliever_employee_no: val.need_reliever ? val.reliever_employee_no : null,
      attachment_path:      val.attachment_path,
      branch_no:            this.currentBranchNo,
      is_active:            val.is_active,
    };

    const obs = isUpdate ? this.data.updateLeave(this.selectedNo()!, payload) : this.data.saveLeave(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Leave updated' : 'Leave saved as draft');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.leave_application_no ?? null);
          this.loadLeaves(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  doAction(action: LeaveAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Leave ${action}${action === 'submit' || action === 'cancel' ? 'ted' : action === 'reject' ? 'ed' : 'd'}`);
          this.loadLeaves(no);
        } else {
          this.toastr.error(res.message || `${action} failed`);
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteLeave(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Leave deleted');
          this.loadLeaves(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    const today = new Date().toISOString().split('T')[0];
    this.selectedNo.set(null);
    this.status.set(1);
    this.canEdit.set(true);       // a brand-new application is always editable
    this.balance.set(null);
    this.form?.reset({ from_date: today, to_date: today, is_half_day: 0, need_reliever: 0, is_active: 1 }, { emitEvent: false });
  }
}
