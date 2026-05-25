import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1107DataService } from './data.service';

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
  user_company_no?: number | null;
  company_no: number | null;
  is_default: number;
  is_owner: number;
  is_active: number;
}

/**
 * View-model for SYS1107 – User-Company Mapping. Pick a user, then grant access to companies
 * (sys_user_company). One company may be marked default; ownership flag marks group owners.
 */
@Injectable()
export class Sys1107ModelService {
  private data = inject(Sys1107DataService);
  private toastr = inject(ToastrService);

  users = signal<UserOption[]>([]);
  companies = signal<Option[]>([]);
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
      companies: this.data.getCompanies(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ users, companies }) => {
        if (isSuccess(companies) && companies.data) this.companies.set(companies.data);
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
              user_company_no: m.user_company_no ?? null,
              company_no: m.company_no ?? null,
              is_default: m.is_default ?? 0,
              is_owner: m.is_owner ?? 0,
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
      { company_no: null, is_default: rows.length === 0 ? 1 : 0, is_owner: 0, is_active: 1 },
    ]);
  }

  removeRow(index: number): void {
    this.mappings.update((rows) => rows.filter((_, i) => i !== index));
  }

  setCompany(index: number, value: string): void {
    const n = value ? Number(value) : null;
    this.mappings.update((rows) => rows.map((r, i) => (i === index ? { ...r, company_no: n } : r)));
  }

  setDefault(index: number): void {
    this.mappings.update((rows) => rows.map((r, i) => ({ ...r, is_default: i === index ? 1 : 0 })));
  }

  toggleOwner(index: number): void {
    this.mappings.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, is_owner: r.is_owner === 1 ? 0 : 1 } : r)),
    );
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
    if (rows.some((r) => r.company_no == null)) {
      this.toastr.warning('Every row needs a company.');
      return;
    }
    const ids = rows.map((r) => r.company_no);
    if (new Set(ids).size !== ids.length) {
      this.toastr.warning('A company is listed more than once.');
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
