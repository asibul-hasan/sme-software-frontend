import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1103DataService } from './data.service';

export interface RoleOption {
  role_no: number;
  role_id: string;
  role_name: string;
  is_system_role?: number;
}

export type FlagField =
  | 'can_view' | 'can_insert' | 'can_update' | 'can_delete'
  | 'can_approve' | 'can_post' | 'can_cancel' | 'can_export';

export interface MatrixRow {
  menu_no: number;
  form_id: string;
  form_name: string;
  module_code: string;
  module_name: string;
  submodule_name: string;
  can_view: number;
  can_insert: number;
  can_update: number;
  can_delete: number;
  can_approve: number;
  can_post: number;
  can_cancel: number;
  can_export: number;
  perm_scope: number;     // 1=Company, 2=Branch
  record_filter: number;  // 1=All, 2=Own
}

export interface ModuleGroup {
  module_name: string;
  rows: MatrixRow[];
}

/**
 * View-model for SYS1103 – Role Permission Matrix. The left list selects a company role;
 * the grid edits its per-form grants (can_*) plus scope/record-filter, then bulk-saves.
 */
@Injectable()
export class Sys1103ModelService {
  private data = inject(Sys1103DataService);
  private toastr = inject(ToastrService);

  roles = signal<RoleOption[]>([]);
  matrix = signal<MatrixRow[]>([]);
  selectedRoleNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  readonly flagFields: { key: FlagField; label: string }[] = [
    { key: 'can_view', label: 'View' },
    { key: 'can_insert', label: 'Create' },
    { key: 'can_update', label: 'Edit' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_approve', label: 'Approve' },
    { key: 'can_post', label: 'Post' },
    { key: 'can_cancel', label: 'Cancel' },
    { key: 'can_export', label: 'Export' },
  ];

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

  grouped = computed<ModuleGroup[]>(() => {
    const groups: ModuleGroup[] = [];
    const idx = new Map<string, ModuleGroup>();
    for (const row of this.matrix()) {
      const key = row.module_name || row.module_code || '—';
      let g = idx.get(key);
      if (!g) {
        g = { module_name: key, rows: [] };
        idx.set(key, g);
        groups.push(g);
      }
      g.rows.push(row);
    }
    return groups;
  });

  loadRoles(): void {
    this.isLoading.set(true);
    this.data
      .getRoles()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.roles.set(res.data);
          const first = res.data[0];
          if (first) this.selectRole(first.role_no);
          else this.matrix.set([]);
        }
      });
  }

  selectRole(roleNo: number): void {
    this.selectedRoleNo.set(roleNo);
    this.isLoading.set(true);
    this.data
      .getMatrix(roleNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.matrix.set(res.data);
      });
  }

  reloadCurrent(): void {
    const no = this.selectedRoleNo();
    if (no) this.selectRole(no);
  }

  toggle(menuNo: number, field: FlagField): void {
    this.matrix.update((rows) =>
      rows.map((r) => (r.menu_no === menuNo ? { ...r, [field]: r[field] === 1 ? 0 : 1 } : r)),
    );
  }

  grantAll(menuNo: number, value: number): void {
    this.matrix.update((rows) =>
      rows.map((r) =>
        r.menu_no === menuNo
          ? {
              ...r,
              can_view: value, can_insert: value, can_update: value, can_delete: value,
              can_approve: value, can_post: value, can_cancel: value, can_export: value,
            }
          : r,
      ),
    );
  }

  setScope(menuNo: number, value: number): void {
    this.matrix.update((rows) =>
      rows.map((r) => (r.menu_no === menuNo ? { ...r, perm_scope: value } : r)),
    );
  }

  setRecordFilter(menuNo: number, value: number): void {
    this.matrix.update((rows) =>
      rows.map((r) => (r.menu_no === menuNo ? { ...r, record_filter: value } : r)),
    );
  }

  onSave(): void {
    const roleNo = this.selectedRoleNo();
    if (!roleNo) {
      this.toastr.warning('Select a role first.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .saveMatrix(roleNo, this.matrix())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Permissions saved');
            if (res.data) this.matrix.set(res.data);
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }
}
