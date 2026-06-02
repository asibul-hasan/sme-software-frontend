import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
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

  // ── Matrix filters & view state ───────────────────────────────────────
  formSearch = signal('');                 // free-text filter over form name / id
  moduleFilter = signal<string>('');       // '' = all modules
  submoduleFilter = signal<string>('');    // '' = all submodules
  onlyGranted = signal(false);             // show only forms with at least one grant
  collapsedModules = signal<ReadonlySet<string>>(new Set());
  copySourceRoleNo = signal<number | null>(null);
  isCopying = signal(false);

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

  /** Paginated sidebar list — standard master-detail pattern (see SYS1002/SYS1004). */
  pager = makePaginator(this.filteredRoles, { sortKey: (r) => r.role_no });

  private moduleKey(row: MatrixRow): string {
    return row.module_name || row.module_code || '—';
  }

  grouped = computed<ModuleGroup[]>(() => {
    const groups: ModuleGroup[] = [];
    const idx = new Map<string, ModuleGroup>();
    for (const row of this.matrix()) {
      const key = this.moduleKey(row);
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

  /** Distinct module names present in the matrix — feeds the module filter. */
  modules = computed<string[]>(() => this.grouped().map((g) => g.module_name));

  /**
   * Distinct submodule names — narrowed to the selected module when one is set,
   * so the Submodule dropdown only offers relevant options.
   */
  submodules = computed<string[]>(() => {
    const mod = this.moduleFilter();
    const seen = new Set<string>();
    for (const r of this.matrix()) {
      if (mod && this.moduleKey(r) !== mod) continue;
      if (r.submodule_name) seen.add(r.submodule_name);
    }
    return [...seen];
  });

  /** Roles other than the one being edited — copy-from source options. */
  otherRoles = computed<RoleOption[]>(() =>
    this.roles().filter((r) => r.role_no !== this.selectedRoleNo()),
  );

  /** Groups after applying the form-search / module / only-granted filters. */
  filteredGrouped = computed<ModuleGroup[]>(() => {
    const term = this.formSearch().toLowerCase().trim();
    const mod = this.moduleFilter();
    const sub = this.submoduleFilter();
    const onlyG = this.onlyGranted();
    const groups: ModuleGroup[] = [];
    const idx = new Map<string, ModuleGroup>();
    for (const row of this.matrix()) {
      const key = this.moduleKey(row);
      if (mod && key !== mod) continue;
      if (sub && row.submodule_name !== sub) continue;
      if (onlyG && this.flagCount(row) === 0) continue;
      if (
        term &&
        !`${row.form_name} ${row.form_id} ${row.submodule_name}`.toLowerCase().includes(term)
      )
        continue;
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

  /** menu_nos currently visible after filters — column/global ops act on these only. */
  private visibleMenuNos = computed<Set<number>>(() => {
    const s = new Set<number>();
    for (const g of this.filteredGrouped()) for (const r of g.rows) s.add(r.menu_no);
    return s;
  });

  visibleGranted = computed(() => {
    let n = 0;
    for (const g of this.filteredGrouped()) for (const r of g.rows) n += this.flagCount(r);
    return n;
  });
  visiblePossible = computed(() => this.visibleMenuNos().size * this.flagFields.length);
  hasActiveFilters = computed(
    () =>
      !!this.formSearch().trim() ||
      !!this.moduleFilter() ||
      !!this.submoduleFilter() ||
      this.onlyGranted(),
  );

  /** True when every visible module is collapsed — drives the single toggle button. */
  isAllCollapsed = computed(() => {
    const groups = this.filteredGrouped();
    return groups.length > 0 && groups.every((g) => this.isCollapsed(g.module_name));
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

  private withAllFlags(r: MatrixRow, value: number): MatrixRow {
    return {
      ...r,
      can_view: value, can_insert: value, can_update: value, can_delete: value,
      can_approve: value, can_post: value, can_cancel: value, can_export: value,
    };
  }

  grantAll(menuNo: number, value: number): void {
    this.matrix.update((rows) =>
      rows.map((r) => (r.menu_no === menuNo ? this.withAllFlags(r, value) : r)),
    );
  }

  // ── Row / module / column helpers ─────────────────────────────────────

  flagCount(row: MatrixRow): number {
    return this.flagFields.reduce((n, f) => n + (row[f.key] === 1 ? 1 : 0), 0);
  }
  isRowAll(row: MatrixRow): boolean {
    return this.flagCount(row) === this.flagFields.length;
  }
  isRowSome(row: MatrixRow): boolean {
    const n = this.flagCount(row);
    return n > 0 && n < this.flagFields.length;
  }

  moduleGranted(g: ModuleGroup): number {
    return g.rows.reduce((n, r) => n + this.flagCount(r), 0);
  }
  moduleTotal(g: ModuleGroup): number {
    return g.rows.length * this.flagFields.length;
  }

  isCollapsed(name: string): boolean {
    return this.collapsedModules().has(name);
  }
  toggleModule(name: string): void {
    this.collapsedModules.update((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
  collapseAll(): void {
    this.collapsedModules.set(new Set(this.filteredGrouped().map((g) => g.module_name)));
  }
  expandAll(): void {
    this.collapsedModules.set(new Set());
  }
  /** Single button: collapse everything if anything is open, else expand everything. */
  toggleAllCollapse(): void {
    if (this.isAllCollapsed()) this.expandAll();
    else this.collapseAll();
  }

  /** Grant/revoke every flag for all rows in one module. */
  grantModule(g: ModuleGroup, value: number): void {
    const menus = new Set(g.rows.map((r) => r.menu_no));
    this.matrix.update((rows) =>
      rows.map((r) => (menus.has(r.menu_no) ? this.withAllFlags(r, value) : r)),
    );
  }

  /** Header tri-state for one action column, across the currently-visible rows. */
  columnState(field: FlagField): 'all' | 'some' | 'none' {
    const vis = this.visibleMenuNos();
    let on = 0;
    let total = 0;
    for (const r of this.matrix()) {
      if (!vis.has(r.menu_no)) continue;
      total++;
      if (r[field] === 1) on++;
    }
    if (total === 0 || on === 0) return 'none';
    return on === total ? 'all' : 'some';
  }
  /** Set one action for every visible row. */
  grantColumn(field: FlagField, value: number): void {
    const vis = this.visibleMenuNos();
    this.matrix.update((rows) =>
      rows.map((r) => (vis.has(r.menu_no) ? { ...r, [field]: value } : r)),
    );
  }

  /** Grant/revoke every flag for every visible row. */
  grantAllVisible(value: number): void {
    const vis = this.visibleMenuNos();
    this.matrix.update((rows) =>
      rows.map((r) => (vis.has(r.menu_no) ? this.withAllFlags(r, value) : r)),
    );
  }

  clearFilters(): void {
    this.formSearch.set('');
    this.moduleFilter.set('');
    this.submoduleFilter.set('');
    this.onlyGranted.set(false);
  }

  /**
   * Copy another role's grants into the current (in-memory) matrix by menu_no.
   * Non-destructive until Save — the user reviews then persists, or resets to undo.
   */
  copyFromRole(): void {
    const src = this.copySourceRoleNo();
    if (!src) {
      this.toastr.warning('Choose a role to copy from.');
      return;
    }
    if (!this.selectedRoleNo()) {
      this.toastr.warning('Select a target role first.');
      return;
    }
    this.isCopying.set(true);
    this.data
      .getMatrix(src)
      .pipe(finalize(() => this.isCopying.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) {
          this.toastr.error('Could not load the source role permissions.');
          return;
        }
        const byMenu = new Map<number, MatrixRow>();
        for (const r of res.data) byMenu.set(r.menu_no, r);
        let copied = 0;
        this.matrix.update((rows) =>
          rows.map((r) => {
            const s = byMenu.get(r.menu_no);
            if (!s) return r;
            copied++;
            return {
              ...r,
              can_view: s.can_view, can_insert: s.can_insert,
              can_update: s.can_update, can_delete: s.can_delete,
              can_approve: s.can_approve, can_post: s.can_post,
              can_cancel: s.can_cancel, can_export: s.can_export,
              perm_scope: s.perm_scope, record_filter: s.record_filter,
            };
          }),
        );
        const srcRole = this.roles().find((x) => x.role_no === src);
        this.toastr.info(
          `Copied from “${srcRole?.role_name ?? 'role'}” into ${copied} form(s). Review, then Save to apply.`,
        );
        this.copySourceRoleNo.set(null);
      });
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
