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
import {
  CommonDataService,
  DepartmentLookup,
  DesignationLookup,
} from '../../../../../shared/services/common-data.service';
import { hrmConstants } from '../../../constants/hrm.constants';
import { TranslateService } from '@ngx-translate/core';

/**
 * Employee entity — mirrors the `HRM_employee` table from db-updated.md.
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
  taxpayer_class?: string | null;

  // Org Mapping
  department_no: number;
  designation_no: number;
  grade_no?: number | null;
  reporting_to?: number | null;
  branch_no: number;
  company_no?: number | null;

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
  contract_type?: number | null;
  contract_end_date?: string | null;
  contract_amount?: number | null;
  contract_notes?: string | null;

  // Education
  highest_education?: string | null;
  education_subject?: string | null;
  is_experienced?: number | null;
  experience_duration?: string | null;

  remarks?: string | null;
}

export interface GradeOption {
  grade_no: number;
  grade_id: string;
  grade_name: string;
  min_salary?: number | null;
  max_salary?: number | null;
  is_active?: number | null;
}

type AddressScope = 'present' | 'permanent';
type UploadTarget = 'photo_url' | 'signature_url';
const DEFAULT_TAXPAYER_CLASS = 'GENERAL';

@Injectable()
export class Hrm1001ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Hrm1001DataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);
  private commApi = inject(CommonDataService);
  private translate = inject(TranslateService);
  private readonly taxpayerClassValues = new Set(
    hrmConstants.taxpayerClasses.map((option) =>
      String(option.value).toUpperCase(),
    ),
  );

  // ─── State ─────────────────────────────────────────────────────────────────
  isSaving = signal(false);
  isLoading = signal(false);
  isImporting = signal(false);
  importErrors = signal<string[]>([]);
  selectedImportFile = signal<File | null>(null);
  validImportRows = signal<Partial<IEmployee>[]>([]);

  employees = signal<IEmployee[]>([]);
  departments = signal<DepartmentLookup[]>([]);
  designations = signal<DesignationLookup[]>([]);
  grades = signal<GradeOption[]>([]);

  selectedEmployeeNo = signal<number | null>(null);
  searchTerm = signal('');
  filterDeptNo = signal<number | null>(null);
  filterDesigNo = signal<number | null>(null);
  filterStatus = signal<number | null>(null);

  formDeptNo = signal<number | null>(null);
  formDesignationNo = signal<number | null>(null);

  formDesignations = computed(() => {
    const deptNo = this.formDeptNo();
    const all = this.designations();
    if (!deptNo) return all;
    return all.filter((d) => d.department_no === deptNo);
  });

  currentDesignation = computed(() => {
    const designationNo = this.formDesignationNo();
    return (
      this.designations().find((d) => d.designation_no === designationNo) ??
      null
    );
  });

  availableGrades = computed(() => {
    const activeGrades = this.grades().filter(
      (g) => g.is_active == null || g.is_active === 1,
    );
    const gradeLevel = this.currentDesignation()
      ?.grade_level?.trim()
      .toLowerCase();
    if (!gradeLevel) return activeGrades;
    const matched = activeGrades.filter((g) =>
      [g.grade_id, g.grade_name].some(
        (value) => value?.trim().toLowerCase() === gradeLevel,
      ),
    );
    return matched.length ? matched : activeGrades;
  });

  currentGrade = computed(() => {
    const gradeNo = this.form?.get('grade_no')?.value as number | null;
    return this.grades().find((g) => g.grade_no === gradeNo) ?? null;
  });

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const deptNo = this.filterDeptNo();
    const desigNo = this.filterDesigNo();
    const status = this.filterStatus();
    let list = this.employees();
    if (deptNo) list = list.filter((e) => e.department_no === deptNo);
    if (desigNo) list = list.filter((e) => e.designation_no === desigNo);
    if (status !== null && status !== undefined)
      list = list.filter((e) => e.is_active === status);
    if (!term) return list;
    return list.filter((e) => {
      const fullName = `${e.first_name} ${e.last_name ?? ''}`
        .trim()
        .toLowerCase();
      return (
        fullName.includes(term) ||
        (e.employee_id || '').toLowerCase().includes(term) ||
        (e.mobile_number || '').includes(term)
      );
    });
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator<IEmployee>(this.filteredEmployees);

  form!: FormGroup;

  private readonly importHeaders = [
    'employee_id',
    'first_name',
    'middle_name',
    'last_name',
    'date_of_birth',
    'gender',
    'department_no',
    'designation_no',
    'grade_no',
    'joining_date',
    'employment_type',
    'taxpayer_class',
    'salary',
    'mobile_number',
    'official_email',
    'personal_email',
    'emergency_contact_name',
    'emergency_contact_number',
    'present_address',
    'permanent_address',
    'contract_type',
    'contract_start_date',
    'contract_end_date',
    'contract_amount',
    'highest_education',
    'experience_duration',
    'remarks',
  ];

  // ─── Form Init ─────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group(
      {
        employee_no: [null],
        employee_id: ['', [Validators.required, Validators.maxLength(30)]],
        first_name: ['', [Validators.required, Validators.maxLength(100)]],
        middle_name: ['', [Validators.maxLength(100)]],
        last_name: ['', [Validators.maxLength(100)]],

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
        taxpayer_class: [DEFAULT_TAXPAYER_CLASS, [Validators.maxLength(30)]],

        department_no: [null, [Validators.required]],
        designation_no: [null, [Validators.required]],
        grade_no: [null],
        reporting_to: [null],
        branch_no: [this.authCtx.user()?.branch_no ?? null],

        joining_date: ['', [Validators.required]],
        confirmation_date: [null],
        employment_type: [1, [Validators.required]],
        is_active: [1],
        is_create_user: [0],

        mobile_number: ['', [Validators.required]],
        alternative_mobile_number: [''],
        official_email: ['', [Validators.email]],
        personal_email: ['', [Validators.email]],

        emergency_contact_name: ['', [Validators.required]],
        emergency_contact_number: ['', [Validators.required]],
        emergency_contact_relation: [''],

        present_address: [''],
        permanent_address: [''],
        present_post_code: [''],
        permanent_post_code: [''],
        present_road_village: ['', [Validators.required]],
        present_post_office: [''],
        present_thana: [''],
        present_zilla: [''],
        present_division: [''],
        permanent_road_village: [''],
        permanent_post_office: [''],
        permanent_thana: [''],
        permanent_zilla: [''],
        permanent_division: [''],

        pay_schedule: [null],
        salary: [0, [Validators.required, Validators.min(0)]],

        bank_account_no: [''],
        bank_name: [''],
        bank_branch: [''],
        routing_number: [''],
        mfs_number: [''],
        mfs_provider: [''],

        contract_start_date: [null],
        contract_type: [null],
        contract_end_date: [null],
        contract_amount: [null],
        contract_notes: [''],

        highest_education: [''],
        education_subject: [''],
        is_experienced: [0],
        experience_duration: [''],
        photo_url: [''],
        signature_url: [''],

        company_no: [this.authCtx.user()?.company_no ?? null],
        remarks: [''],
      },
      {
        validators: [
          CustomValidators.atLeastOne(['nid_number', 'passport_number']),
        ],
      },
    );

    this.form.get('department_no')?.valueChanges.subscribe((deptNo) => {
      this.formDeptNo.set(deptNo);
      this.formDesignationNo.set(null);
      this.form.patchValue(
        { designation_no: null, grade_no: null },
        { emitEvent: false },
      );
    });

    this.form.get('designation_no')?.valueChanges.subscribe((designationNo) => {
      this.formDesignationNo.set(designationNo);
      this.applyDesignationDefaults();
    });

    this.form
      .get('grade_no')
      ?.valueChanges.subscribe(() => this.applyGradeSalary());

    this.form
      .get('employment_type')
      ?.valueChanges.subscribe(() => this.applyEmploymentTypeRules());
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

  loadGrades(): void {
    this.data.loadGrades().subscribe((res) => {
      if (isSuccess(res) && res.data) this.grades.set(res.data);
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
            const deptNo = (d['department_no'] ?? d['departmentNo']) as
              | number
              | null;
            this.formDeptNo.set(deptNo);
            this.form.patchValue({
              employee_no: d['employee_no'] ?? d['employeeNo'],
              employee_id: d['employee_id'] ?? d['employeeId'],
              first_name: d['first_name'] ?? d['firstName'],
              middle_name: d['middle_name'] ?? d['middleName'],
              last_name: d['last_name'] ?? d['lastName'],
              date_of_birth: d['date_of_birth'] ?? d['dateOfBirth'],
              gender: d['gender'],
              marital_status: d['marital_status'] ?? d['maritalStatus'],
              blood_group: d['blood_group'] ?? d['bloodGroup'],
              religion: d['religion'],
              nationality: d['nationality'],
              nid_number: d['nid_number'] ?? d['nidNumber'],
              passport_number: d['passport_number'] ?? d['passportNumber'],
              birth_certificate_no:
                d['birth_certificate_no'] ?? d['birthCertificateNo'],
              tin_number: d['tin_number'] ?? d['tinNumber'],
              taxpayer_class:
                d['taxpayer_class'] ??
                d['taxpayerClass'] ??
                DEFAULT_TAXPAYER_CLASS,
              department_no: deptNo,
              designation_no: d['designation_no'] ?? d['designationNo'],
              grade_no: d['grade_no'] ?? d['gradeNo'],
              reporting_to: d['reporting_to'] ?? d['reportingTo'],
              branch_no: d['branch_no'] ?? d['branchNo'],
              joining_date: d['joining_date'] ?? d['joiningDate'],
              confirmation_date:
                d['confirmation_date'] ?? d['confirmationDate'],
              employment_type: d['employment_type'] ?? d['employmentType'],
              is_active: d['is_active'] ?? d['isActive'] ?? 1,
              is_create_user: d['is_create_user'] ?? d['isCreateUser'] ?? 0,
              mobile_number: d['mobile_number'] ?? d['mobileNumber'],
              alternative_mobile_number:
                d['alternative_mobile_number'] ?? d['alternativeMobileNumber'],
              official_email: d['official_email'] ?? d['officialEmail'],
              personal_email: d['personal_email'] ?? d['personalEmail'],
              emergency_contact_name:
                d['emergency_contact_name'] ?? d['emergencyContactName'],
              emergency_contact_number:
                d['emergency_contact_number'] ?? d['emergencyContactNumber'],
              emergency_contact_relation:
                d['emergency_contact_relation'] ??
                d['emergencyContactRelation'],
              present_address: d['present_address'] ?? d['presentAddress'],
              permanent_address:
                d['permanent_address'] ?? d['permanentAddress'],
              present_post_code: d['present_post_code'] ?? d['presentPostCode'],
              permanent_post_code:
                d['permanent_post_code'] ?? d['permanentPostCode'],
              present_road_village:
                d['present_road_village'] ??
                d['presentRoadVillage'] ??
                d['present_address'] ??
                d['presentAddress'],
              present_post_office:
                d['present_post_office'] ?? d['presentPostOffice'],
              present_thana: d['present_thana'] ?? d['presentThana'],
              present_zilla: d['present_zilla'] ?? d['presentZilla'],
              present_division: d['present_division'] ?? d['presentDivision'],
              permanent_road_village:
                d['permanent_road_village'] ??
                d['permanentRoadVillage'] ??
                d['permanent_address'] ??
                d['permanentAddress'],
              permanent_post_office:
                d['permanent_post_office'] ?? d['permanentPostOffice'],
              permanent_thana: d['permanent_thana'] ?? d['permanentThana'],
              permanent_zilla: d['permanent_zilla'] ?? d['permanentZilla'],
              permanent_division:
                d['permanent_division'] ?? d['permanentDivision'],
              pay_schedule: d['pay_schedule'] ?? d['paySchedule'],
              salary: d['salary'] ?? 0,
              bank_account_no: d['bank_account_no'] ?? d['bankAccountNo'],
              bank_name: d['bank_name'] ?? d['bankName'],
              bank_branch: d['bank_branch'] ?? d['bankBranch'],
              routing_number: d['routing_number'] ?? d['routingNumber'],
              mfs_number: d['mfs_number'] ?? d['mfsNumber'],
              mfs_provider: d['mfs_provider'] ?? d['mfsProvider'],
              contract_start_date:
                d['contract_start_date'] ?? d['contractStartDate'],
              contract_type: d['contract_type'] ?? d['contractType'],
              contract_end_date: d['contract_end_date'] ?? d['contractEndDate'],
              contract_amount: d['contract_amount'] ?? d['contractAmount'],
              contract_notes: d['contract_notes'] ?? d['contractNotes'],
              highest_education:
                d['highest_education'] ?? d['highestEducation'],
              education_subject:
                d['education_subject'] ?? d['educationSubject'],
              is_experienced: d['is_experienced'] ?? d['isExperienced'] ?? 0,
              experience_duration:
                d['experience_duration'] ?? d['experienceDuration'],
              photo_url: d['photo_url'] ?? d['photoUrl'],
              signature_url: d['signature_url'] ?? d['signatureUrl'],
              company_no: d['company_no'] ?? d['companyNo'],
              remarks: d['remarks'],
            });
            this.formDesignationNo.set(
              this.form.get('designation_no')?.value ?? null,
            );
            this.applyEmploymentTypeRules();
          }
        },
      });
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      const fieldMap: Record<string, string> = {
        employee_id: 'employeeIdMissing',
        first_name: 'firstNameMissing',
        date_of_birth: 'dateOfBirthMissing',
        department_no: 'departmentMissing',
        designation_no: 'designationMissing',
        branch_no: 'branchMissing',
        joining_date: 'joiningDateMissing',
        employment_type: 'employmentTypeMissing',
        mobile_number: 'mobileNumberMissing',
        emergency_contact_name: 'emergencyContactNameMissing',
        emergency_contact_number: 'emergencyContactNumberMissing',
        present_road_village: 'presentRoadVillageMissing',
        salary: 'salaryMissing',
        company_no: 'companyMissing',
        grade_no: 'gradeMissing',
        contract_type: 'contractTypeMissing'
      };

      for (const key of Object.keys(this.form.controls)) {
        const control = this.form.get(key);
        if (control?.invalid) {
          const nameKey = fieldMap[key];
          if (key === 'company_no') {
             this.toastr.warning(`Company is invalid! Value: ${control.value}, Errors: ${JSON.stringify(control.errors)}, AuthCompany: ${this.authCtx.user()?.company_no}`);
             return;
          }
          if (nameKey) {
            const errorMsg = this.translate.instant(nameKey);
            this.toastr.warning(errorMsg);
          } else {
            const fallbackName = key.replace(/_/g, ' ');
            this.toastr.warning(`${fallbackName} is required`);
          }
          return;
        }
      }

      if (this.form.errors?.['atLeastOne']) {
        this.toastr.warning('Either NID Number or Passport Number is required.');
      } else {
        this.toastr.warning('Please check form validation errors.');
      }
      return;
    }

    this.isSaving.set(true);
    const val = this.preparePayload();
    const selectedNo = this.selectedEmployeeNo();
    const isUpdate = !!selectedNo;
    const obs = isUpdate
      ? this.data.updateEmployee({ ...val, employee_no: selectedNo })
      : this.data.saveEmployee(val);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(this.translate.instant('saveSuccess'));
          this.loadEmployees(isUpdate ? this.selectedEmployeeNo() : null);
        }
      },
      error: (err) => {
        console.error('Failed to save employee:', err);
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
            this.toastr.success(this.translate.instant('deleteSuccess'));
            this.onNew();
            this.loadEmployees();
          }
        },
        error: (err) => {
          console.error('Failed to delete employee:', err);
        },
      });
  }

  // ─── New ───────────────────────────────────────────────────────────────────
  onNew(): void {
    this.selectedEmployeeNo.set(null);
    this.formDeptNo.set(null);
    this.formDesignationNo.set(null);
    this.form.reset({
      is_active: 1,
      is_create_user: 0,
      employment_type: 1,
      taxpayer_class: DEFAULT_TAXPAYER_CLASS,
      salary: 0,
      is_experienced: 0,
      company_no: this.authCtx.user()?.company_no ?? null,
      branch_no: this.authCtx.user()?.branch_no ?? null,
    });
    this.applyEmploymentTypeRules();
  }

  copyPresentToPermanent(): void {
    this.form.patchValue({
      permanent_road_village: this.form.get('present_road_village')?.value,
      permanent_post_office: this.form.get('present_post_office')?.value,
      permanent_thana: this.form.get('present_thana')?.value,
      permanent_zilla: this.form.get('present_zilla')?.value,
      permanent_division: this.form.get('present_division')?.value,
      permanent_post_code: this.form.get('present_post_code')?.value,
    });
  }

  shouldShowContractSection(): boolean {
    return Number(this.form?.get('employment_type')?.value) === 2;
  }

  shouldShowContractType(): boolean {
    const type = Number(this.form?.get('employment_type')?.value);
    return type === 2 || type === 4;
  }

  requiresGrade(): boolean {
    const type = Number(this.form?.get('employment_type')?.value);
    return type !== 2 && type !== 4;
  }

  handleImageUpload(event: Event, controlName: UploadTarget): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Only image files are allowed.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toastr.warning('Image size must be 1 MB or less.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      this.form.get(controlName)?.setValue(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearImage(controlName: UploadTarget): void {
    this.form.get(controlName)?.setValue('');
  }

  async downloadImportTemplate(): Promise<void> {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.aoa_to_sheet([
      this.importHeaders,
      [
        'EMP-001',
        'Employee First Name',
        '',
        'Last Name',
        '1995-01-01',
        1,
        '',
        '',
        '',
        '2026-01-01',
        1,
        0,
        '+8801XXXXXXXXX',
        'employee@company.com',
        '',
        'Emergency Contact',
        '+8801XXXXXXXXX',
        'Road / Village: Example, Post Office: Example, Thana / Police Station: Example, Zilla / District: Example, Division / State: Example',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
    ]);
    worksheet['!cols'] = this.importHeaders.map(() => ({ wch: 24 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'HRM-employee-import-template.xlsx');
  }

  async handleImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImportFile.set(file);
    this.importErrors.set([]);
    this.validImportRows.set([]);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true,
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });
      const { validRows, errors } = this.validateImportRows(rows);
      if (errors.length) {
        this.importErrors.set(errors);
        this.toastr.warning('Employee import has validation errors.');
        return;
      }
      if (!validRows.length) {
        this.toastr.warning('No employee rows found in the import file.');
        return;
      }
      this.validImportRows.set(validRows);
    } catch {
      this.toastr.error('Failed to read employee import file.');
      this.selectedImportFile.set(null);
    } finally {
      input.value = '';
    }
  }

  importEmployees(): void {
    const validRows = this.validImportRows();
    if (!validRows.length) return;

    this.isImporting.set(true);
    this.data
      .bulkImportEmployees(validRows)
      .pipe(finalize(() => this.isImporting.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(`${validRows.length} employees imported`);
            this.clearSelectedImportFile();
            this.loadEmployees();
          }
        },
      });
  }

  clearSelectedImportFile(): void {
    this.selectedImportFile.set(null);
    this.importErrors.set([]);
    this.validImportRows.set([]);
  }

  reportContext(): {
    employee: Record<string, unknown>;
    departmentName?: string;
    designationName?: string;
    gradeName?: string;
    employmentType?: string;
    taxpayerClass?: string;
  } {
    const payload = this.preparePayload();
    const dept = this.departments().find(
      (d) => d.department_no === payload['department_no'],
    );
    const designation = this.designations().find(
      (d) => d.designation_no === payload['designation_no'],
    );
    const grade = this.grades().find((g) => g.grade_no === payload['grade_no']);
    const employmentType = hrmConstants.employmentTypeOptions.find(
      (option) => option.value === payload['employment_type'],
    );
    const taxpayerClass = hrmConstants.taxpayerClasses.find(
      (option) => option.value === payload['taxpayer_class'],
    );
    return {
      employee: payload,
      departmentName: dept?.department_name,
      designationName: designation?.designation_name,
      gradeName: grade?.grade_name,
      employmentType: employmentType?.label,
      taxpayerClass: taxpayerClass?.label,
    };
  }

  private applyEmploymentTypeRules(): void {
    const grade = this.form.get('grade_no');
    const contractType = this.form.get('contract_type');
    if (this.requiresGrade()) {
      grade?.setValidators([Validators.required]);
      contractType?.clearValidators();
      if (!this.shouldShowContractType())
        contractType?.setValue(null, { emitEvent: false });
    } else {
      grade?.clearValidators();
      grade?.setValue(null, { emitEvent: false });
      contractType?.setValidators([Validators.required]);
    }
    grade?.updateValueAndValidity({ emitEvent: false });
    contractType?.updateValueAndValidity({ emitEvent: false });
  }

  private validateImportRows(rows: Record<string, unknown>[]): {
    validRows: Partial<IEmployee>[];
    errors: string[];
  } {
    const errors: string[] = [];
    const validRows: Partial<IEmployee>[] = [];
    const companyNo = this.authCtx.user()?.company_no;
    const branchNo = this.authCtx.user()?.branch_no;
    if (companyNo == null || branchNo == null) {
      return {
        validRows,
        errors: ['Company and branch context are required before import.'],
      };
    }
    const existingIds = new Set(
      this.employees().map((employee) => employee.employee_id?.toLowerCase()),
    );
    const importIds = new Set<string>();

    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const employeeId = this.importText(row, 'employee_id');
      const departmentNo = this.importNumber(row, 'department_no');
      const designationNo = this.importNumber(row, 'designation_no');
      const gradeNo = this.importNumber(row, 'grade_no');
      const employmentType = this.importNumber(row, 'employment_type') ?? 1;
      const taxpayerClass = this.importTaxpayerClass(row);
      const officialEmail = this.importText(row, 'official_email');
      const personalEmail = this.importText(row, 'personal_email');
      const mobile = this.importText(row, 'mobile_number');
      const emergencyPhone = this.importText(row, 'emergency_contact_number');
      const rowErrors: string[] = [];

      [
        ['employee_id', employeeId],
        ['first_name', this.importText(row, 'first_name')],
        ['date_of_birth', this.importDate(row, 'date_of_birth')],
        ['department_no', departmentNo],
        ['designation_no', designationNo],
        ['joining_date', this.importDate(row, 'joining_date')],
        ['employment_type', employmentType],
        ['salary', this.importNumber(row, 'salary')],
        ['mobile_number', mobile],
        [
          'emergency_contact_name',
          this.importText(row, 'emergency_contact_name'),
        ],
        ['emergency_contact_number', emergencyPhone],
        ['present_address', this.importText(row, 'present_address')],
      ].forEach(([field, value]) => {
        if (value === null || value === undefined || value === '')
          rowErrors.push(`Missing ${field}`);
      });

      const lowerEmployeeId = employeeId.toLowerCase();
      if (employeeId && existingIds.has(lowerEmployeeId))
        rowErrors.push('Duplicate employee_id');
      if (employeeId && importIds.has(lowerEmployeeId))
        rowErrors.push('Duplicate employee_id in import file');
      if (employeeId) importIds.add(lowerEmployeeId);

      if (
        departmentNo &&
        !this.departments().some((dept) => dept.department_no === departmentNo)
      ) {
        rowErrors.push('Invalid department_no');
      }
      if (
        designationNo &&
        !this.designations().some(
          (designation) =>
            designation.designation_no === designationNo &&
            (!departmentNo || designation.department_no === departmentNo),
        )
      ) {
        rowErrors.push('Invalid designation_no');
      }
      if (
        gradeNo &&
        !this.grades().some((grade) => grade.grade_no === gradeNo)
      ) {
        rowErrors.push('Invalid grade_no');
      }
      if (taxpayerClass && !this.taxpayerClassValues.has(taxpayerClass)) {
        rowErrors.push('Invalid taxpayer_class');
      }
      if (employmentType !== 2 && employmentType !== 4 && !gradeNo) {
        rowErrors.push('Missing grade_no');
      }
      if (
        (employmentType === 2 || employmentType === 4) &&
        !this.importNumber(row, 'contract_type')
      ) {
        rowErrors.push('Missing contract_type');
      }
      if (officialEmail && !this.isValidEmail(officialEmail))
        rowErrors.push('Invalid official_email');
      if (personalEmail && !this.isValidEmail(personalEmail))
        rowErrors.push('Invalid personal_email');
      if (mobile && !this.isValidPhone(mobile))
        rowErrors.push('Invalid mobile_number');
      if (emergencyPhone && !this.isValidPhone(emergencyPhone))
        rowErrors.push('Invalid emergency_contact_number');

      if (rowErrors.length) {
        errors.push(`Row ${rowNo}: ${rowErrors.join(', ')}`);
        return;
      }

      validRows.push({
        employee_id: employeeId,
        first_name: this.importText(row, 'first_name'),
        middle_name: this.importText(row, 'middle_name') || null,
        last_name: this.importText(row, 'last_name') || null,
        date_of_birth: this.importDate(row, 'date_of_birth'),
        gender: this.importNumber(row, 'gender'),
        department_no: departmentNo!,
        designation_no: designationNo!,
        grade_no: gradeNo,
        joining_date: this.importDate(row, 'joining_date'),
        employment_type: employmentType,
        taxpayer_class: taxpayerClass || DEFAULT_TAXPAYER_CLASS,
        salary: this.importNumber(row, 'salary') ?? 0,
        mobile_number: mobile,
        official_email: officialEmail || null,
        personal_email: personalEmail || null,
        emergency_contact_name: this.importText(row, 'emergency_contact_name'),
        emergency_contact_number: emergencyPhone,
        present_address: this.importText(row, 'present_address'),
        permanent_address: this.importText(row, 'permanent_address') || null,
        contract_type: this.importNumber(row, 'contract_type'),
        contract_start_date:
          this.importDate(row, 'contract_start_date') || null,
        contract_end_date: this.importDate(row, 'contract_end_date') || null,
        contract_amount: this.importNumber(row, 'contract_amount'),
        highest_education: this.importText(row, 'highest_education') || null,
        experience_duration:
          this.importText(row, 'experience_duration') || null,
        remarks: this.importText(row, 'remarks') || null,
        is_active: 1,
        company_no: companyNo,
        branch_no: branchNo,
      });
    });

    return { validRows, errors };
  }

  private importText(row: Record<string, unknown>, field: string): string {
    return String(row[field] ?? '').trim();
  }

  private importNumber(
    row: Record<string, unknown>,
    field: string,
  ): number | null {
    const value = row[field];
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private importDate(row: Record<string, unknown>, field: string): string {
    const value = row[field];
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime()))
      return value.toISOString().slice(0, 10);
    return String(value).trim();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPhone(value: string): boolean {
    return /^[+0-9()\-\s]{7,20}$/.test(value);
  }

  private applyDesignationDefaults(): void {
    const designation = this.currentDesignation();
    if (!designation) return;
    const grade = this.availableGrades()[0];
    if (grade && !this.form.get('grade_no')?.value && this.requiresGrade()) {
      this.form.patchValue({ grade_no: grade.grade_no }, { emitEvent: true });
      return;
    }
    const salary = designation.min_salary ?? designation.max_salary;
    if (salary != null && Number(this.form.get('salary')?.value || 0) === 0) {
      this.form.patchValue({ salary }, { emitEvent: false });
    }
  }

  private applyGradeSalary(): void {
    const grade = this.currentGrade();
    if (!grade) return;
    const salary = grade.min_salary ?? grade.max_salary;
    if (salary != null) this.form.patchValue({ salary }, { emitEvent: false });
  }

  private preparePayload(): Record<string, any> {
    const val = this.form.getRawValue();
    const payload = { ...val };
    payload.taxpayer_class = this.normalizeTaxpayerClass(
      payload.taxpayer_class,
    );
    payload.company_no = payload.company_no ?? this.authCtx.user()?.company_no ?? null;
    payload.branch_no = payload.branch_no ?? this.authCtx.user()?.branch_no ?? null;

    const formatDateField = (dateVal: any): string | null => {
      if (!dateVal) return null;
      if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
        return dateVal.toISOString().slice(0, 10);
      }
      if (typeof dateVal === 'string' && dateVal.includes('T')) {
        return dateVal.split('T')[0];
      }
      return String(dateVal).trim() || null;
    };

    ['date_of_birth', 'joining_date', 'confirmation_date', 'contract_start_date', 'contract_end_date'].forEach((field) => {
      if (field in payload) {
        payload[field] = formatDateField(payload[field]);
      }
    });

    [
      'present_road_village',
      'present_post_office',
      'present_thana',
      'present_zilla',
      'present_division',
      'permanent_road_village',
      'permanent_post_office',
      'permanent_thana',
      'permanent_zilla',
      'permanent_division',
    ].forEach((field) => delete payload[field]);
    return {
      ...payload,
      present_address: this.composeAddress('present'),
      permanent_address: this.composeAddress('permanent'),
    };
  }

  private importTaxpayerClass(row: Record<string, unknown>): string {
    return this.normalizeTaxpayerClass(this.importText(row, 'taxpayer_class'));
  }

  private normalizeTaxpayerClass(value: unknown): string {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    return normalized || DEFAULT_TAXPAYER_CLASS;
  }

  private composeAddress(scope: AddressScope): string {
    const rows: Array<[string, string]> = [
      ['Road / Village', `${scope}_road_village`],
      ['Post Office', `${scope}_post_office`],
      ['Thana / Police Station', `${scope}_thana`],
      ['Zilla / District', `${scope}_zilla`],
      ['Division / State', `${scope}_division`],
      ['Post Code', `${scope}_post_code`],
    ];
    return rows
      .map(([label, control]) => {
        const value = this.form.get(control)?.value;
        return value ? `${label}: ${value}` : '';
      })
      .filter(Boolean)
      .join(', ');
  }
}
