import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Sal1101DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface Customer extends BaseEntity {
  customer_no: number;
  customer_id: string;
  customer_name: string;
  customer_name_nls?: string | null;
  customer_type: number;
  price_tier?: number | null;
  customer_group_no?: number | null;
  mobile_no?: string | null;
  alt_mobile_no?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  post_code?: string | null;
  country_code?: string | null;
  vat_reg_no?: string | null;
  tin_no?: string | null;
  is_credit_allowed?: number | null;
  credit_limit?: number | null;
  credit_days?: number | null;
  opening_balance?: number | null;
  opening_balance_date?: string | null;
  current_due?: number | null;
  loyalty_points?: number | null;
  default_currency_no?: number | null;
  default_warehouse_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for SAL_1101 – Customer Management. */
@Injectable()
export class Sal1101ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Sal1101DataService);
  private toastr = inject(ToastrService);

  customers  = signal<Customer[]>([]);
  isLoading  = signal(false);
  isSaving   = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.customers()
      .filter((c) =>
        (c.customer_id || '').toLowerCase().includes(term) ||
        (c.customer_name || '').toLowerCase().includes(term) ||
        (c.mobile_no || '').toLowerCase().includes(term))
      .sort((a, b) => b.customer_no - a.customer_no);
  });
  pager = makePaginator(this.filtered, { sortKey: (x: Customer) => x.customer_no });

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      customer_no:   [null],
      customer_id:   [''],
      customer_name: ['', [Validators.required, Validators.maxLength(200)]],
      customer_type: [2, [Validators.required]],
      price_tier:    [1],
      mobile_no:     [''],
      alt_mobile_no: [''],
      email:         ['', [Validators.email]],
      address_line1: [''],
      address_line2: [''],
      city:          [''],
      post_code:     [''],
      country_code:  [''],
      vat_reg_no:    [''],
      tin_no:        [''],
      is_credit_allowed: [0],
      credit_limit:  [0],
      credit_days:   [0],
      opening_balance: [0],
      opening_balance_date: [null],
      remarks:       [''],
      is_active:     [1],
    });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadCustomers().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.customers.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((c) => c.customer_no === reselectNo) : null;
            this.select(target ?? res.data[res.data.length - 1]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load customers'),
    });
  }

  select(item: Customer): void {
    this.selectedNo.set(item.customer_no);
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
          this.toastr.success(isUpdate ? 'Customer updated' : 'Customer created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.customer_no ?? null));
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Customer deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ customer_type: 2, price_tier: 1, is_credit_allowed: 0, credit_limit: 0, credit_days: 0, opening_balance: 0, is_active: 1 });
  }
}
