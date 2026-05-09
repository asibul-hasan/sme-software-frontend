import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { CustomValidators } from '../../../../../core/validators/custom-validators';

/**
 * Interface representing a Department entity.
 * Based on the hr_department table in db.md.
 */
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
  row_version?: number | null;
}

/**
 * Interface representing a Designation entity.
 * Based on the hr_designation table in db.md.
 */
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
  row_version?: number | null;
}

@Injectable()
export class Hr1002ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  isLoading = signal(false);
  
  departments = signal<IDepartment[]>([]);
  designations = signal<IDesignation[]>([]);
  
  deptForm!: FormGroup;
  desigForm!: FormGroup;


  initDeptForm(): void {
    this.deptForm = this.fb.group({
      department_no: [null],
      department_id: ['', [Validators.required, Validators.maxLength(50)]],
      department_name: ['', [Validators.required, Validators.maxLength(200)]],
      short_name: [''],
      parent_department_no: [null],
      department_head_no: [null],
      company_no: [null, [Validators.required]],
      branch_no: [null, [Validators.required]],
      active_status: [1, [Validators.required]],
      display_sl: [null],
      remarks: [''],
      description: [''],
    });
  }

  initDesigForm(): void {
    this.desigForm = this.fb.group({
      designation_no: [null],
      designation_id: ['', [Validators.required, Validators.maxLength(50)]],
      designation_name: ['', [Validators.required, Validators.maxLength(200)]],
      short_name: [''],
      department_no: [null, [Validators.required]],
      job_category: [''],
      grade_level: [''],
      hierarchy_rank: [null],
      min_salary: [null],
      max_salary: [null],
      overtime_eligible: [0],
      company_no: [null, [Validators.required]],
      branch_no: [null, [Validators.required]],
      active_status: [1, [Validators.required]],
      display_sl: [null],
      remarks: [''],
      description: [''],
    }, {
      validators: [CustomValidators.minMax('min_salary', 'max_salary')]
    });
  }
}
