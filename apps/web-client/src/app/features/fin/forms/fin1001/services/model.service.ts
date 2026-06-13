import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1001DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';

export interface AccountGroupLite { account_group_no: number; group_name: string; root_type: number; }

export interface Account extends BaseEntity {
  account_no: number;
  account_code: string;
  account_name: string;
  account_group_no: number | null;
  root_type?: number | null;
  normal_balance?: 'dr' | 'cr' | null;
  is_postable?: number | null;
  control_type?: number | null;
  requires_cost_center?: number | null;
  requires_party?: number | null;
  currency_no?: number | null;
  opening_balance?: number | null;
  opening_dr_cr?: 'dr' | 'cr' | null;
  account_group_name?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for FIN_1001 – Chart of Accounts. */
@Injectable()
export class Fin1001ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1001DataService);
  private toastr = inject(ToastrService);

  accounts      = signal<Account[]>([]);
  groups        = signal<AccountGroupLite[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.accounts()
      .filter((a) => (a.account_code || '').toLowerCase().includes(term) || (a.account_name || '').toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.account_no - a.account_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      account_no:           [null],
      account_code:         ['', [Validators.required, Validators.maxLength(30)]],
      account_name:         ['', [Validators.required, Validators.maxLength(200)]],
      account_group_no:     [null, [Validators.required]],
      normal_balance:       [null],
      is_postable:          [1],
      control_type:         [null],
      requires_cost_center: [0],
      requires_party:       [0],
      opening_balance:      [0],
      opening_dr_cr:        ['dr'],
      is_active:            [1],
    });
  }

  loadGroups(): void {
    this.data.loadGroups().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.groups.set(r.data); } });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadAccounts().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.accounts.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((a) => a.account_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load accounts'),
    });
  }

  select(item: Account): void {
    this.selectedNo.set(item.account_no);
    this.form.patchValue({
      account_no:           item.account_no,
      account_code:         item.account_code,
      account_name:         item.account_name,
      account_group_no:     item.account_group_no,
      normal_balance:       item.normal_balance,
      is_postable:          item.is_postable ?? 1,
      control_type:         item.control_type,
      requires_cost_center: item.requires_cost_center ?? 0,
      requires_party:       item.requires_party ?? 0,
      opening_balance:      item.opening_balance ?? 0,
      opening_dr_cr:        item.opening_dr_cr ?? 'dr',
      is_active:            item.is_active,
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, val) : this.data.save(val);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Account updated' : 'Account created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.account_no ?? null));
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.remove(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Account deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ is_postable: 1, requires_cost_center: 0, requires_party: 0, opening_balance: 0, opening_dr_cr: 'dr', is_active: 1 });
  }
}
