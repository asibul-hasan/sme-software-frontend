import { Injectable, signal, computed, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1201DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import {
  CommonDataService,
  DesignationLookup,
  EmployeeLookup,
  GradeLookup,
  GradeStepLookup,
} from '../../../../../shared/services/common-data.service';

export interface StructureLine {
  structure_dtl_no?: number | null;
  component_no: number | null;
  amount: number | null;
}

export interface SalaryStructure extends BaseEntity {
  salary_structure_no: number;
  employee_no: number;
  designation_no?: number | null;
  grade_no?: number | null;
  grade_step_no?: number | null;
  effective_from: string;
  effective_to?: string | null;
  basic_salary?: number | null;
  gross_salary: number;
  status: number;
  branch_no?: number | null;
  revision_reason?: string | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
  lines?: StructureLine[];
  source_structure_no?: number | null;
  source_effective_from?: string | null;
  source_basic_salary?: number | null;
  source_gross_salary?: number | null;
  source_revision_reason?: string | null;
  source_status?: number | null;
}

export interface ComponentOption {
  component_no: number;
  component_id: string;
  component_name: string;
  component_type: number;
}

/** State + form (header + lines FormArray) + orchestration for HRM_1201 – Salary Structure. */
@Injectable()
export class Hrm1201ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1201DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  structures    = signal<SalaryStructure[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  designations  = signal<DesignationLookup[]>([]);
  grades        = signal<GradeLookup[]>([]);
  gradeSteps    = signal<GradeStepLookup[]>([]);
  components    = signal<ComponentOption[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  isRevisionLoading = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');
  revisionSource = signal<SalaryStructure | null>(null);

  private suppressEmployeeAutoLoad = false;

  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }

  componentName(componentNo?: number | null): string {
    const c = this.components().find((x) => x.component_no === componentNo);
    return c ? c.component_name : '';
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.structures()
      .filter((s) => this.employeeName(s.employee_no).toLowerCase().includes(term) || (s.effective_from || '').includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.salary_structure_no - a.salary_structure_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  currentEmployeeHistory = computed(() => {
    const employeeNo = this.form?.get('employee_no')?.value as number | null;
    if (!employeeNo) return [];
    return this.structures()
      .filter((item) => item.employee_no === employeeNo)
      .sort((a, b) => b.salary_structure_no - a.salary_structure_no);
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      salary_structure_no: [null],
      employee_no:         [null, [Validators.required]],
      designation_no:      [null, [Validators.required]],
      grade_no:            [null],
      grade_step_no:       [null],
      effective_from:      [new Date().toISOString().split('T')[0], [Validators.required]],
      effective_to:        [null],
      basic_salary:        [{ value: 0, disabled: true }],
      status:              [1, [Validators.required]],
      revision_reason:     [''],
      remarks:             [''],
      is_active:           [1],
      lines:               this.fb.array([this.makeLine()]),
    });

    this.form.get('employee_no')?.valueChanges.subscribe((employeeNo) => {
      this.onEmployeeChanged(employeeNo);
    });

    this.form.get('designation_no')?.valueChanges.subscribe((designationNo) => {
      this.onDesignationChanged(designationNo);
    });

    this.form.get('grade_no')?.valueChanges.subscribe((gradeNo) => {
      this.onGradeChanged(gradeNo);
    });

    this.form.get('grade_step_no')?.valueChanges.subscribe((gradeStepNo) => {
      this.onGradeStepChanged(gradeStepNo);
    });

    this.form.get('effective_from')?.valueChanges.subscribe(() => {
      if (!this.selectedNo()) {
        this.refreshRevisionTemplate(false);
      }
    });
  }

  get linesArray(): FormArray { return this.form.get('lines') as FormArray; }

  private makeLine(line?: Partial<StructureLine>): FormGroup {
    return this.fb.group({
      structure_dtl_no: [line?.structure_dtl_no ?? null],
      component_no:     [line?.component_no ?? null, [Validators.required]],
      amount:           [line?.amount ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addLine(): void { this.linesArray.push(this.makeLine()); }
  removeLine(i: number): void {
    this.linesArray.removeAt(i);
    if (this.linesArray.length === 0) this.addLine();
  }
  private setLines(lines: StructureLine[]): void {
    this.linesArray.clear();
    (lines.length ? lines : [{ component_no: null, amount: 0 }]).forEach((l) => this.linesArray.push(this.makeLine(l)));
  }

  /** Gross = sum of line amounts (the earning breakdown). Recomputed by the server on save too. */
  grossTotal(): number {
    return this.linesArray.controls.reduce((sum, c) => sum + (Number(c.get('amount')?.value) || 0), 0);
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
  }

  loadDesignations(): void {
    this.commApi.getDesignationList().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.designations.set(res.data); },
    });
  }

  loadGrades(): void {
    this.commApi.getGradeList().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.grades.set(res.data); },
    });
  }

  loadGradeSteps(gradeNo: number | null, preferredStepNo?: number | null): void {
    if (!gradeNo) {
      this.gradeSteps.set([]);
      if (!preferredStepNo) {
        this.form.patchValue({ grade_step_no: null, basic_salary: 0 }, { emitEvent: false });
      }
      return;
    }
    this.commApi.getGradeStepList(gradeNo).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.gradeSteps.set(res.data);
          if (preferredStepNo != null && res.data.some((step) => step.grade_step_no === preferredStepNo)) {
            this.form.patchValue({ grade_step_no: preferredStepNo }, { emitEvent: false });
            this.onGradeStepChanged(preferredStepNo);
          } else {
            this.form.patchValue({ grade_step_no: null, basic_salary: 0 }, { emitEvent: false });
          }
        }
      },
    });
  }

  loadComponents(): void {
    this.data.loadComponents().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.components.set(res.data); },
    });
  }

  loadStructures(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadStructures().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.structures.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.salary_structure_no === reselectNo) : null;
            this.selectStructure(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load salary structures'),
    });
  }

  selectStructure(item: SalaryStructure): void {
    this.selectedNo.set(item.salary_structure_no);
    this.revisionSource.set(item);
    this.isLoading.set(true);
    this.data.loadStructureDetail(item.salary_structure_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.suppressEmployeeAutoLoad = true;
          this.form.patchValue({
            salary_structure_no: d.salary_structure_no,
            employee_no:         d.employee_no,
            designation_no:      d.designation_no ?? null,
            grade_no:            d.grade_no ?? null,
            grade_step_no:       d.grade_step_no ?? null,
            effective_from:      (d.effective_from ?? '').slice(0, 10),
            effective_to:        d.effective_to ? d.effective_to.slice(0, 10) : null,
            basic_salary:        d.basic_salary ?? 0,
            status:              d.status ?? 1,
            revision_reason:     d.revision_reason ?? '',
            remarks:             d.remarks,
            is_active:           d.is_active,
          }, { emitEvent: false });
          this.suppressEmployeeAutoLoad = false;
          this.loadGradeSteps(d.grade_no ?? null, d.grade_step_no ?? null);
          this.setLines(d.lines ?? []);
          this.revisionSource.set(d);
        }
      },
      error: () => this.toastr.error('Failed to load structure details'),
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
      salary_structure_no: val.salary_structure_no,
      employee_no:         val.employee_no,
      designation_no:      val.designation_no,
      grade_no:            val.grade_no,
      grade_step_no:       val.grade_step_no,
      effective_from:      val.effective_from,
      effective_to:        val.effective_to,
      basic_salary:        val.basic_salary,
      status:              val.status,
      branch_no:           this.currentBranchNo,
      revision_reason:     val.revision_reason,
      remarks:             val.remarks,
      is_active:           val.is_active,
      lines:               (val.lines as StructureLine[]).map((l) => ({ component_no: l.component_no, amount: l.amount })),
    };

    const obs = isUpdate
      ? this.data.updateStructure(this.selectedNo()!, payload)
      : this.data.saveStructure(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Salary structure updated' : 'Salary structure created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.salary_structure_no ?? null);
          this.loadStructures(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteStructure(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Salary structure deleted');
          this.loadStructures(null);
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
    this.revisionSource.set(null);
    this.suppressEmployeeAutoLoad = true;
    this.form?.reset({
      employee_no: null,
      designation_no: null,
      grade_no: null,
      grade_step_no: null,
      effective_from: new Date().toISOString().split('T')[0],
      basic_salary: 0,
      status: 1,
      revision_reason: '',
      is_active: 1,
    });
    this.suppressEmployeeAutoLoad = false;
    this.gradeSteps.set([]);
    this.setLines([]);
  }

  startRevision(): void {
    const employeeNo = this.form?.get('employee_no')?.value as number | null;
    if (!employeeNo) {
      this.toastr.warning('Select an employee to start a salary revision.');
      return;
    }
    this.selectedNo.set(null);
    this.refreshRevisionTemplate(true);
  }

  designationName(designationNo?: number | null): string {
    if (designationNo == null) return '';
    return this.designations().find((x) => x.designation_no === designationNo)?.designation_name ?? '';
  }

  gradeLabel(gradeNo?: number | null): string {
    if (gradeNo == null) return '';
    const grade = this.grades().find((x) => x.grade_no === gradeNo);
    return grade?.grade_name ?? '';
  }

  gradeStepLabel(gradeStepNo?: number | null): string {
    if (gradeStepNo == null) return '';
    const step = this.gradeSteps().find((x) => x.grade_step_no === gradeStepNo);
    return step ? `${step.step} - ${step.amount}` : '';
  }

  revisionDeltaBasic(): number {
    const source = Number(this.revisionSource()?.source_basic_salary ?? this.revisionSource()?.basic_salary ?? 0);
    const current = Number(this.form?.get('basic_salary')?.value ?? 0);
    return current - source;
  }

  revisionDeltaGross(): number {
    const source = Number(this.revisionSource()?.source_gross_salary ?? this.revisionSource()?.gross_salary ?? 0);
    return this.grossTotal() - source;
  }

  private onEmployeeChanged(employeeNo: number | null): void {
    if (this.suppressEmployeeAutoLoad) return;
    const employee = this.employees().find((item) => item.employee_no === employeeNo);
    if (!employee) return;

    const patch: Record<string, number | null> = {};
    if (employee.designation_no != null) {
      patch['designation_no'] = employee.designation_no;
    }
    if (employee.designation_no != null) {
      const designation = this.designations().find((item) => item.designation_no === employee.designation_no);
      if (designation?.grade_no != null) {
        patch['grade_no'] = designation.grade_no;
      } else if (employee.designation_no && employee.designation_no !== this.form.get('designation_no')?.value) {
        patch['grade_no'] = null;
      }
    }
    if (Object.keys(patch).length > 0) {
      this.form.patchValue(patch);
    }

    if (!this.selectedNo()) {
      this.refreshRevisionTemplate(true);
    }
  }

  private onDesignationChanged(designationNo: number | null): void {
    const designation = this.designations().find((item) => item.designation_no === designationNo);
    if (!designation) return;

    if (designation.grade_no != null && designation.grade_no !== this.form.get('grade_no')?.value) {
      this.form.patchValue({ grade_no: designation.grade_no });
      return;
    }
    if (designation.grade_no == null) {
      this.form.patchValue({ grade_no: null, grade_step_no: null, basic_salary: 0 }, { emitEvent: false });
      this.gradeSteps.set([]);
    }
  }

  private onGradeChanged(gradeNo: number | null): void {
    const currentStepNo = this.form.get('grade_step_no')?.value;
    if (!gradeNo) {
      this.gradeSteps.set([]);
      this.form.patchValue({ grade_step_no: null, basic_salary: 0 }, { emitEvent: false });
      return;
    }
    this.loadGradeSteps(gradeNo, currentStepNo);
  }

  private onGradeStepChanged(gradeStepNo: number | null): void {
    const step = this.gradeSteps().find((item) => item.grade_step_no === gradeStepNo);
    this.form.patchValue({ basic_salary: step?.amount ?? 0 }, { emitEvent: false });
  }

  private refreshRevisionTemplate(showErrors: boolean): void {
    const employeeNo = this.form?.get('employee_no')?.value as number | null;
    if (!employeeNo || this.selectedNo()) return;
    const effectiveFrom = this.form?.get('effective_from')?.value as string | null;

    this.isRevisionLoading.set(true);
    this.data.loadRevisionTemplate(employeeNo, effectiveFrom).pipe(
      finalize(() => this.isRevisionLoading.set(false)),
    ).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.applyRevisionTemplate(res.data);
        }
      },
      error: () => {
        if (showErrors) {
          this.toastr.error('Failed to load revision template.');
        }
      },
    });
  }

  private applyRevisionTemplate(template: SalaryStructure): void {
    const effectiveFrom = this.form?.get('effective_from')?.value ?? template.effective_from;
    this.suppressEmployeeAutoLoad = true;
    this.form.patchValue({
      salary_structure_no: null,
      employee_no: template.employee_no,
      designation_no: template.designation_no ?? null,
      grade_no: template.grade_no ?? null,
      grade_step_no: template.grade_step_no ?? null,
      effective_from: effectiveFrom,
      effective_to: null,
      basic_salary: template.basic_salary ?? 0,
      status: 1,
      revision_reason: '',
      remarks: '',
      is_active: 1,
    }, { emitEvent: false });
    this.suppressEmployeeAutoLoad = false;

    this.loadGradeSteps(template.grade_no ?? null, template.grade_step_no ?? null);
    this.setLines(template.lines ?? []);
    this.revisionSource.set(template);
  }
}
