import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Sys1006DataService } from './data.service';
import { CurrencySettingsService } from '../../../../../core/services/currency-settings.service';

export interface Lookup { value: number; label: string; }

export interface IExchangeRate {
  exchange_rate_no: number;
  currency_no: number;
  currency_label?: string | null;
  rate_date: string;
  rate: number;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Sys1006ModelService {
  private fb               = inject(FormBuilder);
  private data             = inject(Sys1006DataService);
  private toastr           = inject(ToastrService);
  private currencySettings = inject(CurrencySettingsService);

  items = signal<IExchangeRate[]>([]);
  currencies = signal<Lookup[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter((e) => (e.currency_label || '').toLowerCase().includes(term));
  });

  pager = makePaginator<IExchangeRate>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      exchange_rate_no: [null],
      currency_no: [null, [Validators.required]],
      rate_date: [{ value: '', disabled: true }, [Validators.required]],
      rate: [null, [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      is_active: [1, [Validators.required]],
    });
  }

  loadCurrencies(): void {
    this.data.getCurrencies().subscribe((res) => {
      if (isSuccess(res) && res.data) this.currencies.set(res.data);
    });
  }

  loadList(reselectNo: number | null = null): void {
    this.data.getList().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.items.set(res.data);
        const resolved = resolvePostReloadSelection(res.data, (e: IExchangeRate) => e.exchange_rate_no, reselectNo);
        resolved ? this.select(resolved.item as IExchangeRate) : this.onNew();
      }
    });
  }

  select(item: IExchangeRate): void {
    this.selectedNo.set(item.exchange_rate_no);
    const p = this.currencySettings.baseCurrency()?.decimal_places ?? 2;
    this.form.patchValue({
      exchange_rate_no: item.exchange_rate_no,
      currency_no:      item.currency_no,
      rate_date:        item.rate_date,
      rate:             (item.rate ?? 0).toFixed(p),  // "123.00" — text input shows it as-is
      is_active:        item.is_active ?? 1,
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, exchange_rate_no: this.selectedNo(), rate: parseFloat(val.rate) })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Exchange rate updated' : 'Exchange rate created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.exchange_rate_no ?? null));
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toastr.error(err?.error?.message || 'API error during save');
        },
      });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.data.delete(no).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Exchange rate deleted');
          this.loadList();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    const p = this.currencySettings.baseCurrency()?.decimal_places ?? 2;
    this.form.reset({
      is_active: 1,
      rate_date: new Date().toISOString().split('T')[0],
      rate: (0).toFixed(p),   // "0.00" — pre-formatted so placeholder aligns with decimal style
    });
  }
}
