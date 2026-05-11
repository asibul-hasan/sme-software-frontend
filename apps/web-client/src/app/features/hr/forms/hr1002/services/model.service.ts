import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hr1002DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService } from '../../../../../shared/services/common-data.service';

export interface IDepartment extends BaseEntity {
  department_no: number;
  department_id: string;
  department_name: string;
  short_name?: string | null;
  parent_department_no?: number | null;
  department_head_no?: number | null;
  hierarchy_level?: number | null;
  cost_center_no?: number | null;
  company_no: number;
  branch_no: number;
  active_status: number;
  display_sl?: number | null;
  remarks?: string | null;
  description?: string | null;
}

export interface IDesignation extends BaseEntity {
  designation_no: number;
  designation_id: string;
  designation_name: string;
  short_name?: string | null;
  department_no: number;
  job_category?: string | null;
  grade_level?: string | null;
  hierarchy_rank?: number | null;
  min_salary?: number | null;
  max_salary?: number | null;
  overtime_eligible: number;
  company_no: number;
  branch_no: number;
  active_status: number;
  display_sl?: number | null;
  remarks?: string | null;
  description?: string | null;
}

@Injectable()
export class Hr1002ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hr1002DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);
  private commApi = inject(CommonDataService);

  // ─── State ─────────────────────────────────────────────────────────────────
  isSaving  = signal(false);
  isLoading = signal(false);

  departments = signal<IDepartment[]>([]);
  designations = signal<IDesignation[]>([]);
  employees   = signal<any[]>([]);

  selectedDeptNo  = signal<number | null>(null);
  selectedDesigNo = signal<number | null>(null);
  searchDeptTerm  = signal('');
  searchDesigTerm = signal('');

  filteredDepts = computed(() => {
    const term = this.searchDeptTerm().toLowerCase().trim();
    const list = this.departments();
    if (!term) return list;
    return list.filter(
      (d) =>
        d.department_name.toLowerCase().includes(term) ||
        d.department_id.toLowerCase().includes(term),
    );
  });

  filteredDesigs = computed(() => {
    const term = this.searchDesigTerm().toLowerCase().trim();
    const list = this.designations();
    if (!term) return list;
    return list.filter(
      (d) =>
        d.designation_name.toLowerCase().includes(term) ||
        d.designation_id.toLowerCase().includes(term),
    );
  });

  deptForm!: FormGroup;
  desigForm!: FormGroup;

  // ─── Form Init ─────────────────────────────────────────────────────────────
  initDeptForm(): void {
    this.deptForm = this.fb.group({
      department_no:        [null],
      department_id:        ['', [Validators.required, Validators.maxLength(20)]],
      department_name:      ['', [Validators.required, Validators.maxLength(150)]],
      short_name:           [''],
      parent_department_no: [null],
      department_head_no:   [null],
      company_no:           [this.authCtx.user()?.company_no ?? null, [Validators.required]],
      branch_no:            [this.authCtx.user()?.branch_no  ?? null, [Validators.required]],
      active_status:        [1, [Validators.required]],
      display_sl:           [null],
      remarks:              [''],
      description:          [''],
    });
  }

  initDesigForm(): void {
    this.desigForm = this.fb.group(
      {
        designation_no:   [null],
        designation_id:   ['', [Validators.required, Validators.maxLength(20)]],
        designation_name: ['', [Validators.required, Validators.maxLength(150)]],
        short_name:       [''],
        department_no:    [null, [Validators.required]],
        job_category:     [''],
        grade_level:      [''],
        hierarchy_rank:   [null],
        min_salary:       [null],
        max_salary:       [null],
        overtime_eligible: [0],
        company_no:       [this.authCtx.user()?.company_no ?? null, [Validators.required]],
        branch_no:        [this.authCtx.user()?.branch_no  ?? null, [Validators.required]],
        active_status:    [1, [Validators.required]],
        display_sl:       [null],
        remarks:          [''],
        description:      [''],
      },
      { validators: [CustomValidators.minMax('min_salary', 'max_salary')] },
    );
  }

  // ─── Load ──────────────────────────────────────────────────────────────────
  loadDepartments(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .loadDepartments()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.departments.set(res.data);
            const resolved = resolvePostReloadSelection(
              res.data,
              (d) => d.department_no,
              reselectNo,
            );
            resolved ? this.selectDept(resolved.item) : this.onNewDept();
          }
        },
      });
  }

  loadDesignations(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .loadDesignations()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.designations.set(res.data);
            const resolved = resolvePostReloadSelection(
              res.data,
              (d) => d.designation_no,
              reselectNo,
            );
            resolved ? this.selectDesig(resolved.item) : this.onNewDesig();
          }
        },
      });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ active_status: 1 }).subscribe((res) => {
      if (isSuccess(res) && res.data) this.employees.set(res.data);
    });
  }

  // ─── Select ────────────────────────────────────────────────────────────────
  selectDept(dept: IDepartment): void {
    this.selectedDeptNo.set(dept.department_no);
    this.isLoading.set(true);
    this.data
      .loadDepartmentDetail(dept.department_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.deptForm.patchValue({
              department_no:        d['department_no']        ?? d['departmentNo'],
              department_id:        d['department_id']        ?? d['departmentId'],
              department_name:      d['department_name']      ?? d['departmentName'],
              short_name:           d['short_name']           ?? d['shortName'],
              parent_department_no: d['parent_department_no'] ?? d['parentDepartmentNo'],
              department_head_no:   d['department_head_no']   ?? d['departmentHeadNo'],
              company_no:           d['company_no']           ?? d['companyNo'],
              branch_no:            d['branch_no']            ?? d['branchNo'],
              active_status:        d['active_status']        ?? d['activeStatus'] ?? 1,
              display_sl:           d['display_sl']           ?? d['displaySl'],
              remarks:              d['remarks'],
              description:          d['description'],
            });
          }
        },
      });
  }

  selectDesig(desig: IDesignation): void {
    this.selectedDesigNo.set(desig.designation_no);
    this.isLoading.set(true);
    this.data
      .loadDesignationDetail(desig.designation_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.desigForm.patchValue({
              designation_no:    d['designation_no']   ?? d['designationNo'],
              designation_id:    d['designation_id']   ?? d['designationId'],
              designation_name:  d['designation_name'] ?? d['designationName'],
              short_name:        d['short_name']        ?? d['shortName'],
              department_no:     d['department_no']     ?? d['departmentNo'],
              job_category:      d['job_category']      ?? d['jobCategory'],
              grade_level:       d['grade_level']       ?? d['gradeLevel'],
              hierarchy_rank:    d['hierarchy_rank']    ?? d['hierarchyRank'],
              min_salary:        d['min_salary']        ?? d['minSalary'],
              max_salary:        d['max_salary']        ?? d['maxSalary'],
              overtime_eligible: d['overtime_eligible'] ?? d['overtimeEligible'] ?? 0,
              company_no:        d['company_no']        ?? d['companyNo'],
              branch_no:         d['branch_no']         ?? d['branchNo'],
              active_status:     d['active_status']     ?? d['activeStatus'] ?? 1,
              display_sl:        d['display_sl']        ?? d['displaySl'],
              remarks:           d['remarks'],
              description:       d['description'],
            });
          }
        },
      });
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  onSaveDept(): void {
    if (this.deptForm.invalid) {
      this.deptForm.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    this.isSaving.set(true);
    const val = this.deptForm.getRawValue();
    const isUpdate = !!this.selectedDeptNo();
    const obs = isUpdate
      ? this.data.updateDepartment({ ...val, department_no: this.selectedDeptNo() })
      : this.data.saveDepartment(val);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Department updated' : 'Department created');
          this.loadDepartments(isUpdate ? this.selectedDeptNo() : null);
        }
      },
    });
  }

  onSaveDesig(): void {
    if (this.desigForm.invalid) {
      this.desigForm.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    this.isSaving.set(true);
    const val = this.desigForm.getRawValue();
    const isUpdate = !!this.selectedDesigNo();
    const obs = isUpdate
      ? this.data.updateDesignation({ ...val, designation_no: this.selectedDesigNo() })
      : this.data.saveDesignation(val);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Designation updated' : 'Designation created');
          this.loadDesignations(isUpdate ? this.selectedDesigNo() : null);
        }
      },
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  onDeleteDept(): void {
    const no = this.selectedDeptNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .deleteDepartment(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Department deleted');
            this.loadDepartments();
          }
        },
      });
  }

  onDeleteDesig(): void {
    const no = this.selectedDesigNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .deleteDesignation(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Designation deleted');
            this.loadDesignations();
          }
        },
      });
  }

  // ─── New ───────────────────────────────────────────────────────────────────
  onNewDept(): void {
    this.selectedDeptNo.set(null);
    this.deptForm.reset({
      active_status: 1,
      company_no: this.authCtx.user()?.company_no ?? null,
      branch_no:  this.authCtx.user()?.branch_no  ?? null,
    });
  }

  onNewDesig(): void {
    this.selectedDesigNo.set(null);
    this.desigForm.reset({
      active_status:     1,
      overtime_eligible: 0,
      company_no: this.authCtx.user()?.company_no ?? null,
      branch_no:  this.authCtx.user()?.branch_no  ?? null,
    });
  }
}
