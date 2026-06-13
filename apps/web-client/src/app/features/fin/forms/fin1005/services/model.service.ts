import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1005DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';

export interface AccountLite { account_no: number; account_code: string; account_name: string; control_type?: number | null; is_active?: number | null; }

export interface BankAccount extends BaseEntity {
  bank_account_no: number;
  bank_account_id: string;
  account_no: number | null;
  bank_name?: string | null;
  branch_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  routing_number?: string | null;
  swift_code?: string | null;
  opening_balance?: number | null;
  account_code?: string | null;
  account_name?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for FIN_1005 – Bank/Cash Account. */
@Injectable()
export class Fin1005ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1005DataService);
  private toastr = inject(ToastrService);

  banks         = signal<BankAccount[]>([]);
  accounts      = signal<AccountLite[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  /** Only Bank(3)/Cash(4) control accounts can back a bank account. */
  bankCashAccounts = computed(() => this.accounts().filter((a) => (a.is_active ?? 1) === 1 && (a.control_type === 3 || a.control_type === 4)));

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.banks()
      .filter((b) => (b.bank_account_id || '').toLowerCase().includes(term) || (b.bank_name || '').toLowerCase().includes(term) || (b.account_title || '').toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.bank_account_no - a.bank_account_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      bank_account_no: [null],
      bank_account_id: ['', [Validators.required, Validators.maxLength(30)]],
      account_no:      [null, [Validators.required]],
      bank_name:       [''],
      branch_name:     [''],
      account_title:   [''],
      account_number:  [''],
      routing_number:  [''],
      swift_code:      [''],
      opening_balance: [0],
      is_active:       [1],
    });
  }

  loadAccounts(): void { this.data.loadAccounts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.accounts.set(r.data); } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadBanks().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.banks.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((b) => b.bank_account_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load bank accounts'),
    });
  }

  select(item: BankAccount): void {
    this.selectedNo.set(item.bank_account_no);
    this.form.patchValue({
      bank_account_no: item.bank_account_no,
      bank_account_id: item.bank_account_id,
      account_no:      item.account_no,
      bank_name:       item.bank_name,
      branch_name:     item.branch_name,
      account_title:   item.account_title,
      account_number:  item.account_number,
      routing_number:  item.routing_number,
      swift_code:      item.swift_code,
      opening_balance: item.opening_balance ?? 0,
      is_active:       item.is_active,
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
          this.toastr.success(isUpdate ? 'Bank account updated' : 'Bank account created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.bank_account_no ?? null));
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Bank account deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ opening_balance: 0, is_active: 1 });
  }
}
