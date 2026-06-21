import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1004DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

// ─── Domain Interface ────────────────────────────────────────────────────────

export interface Grade extends BaseEntity {
  grade_no: number;
  grade_id: string;
  grade_name: string;
  rank_order?: number | null;
  min_salary?: number | null;
  max_salary?: number | null;
  is_overtime_eligible: number;
  steps?: GradeStep[];
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

export interface GradeStep {
  grade_step_no?: number;
  step: string;
  amount: number | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * State + form + orchestration for HRM_1004 – Grade / Pay-Scale Setup.
 * Mirrors the SYS_1005 form-wise model service. HTTP paths live in Hrm1004DataService.
 */
@Injectable()
export class Hrm1004ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1004DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  /** Current logged-in branch — the default branch assignment on New. */
  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  grades            = signal<Grade[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedGradeNo   = signal<number | null>(null);
  steps             = signal<GradeStep[]>([]);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredGrades = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.grades()
      .filter(
        (g) =>
          g.grade_name.toLowerCase().includes(term) ||
          (g.grade_id || '').toLowerCase().includes(term) ||
          String(g.rank_order ?? '').includes(term),
      );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.grade_id || '').localeCompare(b.grade_id || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator(this.filteredGrades);

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      grade_no:             [null],
      grade_id:             ['', [Validators.maxLength(20)]],
      grade_name:           ['', [Validators.required, Validators.maxLength(100)]],
      rank_order:           [null],
      min_salary:           [null, [Validators.min(0)]],
      max_salary:           [null, [Validators.min(0)]],
      is_overtime_eligible: [0],
      remarks:              [''],
      is_active:            [1],
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadGrades(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadGrades()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.grades.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectGrade(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load grades'),
      });
  }

  selectGrade(grade: Grade, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedGradeNo.set(grade.grade_no);
    this.isLoading.set(true);

    this.data
      .loadGradeDetail(grade.grade_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.form.patchValue({
              grade_no:             d['grade_no'],
              grade_id:             d['grade_id'],
              grade_name:           d['grade_name'],
              rank_order:           d['rank_order'],
              min_salary:           d['min_salary'],
              max_salary:           d['max_salary'],
              is_overtime_eligible: d['is_overtime_eligible'] ?? 0,
              remarks:              d['remarks'],
              is_active:            d['is_active'],
            });
            this.steps.set((d['steps'] as GradeStep[] | undefined) ?? []);
          }
        },
        error: () => this.toastr.error('Failed to load grade details'),
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    if (!this.validateSteps()) return;

    this.isSaving.set(true);
    const val      = this.form.getRawValue();
    const isUpdate = !!this.selectedGradeNo();

    const payload = {
      grade_no:             val.grade_no,
      grade_id:             val.grade_id,
      grade_name:           val.grade_name,
      rank_order:           val.rank_order,
      min_salary:           val.min_salary,
      max_salary:           val.max_salary,
      is_overtime_eligible: 0,
      steps:                this.normalizedSteps(),
      branch_no:            this.currentBranchNo,   // branch-scoped, taken from the active branch
      remarks:              val.remarks,
      is_active:            val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateGrade(this.selectedGradeNo()!, payload)
      : this.data.saveGrade(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Grade updated' : 'Grade created');
          this.loadGrades(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const gradeNo = this.selectedGradeNo();
    if (!gradeNo) return;

    this.isLoading.set(true);
    this.data
      .deleteGrade(gradeNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Grade deleted');
            this.loadGrades();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: () => this.toastr.error('Server error during delete'),
      });
  }

  onNew(): void {
    this.selectedGradeNo.set(null);
    this.steps.set([{ step: 'Step 1', amount: null }]);
    this.form?.reset({
      is_overtime_eligible: 0,
      is_active: 1,
    });
  }

  addStep(): void {
    this.steps.update((rows) => [
      ...rows,
      { step: `Step ${rows.length + 1}`, amount: null },
    ]);
  }

  removeStep(index: number): void {
    this.steps.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateStep(index: number, field: keyof GradeStep, value: string | number | null): void {
    this.steps.update((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          [field]: field === 'amount' ? this.toNumberOrNull(value) : String(value ?? ''),
        };
      }),
    );
  }

  private normalizedSteps(): GradeStep[] {
    return this.steps()
      .map((row, index) => ({
        grade_step_no: row.grade_step_no,
        step: (row.step || `Step ${index + 1}`).trim(),
        amount: this.toNumberOrNull(row.amount),
      }))
      .filter((row) => row.step || row.amount != null);
  }

  private validateSteps(): boolean {
    const min = this.toNumberOrNull(this.form.get('min_salary')?.value);
    const max = this.toNumberOrNull(this.form.get('max_salary')?.value);

    for (const row of this.normalizedSteps()) {
      if (row.amount == null) {
        this.toastr.warning(`${row.step || 'Step'} amount is required.`);
        return false;
      }
      if (min != null && row.amount < min) {
        this.toastr.warning(`${row.step} amount cannot be lower than minimum salary.`);
        return false;
      }
      if (max != null && row.amount > max) {
        this.toastr.warning(`${row.step} amount cannot be higher than maximum salary.`);
        return false;
      }
    }
    return true;
  }

  private toNumberOrNull(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
