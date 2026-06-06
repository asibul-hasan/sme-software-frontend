import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Pur1001DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface Supplier extends BaseEntity {
  supplier_no: number;
  supplier_id: string;
  supplier_name: string;
  supplier_name_nls?: string | null;
  supplier_type: number;
  contact_person?: string | null;
  mobile_no?: string | null;
  alt_mobile_no?: string | null;
  phone_no?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  post_code?: string | null;
  country_code?: string | null;
  vat_reg_no?: string | null;
  tin_no?: string | null;
  bin_no?: string | null;
  trade_license_no?: string | null;
  payment_terms?: number | null;
  credit_days?: number | null;
  credit_limit?: number | null;
  opening_balance?: number | null;
  opening_balance_date?: string | null;
  current_payable?: number | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_branch?: string | null;
  routing_no?: string | null;
  mfs_provider?: string | null;
  mfs_number?: string | null;
  lead_time_days?: number | null;
  rating?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for PUR_1001 – Supplier Management. */
@Injectable()
export class Pur1001ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Pur1001DataService);
  private toastr = inject(ToastrService);

  suppliers  = signal<Supplier[]>([]);
  isLoading  = signal(false);
  isSaving   = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.suppliers()
      .filter((s) =>
        (s.supplier_id || '').toLowerCase().includes(term) ||
        (s.supplier_name || '').toLowerCase().includes(term) ||
        (s.mobile_no || '').toLowerCase().includes(term))
      .sort((a, b) => b.supplier_no - a.supplier_no);
  });
  pager = makePaginator(this.filtered, { sortKey: (x: Supplier) => x.supplier_no });

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      supplier_no:   [null],
      supplier_id:   [''],
      supplier_name: ['', [Validators.required, Validators.maxLength(200)]],
      supplier_type: [1, [Validators.required]],
      contact_person: [''],
      mobile_no:     [''],
      alt_mobile_no: [''],
      phone_no:      [''],
      email:         ['', [Validators.email]],
      website:       [''],
      address_line1: [''],
      address_line2: [''],
      city:          [''],
      state_province: [''],
      post_code:     [''],
      country_code:  [''],
      vat_reg_no:    [''],
      tin_no:        [''],
      bin_no:        [''],
      trade_license_no: [''],
      payment_terms: [1],
      credit_days:   [0],
      credit_limit:  [0],
      opening_balance: [0],
      opening_balance_date: [null],
      bank_name:     [''],
      bank_account_no: [''],
      bank_branch:   [''],
      routing_no:    [''],
      mfs_provider:  [''],
      mfs_number:    [''],
      lead_time_days: [null],
      rating:        [null],
      remarks:       [''],
      is_active:     [1],
    });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadSuppliers().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.suppliers.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.supplier_no === reselectNo) : null;
            this.select(target ?? res.data[res.data.length - 1]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load suppliers'),
    });
  }

  select(item: Supplier): void {
    this.selectedNo.set(item.supplier_no);
    this.form.patchValue({ ...item });
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
          this.toastr.success(isUpdate ? 'Supplier updated' : 'Supplier created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.supplier_no ?? null));
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Supplier deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ supplier_type: 1, payment_terms: 1, credit_days: 0, credit_limit: 0, opening_balance: 0, is_active: 1 });
  }
}
