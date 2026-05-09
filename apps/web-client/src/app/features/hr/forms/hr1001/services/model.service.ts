import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { CustomValidators } from '../../../../../core/validators/custom-validators';

/**
 * Interface representing an Employee entity.
 * Based on the hr_employee table in db.md.
 */
export interface IEmployee extends BaseEntity {
  employee_no: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  first_name_nls?: string | null;
  last_name_nls?: string | null;
  date_of_birth: string;
  gender?: number | null;
  marital_status?: number | null;
  blood_group?: string | null;
  religion?: number | null;
  nationality?: number | null;
  photo_url?: string | null;
  signature_url?: string | null;
  nid_number?: string | null;
  passport_number?: string | null;
  birth_certificate_no?: string | null;
  tin_number?: string | null;
  department_no: number;
  designation_no: number;
  reporting_to?: number | null;
  branch_no: number;
  joining_date: string;
  confirmation_date?: string | null;
  employment_type?: number | null;
  employee_status?: number | null;
  mobile_number: string;
  alternative_mobile_number?: string | null;
  official_email?: string | null;
  personal_email?: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relation?: string | null;
  present_address: string;
  permanent_address?: string | null;
  present_post_code?: string | null;
  permanent_post_code?: string | null;
  pay_schedule?: number | null;
  salary_grade_no?: number | null;
  basic_salary: number;
  gross_salary?: number | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  routing_number?: string | null;
  mfs_number?: string | null;
  mfs_provider?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  contract_amount?: number | null;
  contract_notes?: string | null;
  active_status: number;
  display_sl?: number | null;
  remarks?: string | null;
  description?: string | null;
  row_version?: number | null;
}

@Injectable()
export class Hr1001ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  isLoading = signal(false);
  employees = signal<IEmployee[]>([]);
  selectedEmployee = signal<IEmployee | null>(null);

  form!: FormGroup;


  initForm(): void {
    this.form = this.fb.group({
      employee_no: [null],
      employee_id: ['', [Validators.required, Validators.maxLength(50)]],
      first_name: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      full_name: ['', [Validators.required, Validators.maxLength(200)]],
      first_name_nls: [''],
      last_name_nls: [''],
      date_of_birth: ['', [Validators.required]],
      gender: [null],
      marital_status: [null],
      blood_group: [''],
      religion: [null],
      nationality: [null],
      
      nid_number: [''],
      passport_number: [''],
      birth_certificate_no: [''],
      tin_number: [''],
      
      department_no: [null, [Validators.required]],
      designation_no: [null, [Validators.required]],
      reporting_to: [null],
      branch_no: [null, [Validators.required]],
      
      joining_date: ['', [Validators.required]],
      confirmation_date: [null],
      employment_type: [null],
      employee_status: [1],
      
      mobile_number: ['', [Validators.required]],
      alternative_mobile_number: [''],
      official_email: ['', [Validators.email]],
      personal_email: ['', [Validators.email]],
      
      emergency_contact_name: ['', [Validators.required]],
      emergency_contact_number: ['', [Validators.required]],
      emergency_contact_relation: [''],
      
      present_address: ['', [Validators.required]],
      permanent_address: [''],
      present_post_code: [''],
      permanent_post_code: [''],
      
      pay_schedule: [null],
      salary_grade_no: [null],
      basic_salary: [0, [Validators.required, Validators.min(0)]],
      gross_salary: [null],
      
      bank_account_number: [''],
      bank_name: [''],
      bank_branch: [''],
      routing_number: [''],
      mfs_number: [''],
      mfs_provider: [''],
      
      active_status: [1, [Validators.required]],
      display_sl: [null],
      remarks: [''],
      description: [''],
    }, {
      validators: [
        CustomValidators.atLeastOne(['nid_number', 'passport_number']),
        CustomValidators.minMax('basic_salary', 'gross_salary')
      ]
    });
  }

  patchForm(data: IEmployee): void {
    if (this.form && data) {
      this.form.patchValue(data);
    }
  }
}
