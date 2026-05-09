import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '../../../../../core/services/modal.service';
import { finalize } from 'rxjs';
import { Sys1004DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';

import { IBranch } from '../../sys1002/services/model.service';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface Currency extends BaseEntity {
  currency_no: number;
  currency_code: string;
  currency_name_en: string;
  currency_name_bn?: string;
  currency_symbol: string;
  fractional_unit_en?: string;
  fractional_unit_bn?: string;
  region: string;
  number_format: string;
  exchange_rate: number;
  decimal_places: number;
  is_base_currency: boolean;
  rate_date: string;
  last_rate_update?: string;
}

export interface RateHistory {
  rate_date: string;
  exchange_rate: number;
  entered_by: string;
  entered_at: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * State + form + orchestration service for SYS1004 – Currency Setup.
 *
 * Responsibilities:
 *  - Reactive signals (currency list, loading flags, selection)
 *  - FormGroup construction and patching
 *  - Orchestration of Sys1004DataService calls (load, save, delete, rate history)
 *
 * HTTP endpoint paths live in Sys1004DataService.
 */
@Injectable()
export class Sys1004ModelService {
  private fb           = inject(FormBuilder);
  private data         = inject(Sys1004DataService);
  private toastr       = inject(ToastrService);
  private datePipe     = inject(DatePipe);
  private modalService = inject(ModalService);

  // ─── State ─────────────────────────────────────────────────────────────────
  currencies          = signal<Currency[]>([]);
  branches            = signal<IBranch[]>([]);
  rateHistory         = signal<RateHistory[]>([]);
  isLoading           = signal(false);
  isSaving            = signal(false);
  isHistoryLoading    = signal(false);
  searchTerm          = signal('');
  selectedCurrencyNo  = signal<number | null>(null);
  lastSelectedIndex   = 0;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredCurrencies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.currencies().filter(
      (c) =>
        c.currency_name_en.toLowerCase().includes(term) ||
        (c.currency_name_bn && c.currency_name_bn.toLowerCase().includes(term)) ||
        c.currency_code.toLowerCase().includes(term),
    );
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      currency_no:        [null],
      branch_nos:         [[], [Validators.required]],
      currency_code:      ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
      currency_name_en:   ['', [Validators.required]],
      currency_name_bn:   [''],
      currency_symbol:    ['', [Validators.required, Validators.maxLength(5)]],
      fractional_unit_en: [''],
      fractional_unit_bn: [''],
      region:             ['', [Validators.required]],
      number_format:      ['International', [Validators.required]],
      decimal_places:     [2, [Validators.required, Validators.min(0), Validators.max(4)]],
      is_base_currency:   [false],
      exchange_rate:      [1.0, [Validators.required, Validators.min(0)]],
      rate_date:          [new Date().toISOString().split('T')[0], [Validators.required]],
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.branches.set(res.data);
      },
    });
  }

  loadCurrencies(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadCurrencies()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.currencies.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectCurrency(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load currencies'),
      });
  }

  selectCurrency(currency: Currency, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedCurrencyNo.set(currency.currency_no);
    this.isLoading.set(true);

    this.data
      .loadCurrencyDetail(currency.currency_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.form.patchValue({
              currency_no:        d['currencyNo'],
              branch_nos:         (d['branchNos'] as number[]) || [],
              currency_code:      d['currencyCode'],
              currency_name_en:   d['currencyNameEn'],
              currency_name_bn:   d['currencyNameBn'],
              currency_symbol:    d['currencySymbol'],
              fractional_unit_en: d['fractionalUnitEn'],
              fractional_unit_bn: d['fractionalUnitBn'],
              region:             d['region'],
              number_format:      d['numberFormat'] || 'International',
              decimal_places:     d['decimalPlaces'],
              is_base_currency:   d['isBaseCurrency'] === 1 || d['isBaseCurrency'] === true,
              exchange_rate:      d['exchangeRate'],
              rate_date:          this.datePipe.transform(d['rateDate'] as string, 'yyyy-MM-dd'),
            });
          }
        },
        error: () => this.toastr.error('Failed to load currency details'),
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }

    this.isSaving.set(true);
    const val      = this.form.value;
    const isUpdate = !!this.selectedCurrencyNo();

    const payload = {
      currency_no:        val.currency_no,
      branch_nos:         val.branch_nos,
      currency_code:      val.currency_code.toUpperCase(),
      currency_name_en:   val.currency_name_en,
      currency_name_bn:   val.currency_name_bn,
      currency_symbol:    val.currency_symbol,
      fractional_unit_en: val.fractional_unit_en,
      fractional_unit_bn: val.fractional_unit_bn,
      region:             val.region,
      number_format:      val.number_format,
      decimal_places:     val.decimal_places,
      is_base_currency:   val.is_base_currency ? 1 : 0,
      exchange_rate:      val.exchange_rate,
      rate_date:          val.rate_date,
    };

    const obs = isUpdate
      ? this.data.updateCurrency(this.selectedCurrencyNo()!, payload)
      : this.data.saveCurrency(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Currency updated' : 'Currency registered');
          this.loadCurrencies(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const currencyNo = this.selectedCurrencyNo();
    if (!currencyNo) return;

    this.isLoading.set(true);
    this.data
      .deleteCurrency(currencyNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Currency deleted successfully');
            this.loadCurrencies();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: () => this.toastr.error('Server error during delete'),
      });
  }

  viewRateHistory(currencyCode: string): void {
    const currencyNo = this.selectedCurrencyNo();
    if (!currencyNo) return;

    this.isHistoryLoading.set(true);
    this.data
      .loadRateHistory(currencyNo)
      .pipe(finalize(() => this.isHistoryLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.modalService.openDataList({
              title: `Rate History: ${currencyCode}`,
              width: 'lg',
              columns: [
                { field: 'rate_date',     label: 'Effective Date', pipe: 'date' },
                { field: 'exchange_rate', label: 'Exchange Rate',  pipe: 'number', pipeArgs: '1.2-6', align: 'right' },
                { field: 'entered_by',    label: 'Entered By' },
                { field: 'entered_at',    label: 'Timestamp',      pipe: 'date', pipeArgs: 'short' },
              ],
              data: res.data,
            });
          }
        },
        error: () => this.toastr.error('Failed to load rate history'),
      });
  }

  onNew(): void {
    this.selectedCurrencyNo.set(null);
    this.form?.reset({
      decimal_places:   2,
      exchange_rate:    1.0,
      is_base_currency: false,
      rate_date:        new Date().toISOString().split('T')[0],
    });
  }
}
