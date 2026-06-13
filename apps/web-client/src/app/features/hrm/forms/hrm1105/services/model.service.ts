import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1105DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Overtime extends BaseEntity {
  overtime_no: number;
  overtime_id: string;
  employee_no: number | null;
  ot_date: string | null;
  hours?: number | null;
  rate_multiplier?: number | null;
  hourly_rate?: number | null;
  ot_amount?: number | null;
  reason?: string | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

type OvertimeAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** State + form + workflow for HRM_1105 – Overtime. */
@Injectable()
export class Hrm1105ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1105DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  overtimes     = signal<Overtime[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  readonly isDraft = computed(() => this.status() === 1);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.overtimes()
      .filter((s) => (s.overtime_id || '').toLowerCase().includes(term) || this.employeeName(s.employee_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.overtime_no - a.overtime_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      overtime_no:     [null],
      overtime_id:     ['', [Validators.required, Validators.maxLength(30)]],
      employee_no:     [null, [Validators.required]],
      ot_date:         [new Date().toISOString().split('T')[0], [Validators.required]],
      hours:           [0, [Validators.required, Validators.min(0.01)]],
      rate_multiplier: [1.5, [Validators.required, Validators.min(0.01)]],
      hourly_rate:     [0, [Validators.min(0)]],
      reason:          [''],
      is_active:       [1],
    });
  }

  /** Live OT amount = hours × hourly_rate × multiplier. */
  otAmount(): number {
    const v = this.form?.getRawValue() ?? {};
    const n = (x: unknown) => Number(x) || 0;
    return n(v.hours) * n(v.hourly_rate) * n(v.rate_multiplier);
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
  }

  loadOvertimes(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadOvertimes().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.overtimes.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.overtime_no === reselectNo) : null;
            this.selectOvertime(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load overtime claims'),
    });
  }

  selectOvertime(item: Overtime): void {
    this.selectedNo.set(item.overtime_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadOvertimeDetail(item.overtime_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.form.patchValue({
            overtime_no:     d.overtime_no,
            overtime_id:     d.overtime_id,
            employee_no:     d.employee_no,
            ot_date:         d.ot_date ? d.ot_date.slice(0, 10) : null,
            hours:           d.hours ?? 0,
            rate_multiplier: d.rate_multiplier ?? 1.5,
            hourly_rate:     d.hourly_rate ?? 0,
            reason:          d.reason,
            is_active:       d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load overtime details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = { ...val, branch_no: this.currentBranchNo };
    const obs = isUpdate ? this.data.updateOvertime(this.selectedNo()!, payload) : this.data.saveOvertime(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Overtime updated' : 'Overtime created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.overtime_no ?? null);
          this.loadOvertimes(savedNo);
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: OvertimeAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<OvertimeAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', cancel: 'cancelled' };
          this.toastr.success(`Overtime ${past[action]}`);
          this.loadOvertimes(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteOvertime(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Overtime deleted'); this.loadOvertimes(null); if (callback) callback(); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.form?.reset({
      ot_date: new Date().toISOString().split('T')[0], hours: 0, rate_multiplier: 1.5, hourly_rate: 0, is_active: 1,
    });
  }
}
