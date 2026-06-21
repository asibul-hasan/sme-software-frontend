import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, Observable } from 'rxjs';
import { Hrm1103DataService, ShiftLookup } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { ApiResponse, isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Adjustment extends BaseEntity {
  adjustment_no: number;
  employee_no: number;
  att_date: string;
  requested_status: number;
  requested_in?: string | null;
  requested_out?: string | null;
  reason?: string | null;
  status: number;            // 1=Pending 2=Approved 3=Rejected
  approved_by?: number | null;
  approved_at?: string | null;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

type AdjAction = 'approve' | 'reject';

/** State + form + workflow orchestration for HRM_1103 – Attendance Adjustment. */
@Injectable()
export class Hrm1103ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1103DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  adjustments   = signal<Adjustment[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  shifts        = signal<ShiftLookup[]>([]);
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

  readonly isPending = computed(() => this.status() === 1);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.adjustments()
      .filter((a) => this.employeeName(a.employee_no).toLowerCase().includes(term) || (a.att_date || '').includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.adjustment_no - a.adjustment_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      adjustment_no:    [null],
      employee_nos:     [[], [Validators.required]],
      att_date:         [new Date().toISOString().split('T')[0], [Validators.required]],
      requested_status: [1, [Validators.required]],
      use_shift_in:     [false],
      use_shift_out:    [false],
      requested_in:     [null],
      requested_out:    [null],
      reason:           ['', [Validators.required]],
      is_active:        [1],
    });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
    this.data.loadShifts().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.shifts.set(res.data.filter((s) => s.is_active === 1)); },
    });
  }

  loadAdjustments(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadAdjustments().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.adjustments.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((a) => a.adjustment_no === reselectNo) : null;
            this.selectAdjustment(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load adjustments'),
    });
  }

  selectAdjustment(item: Adjustment): void {
    this.selectedNo.set(item.adjustment_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadAdjustmentDetail(item.adjustment_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.form.patchValue({
            adjustment_no:    d.adjustment_no,
            employee_nos:     [d.employee_no],
            att_date:         (d.att_date ?? '').slice(0, 10),
            requested_status: d.requested_status ?? 1,
            use_shift_in:     false,
            use_shift_out:    false,
            requested_in:     (d.requested_in as string ?? '')?.slice(0, 5) || null,
            requested_out:    (d.requested_out as string ?? '')?.slice(0, 5) || null,
            reason:           d.reason,
            is_active:        d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load adjustment details'),
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
    const employeeNos: number[] = Array.isArray(val.employee_nos) ? val.employee_nos : [val.employee_nos].filter(Boolean);
    const basePayload = {
      adjustment_no:    val.adjustment_no,
      att_date:         val.att_date,
      requested_status: val.requested_status,
      requested_in:     val.requested_in || null,
      requested_out:    val.requested_out || null,
      reason:           val.reason,
      branch_no:        this.currentBranchNo,
      is_active:        val.is_active,
    };
    const obs: Observable<ApiResponse<Adjustment> | ApiResponse<Adjustment>[]> = isUpdate
      ? this.data.updateAdjustment(this.selectedNo()!, { ...basePayload, employee_no: employeeNos[0] })
      : forkJoin(employeeNos.map((employee_no) => this.data.saveAdjustment({ ...basePayload, employee_no })));
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        const ok = Array.isArray(res) ? res.every(isSuccess) : isSuccess(res);
        if (ok) {
          this.toastr.success(isUpdate ? 'Adjustment updated' : 'Adjustment requested');
          const savedNo = isUpdate || Array.isArray(res) ? this.selectedNo() : (res.data?.adjustment_no ?? null);
          this.loadAdjustments(savedNo);
        } else {
          this.toastr.error('Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  doAction(action: AdjAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Adjustment ${action}${action === 'approve' ? 'd' : 'ed'}`);
          this.loadAdjustments(no);
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
    this.data.deleteAdjustment(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Adjustment deleted');
          this.loadAdjustments(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.form?.reset({
      att_date: new Date().toISOString().split('T')[0],
      employee_nos: [],
      requested_status: 1,
      use_shift_in: false,
      use_shift_out: false,
      is_active: 1,
    });
  }

  toggleShiftTime(kind: 'in' | 'out', checked: boolean): void {
    const shift = this.shifts()[0];
    if (kind === 'in') {
      this.form.get('use_shift_in')?.setValue(checked, { emitEvent: false });
      if (checked) this.form.get('requested_in')?.setValue((shift?.start_time || '09:00').slice(0, 5));
      checked ? this.form.get('requested_in')?.disable({ emitEvent: false }) : this.form.get('requested_in')?.enable({ emitEvent: false });
    } else {
      this.form.get('use_shift_out')?.setValue(checked, { emitEvent: false });
      if (checked) this.form.get('requested_out')?.setValue((shift?.end_time || '18:00').slice(0, 5));
      checked ? this.form.get('requested_out')?.disable({ emitEvent: false }) : this.form.get('requested_out')?.enable({ emitEvent: false });
    }
  }
}
