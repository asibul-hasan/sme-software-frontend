import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hr1001DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService } from '../../../../../shared/services/common-data.service';

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
}

@Injectable()
export class Hr1001ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hr1001DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);
  private commApi = inject(CommonDataService);

  // ─── State ─────────────────────────────────────────────────────────────────
  isSaving  = signal(false);
  isLoading = signal(false);

  employees    = signal<IEmployee[]>([]);
  departments  = signal<any[]>([]);
  designations = signal<any[]>([]);

  selectedEmployeeNo = signal<number | null>(null);
  searchTerm         = signal('');
  filterDeptNo       = signal<number | null>(null);
  filterDesigNo      = signal<number | null>(null);
  filterStatus       = signal<number | null>(null);

  formDeptNo = signal<number | null>(null);

  formDesignations = computed(() => {
    const deptNo = this.formDeptNo();
    const all = this.designations();
    if (!deptNo) return all;
    return all.filter((d: any) => d.department_no === deptNo);
  });

  filteredEmployees = computed(() => {
    const term    = this.searchTerm().toLowerCase().trim();
    const deptNo  = this.filterDeptNo();
    const desigNo = this.filterDesigNo();
    const status  = this.filterStatus();
    let list = this.employees();
    if (deptNo)  list = list.filter((e) => e.department_no  === deptNo);
    if (desigNo) list = list.filter((e) => e.designation_no === desigNo);
    if (status !== null && status !== undefined) list = list.filter((e) => e.active_status === status);
    if (!term) return list;
    return list.filter(
      (e) =>
        (e.full_name   || '').toLowerCase().includes(term) ||
        (e.employee_id || '').toLowerCase().includes(term) ||
        (e.mobile_number || '').includes(term),
    );
  });

  form!: FormGroup;

  // ─── Form Init ─────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group(
      {
        employee_no:               [null],
        employee_id:               ['', [Validators.required, Validators.maxLength(50)]],
        first_name:                ['', [Validators.required, Validators.maxLength(100)]],
        last_name:                 ['', [Validators.required, Validators.maxLength(100)]],
        full_name:                 ['', [Validators.required, Validators.maxLength(200)]],
        first_name_nls:            [''],
        last_name_nls:             [''],
        date_of_birth:             ['', [Validators.required]],
        gender:                    [null],
        marital_status:            [null],
        blood_group:               [''],
        religion:                  [null],
        nationality:               [null],

        nid_number:                [''],
        passport_number:           [''],
        birth_certificate_no:      [''],
        tin_number:                [''],

        department_no:             [null, [Validators.required]],
        designation_no:            [null, [Validators.required]],
        reporting_to:              [null],
        branch_no:                 [this.authCtx.user()?.branch_no ?? null, [Validators.required]],

        joining_date:              ['', [Validators.required]],
        confirmation_date:         [null],
        employment_type:           [null],
        employee_status:           [1],

        mobile_number:             ['', [Validators.required]],
        alternative_mobile_number: [''],
        official_email:            ['', [Validators.email]],
        personal_email:            ['', [Validators.email]],

        emergency_contact_name:    ['', [Validators.required]],
        emergency_contact_number:  ['', [Validators.required]],
        emergency_contact_relation:[''],

        present_address:           ['', [Validators.required]],
        permanent_address:         [''],
        present_post_code:         [''],
        permanent_post_code:       [''],

        pay_schedule:              [null],
        salary_grade_no:           [null],
        basic_salary:              [0, [Validators.required, Validators.min(0)]],
        gross_salary:              [null],

        bank_account_number:       [''],
        bank_name:                 [''],
        bank_branch:               [''],
        routing_number:            [''],
        mfs_number:                [''],
        mfs_provider:              [''],

        contract_start_date:       [null],
        contract_end_date:         [null],
        contract_amount:           [null],
        contract_notes:            [''],

        company_no:                [this.authCtx.user()?.company_no ?? null, [Validators.required]],
        active_status:             [1, [Validators.required]],
        display_sl:                [null],
        remarks:                   [''],
        description:               [''],
      },
      {
        validators: [
          CustomValidators.atLeastOne(['nid_number', 'passport_number']),
          CustomValidators.minMax('basic_salary', 'gross_salary'),
        ],
      },
    );

    this.form.get('department_no')?.valueChanges.subscribe((deptNo) => {
      this.formDeptNo.set(deptNo);
      this.form.patchValue({ designation_no: null }, { emitEvent: false });
    });
  }

  // ─── Load ──────────────────────────────────────────────────────────────────
  loadEmployees(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .loadEmployees()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.employees.set(res.data);
            const resolved = resolvePostReloadSelection(
              res.data,
              (e) => e.employee_no,
              reselectNo,
            );
            resolved ? this.selectEmployee(resolved.item) : this.onNew();
          }
        },
      });
  }

  loadDepartments(): void {
    this.commApi.getDepartmentList().subscribe((res) => {
      if (isSuccess(res) && res.data) this.departments.set(res.data);
    });
  }

  loadDesignations(): void {
    this.commApi.getDesignationList().subscribe((res) => {
      if (isSuccess(res) && res.data) this.designations.set(res.data);
    });
  }

  // ─── Select ────────────────────────────────────────────────────────────────
  selectEmployee(emp: IEmployee): void {
    this.selectedEmployeeNo.set(emp.employee_no);
    this.isLoading.set(true);
    this.data
      .loadEmployeeDetail(emp.employee_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            const deptNo = (d['department_no'] ?? d['departmentNo']) as number | null;
            this.formDeptNo.set(deptNo);
            this.form.patchValue({
              employee_no:               d['employee_no']               ?? d['employeeNo'],
              employee_id:               d['employee_id']               ?? d['employeeId'],
              first_name:                d['first_name']                ?? d['firstName'],
              last_name:                 d['last_name']                 ?? d['lastName'],
              full_name:                 d['full_name']                 ?? d['fullName'],
              first_name_nls:            d['first_name_nls']            ?? d['firstNameNls'],
              last_name_nls:             d['last_name_nls']             ?? d['lastNameNls'],
              date_of_birth:             d['date_of_birth']             ?? d['dateOfBirth'],
              gender:                    d['gender'],
              marital_status:            d['marital_status']            ?? d['maritalStatus'],
              blood_group:               d['blood_group']               ?? d['bloodGroup'],
              religion:                  d['religion'],
              nationality:               d['nationality'],
              nid_number:                d['nid_number']                ?? d['nidNumber'],
              passport_number:           d['passport_number']           ?? d['passportNumber'],
              birth_certificate_no:      d['birth_certificate_no']      ?? d['birthCertificateNo'],
              tin_number:                d['tin_number']                ?? d['tinNumber'],
              department_no:             deptNo,
              designation_no:            d['designation_no']            ?? d['designationNo'],
              reporting_to:              d['reporting_to']              ?? d['reportingTo'],
              branch_no:                 d['branch_no']                 ?? d['branchNo'],
              joining_date:              d['joining_date']              ?? d['joiningDate'],
              confirmation_date:         d['confirmation_date']         ?? d['confirmationDate'],
              employment_type:           d['employment_type']           ?? d['employmentType'],
              employee_status:           d['employee_status']           ?? d['employeeStatus'] ?? 1,
              mobile_number:             d['mobile_number']             ?? d['mobileNumber'],
              alternative_mobile_number: d['alternative_mobile_number'] ?? d['alternativeMobileNumber'],
              official_email:            d['official_email']            ?? d['officialEmail'],
              personal_email:            d['personal_email']            ?? d['personalEmail'],
              emergency_contact_name:    d['emergency_contact_name']    ?? d['emergencyContactName'],
              emergency_contact_number:  d['emergency_contact_number']  ?? d['emergencyContactNumber'],
              emergency_contact_relation:d['emergency_contact_relation'] ?? d['emergencyContactRelation'],
              present_address:           d['present_address']           ?? d['presentAddress'],
              permanent_address:         d['permanent_address']         ?? d['permanentAddress'],
              present_post_code:         d['present_post_code']         ?? d['presentPostCode'],
              permanent_post_code:       d['permanent_post_code']       ?? d['permanentPostCode'],
              pay_schedule:              d['pay_schedule']              ?? d['paySchedule'],
              salary_grade_no:           d['salary_grade_no']           ?? d['salaryGradeNo'],
              basic_salary:              d['basic_salary']              ?? d['basicSalary'] ?? 0,
              gross_salary:              d['gross_salary']              ?? d['grossSalary'],
              bank_account_number:       d['bank_account_number']       ?? d['bankAccountNumber'],
              bank_name:                 d['bank_name']                 ?? d['bankName'],
              bank_branch:               d['bank_branch']               ?? d['bankBranch'],
              routing_number:            d['routing_number']            ?? d['routingNumber'],
              mfs_number:                d['mfs_number']                ?? d['mfsNumber'],
              mfs_provider:              d['mfs_provider']              ?? d['mfsProvider'],
              contract_start_date:       d['contract_start_date']       ?? d['contractStartDate'],
              contract_end_date:         d['contract_end_date']         ?? d['contractEndDate'],
              contract_amount:           d['contract_amount']           ?? d['contractAmount'],
              contract_notes:            d['contract_notes']            ?? d['contractNotes'],
              company_no:                d['company_no']                ?? d['companyNo'],
              active_status:             d['active_status']             ?? d['activeStatus'] ?? 1,
              display_sl:                d['display_sl']                ?? d['displaySl'],
              remarks:                   d['remarks'],
              description:               d['description'],
            });
          }
        },
      });
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedEmployeeNo();
    const obs = isUpdate
      ? this.data.updateEmployee({ ...val, employee_no: this.selectedEmployeeNo() })
      : this.data.saveEmployee(val);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Employee updated' : 'Employee created');
          this.loadEmployees(isUpdate ? this.selectedEmployeeNo() : null);
        }
      },
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  onDelete(): void {
    const no = this.selectedEmployeeNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .deleteEmployee(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Employee deleted');
            this.loadEmployees();
          }
        },
      });
  }

  // ─── New ───────────────────────────────────────────────────────────────────
  onNew(): void {
    this.selectedEmployeeNo.set(null);
    this.formDeptNo.set(null);
    this.form.reset({
      active_status:    1,
      employee_status:  1,
      basic_salary:     0,
      company_no: this.authCtx.user()?.company_no ?? null,
      branch_no:  this.authCtx.user()?.branch_no  ?? null,
    });
  }
}
