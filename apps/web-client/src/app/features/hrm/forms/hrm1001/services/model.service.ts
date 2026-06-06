import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1001DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { makePaginator } from '../../../../../core/utils/paginator';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, DepartmentLookup, DesignationLookup } from '../../../../../shared/services/common-data.service';

/**
 * Employee entity — mirrors the `hr_employee` table from db-updated.md.
 *
 * Field names use snake_case to match the backend JSON wire format
 * (Jackson SNAKE_CASE serialisation) so the API response maps directly
 * without transformation.
 */
export interface IEmployee extends BaseEntity {
  employee_no: number;
  employee_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;

  // Personal Core
  date_of_birth: string;
  gender?: number | null;
  marital_status?: number | null;
  blood_group?: string | null;
  religion?: number | null;
  nationality?: number | null;
  photo_url?: string | null;
  signature_url?: string | null;

  // Statutory Identifiers
  nid_number?: string | null;
  passport_number?: string | null;
  birth_certificate_no?: string | null;
  tin_number?: string | null;

  // Org Mapping
  department_no: number;
  designation_no: number;
  reporting_to?: number | null;
  branch_no: number;

  // Contract Milestones
  joining_date: string;
  confirmation_date?: string | null;
  employment_type?: number | null;
  is_active: number;

  // Communication
  mobile_number: string;
  alternative_mobile_number?: string | null;
  official_email?: string | null;
  personal_email?: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relation?: string | null;

  // Address
  present_address: string;
  permanent_address?: string | null;
  present_post_code?: string | null;
  permanent_post_code?: string | null;

  // Compensation
  pay_schedule?: number | null;
  salary: number;

  // Bank & MFS
  bank_account_no?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  routing_number?: string | null;
  mfs_number?: string | null;
  mfs_provider?: string | null;

  // Contract (for contractual employees)
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  contract_amount?: number | null;
  contract_notes?: string | null;

  // Education
  highest_education?: string | null;
  education_subject?: string | null;

  remarks?: string | null;
}

@Injectable()
export class Hrm1001ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1001DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);
  private commApi = inject(CommonDataService);

  // ─── State ─────────────────────────────────────────────────────────────────
  isSaving  = signal(false);
  isLoading = signal(false);

  employees    = signal<IEmployee[]>([]);
  departments  = signal<DepartmentLookup[]>([]);
  designations = signal<DesignationLookup[]>([]);

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
    return all.filter((d) => d.department_no === deptNo);
  });

  filteredEmployees = computed(() => {
    const term    = this.searchTerm().toLowerCase().trim();
    const deptNo  = this.filterDeptNo();
    const desigNo = this.filterDesigNo();
    const status  = this.filterStatus();
    let list = this.employees();
    if (deptNo)  list = list.filter((e) => e.department_no  === deptNo);
    if (desigNo) list = list.filter((e) => e.designation_no === desigNo);
    if (status !== null && status !== undefined) list = list.filter((e) => e.is_active === status);
    if (!term) return list;
    return list.filter(
      (e) => {
        const fullName = `${e.first_name} ${e.last_name ?? ''}`.trim().toLowerCase();
        return fullName.includes(term) ||
          (e.employee_id || '').toLowerCase().includes(term) ||
          (e.mobile_number || '').includes(term);
      },
    );
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator<IEmployee>(this.filteredEmployees);

  form!: FormGroup;

  // ─── Form Init ─────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group(
      {
        employee_no:               [null],
        employee_id:               ['', [Validators.required, Validators.maxLength(30)]],
        first_name:                ['', [Validators.required, Validators.maxLength(100)]],
        middle_name:               ['', [Validators.maxLength(100)]],
        last_name:                 ['', [Validators.maxLength(100)]],

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
        is_active:                 [1],
        is_create_user:            [0],

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
        salary:                    [0, [Validators.required, Validators.min(0)]],

        bank_account_no:           [''],
        bank_name:                 [''],
        bank_branch:               [''],
        routing_number:            [''],
        mfs_number:                [''],
        mfs_provider:              [''],

        contract_start_date:       [null],
        contract_end_date:         [null],
        contract_amount:           [null],
        contract_notes:            [''],

        highest_education:         [''],
        education_subject:         [''],

        company_no:                [this.authCtx.user()?.company_no ?? null, [Validators.required]],
        remarks:                   [''],
      },
      {
        validators: [
          CustomValidators.atLeastOne(['nid_number', 'passport_number']),
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
              middle_name:               d['middle_name']               ?? d['middleName'],
              last_name:                 d['last_name']                 ?? d['lastName'],
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
              is_active:                 d['is_active']                 ?? d['isActive'] ?? 1,
              is_create_user:            d['is_create_user']            ?? d['isCreateUser'] ?? 0,
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
              salary:                    d['salary']                    ?? 0,
              bank_account_no:           d['bank_account_no']           ?? d['bankAccountNo'],
              bank_name:                 d['bank_name']                 ?? d['bankName'],
              bank_branch:               d['bank_branch']               ?? d['bankBranch'],
              routing_number:            d['routing_number']            ?? d['routingNumber'],
              mfs_number:                d['mfs_number']                ?? d['mfsNumber'],
              mfs_provider:              d['mfs_provider']              ?? d['mfsProvider'],
              contract_start_date:       d['contract_start_date']       ?? d['contractStartDate'],
              contract_end_date:         d['contract_end_date']         ?? d['contractEndDate'],
              contract_amount:           d['contract_amount']           ?? d['contractAmount'],
              contract_notes:            d['contract_notes']            ?? d['contractNotes'],
              highest_education:         d['highest_education']         ?? d['highestEducation'],
              education_subject:         d['education_subject']         ?? d['educationSubject'],
              company_no:                d['company_no']                ?? d['companyNo'],
              remarks:                   d['remarks'],
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
      is_active:  1,
      is_create_user: 0,
      salary:     0,
      company_no: this.authCtx.user()?.company_no ?? null,
      branch_no:  this.authCtx.user()?.branch_no  ?? null,
    });
  }
}
