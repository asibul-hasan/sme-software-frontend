import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { Sys1102DataService } from './data.service';

export interface IBranchLookup {
  branch_no: number;
  branch_id: string;
  branch_name: string;
  is_main_branch: number;
  branch_type: string | null;
}

/**
 * Role entity — aligned to the SYS re-plan `sys_role`.
 *
 * Roles are **company-scoped templates** (`company_no`, not `branch_no`); they are assigned
 * to users per branch via `sys_user_branch.role_no`. Branch applicability is stored in
 * `sys_role_branch`: specific branches or company-wide (empty `branch_nos` = all branches).
 */
export interface IRole extends BaseEntity {
  role_no: number;
  company_no: number;
  company_name?: string | null;
  role_id: string;
  role_name: string;
  role_desc?: string | null;
  branch_nos?: number[] | null;
  is_system_role?: number | null;
  is_active: number;
  remarks?: string | null;
}

/**
 * View-model + orchestration service for SYS1102 – Role Management.
 * Mirrors the master-detail pattern used by SYS1002 (Branch).
 */
@Injectable()
export class Sys1102ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1102DataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  // ─── State ──────────────────────────────────────────────────────────────────
  roles = signal<IRole[]>([]);
  branches = signal<IBranchLookup[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedRoleNo = signal<number | null>(null);

  form!: FormGroup;

  // ─── Derived state ────────────────────────────────────────────────────────────
  filteredRoles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.roles();
    if (!term) return data;
    return data.filter(
      (r) =>
        (r.role_name || '').toLowerCase().includes(term) ||
        (r.role_id || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<IRole>(this.filteredRoles);

  /** True while a built-in/system role is selected (cannot be edited/deleted server-side). */
  isSystemSelected = computed(() => {
    const no = this.selectedRoleNo();
    return !!this.roles().find((r) => r.role_no === no)?.is_system_role;
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group({
      role_no:        [null],
      company_no:     [this.authCtx.user()?.company_no ?? null, [Validators.required]],
      role_id:        ['', [Validators.required, Validators.maxLength(20)]],
      role_name:      ['', [Validators.required, Validators.maxLength(150)]],
      role_desc:      ['', [Validators.maxLength(500)]],
      branch_nos:     [[] as number[]],
      is_system_role: [0],
      is_active:      [1, [Validators.required]],
    });
  }

  // ─── Data loading ─────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.branches.set(res.data);
      },
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadRoles(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .loadRoles()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.roles.set(res.data);
            const resolved = resolvePostReloadSelection(
              res.data,
              (r: IRole) => r.role_no,
              reselectNo,
            );
            resolved ? this.selectRole(resolved.item as IRole) : this.onNew();
          }
        },
      });
  }

  selectRole(role: IRole): void {
    this.selectedRoleNo.set(role.role_no);
    this.isLoading.set(true);
    this.data
      .loadRoleDetail(role.role_no!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) this.patchForm(res.data);
        },
      });
  }

  patchForm(d: IRole): void {
    this.form.patchValue({
      role_no:        d.role_no,
      company_no:     d.company_no,
      role_id:        d.role_id,
      role_name:      d.role_name,
      role_desc:      d.role_desc,
      branch_nos:     d.branch_nos ?? [],
      is_system_role: d.is_system_role ?? 0,
      is_active:      d.is_active ?? 1,
    });
  }

  onSave(callback?: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedRoleNo();
    const payload: Partial<IRole> = { ...val, role_no: this.selectedRoleNo() ?? undefined };

    this.isSaving.set(true);
    const req = isUpdate ? this.data.updateRole(payload) : this.data.saveRole(payload);
    req.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Role updated' : 'Role created');
          this.loadRoles(isUpdate ? this.selectedRoleNo() : (res.data?.role_no ?? null));
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const roleNo = this.selectedRoleNo();
    if (!roleNo) return;

    this.isLoading.set(true);
    this.data
      .deleteRole(roleNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Role deleted');
            this.loadRoles();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }

  onNew(): void {
    this.selectedRoleNo.set(null);
    this.form.reset({
      is_active:      1,
      branch_nos:     [],
      is_system_role: 0,
      company_no:     this.authCtx.user()?.company_no ?? null,
    });
  }
}
