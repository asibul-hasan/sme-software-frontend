import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolveIdPattern, validateIdPattern } from '../../../../../shared/numbering';
import { Sys1301DataService } from './data.service';

// ── Wire types (snake_case matches backend DTO) ─────────────────────────────

export interface ISysLookupOption {
  value: number;
  label: string;
}

export interface ISys1301MenuOption {
  menu_no: number;
  form_id: string;
  form_name: string;
  submodule_no: number | null;
  submodule_name: string | null;
  module_no: number | null;
  module_name: string | null;
}

export interface IIdGeneratorRow {
  doc_sequence_no?: number;
  menu_no: number | null;
  module_no?: number | null;
  submodule_no?: number | null;
  form_id?: string;
  form_name?: string;
  module_name?: string;
  submodule_name?: string;
  doc_sub_type?: string;
  branch_no?: number | null;
  fin_year_no?: number | null;
  pattern: string;
  prefix?: string;
  suffix?: string;
  starting_no?: number;
  next_no?: number;
  padding?: number;
  reset_policy?: number;
  is_active?: number;
  row_version?: number;
}

export interface ISys1301PreviewRequest {
  pattern: string;
  doc_sub_type?: string;
  doc_date?: string;
  sample_sequence?: number;
}

export interface ISys1301PreviewResponse {
  preview: string;
  tokens_used: string;
}

// ── Grid row shape (adds __uid so the grid can key rows before they have a PK) ─
export interface IdGeneratorRowVM extends IIdGeneratorRow {
  __uid: number;
  /** Client-side rendered preview — recomputed on every edit. */
  preview_display?: string;
}

/**
 * SYS_1301 ID Generator — model service. Owns the grid rows (`externalRowState`
 * on the grid config) so cascading Module / Submodule / Form edits stay in one
 * place, and unsaved rows survive filter changes.
 */
@Injectable()
export class Sys1301ModelService {
  private data = inject(Sys1301DataService);
  private toastr = inject(ToastrService);

  private uidSeq = 1;

  // ── Server data ─────────────────────────────────────────────────────────
  rows        = signal<IdGeneratorRowVM[]>([]);
  menuOptions = signal<ISys1301MenuOption[]>([]);
  finYearOptions = signal<ISysLookupOption[]>([]);

  // ── Loading / saving flags ─────────────────────────────────────────────
  isLoading = signal(false);
  isSaving  = signal(false);
  isDeleting = signal(false);

  // ── Filters ────────────────────────────────────────────────────────────
  searchTerm       = signal('');
  filterModuleNo    = signal<number | null>(null);
  filterSubmoduleNo = signal<number | null>(null);
  filterMenuNo      = signal<number | null>(null);

  hasActiveFilters = computed(
    () =>
      this.filterModuleNo() !== null ||
      this.filterSubmoduleNo() !== null ||
      this.filterMenuNo() !== null,
  );

  /**
   * Menu options filtered by the module / submodule filter — used both by the
   * top filter card's Form picker AND every grid row's Form cell so users only
   * see forms within the module they filtered on.
   */
  filteredMenuOptions = computed(() => {
    const mod = this.filterModuleNo();
    const sub = this.filterSubmoduleNo();
    return this.menuOptions().filter(
      (m) =>
        (mod == null || m.module_no === mod) &&
        (sub == null || m.submodule_no === sub),
    );
  });

  /** Unique modules from the loaded menu catalogue. */
  moduleOptions = computed<ISysLookupOption[]>(() => {
    const seen = new Map<number, string>();
    for (const m of this.menuOptions()) {
      if (m.module_no != null && !seen.has(m.module_no)) {
        seen.set(m.module_no, m.module_name || '');
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  });

  /** Submodules filtered by the module filter. */
  submoduleOptions = computed<ISysLookupOption[]>(() => {
    const mod = this.filterModuleNo();
    const seen = new Map<number, string>();
    for (const m of this.menuOptions()) {
      if (m.submodule_no == null) continue;
      if (mod != null && m.module_no !== mod) continue;
      if (!seen.has(m.submodule_no)) {
        seen.set(m.submodule_no, m.submodule_name || '');
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  });

  // ── Grid rows the user actually sees (after filters + search) ───────────
  visibleRows = computed<IdGeneratorRowVM[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const menu = this.filterMenuNo();
    const sub  = this.filterSubmoduleNo();
    const mod  = this.filterModuleNo();
    return this.rows().filter((r) => {
      if (menu != null && r.menu_no !== menu) return false;
      if (sub  != null && r.submodule_no !== sub) return false;
      if (mod  != null && r.module_no !== mod) return false;
      if (term) {
        const haystack = [
          r.pattern, r.doc_sub_type, r.form_id, r.form_name,
          r.module_name, r.submodule_name,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  loadLookups(): void {
    forkJoin({
      menus:    this.data.getMenuOptions(),
      finYears: this.data.getFinYearOptions(),
    }).subscribe(({ menus, finYears }) => {
      if (isSuccess(menus) && menus.data) this.menuOptions.set(menus.data);
      if (isSuccess(finYears) && finYears.data) this.finYearOptions.set(finYears.data);
    });
  }

  loadList(): void {
    this.isLoading.set(true);
    this.data.getList(this.filterMenuNo())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.rows.set(res.data.map((r) => this.decorate(r)));
        }
      });
  }

  // -------------------------------------------------------------------------
  // Grid intent handlers (externalRowState: form owns rows)
  // -------------------------------------------------------------------------

  addRow(): void {
    const row: IdGeneratorRowVM = this.decorate({
      menu_no: this.filterMenuNo(),
      pattern: '{SEQ:4}',
      starting_no: 1,
      padding: 6,
      reset_policy: 2,
      is_active: 1,
      doc_sub_type: '',
    });
    // If a menu is filtered, back-fill module/submodule from the catalogue.
    if (row.menu_no != null) this.applyMenuCascade(row, row.menu_no);
    this.rows.update((list) => [row, ...list]);
  }

  updateRow(uid: number, changes: Partial<IIdGeneratorRow>): void {
    this.rows.update((list) =>
      list.map((r) => {
        if (r.__uid !== uid) return r;
        const merged: IdGeneratorRowVM = { ...r, ...changes };
        // Cascade: whichever level the user edited, resolve the rest from the catalogue.
        if ('menu_no' in changes && changes.menu_no != null) {
          this.applyMenuCascade(merged, changes.menu_no);
        } else if ('submodule_no' in changes && changes.submodule_no != null) {
          const first = this.menuOptions().find((m) => m.submodule_no === changes.submodule_no);
          if (first) {
            merged.module_no = first.module_no;
            merged.module_name = first.module_name || undefined;
            // If the previously-selected form no longer belongs here, clear it.
            if (merged.menu_no != null) {
              const stillValid = this.menuOptions().some(
                (m) => m.menu_no === merged.menu_no && m.submodule_no === changes.submodule_no,
              );
              if (!stillValid) {
                merged.menu_no = null;
                merged.form_id = undefined;
                merged.form_name = undefined;
              }
            }
          }
        } else if ('module_no' in changes && changes.module_no != null) {
          // Clear submodule/form if they no longer belong under this module.
          if (merged.submodule_no != null) {
            const stillValid = this.menuOptions().some(
              (m) => m.submodule_no === merged.submodule_no && m.module_no === changes.module_no,
            );
            if (!stillValid) {
              merged.submodule_no = null;
              merged.submodule_name = undefined;
              merged.menu_no = null;
              merged.form_id = undefined;
              merged.form_name = undefined;
            }
          }
        }
        merged.preview_display = this.buildPreview(merged);
        return merged;
      }),
    );
  }

  removeRow(uid: number): void {
    this.rows.update((list) => list.filter((r) => r.__uid !== uid));
  }

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------

  applyFilters(patch: { module?: number | null; submodule?: number | null; menu?: number | null }): void {
    if ('module'    in patch) this.filterModuleNo.set(patch.module ?? null);
    if ('submodule' in patch) this.filterSubmoduleNo.set(patch.submodule ?? null);
    if ('menu'      in patch) this.filterMenuNo.set(patch.menu ?? null);
    // Cascade the top filter: a module change wipes an out-of-scope submodule / menu.
    if ('module' in patch) {
      const mod = this.filterModuleNo();
      if (mod != null) {
        const sub = this.filterSubmoduleNo();
        if (sub != null && !this.submoduleOptions().some((s) => s.value === sub)) {
          this.filterSubmoduleNo.set(null);
        }
        const menu = this.filterMenuNo();
        if (menu != null && !this.menuOptions().some((m) => m.menu_no === menu && m.module_no === mod)) {
          this.filterMenuNo.set(null);
        }
      }
    }
    if ('submodule' in patch) {
      const sub = this.filterSubmoduleNo();
      const menu = this.filterMenuNo();
      if (sub != null && menu != null &&
          !this.menuOptions().some((m) => m.menu_no === menu && m.submodule_no === sub)) {
        this.filterMenuNo.set(null);
      }
    }
    this.loadList();
  }

  clearFilters(): void {
    this.filterModuleNo.set(null);
    this.filterSubmoduleNo.set(null);
    this.filterMenuNo.set(null);
    this.loadList();
  }

  // -------------------------------------------------------------------------
  // Save (bulk — every dirty row) / Delete
  // -------------------------------------------------------------------------

  onSave(): void {
    // Validate patterns client-side before firing anything.
    for (const row of this.rows()) {
      const v = validateIdPattern(row.pattern);
      if (!v.ok) {
        this.toastr.error(`Row for ${row.form_name || 'form'}: ${v.error}`);
        return;
      }
      if (row.menu_no == null) {
        this.toastr.error('Every row must have a Form selected');
        return;
      }
    }
    this.isSaving.set(true);
    const calls = this.rows().map((r) => this.data.save(this.toDto(r)));
    forkJoin(calls)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          const ok = results.every(isSuccess);
          if (ok) {
            const first = results[0];
            this.toastr.success(first?.message || 'Patterns saved');
            this.loadList();
          } else {
            const bad = results.find((r) => !isSuccess(r));
            this.toastr.error(bad?.message || 'Some patterns failed to save');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'Save failed'),
      });
  }

  deleteRow(uid: number): void {
    const row = this.rows().find((r) => r.__uid === uid);
    if (!row) return;
    // New (unsaved) row — just drop it locally.
    if (!row.doc_sequence_no) {
      this.removeRow(uid);
      return;
    }
    this.isDeleting.set(true);
    this.data.delete(row.doc_sequence_no)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(res.message || 'Pattern deleted');
            this.removeRow(uid);
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'Delete failed'),
      });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private decorate(r: IIdGeneratorRow): IdGeneratorRowVM {
    const vm: IdGeneratorRowVM = { __uid: ++this.uidSeq, ...r };
    vm.preview_display = this.buildPreview(vm);
    return vm;
  }

  private applyMenuCascade(row: IdGeneratorRowVM, menuNo: number): void {
    const menu = this.menuOptions().find((m) => m.menu_no === menuNo);
    if (!menu) return;
    row.menu_no = menu.menu_no;
    row.form_id = menu.form_id;
    row.form_name = menu.form_name;
    row.submodule_no = menu.submodule_no ?? null;
    row.submodule_name = menu.submodule_name ?? undefined;
    row.module_no = menu.module_no ?? null;
    row.module_name = menu.module_name ?? undefined;
  }

  /** Client-side preview — cheap, no round trip. */
  private buildPreview(row: IdGeneratorRowVM): string {
    if (!row.pattern) return '';
    return resolveIdPattern(row.pattern, {
      docDate: new Date(),
      docSubType: row.doc_sub_type || '',
      sequenceValue: row.starting_no ?? 1,
    });
  }

  private toDto(r: IdGeneratorRowVM): Partial<IIdGeneratorRow> {
    return {
      doc_sequence_no: r.doc_sequence_no,
      menu_no: r.menu_no,
      doc_sub_type: r.doc_sub_type ?? '',
      branch_no: r.branch_no ?? null,
      fin_year_no: r.fin_year_no ?? null,
      pattern: r.pattern,
      prefix: r.prefix ?? '',
      suffix: r.suffix ?? '',
      starting_no: r.starting_no ?? 1,
      padding: r.padding ?? 6,
      reset_policy: r.reset_policy ?? 2,
      is_active: r.is_active ?? 1,
      row_version: r.row_version,
    };
  }
}
