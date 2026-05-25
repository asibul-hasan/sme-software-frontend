import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1104DataService } from './data.service';

export interface UserOption {
  user_no: number;
  user_id: string;
  user_name: string;
  employee_no?: number;
  access_scope?: number;
}

export interface Option {
  value: number;
  label: string;
}

export interface MappingRow {
  user_branch_no?: number | null;
  branch_no: number | null;
  role_no: number | null;
  is_default: number;
  is_active: number;
}

/**
 * View-model for SYS1104 – User-Branch Mapping. Pick a user, then assign branches with a role
 * per branch (sys_user_branch). One branch may be marked default.
 */
@Injectable()
export class Sys1104ModelService {
  private data = inject(Sys1104DataService);
  private toastr = inject(ToastrService);

  users = signal<UserOption[]>([]);
  branches = signal<Option[]>([]);
  roles = signal<Option[]>([]);
  mappings = signal<MappingRow[]>([]);
  selectedUserNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.users();
    if (!term) return data;
    return data.filter(
      (u) =>
        (u.user_name || '').toLowerCase().includes(term) ||
        (u.user_id || '').toLowerCase().includes(term),
    );
  });

  loadInitial(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.data.getUsers(),
      branches: this.data.getBranches(),
      roles: this.data.getRoles(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ users, branches, roles }) => {
        if (isSuccess(branches) && branches.data) this.branches.set(branches.data);
        if (isSuccess(roles) && roles.data) this.roles.set(roles.data);
        if (isSuccess(users) && users.data) {
          this.users.set(users.data);
          const first = users.data[0];
          if (first) this.selectUser(first.user_no);
        }
      });
  }

  selectUser(userNo: number): void {
    this.selectedUserNo.set(userNo);
    this.isLoading.set(true);
    this.data
      .getMappings(userNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.mappings.set(
            res.data.map((m) => ({
              user_branch_no: m.user_branch_no ?? null,
              branch_no: m.branch_no ?? null,
              role_no: m.role_no ?? null,
              is_default: m.is_default ?? 0,
              is_active: m.is_active ?? 1,
            })),
          );
        }
      });
  }

  reloadCurrent(): void {
    const no = this.selectedUserNo();
    if (no) this.selectUser(no);
  }

  addRow(): void {
    this.mappings.update((rows) => [
      ...rows,
      { branch_no: null, role_no: null, is_default: rows.length === 0 ? 1 : 0, is_active: 1 },
    ]);
  }

  removeRow(index: number): void {
    this.mappings.update((rows) => rows.filter((_, i) => i !== index));
  }

  setBranch(index: number, value: string): void {
    const n = value ? Number(value) : null;
    this.mappings.update((rows) => rows.map((r, i) => (i === index ? { ...r, branch_no: n } : r)));
  }

  setRole(index: number, value: string): void {
    const n = value ? Number(value) : null;
    this.mappings.update((rows) => rows.map((r, i) => (i === index ? { ...r, role_no: n } : r)));
  }

  setDefault(index: number): void {
    this.mappings.update((rows) => rows.map((r, i) => ({ ...r, is_default: i === index ? 1 : 0 })));
  }

  toggleActive(index: number): void {
    this.mappings.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, is_active: r.is_active === 1 ? 0 : 1 } : r)),
    );
  }

  onSave(): void {
    const userNo = this.selectedUserNo();
    if (!userNo) {
      this.toastr.warning('Select a user first.');
      return;
    }
    const rows = this.mappings();
    if (rows.some((r) => r.branch_no == null || r.role_no == null)) {
      this.toastr.warning('Every row needs both a branch and a role.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .saveMappings(userNo, rows)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Mappings saved');
            this.selectUser(userNo);
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }
}
