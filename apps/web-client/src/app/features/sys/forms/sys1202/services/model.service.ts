import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1202DataService } from './data.service';

export interface Option {
  value: number;
  label: string;
}

export interface MenuRow {
  menu_no: number;
  form_id: string;
  form_name: string;
  module_name: string;
  module_code: string;
  submodule_name: string;
  module_serial?: number | null;
  enrolled: boolean;
  enroll_menu_no?: number | null;
  is_lifetime: number;
  enroll_start_date?: string | null;
  enroll_end_date?: string | null;
}

export interface SubmoduleGroup {
  submoduleName: string;
  items: MenuRow[];
}

export interface ModuleGroup {
  moduleName: string;
  submodules: SubmoduleGroup[];
}

/**
 * View-model for SYS1202 – Menu Enrollment. Pick a company, then toggle which menus (forms)
 * it has purchased. Enrolments are company-wide (sys_enroll_menu, branch_no IS NULL).
 */
@Injectable()
export class Sys1202ModelService {
  private data = inject(Sys1202DataService);
  private toastr = inject(ToastrService);

  companies = signal<Option[]>([]);
  menus = signal<MenuRow[]>([]);
  selectedCompanyNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.companies();
    if (!term) return data;
    return data.filter((c) => (c.label || '').toLowerCase().includes(term));
  });

  enrolledCount = computed(() => this.menus().filter((m) => m.enrolled).length);

  grouped = computed<ModuleGroup[]>(() => {
    const out: ModuleGroup[] = [];
    const modIndex = new Map<string, number>();
    for (const m of this.menus()) {
      const modKey = m.module_name || 'Other';
      let mi = modIndex.get(modKey);
      if (mi === undefined) {
        mi = out.length;
        modIndex.set(modKey, mi);
        out.push({ moduleName: modKey, submodules: [] });
      }
      const mod = out[mi];
      const subKey = m.submodule_name || '';
      let sub = mod.submodules.find((s) => s.submoduleName === subKey);
      if (!sub) {
        sub = { submoduleName: subKey, items: [] };
        mod.submodules.push(sub);
      }
      sub.items.push(m);
    }
    return out;
  });

  loadCompanies(): void {
    this.isLoading.set(true);
    this.data
      .getCompanies()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.companies.set(res.data);
          const first = res.data[0];
          if (first) this.selectCompany(first.value);
        }
      });
  }

  selectCompany(companyNo: number): void {
    this.selectedCompanyNo.set(companyNo);
    this.isLoading.set(true);
    this.data
      .getMenus(companyNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.menus.set(
            res.data.map((m) => ({
              ...m,
              enrolled: !!m.enrolled,
              is_lifetime: m.is_lifetime ?? 0,
            })),
          );
        } else {
          this.menus.set([]);
        }
      });
  }

  reloadCurrent(): void {
    const no = this.selectedCompanyNo();
    if (no) this.selectCompany(no);
  }

  private patch(menuNo: number, change: Partial<MenuRow>): void {
    this.menus.update((rows) => rows.map((r) => (r.menu_no === menuNo ? { ...r, ...change } : r)));
  }

  toggleEnrolled(menuNo: number): void {
    const row = this.menus().find((r) => r.menu_no === menuNo);
    this.patch(menuNo, { enrolled: !(row?.enrolled) });
  }

  toggleLifetime(menuNo: number): void {
    const row = this.menus().find((r) => r.menu_no === menuNo);
    const next = row?.is_lifetime === 1 ? 0 : 1;
    this.patch(menuNo, {
      is_lifetime: next,
      ...(next === 1 ? { enroll_start_date: null, enroll_end_date: null } : {}),
    });
  }

  setStart(menuNo: number, value: string): void {
    this.patch(menuNo, { enroll_start_date: value || null });
  }

  setEnd(menuNo: number, value: string): void {
    this.patch(menuNo, { enroll_end_date: value || null });
  }

  setModuleEnrolled(moduleName: string, enrolled: boolean): void {
    this.menus.update((rows) =>
      rows.map((r) => (r.module_name === moduleName ? { ...r, enrolled } : r)),
    );
  }

  onSave(): void {
    const companyNo = this.selectedCompanyNo();
    if (!companyNo) {
      this.toastr.warning('Select a company first.');
      return;
    }
    const rows = this.menus();
    const badDates = rows.some(
      (r) =>
        r.enrolled &&
        r.is_lifetime !== 1 &&
        r.enroll_start_date &&
        r.enroll_end_date &&
        r.enroll_end_date < r.enroll_start_date,
    );
    if (badDates) {
      this.toastr.warning('An enrolment has an end date before its start date.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .saveEnrollments(companyNo, rows)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.toastr.success('Enrolment saved');
            this.menus.set(
              res.data.map((m) => ({ ...m, enrolled: !!m.enrolled, is_lifetime: m.is_lifetime ?? 0 })),
            );
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }
}
