import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
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
  sortDirection = signal<SortDirection>('');

  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }
  leaveTypeName(no?: number | null): string {
    return this.leaveTypes().find((t) => t.leave_type_no === no)?.leave_type_name ?? '';
  }

  /** Status: 1=Draft 2=Applied 3=Approved 4=Rejected 5=Cancelled. */
  readonly isEditable = computed(() => this.status() === 1 || this.status() === 2);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.leaves()
      .filter((l) => this.employeeName(l.employee_no).toLowerCase().includes(term) || (l.from_date || '').includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.leave_application_no - a.leave_application_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

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
    const emp = this.form.get('employee_no')?.value;
    const type = this.form.get('leave_type_no')?.value;
    const from = this.form.get('from_date')?.value as string;
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
          this.form.patchValue({
            leave_application_no: d.leave_application_no,
            employee_no:          d.employee_no,
            leave_type_no:        d.leave_type_no,
            from_date:            (d.from_date ?? '').slice(0, 10),
            to_date:              (d.to_date ?? '').slice(0, 10),
            is_half_day:          d.is_half_day ?? 0,
            reason:               d.reason,
            is_active:            d.is_active,
          });
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
      status:               1,   // save as Draft; use Submit to apply
      reason:               val.reason,
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
    this.balance.set(null);
    this.form?.reset({ from_date: today, to_date: today, is_half_day: 0, is_active: 1 });
  }
}
