import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1401DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, DepartmentLookup, DesignationLookup } from '../../../../../shared/services/common-data.service';

export interface JobRequisition extends BaseEntity {
  requisition_no: number;
  requisition_id: string;
  department_no: number | null;
  designation_no: number | null;
  grade_no?: number | null;
  no_of_vacancies: number;
  employment_type?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  job_description?: string | null;
  required_by_date?: string | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

export interface GradeOption { grade_no: number; grade_id: string; grade_name: string; }

type ReqAction = 'submit' | 'approve' | 'reject' | 'hold' | 'resume' | 'close' | 'cancel';

/** State + form + recruitment workflow orchestration for HRM_1401 – Job Requisition. */
@Injectable()
export class Hrm1401ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1401DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  requisitions  = signal<JobRequisition[]>([]);
  departments   = signal<DepartmentLookup[]>([]);
  designations  = signal<DesignationLookup[]>([]);
  grades        = signal<GradeOption[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  selectedDept  = signal<number | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  /** Status: 1=Draft 2=Submitted 3=Approved 4=OnHold 5=Closed 6=Cancelled. */
  readonly isDraft = computed(() => this.status() === 1);

  deptName(no?: number | null): string { return this.departments().find((d) => d.department_no === no)?.department_name ?? ''; }
  desigName(no?: number | null): string { return this.designations().find((d) => d.designation_no === no)?.designation_name ?? ''; }

  /** Designations narrowed to the chosen department. */
  readonly designationsForDept = computed(() => {
    const dept = this.selectedDept();
    return dept == null ? this.designations() : this.designations().filter((d) => d.department_no === dept);
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.requisitions()
      .filter((r) => (r.requisition_id || '').toLowerCase().includes(term) || this.desigName(r.designation_no).toLowerCase().includes(term))
      .sort((a, b) => b.requisition_no - a.requisition_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      requisition_no:   [null],
      requisition_id:   ['', [Validators.required, Validators.maxLength(30)]],
      department_no:    [null, [Validators.required]],
      designation_no:   [null, [Validators.required]],
      grade_no:         [null],
      no_of_vacancies:  [1, [Validators.required, Validators.min(1)]],
      employment_type:  [1],
      budget_min:       [null, [Validators.min(0)]],
      budget_max:       [null, [Validators.min(0)]],
      job_description:  [''],
      required_by_date: [null],
      is_active:        [1],
    });
  }

  loadLookups(): void {
    this.commApi.getDepartmentList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.departments.set(r.data); } });
    this.commApi.getDesignationList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.designations.set(r.data); } });
    this.data.loadGrades().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.grades.set(r.data); } });
  }

  onDeptChange(deptNo: number | null): void {
    this.selectedDept.set(deptNo);
    this.form.get('designation_no')?.setValue(null);
  }

  loadRequisitions(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadRequisitions().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.requisitions.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((r) => r.requisition_no === reselectNo) : null;
            this.selectRequisition(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load requisitions'),
    });
  }

  selectRequisition(item: JobRequisition): void {
    this.selectedNo.set(item.requisition_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadRequisitionDetail(item.requisition_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.selectedDept.set(d.department_no ?? null);
          this.form.patchValue({
            requisition_no:   d.requisition_no,
            requisition_id:   d.requisition_id,
            department_no:    d.department_no,
            designation_no:   d.designation_no,
            grade_no:         d.grade_no,
            no_of_vacancies:  d.no_of_vacancies,
            employment_type:  d.employment_type ?? 1,
            budget_min:       d.budget_min,
            budget_max:       d.budget_max,
            job_description:  d.job_description,
            required_by_date: d.required_by_date ? d.required_by_date.slice(0, 10) : null,
            is_active:        d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load requisition details'),
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
      requisition_no:   val.requisition_no,
      requisition_id:   val.requisition_id,
      department_no:    val.department_no,
      designation_no:   val.designation_no,
      grade_no:         val.grade_no,
      no_of_vacancies:  val.no_of_vacancies,
      employment_type:  val.employment_type,
      budget_min:       val.budget_min,
      budget_max:       val.budget_max,
      job_description:  val.job_description,
      required_by_date: val.required_by_date,
      branch_no:        this.currentBranchNo,
      is_active:        val.is_active,
    };
    const obs = isUpdate ? this.data.updateRequisition(this.selectedNo()!, payload) : this.data.saveRequisition(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Requisition updated' : 'Requisition created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.requisition_no ?? null);
          this.loadRequisitions(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: ReqAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Requisition ${action}${action === 'close' ? 'd' : action === 'hold' ? ' on hold' : action.endsWith('e') ? 'd' : 'ed'}`);
          this.loadRequisitions(no);
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
    this.data.deleteRequisition(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Requisition deleted');
          this.loadRequisitions(null);
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
    this.selectedDept.set(null);
    this.form?.reset({ no_of_vacancies: 1, employment_type: 1, is_active: 1 });
  }
}
