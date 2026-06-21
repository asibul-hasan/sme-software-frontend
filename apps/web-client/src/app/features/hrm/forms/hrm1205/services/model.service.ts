import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1205DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, DesignationLookup, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface BonusLine {
  bonus_line_no: number;
  bonus_run_no: number;
  employee_no: number;
  base_salary: number;
  bonus_amount: number;
}

export interface BonusRun extends BaseEntity {
  bonus_run_no: number;
  bonus_id: string;
  bonus_name: string;
  bonus_type?: number | null;
  bonus_date?: string | null;
  bonus_period?: string | null;
  calculation_type?: number | null;
  applicability_type?: number | null;
  percentage_of_basic?: number | null;
  fixed_amount?: number | null;
  total_amount?: number | null;
  employee_count?: number | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
  selected_designation_nos?: number[] | null;
  selected_employee_nos?: number[] | null;
  lines?: BonusLine[];
}

type RunAction = 'calculate' | 'approve' | 'reject' | 'pay' | 'cancel';

/** State + form + workflow for HRM_1205 – Bonus / Festival. */
@Injectable()
export class Hrm1205ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1205DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  runs          = signal<BonusRun[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  designations  = signal<DesignationLookup[]>([]);
  lines         = signal<BonusLine[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  /** Status: 1=Draft 2=Calculated 3=Approved 4=Paid 5=Cancelled. Editable while Draft/Calculated. */
  readonly isEditable = computed(() => this.status() === 1 || this.status() === 2);
  readonly applicabilityType = computed(() => Number(this.form?.get('applicability_type')?.value ?? 1));
  readonly isDesignationWise = computed(() => this.applicabilityType() === 2);
  readonly isEmployeeWise = computed(() => this.applicabilityType() === 3);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.runs()
      .filter((r) => (r.bonus_id || '').toLowerCase().includes(term) || (r.bonus_name || '').toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.bonus_run_no - a.bonus_run_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      bonus_run_no:        [null],
      bonus_id:            ['', [Validators.required, Validators.maxLength(30)]],
      bonus_name:          ['', [Validators.required, Validators.maxLength(120)]],
      bonus_type:          [1],
      bonus_date:          ['', [Validators.required]],
      bonus_period:        [''],
      calculation_type:    [1, [Validators.required]],
      applicability_type:  [1, [Validators.required]],
      percentage_of_basic: [0, [Validators.min(0)]],
      fixed_amount:        [0, [Validators.min(0)]],
      selected_designation_nos: [[]],
      selected_employee_nos: [[]],
      is_active:           [1],
    });

    this.form.get('applicability_type')?.valueChanges.subscribe((value) => {
      const applicability = Number(value ?? 1);
      if (applicability !== 2) {
        this.form.patchValue({ selected_designation_nos: [] }, { emitEvent: false });
      }
      if (applicability !== 3) {
        this.form.patchValue({ selected_employee_nos: [] }, { emitEvent: false });
      }
    });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
  }

  loadDesignations(): void {
    this.commApi.getDesignationList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.designations.set(r.data); } });
  }

  loadRuns(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadRuns().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.runs.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((r) => r.bonus_run_no === reselectNo) : null;
            this.selectRun(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load bonus runs'),
    });
  }

  selectRun(item: BonusRun): void {
    this.selectedNo.set(item.bonus_run_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadRunDetail(item.bonus_run_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.lines.set(d.lines ?? []);
          this.runs.update((arr) => arr.map((x) => (x.bonus_run_no === d.bonus_run_no ? { ...x, ...d } : x)));
          this.form.patchValue({
            bonus_run_no:        d.bonus_run_no,
            bonus_id:            d.bonus_id,
            bonus_name:          d.bonus_name,
            bonus_type:          d.bonus_type ?? 1,
            bonus_date:          d.bonus_date ?? '',
            bonus_period:        d.bonus_period,
            calculation_type:    d.calculation_type ?? 1,
            applicability_type:  d.applicability_type ?? 1,
            percentage_of_basic: d.percentage_of_basic ?? 0,
            fixed_amount:        d.fixed_amount ?? 0,
            selected_designation_nos: d.selected_designation_nos ?? [],
            selected_employee_nos: d.selected_employee_nos ?? [],
            is_active:           d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load bonus run details'),
    });
  }

  current = computed(() => this.runs().find((r) => r.bonus_run_no === this.selectedNo()) ?? null);

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = { ...val, branch_no: this.currentBranchNo };
    const obs = isUpdate ? this.data.updateRun(this.selectedNo()!, payload) : this.data.saveRun(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Bonus run updated' : 'Bonus run created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.bonus_run_no ?? null);
          this.loadRuns(savedNo);
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: RunAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<RunAction, string> = { calculate: 'calculated', approve: 'approved', reject: 'rejected', pay: 'marked paid', cancel: 'cancelled' };
          this.toastr.success(`Bonus run ${past[action]}`);
          this.loadRuns(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteRun(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Bonus run deleted'); this.loadRuns(null); if (callback) callback(); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.set([]);
    const today = new Date().toISOString().slice(0, 10);
    this.form?.reset({
      bonus_type: 1,
      bonus_date: today,
      calculation_type: 1,
      applicability_type: 1,
      percentage_of_basic: 0,
      fixed_amount: 0,
      selected_designation_nos: [],
      selected_employee_nos: [],
      is_active: 1,
    });
  }
}
