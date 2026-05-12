import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { CommonDataService } from '../../../../../shared/services/common-data.service';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { AuthDataService } from '../../../../auth/services/data.service';
import { Sys1101DataService } from './data.service';

export interface IUserRole extends BaseEntity {
  user_role_no?: number | null;
  user_no?: number | null;
  role_no: number;
  role_name?: string | null;
  access_branch?: string | null;
  primary_role?: number | null;
  active_status?: number | null;
  remarks?: string | null;
}

export interface IUser extends BaseEntity {
  user_no?: number | null;
  employee_no: number;
  user_name: string;
  password?: string;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  failed_login_count?: number | null;
  is_locked: number;
  active_status: number;
  remarks?: string | null;

  employee_id?: string | null;
  employee_name?: string | null;
  department_no?: number | null;
  department_name?: string | null;
  designation_no?: number | null;
  designation_name?: string | null;
  branch_no?: number | null;
  branch_name?: string | null;
  official_email?: string | null;
  mobile_number?: string | null;
  joining_date?: string | null;
  employee_status?: number | null;
  role_mappings?: IUserRole[] | null;
}

export interface IEmployeeSummary {
  employee_no: number;
  employee_id: string;
  full_name: string;
  department_no?: number | null;
  department_name?: string | null;
  designation_no?: number | null;
  designation_name?: string | null;
  branch_no?: number | null;
  mobile_number?: string | null;
  official_email?: string | null;
  joining_date?: string | null;
  employee_status?: number | null;
  active_status?: number | null;
}

interface IRole {
  role_no: number;
  role_name: string;
  role_id?: string | null;
}

@Injectable()
export class Sys1101ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1101DataService);
  private commonApi = inject(CommonDataService);
  private coreApi = inject(CoreDataService);
  private authApi = inject(AuthDataService);
  private toastr = inject(ToastrService);

  isSaving = signal(false);
  isLoading = signal(false);

  employees = signal<IEmployeeSummary[]>([]);
  users = signal<IUser[]>([]);
  departments = signal<any[]>([]);
  designations = signal<any[]>([]);
  roles = signal<IRole[]>([]);
  roleMappings = signal<IUserRole[]>([]);

  selectedEmployee = signal<IEmployeeSummary | null>(null);
  selectedUserNo = signal<number | null>(null);
  roleToAdd = signal<number | null>(null);
  searchTerm = signal('');
  filterDeptNo = signal<number | null>(null);
  filterDesigNo = signal<number | null>(null);
  filterUserStatus = signal<number | null>(null);

  filteredDesignations = computed(() => {
    const deptNo = this.filterDeptNo();
    if (!deptNo) return this.designations();
    return this.designations().filter((d: any) => d.department_no === deptNo);
  });

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const deptNo = this.filterDeptNo();
    const desigNo = this.filterDesigNo();
    const userStatus = this.filterUserStatus();
    const usersByEmployee = new Map(this.users().map((u) => [u.employee_no, u]));

    let list = this.employees();
    if (deptNo) list = list.filter((e) => e.department_no === deptNo);
    if (desigNo) list = list.filter((e) => e.designation_no === desigNo);
    if (userStatus !== null && userStatus !== undefined) {
      list = list.filter((e) => usersByEmployee.get(e.employee_no)?.active_status === userStatus);
    }
    if (!term) return list;
    return list.filter((e) => {
      const user = usersByEmployee.get(e.employee_no);
      return (
        (e.full_name || '').toLowerCase().includes(term) ||
        (e.employee_id || '').toLowerCase().includes(term) ||
        (e.mobile_number || '').includes(term) ||
        (e.official_email || '').toLowerCase().includes(term) ||
        (user?.user_name || '').toLowerCase().includes(term)
      );
    });
  });

  pager = makePaginator<IEmployeeSummary>(this.filteredEmployees);

  form!: FormGroup;
  passwordForm!: FormGroup;
  changePasswordForm!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      user_no: [null],
      employee_no: [null, [Validators.required]],
      user_name: ['', [Validators.required, Validators.maxLength(50)]],
      login_id: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      mobile: [{ value: '', disabled: true }],
      active_status: [1, [Validators.required]],
      is_locked: [0, [Validators.required]],
      failed_login_count: [0],
      last_login_at: [{ value: '', disabled: true }],
      password_changed_at: [{ value: '', disabled: true }],
      remarks: [''],
      row_version: [0],
      password: ['', [Validators.minLength(8)]],
    });

    this.passwordForm = this.fb.group({
      temporary_password: ['', [Validators.minLength(8)]],
      force_password_change: [{ value: false, disabled: true }],
      password_expiry: [{ value: '', disabled: true }],
    });

    this.changePasswordForm = this.fb.group({
      old_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
    });

    this.form.get('user_name')?.valueChanges.subscribe((value) => {
      this.form.get('login_id')?.setValue(value ?? '', { emitEvent: false });
    });
  }

  loadInitial(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.data.loadUsers().pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
      employees: this.commonApi.getEmployeeList().pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
      departments: this.commonApi.getDepartmentList().pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
      designations: this.commonApi.getDesignationList().pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
      roles: this.coreApi.getRoles().pipe(catchError(() => of({ status_code: 200, data: [] } as any))),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ users, employees, departments, designations, roles }) => {
        if (isSuccess(users) && users.data) this.users.set(users.data as IUser[]);
        if (isSuccess(employees) && employees.data) this.employees.set(employees.data as IEmployeeSummary[]);
        if (isSuccess(departments) && departments.data) this.departments.set(departments.data);
        if (isSuccess(designations) && designations.data) this.designations.set(designations.data);
        if (isSuccess(roles) && roles.data) this.roles.set(roles.data as IRole[]);

        const first = this.employees()[0];
        first ? this.selectEmployee(first) : this.onNew();
      });
  }

  selectEmployee(emp: IEmployeeSummary): void {
    this.selectedEmployee.set(emp);
    const existing = this.users().find((u) => u.employee_no === emp.employee_no);
    if (existing?.user_no) {
      this.loadUserDetail(existing.user_no);
      return;
    }
    this.patchNewUserForEmployee(emp);
  }

  loadUserDetail(userNo: number): void {
    this.isLoading.set(true);
    this.data.loadUserDetail(userNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.patchUser(res.data);
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
    const payload: Partial<IUser> = {
      user_no: this.selectedUserNo(),
      employee_no: val.employee_no,
      user_name: val.user_name,
      active_status: val.active_status,
      is_locked: val.is_locked,
      failed_login_count: val.failed_login_count,
      remarks: val.remarks,
      row_version: val.row_version,
      role_mappings: this.roleMappings(),
    };
    if (!isUpdate) payload.password = val.password;

    this.isSaving.set(true);
    const request = isUpdate ? this.data.updateUser(payload) : this.data.saveUser(payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.toastr.success(isUpdate ? 'User updated' : 'User created');
        this.refreshUsers(res.data.user_no ?? null);
      }
    });
  }

  onDelete(): void {
    const userNo = this.selectedUserNo();
    if (!userNo) return;
    this.isLoading.set(true);
    this.data.deleteUser(userNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res)) {
          this.toastr.success('User deleted');
          const employee = this.selectedEmployee();
          this.refreshUsers(null, () => employee && this.patchNewUserForEmployee(employee));
        }
      });
  }

  onNew(): void {
    const emp = this.selectedEmployee();
    emp ? this.patchNewUserForEmployee(emp) : this.clearForm();
  }

  onReset(): void {
    const userNo = this.selectedUserNo();
    if (userNo) this.loadUserDetail(userNo);
    else this.onNew();
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
    this.data.resetPassword(userNo, pwd)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res)) {
          this.toastr.success('Password reset');
          this.passwordForm.reset({ temporary_password: '', force_password_change: false, password_expiry: '' });
          this.loadUserDetail(userNo);
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
    this.authApi.changePassword({
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
    this.data.setLocked(userNo, locked)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(locked === 1 ? 'User locked' : 'User unlocked');
          this.patchUser(res.data);
          this.refreshUsers(res.data.user_no ?? userNo);
        }
      });
  }

  addRole(roleNo: number | null): void {
    if (!roleNo || this.roleMappings().some((r) => r.role_no === roleNo)) return;
    const role = this.roles().find((r) => r.role_no === roleNo);
    const first = this.roleMappings().length === 0;
    this.roleMappings.update((items) => [
      ...items,
      {
        role_no: roleNo,
        role_name: role?.role_name,
        primary_role: first ? 1 : 0,
        active_status: 1,
        access_branch: null,
      },
    ]);
  }

  removeRole(index: number): void {
    this.roleMappings.update((items) => items.filter((_, i) => i !== index));
  }

  setPrimaryRole(index: number): void {
    this.roleMappings.update((items) => items.map((r, i) => ({ ...r, primary_role: i === index ? 1 : 0 })));
  }

  updateRole(index: number, changes: Partial<IUserRole>): void {
    this.roleMappings.update((items) => items.map((r, i) => i === index ? { ...r, ...changes } : r));
  }

  userForEmployee(employeeNo: number): IUser | undefined {
    return this.users().find((u) => u.employee_no === employeeNo);
  }

  employeeStatusLabel(status?: number | null): string {
    return ({ 1: 'Active', 2: 'Resigned', 3: 'Terminated', 4: 'Retired' } as Record<number, string>)[status ?? 0] || 'N/A';
  }

  private refreshUsers(reselectUserNo: number | null, after?: () => void): void {
    this.data.loadUsers().subscribe((res) => {
      if (isSuccess(res) && res.data) this.users.set(res.data);
      if (reselectUserNo) this.loadUserDetail(reselectUserNo);
      else after?.();
    });
  }

  private patchUser(user: IUser): void {
    const employee = this.employees().find((e) => e.employee_no === user.employee_no) ?? this.selectedEmployee();
    this.selectedEmployee.set(employee);
    this.selectedUserNo.set(user.user_no ?? null);
    this.roleMappings.set(user.role_mappings ?? []);
    this.form.reset({
      user_no: user.user_no,
      employee_no: user.employee_no,
      user_name: user.user_name,
      login_id: user.user_name,
      email: user.official_email ?? employee?.official_email ?? '',
      mobile: user.mobile_number ?? employee?.mobile_number ?? '',
      active_status: user.active_status ?? 1,
      is_locked: user.is_locked ?? 0,
      failed_login_count: user.failed_login_count ?? 0,
      last_login_at: user.last_login_at ?? '',
      password_changed_at: user.password_changed_at ?? '',
      remarks: user.remarks ?? '',
      row_version: user.row_version ?? 0,
      password: '',
    });
    this.syncPasswordValidators();
  }

  private patchNewUserForEmployee(emp: IEmployeeSummary): void {
    this.selectedUserNo.set(null);
    this.selectedEmployee.set(emp);
    this.roleMappings.set([]);
    const username = (emp.employee_id || '').toLowerCase().replace(/\s+/g, '.');
    this.form.reset({
      user_no: null,
      employee_no: emp.employee_no,
      user_name: username,
      login_id: username,
      email: emp.official_email ?? '',
      mobile: emp.mobile_number ?? '',
      active_status: 1,
      is_locked: 0,
      failed_login_count: 0,
      last_login_at: '',
      password_changed_at: '',
      remarks: '',
      row_version: 0,
      password: '',
    });
    this.passwordForm.reset({ temporary_password: '', force_password_change: false, password_expiry: '' });
    this.syncPasswordValidators();
  }

  private clearForm(): void {
    this.selectedUserNo.set(null);
    this.selectedEmployee.set(null);
    this.roleMappings.set([]);
    this.form.reset({ active_status: 1, is_locked: 0, failed_login_count: 0, row_version: 0 });
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
