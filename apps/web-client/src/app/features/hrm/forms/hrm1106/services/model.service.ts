import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1106DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup, DesignationLookup, DepartmentLookup, BranchLookup } from '../../../../../shared/services/common-data.service';

export interface Movement extends BaseEntity {
  movement_no: number;
  movement_id: string;
  employee_no: number | null;
  movement_type: number | null;
  effective_date: string | null;
  to_designation_no?: number | null;
  to_grade_no?: number | null;
  to_department_no?: number | null;
  to_branch_no?: number | null;
  new_salary?: number | null;
  reason?: string | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}
export interface GradeOption { grade_no: number; grade_id: string; grade_name: string; }

type MovementAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** State + form + workflow for HRM_1106 – Promotion / Transfer. */
@Injectable()
export class Hrm1106ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1106DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  movements    = signal<Movement[]>([]);
  employees    = signal<EmployeeLookup[]>([]);
  designations = signal<DesignationLookup[]>([]);
  departments  = signal<DepartmentLookup[]>([]);
  branches     = signal<BranchLookup[]>([]);
  grades       = signal<GradeOption[]>([]);
  isLoading    = signal(false);
  isSaving     = signal(false);
  searchTerm   = signal('');
  selectedNo   = signal<number | null>(null);
  status       = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  readonly isDraft = computed(() => this.status() === 1);

  employeeName(no?: number | null): string {
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : (no != null ? `#${no}` : '');
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.movements()
      .filter((m) => (m.movement_id || '').toLowerCase().includes(term) || this.employeeName(m.employee_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.movement_no - a.movement_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      movement_no:       [null],
      movement_id:       ['', [Validators.required, Validators.maxLength(30)]],
      employee_no:       [null, [Validators.required]],
      movement_type:     [1, [Validators.required]],
      effective_date:    [new Date().toISOString().split('T')[0], [Validators.required]],
      to_designation_no: [null],
      to_grade_no:       [null],
      to_department_no:  [null],
      to_branch_no:      [null],
      new_salary:        [null, [Validators.min(0)]],
      reason:            [''],
      is_active:         [1],
    });
  }

  loadLookups(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
    this.commApi.getDesignationList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.designations.set(r.data); } });
    this.commApi.getDepartmentList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.departments.set(r.data); } });
    this.commApi.getBranchList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.branches.set(r.data); } });
    this.data.loadGrades().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.grades.set(r.data); } });
  }

  loadMovements(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadMovements().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.movements.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((m) => m.movement_no === reselectNo) : null;
            this.selectMovement(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load movements'),
    });
  }

  selectMovement(item: Movement): void {
    this.selectedNo.set(item.movement_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadMovementDetail(item.movement_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.form.patchValue({
            movement_no:       d.movement_no,
            movement_id:       d.movement_id,
            employee_no:       d.employee_no,
            movement_type:     d.movement_type ?? 1,
            effective_date:    d.effective_date ? d.effective_date.slice(0, 10) : null,
            to_designation_no: d.to_designation_no,
            to_grade_no:       d.to_grade_no,
            to_department_no:  d.to_department_no,
            to_branch_no:      d.to_branch_no,
            new_salary:        d.new_salary,
            reason:            d.reason,
            is_active:         d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load movement details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = { ...val, branch_no: this.currentBranchNo };
    const obs = isUpdate ? this.data.updateMovement(this.selectedNo()!, payload) : this.data.saveMovement(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Movement updated' : 'Movement created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.movement_no ?? null);
          this.loadMovements(savedNo);
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: MovementAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<MovementAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', cancel: 'cancelled' };
          this.toastr.success(`Movement ${past[action]}`);
          this.loadMovements(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteMovement(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Movement deleted'); this.loadMovements(null); if (callback) callback(); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.form?.reset({ movement_type: 1, effective_date: new Date().toISOString().split('T')[0], is_active: 1 });
  }
}
