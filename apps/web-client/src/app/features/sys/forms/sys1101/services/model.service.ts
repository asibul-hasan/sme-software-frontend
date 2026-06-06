import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import {
  CommonDataService,
  DepartmentLookup,
  DesignationLookup,
} from '../../../../../shared/services/common-data.service';
import { AuthDataService } from '../../../../auth/services/data.service';
import { Sys1101DataService } from './data.service';

// ─── Form-specific DTOs (match backend Sys1101 DTOs) ────────────────────────

export interface Sys1101EmployeeDto {
  employee_no: number;
  employee_id: string;
  full_name: string;
  department_no: number | null;
  department_name: string | null;
  designation_no: number | null;
  designation_name: string | null;
  is_active: number;
  joining_date: string | null;
  official_email: string | null;
  mobile_number: string | null;
}

export interface Sys1101UserDto {
  user_no: number | null;
  user_id: string | null;
  employee_no: number | null;
  user_name: string;
  is_active: number;
  is_locked: number;
  /** 1=BRANCH, 2=COMPANY, 3=GLOBAL (SYS re-plan). */
  access_scope: number | null;
  failed_login_count: number | null;
  last_login_at: string | null;
  password_changed_at: string | null;
  row_version: number | null;
  password?: string;
}

export interface Sys1101UserRoleDto {
  user_role_no: number;
  role_no: number;
  role_name: string;
  is_primary: number;
  is_active: number;
}

@Injectable()
export class Sys1101ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1101DataService);
  private commonApi = inject(CommonDataService);
  private authApi = inject(AuthDataService);
  private toastr = inject(ToastrService);

  isSaving = signal(false);
  isLoading = signal(false);

  // ─── Lookup data ──────────────────────────────────────────────────────────
  employees = signal<Sys1101EmployeeDto[]>([]);
  departments = signal<DepartmentLookup[]>([]);
  designations = signal<DesignationLookup[]>([]);
  roleMappings = signal<Sys1101UserRoleDto[]>([]);

  // ─── Selection state ──────────────────────────────────────────────────────
  selectedEmployee = signal<Sys1101EmployeeDto | null>(null);
  selectedUserNo = signal<number | null>(null);
  searchTerm = signal('');
  filterDeptNo = signal<number | null>(null);
  filterDesigNo = signal<number | null>(null);
  filterUserStatus = signal<number | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  // ─── Computed: filtered designations by department ────────────────────────
  filteredDesignations = computed(() => {
    const deptNo = this.filterDeptNo();
    if (!deptNo) return this.designations();
    return this.designations().filter((d) => d.department_no === deptNo);
  });

  // ─── Computed: filtered employees by search, department, designation, status
  filteredEmployees = computed(() => {
    let list = this.employees();
    const term = this.searchTerm().toLowerCase();
    const deptNo = this.filterDeptNo();
    const desigNo = this.filterDesigNo();
    const status = this.filterUserStatus();

    if (term) {
      list = list.filter(
        (e) =>
          (e.full_name || '').toLowerCase().includes(term) ||
          (e.employee_id || '').toLowerCase().includes(term) ||
          (e.department_name || '').toLowerCase().includes(term) ||
          (e.designation_name || '').toLowerCase().includes(term),
      );
    }
    if (deptNo) list = list.filter((e) => e.department_no === deptNo);
    if (desigNo) list = list.filter((e) => e.designation_no === desigNo);
    if (status !== null && status !== undefined)
      list = list.filter((e) => e.is_active === status);

    const sorted = [...list].sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || ''),
    );
    return this.sortDirection() === 'desc' ? sorted.reverse() : sorted;
  });

  pager = makePaginator<Sys1101EmployeeDto>(this.filteredEmployees);

  form!: FormGroup;
  passwordForm!: FormGroup;
  changePasswordForm!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      user_no: [null],
      user_id: [{ value: '', disabled: true }],
      employee_no: [null, [Validators.required]],
      user_name: ['', [Validators.required, Validators.maxLength(50)]],
      is_active: [1, [Validators.required]],
      is_locked: [0],
      failed_login_count: [0],
      last_login_at: [{ value: '', disabled: true }],
      password_changed_at: [{ value: '', disabled: true }],
      row_version: [0],
      password: ['', [Validators.minLength(3)]],
    });

    this.passwordForm = this.fb.group({
      temporary_password: ['', [Validators.minLength(8)]],
    });

    this.changePasswordForm = this.fb.group({
      old_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
    });
  }

  /**
   * Bootstraps the form in sequence:
   *   1. Filter data   — department + designation lookups for the sidebar filters.
   *   2. List data     — the employee list.
   *   3. Default value — auto-selects the first employee (loads its user + roles).
   */
  loadInitial(): void {
    this.isLoading.set(true);
    // 1. Load the filter data first.
    forkJoin({
      departments: this.commonApi
        .getDepartmentList()
        .pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
      designations: this.commonApi
        .getDesignationList()
        .pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
    }).subscribe(({ departments, designations }) => {
      if (isSuccess(departments) && departments.data)
        this.departments.set(departments.data);
      if (isSuccess(designations) && designations.data)
        this.designations.set(designations.data);

      // 2. Then load the list data (related user/role data follows the default selection).
      this.loadEmployeeList();
    });
  }

  /** Loads the employee list, then auto-selects the first record as the default value. */
  loadEmployeeList(): void {
    this.isLoading.set(true);
    this.data
      .getEmployeeList(this.filterUserStatus() ?? undefined)
      .pipe(
        catchError(() => of({ status_code: 200, data: [] } as any)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((employees) => {
        if (isSuccess(employees) && employees.data)
          this.employees.set(employees.data);

        // 3. Set the default value — auto-select the first employee.
        const first = this.filteredEmployees()[0];
        if (first) this.selectEmployee(first);
      });
  }

  selectEmployee(emp: Sys1101EmployeeDto): void {
    this.selectedEmployee.set(emp);
    this.selectedUserNo.set(null);
    this.roleMappings.set([]);

    // Patch employee info into form
    this.form.patchValue({
      employee_no: emp.employee_no,
      user_name: '',
      is_active: 1,
      is_locked: 0,
      failed_login_count: 0,
      last_login_at: '',
      password_changed_at: '',
      row_version: 0,
      password: '',
    });

    // Check if user exists for this employee
    this.isLoading.set(true);
    this.data
      .getUserByEmployeeNo(emp.employee_no)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((res) => {
        if (res && isSuccess(res) && res.data) {
          // User exists — getUserByEmployeeNo already returned the full user DTO.
          this.applyUser(res.data);
        } else {
          // No user — prepare for creation
          this.patchNewUserForEmployee(emp);
        }
      });
  }

  /** Patches an existing user into the form and loads its role mappings. */
  private applyUser(user: Sys1101UserDto): void {
    this.patchUser(user);
    if (user.user_no != null) {
      this.loadRoles(user.user_no);
    }
  }

  /** Loads the role mappings for the given user. */
  private loadRoles(userNo: number): void {
    this.data
      .getUserRoles(userNo)
      .pipe(catchError(() => of({ status_code: 200, data: [] } as any)))
      .subscribe((roles) => {
        if (isSuccess(roles) && roles.data) {
          this.roleMappings.set(roles.data);
        }
      });
  }

  onSave(): void {
    this.syncPasswordValidators();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedUserNo();

    if (isUpdate) {
      // Update: only username, is_active, is_locked
      const payload: Partial<Sys1101UserDto> = {
        user_name: val.user_name,
        is_active: val.is_active,
        is_locked: val.is_locked,
      };
      this.isSaving.set(true);
      this.data
        .updateUser(this.selectedUserNo()!, payload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res) => {
          if (isSuccess(res) && res.data) {
            this.toastr.success('User updated');
            this.patchUser(res.data);
          }
        });
    } else {
      // Create: employee_no, user_id, user_name, password
      const payload: Partial<Sys1101UserDto> = {
        employee_no: val.employee_no,
        user_id: val.user_id,
        user_name: val.user_name,
        password: val.password,
      };
      this.isSaving.set(true);
      this.data
        .createUser(payload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res) => {
          if (isSuccess(res) && res.data) {
            this.toastr.success('User created');
            this.applyUser(res.data);
          }
        });
    }
  }

  /** One-click provision: create a login user from the selected employee (user id + initial password = employee id). */
  createFromEmployee(): void {
    const emp = this.selectedEmployee();
    if (!emp) { this.toastr.warning('Select an employee first.'); return; }
    if (this.selectedUserNo()) { this.toastr.info('This employee already has a user account.'); return; }
    this.isSaving.set(true);
    this.data
      .createUserFromEmployee(emp.employee_no)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success('User created from employee — login id & initial password are the Employee ID.');
          this.applyUser(res.data);
        }
      });
  }

  onDelete(): void {
    const userNo = this.selectedUserNo();
    if (!userNo) return;
    this.isLoading.set(true);
    this.data
      .deleteUser(userNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res)) {
          this.toastr.success('User deleted');
          const emp = this.selectedEmployee();
          if (emp) this.patchNewUserForEmployee(emp);
        }
      });
  }

  onNew(): void {
    const emp = this.selectedEmployee();
    emp ? this.patchNewUserForEmployee(emp) : this.clearForm();
  }

  onReset(): void {
    const emp = this.selectedEmployee();
    if (emp) this.selectEmployee(emp);
    else this.clearForm();
  }

  resetPassword(): void {
    const userNo = this.selectedUserNo();
    if (!userNo) return;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastr.warning('Temporary password must be at least 8 characters.');
      return;
    }
    const pwd = this.passwordForm.get('temporary_password')?.value;
    if (!pwd) {
      this.toastr.warning('Enter a temporary password.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .resetPassword(userNo, pwd)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res)) {
          this.toastr.success('Password reset');
          this.passwordForm.reset({ temporary_password: '' });
          const emp = this.selectedEmployee();
          if (emp) this.selectEmployee(emp);
        }
      });
  }

  changePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    const val = this.changePasswordForm.getRawValue();
    if (val.new_password !== val.confirm_password) {
      this.toastr.warning('New password and confirmation do not match.');
      return;
    }
    this.isSaving.set(true);
    this.authApi
      .changePassword({
        old_password: val.old_password,
        new_password: val.new_password,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe(() => {
        this.toastr.success('Password changed');
        this.changePasswordForm.reset();
      });
  }

  lockSelected(locked: number): void {
    const userNo = this.selectedUserNo();
    if (!userNo) return;
    this.isSaving.set(true);
    this.data
      .lockUser(userNo, locked)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(locked === 1 ? 'User locked' : 'User unlocked');
          this.patchUser(res.data);
        }
      });
  }

  employeeStatusLabel(status?: number | null): string {
    return (
      (
        { 1: 'Active', 2: 'Resigned', 3: 'Terminated', 4: 'Retired' } as Record<
          number,
          string
        >
      )[status ?? 0] || 'N/A'
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private patchUser(user: Sys1101UserDto): void {
    this.selectedUserNo.set(user.user_no ?? null);
    this.form.patchValue({
      user_no: user.user_no,
      user_id: user.user_id ?? '',
      employee_no: user.employee_no,
      user_name: user.user_name,
      is_active: user.is_active ?? 1,
      is_locked: user.is_locked ?? 0,
      failed_login_count: user.failed_login_count ?? 0,
      last_login_at: user.last_login_at ?? '',
      password_changed_at: user.password_changed_at ?? '',
      row_version: user.row_version ?? 0,
      password: '',
    });
    this.syncPasswordValidators();
  }

  private patchNewUserForEmployee(emp: Sys1101EmployeeDto): void {
    this.selectedUserNo.set(null);
    this.roleMappings.set([]);
    const userId = (emp.employee_id || '').toLowerCase().replace(/\s+/g, '.');
    this.form.patchValue({
      user_no: null,
      user_id: userId,
      employee_no: emp.employee_no,
      user_name: userId,
      is_active: 1,
      is_locked: 0,
      failed_login_count: 0,
      last_login_at: '',
      password_changed_at: '',
      row_version: 0,
      password: '',
    });
    this.passwordForm.reset({ temporary_password: '' });
    this.syncPasswordValidators();
  }

  private clearForm(): void {
    this.selectedUserNo.set(null);
    this.selectedEmployee.set(null);
    this.roleMappings.set([]);
    this.form.reset({
      is_active: 1,
      is_locked: 0,
      failed_login_count: 0,
      row_version: 0,
    });
  }

  private syncPasswordValidators(): void {
    const control = this.form.get('password');
    if (!control) return;
    if (this.selectedUserNo()) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required, Validators.minLength(8)]);
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
}
