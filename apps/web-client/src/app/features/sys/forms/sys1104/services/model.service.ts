import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { Sys1104DataService } from './data.service';

/**
 * Left-list item — an EMPLOYEE (managers think in employees, not user accounts).
 * `user_no` is the employee's linked login, used for all branch-role mapping calls.
 */
export interface UserOption {
  user_no: number;
  user_id: string;          // employee_id (e.g. EMP-0042)
  user_name: string;        // employee full name
  employee_no?: number;
  department_name?: string | null;
  designation_name?: string | null;
}

export interface Option {
  value: number;
  label: string;
}

/** Role option carrying its branch availability — empty `branch_nos` = available at all branches. */
export interface RoleOption extends Option {
  branch_nos: number[];
}

export interface MappingRow {
  /**
   * Stable client-side row id. The model replaces row objects immutably ({...r}) on every
   * edit, so object-reference lookups go stale after the first change. This id is copied by
   * the spread and stays constant, so row lookups (indexOfRow) always resolve correctly —
   * the same approach SYS1003 uses with its fin_period_id key.
   */
  __uid?: string;
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
  roles = signal<RoleOption[]>([]);
  mappings = signal<MappingRow[]>([]);
  selectedUserNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  /** Monotonic source for stable per-row client ids (see MappingRow.__uid). */
  private uidSeq = 0;
  private newUid(): string { return `r${++this.uidSeq}`; }

  // Sidebar filters (mirrors the user form): department + designation, derived from the list.
  filterDept = signal<string | null>(null);
  filterDesig = signal<string | null>(null);

  departments = computed<string[]>(() => {
    const set = new Set<string>();
    for (const u of this.users()) if (u.department_name) set.add(u.department_name);
    return [...set].sort();
  });

  designations = computed<string[]>(() => {
    const dept = this.filterDept();
    const set = new Set<string>();
    for (const u of this.users()) {
      if (dept && u.department_name !== dept) continue;
      if (u.designation_name) set.add(u.designation_name);
    }
    return [...set].sort();
  });

  hasActiveFilters = computed(() => this.filterDept() !== null || this.filterDesig() !== null);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const dept = this.filterDept();
    const desig = this.filterDesig();
    return this.users().filter((u) => {
      if (dept && u.department_name !== dept) return false;
      if (desig && u.designation_name !== desig) return false;
      if (
        term &&
        !((u.user_name || '').toLowerCase().includes(term) ||
          (u.user_id || '').toLowerCase().includes(term))
      )
        return false;
      return true;
    });
  });

  /** Paginated sidebar list — standard master-detail pattern (see SYS1002/SYS1004). */
  pager = makePaginator(this.filteredUsers, { sortKey: (u) => u.user_no });

  clearFilters(): void {
    this.filterDept.set(null);
    this.filterDesig.set(null);
    this.pager.reset();
  }

  // ── Multi-select for bulk assignment ────────────────────────────────────────
  // Explicitly ticked employees. The ACTIVE (clicked) employee is always an effective
  // target too — you're editing its grid — so it always shows checked and is included
  // on save. That removes the "grid shows A but saving hits B" confusion.
  checkedUserNos = signal<ReadonlySet<number>>(new Set());

  effectiveSelected = computed<Set<number>>(() => {
    const s = new Set(this.checkedUserNos());
    const active = this.selectedUserNo();
    if (active != null) s.add(active);
    return s;
  });
  effectiveCount = computed(() => this.effectiveSelected().size);

  allChecked = computed(() => {
    const f = this.filteredUsers();
    return f.length > 0 && f.every((u) => this.effectiveSelected().has(u.user_no));
  });
  someChecked = computed(() => {
    const f = this.filteredUsers();
    const sel = this.effectiveSelected();
    const n = f.filter((u) => sel.has(u.user_no)).length;
    return n > 0 && n < f.length;
  });

  /** Checkbox state for a row — checked when explicitly ticked OR it's the active row. */
  isRowSelected(userNo: number): boolean {
    return this.effectiveSelected().has(userNo);
  }
  toggleChecked(userNo: number): void {
    this.checkedUserNos.update((s) => {
      const next = new Set(s);
      if (next.has(userNo)) next.delete(userNo);
      else next.add(userNo);
      return next;
    });
  }
  /** Select-all toggles only the currently filtered employees. */
  toggleSelectAll(): void {
    const f = this.filteredUsers();
    this.checkedUserNos.update((s) => {
      const next = new Set(s);
      if (this.allChecked()) f.forEach((u) => next.delete(u.user_no));
      else f.forEach((u) => next.add(u.user_no));
      return next;
    });
  }
  clearChecked(): void {
    this.checkedUserNos.set(new Set());
  }

  /** Branch numbers already chosen in any row — drives duplicate-prevention in the dropdowns. */
  selectedBranchNos = computed(() => {
    const s = new Set<number>();
    for (const r of this.mappings()) if (r.branch_no != null) s.add(r.branch_no);
    return s;
  });

  /** True when this branch is used by a DIFFERENT row (so its option is disabled here). */
  isBranchTaken(branchNo: number, currentRowBranch: number | null): boolean {
    return branchNo !== currentRowBranch && this.selectedBranchNos().has(branchNo);
  }

  /**
   * Roles available for a branch: those assigned to it, plus roles with no specific
   * assignment (empty `branch_nos` = all branches). With no branch chosen yet, show none.
   */
  rolesForBranch(branchNo: number | null): RoleOption[] {
    if (branchNo == null) return this.roles();
    return this.roles().filter((r) => !r.branch_nos?.length || r.branch_nos.includes(0) || r.branch_nos.includes(branchNo));
  }

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

        const opts: UserOption[] = (isSuccess(users) && users.data ? users.data : []).map((u: any) => ({
          user_no: u.user_no,
          user_id: u.user_id || `USER-${u.user_no}`,
          user_name: u.user_name || u.user_id || 'Unnamed User',
          employee_no: u.employee_no,
        }));
        this.users.set(opts);
        const first = opts[0];
        if (first) this.selectUser(first.user_no);
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
              __uid: this.newUid(),
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
      { __uid: this.newUid(), branch_no: null, role_no: null, is_default: rows.length === 0 ? 1 : 0, is_active: 1 },
    ]);
  }

  removeRow(index: number): void {
    this.mappings.update((rows) => rows.filter((_, i) => i !== index));
  }

  activeOptions: Option[] = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' },
  ];
  
  defaultOptions: Option[] = [
    { value: 1, label: 'Yes' },
    { value: 0, label: 'No' },
  ];

  updateRow(row: MappingRow): void {
    const i = this.indexOfRow(row);
    if (i >= 0) {
      this.mappings.update((rows) => {
        const next = [...rows];
        const oldRow = next[i];

        // If branch changed, we might need to clear the role if invalid
        if (oldRow.branch_no !== row.branch_no && row.role_no != null && row.branch_no != null) {
          const ok = this.rolesForBranch(row.branch_no).some((ro) => ro.value === row.role_no);
          if (!ok) row.role_no = null;
        }

        // If is_default changed to 1, we must clear others
        if (row.is_default === 1 && oldRow.is_default !== 1) {
          for (let j = 0; j < next.length; j++) {
            if (j !== i) next[j] = { ...next[j], is_default: 0 };
          }
        }

        next[i] = row;
        return next;
      });
    }
  }

  // ── Row-reference variants — used by the common-table custom templates ──────
  private indexOfRow(row: MappingRow): number {
    // Look up by the stable __uid so a stale (immutably-replaced) row object still resolves.
    if (row.__uid != null) return this.mappings().findIndex((r) => r.__uid === row.__uid);
    return this.mappings().indexOf(row);
  }
  removeRowRef(row: MappingRow): void {
    const i = this.indexOfRow(row);
    if (i >= 0) this.removeRow(i);
  }

  setBranchNo(index: number, value: number | null): void {
    this.mappings.update((rows) =>
      rows.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, branch_no: value ?? null };
        // If the role already chosen isn't available at the new branch, clear it.
        if (next.role_no != null && value != null) {
          const ok = this.rolesForBranch(value).some((ro) => ro.value === next.role_no);
          if (!ok) next.role_no = null;
        }
        return next;
      }),
    );
  }

  setRoleNo(index: number, value: number | null): void {
    this.mappings.update((rows) => rows.map((r, i) => (i === index ? { ...r, role_no: value ?? null } : r)));
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
    const rows = this.mappings();
    if (rows.some((r) => r.branch_no == null || r.role_no == null)) {
      this.toastr.warning('Every row needs both a branch and a role.');
      return;
    }
    const branchNos = rows.map((r) => r.branch_no);
    if (new Set(branchNos).size !== branchNos.length) {
      this.toastr.warning('Each branch can only be added once.');
      return;
    }

    // Strip the client-only __uid before sending — the backend DTO has no such field.
    const payload: MappingRow[] = rows.map((r) => ({
      user_branch_no: r.user_branch_no ?? null,
      branch_no: r.branch_no,
      role_no: r.role_no,
      is_default: r.is_default,
      is_active: r.is_active,
    }));

    // Bulk mode: apply the same rows to every effective target (active + checked).
    const targets = [...this.effectiveSelected()];
    if (targets.length > 1) {
      this.bulkSave(targets, payload);
      return;
    }

    const userNo = this.selectedUserNo();
    if (!userNo) {
      this.toastr.warning('Select an employee first.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .saveMappings(userNo, payload)
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

  private bulkSave(userNos: number[], rows: MappingRow[]): void {
    this.isSaving.set(true);
    this.data
      .bulkSaveMappings(userNos, rows)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(`Mappings saved for ${userNos.length} employee(s)`);
            this.clearChecked();
            const cur = this.selectedUserNo();
            if (cur) this.selectUser(cur);
          } else {
            this.toastr.error(res.message || 'Bulk save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during bulk save'),
      });
  }
}
