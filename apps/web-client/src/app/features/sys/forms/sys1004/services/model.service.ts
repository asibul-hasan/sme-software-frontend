import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from '../../../../../core/services/modal.service';
import { Sys1004DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { CurrencySettingsService } from '../../../../../core/services/currency-settings.service';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface CurrencyLookup {
  currency_no:      number;
  currency_code:    string;
  currency_name:    string;
  currency_symbol:  string;
  fraction_name:    string;
  decimal_places:   number;
  number_system:    number;
  is_base_currency: number;
}

export interface Currency extends BaseEntity {
  currency_no:      number;
  currency_code:    string;
  currency_name:    string;
  currency_symbol:  string;
  fraction_name:    string;
  decimal_places:   number;
  number_system:    number;
  exchange_rate:    number;
  is_base_currency: number;
  branch_no:        number;
  remarks:          string;
  is_active:        number;
  row_version:      number;
}

export interface RateHistory {
  exchange_rate_no: number;
  rate_date:        string;
  rate:             number;
  created_by:       number;
  created_at:       string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class Sys1004ModelService {
  private fb                  = inject(FormBuilder);
  private data                = inject(Sys1004DataService);
  private toastr              = inject(ToastrService);
  private datePipe            = inject(DatePipe);
  private modalService        = inject(ModalService);
  private currencySettings    = inject(CurrencySettingsService);
  private authCtx             = inject(AuthContextService);

  /** Current logged-in branch — the default branch assignment on New. */
  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  currencies          = signal<CurrencyLookup[]>([]);
  branches            = signal<IBranch[]>([]);
  rateHistory         = signal<RateHistory[]>([]);
  latestExchangeRate  = signal<number | null>(null);
  isSaving            = signal(false);
  searchTerm          = signal('');
  selectedCurrencyNo  = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredCurrencies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.currencies()
      .filter(
        (c) =>
          c.currency_name.toLowerCase().includes(term) ||
          c.currency_code.toLowerCase().includes(term),
      );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.currency_no - a.currency_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filteredCurrencies);

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      currency_no:      [null],
      branch_nos:       [[] as number[]],   // multi-branch; empty = all branches
      currency_code:    ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
      currency_name:    ['', [Validators.required]],
      currency_symbol:  ['', [Validators.required, Validators.maxLength(5)]],
      fraction_name:    [''],
      decimal_places:   [2, [Validators.required, Validators.min(0), Validators.max(4)]],
      number_system:    [1, [Validators.required]],
      is_base_currency: [false],
      exchange_rate:    [1.0, [Validators.required, Validators.min(0)]],
      remarks:          [''],
    });

    // ── Base-currency guard: lock exchange_rate to 1.0 when base is ticked ──
    this.form.get('is_base_currency')?.valueChanges.subscribe((isBase: boolean | number) => {
      if (isBase === true || isBase === 1) {
        this.form.get('exchange_rate')?.setValue(1.0, { emitEvent: false });
      }
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** True when the currently loaded currency record is the base currency. */
  get isCurrentlyBase(): boolean {
    return this.form?.get('is_base_currency')?.value === true || this.form?.get('is_base_currency')?.value === 1;
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.branches.set(res.data);
      },
    });
  }

  /**
   * Reload the currency list then restore selection by PK.
   *
   * @param reselectNo — PK of the record to select after reload.
   *   - Pass the NEW record's currency_no after a create (selects the new row).
   *   - Pass selectedCurrencyNo() after an update (keeps current selection).
   *   - Omit / pass null after delete or initial load (falls back to first record).
   */
  loadCurrencies(reselectNo?: number | null): void {
    this.data.loadCurrencies().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.currencies.set(res.data);

          // Sync ERP-wide settings from the base currency (if present)
          const base = res.data.find((c) => c.is_base_currency === 1);
          if (base) {
            this.currencySettings.applySettings({
              currency_code:   base.currency_code,
              currency_name:   base.currency_name,
              currency_symbol: base.currency_symbol,
              number_format:   base.number_system === 1 ? 'International' : 'Indian',
              decimal_places:  base.decimal_places,
            });
          }

          if (res.data.length > 0) {
            // API returns ascending by PK; the sidebar displays descending (newest first).
            // • With a reselectNo  → find that record by PK (post-save / post-update).
            // • Without reselectNo → pick the last item in the API array = highest PK
            //                        = the item at the TOP of the descending sidebar list.
            const last = res.data[res.data.length - 1];
            const target = reselectNo != null
              ? (res.data.find(c => c.currency_no === reselectNo) ?? last)
              : last;
            this.selectCurrency(target);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load currencies'),
    });
  }

  selectCurrency(currency: CurrencyLookup, _index?: number): void {
    this.selectedCurrencyNo.set(currency.currency_no);

    this.data.loadCurrencyDetail(currency.currency_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          const isBase = d['is_base_currency'] === 1;

          this.form.patchValue({
            currency_no:      d['currency_no'],
            // single record → its branch as a one-item selection (NULL = all branches → empty)
            branch_nos:       d['branch_no'] != null ? [d['branch_no']] : [],
            currency_code:    d['currency_code'],
            currency_name:    d['currency_name'],
            currency_symbol:  d['currency_symbol'],
            fraction_name:    d['fraction_name'],
            decimal_places:   d['decimal_places'],
            number_system:    d['number_system'],
            is_base_currency: d['is_base_currency'] === 1,
            exchange_rate:    isBase ? 1.0 : d['exchange_rate'],
            remarks:          d['remarks'],
          });

          if (isBase) {
            this.form.get('exchange_rate')?.setValue(1.0, { emitEvent: false });
            this.latestExchangeRate.set(1.0);
          } else {
            this.loadLatestRate(d['currency_no'] as number);
          }
        }
      },
      error: () => this.toastr.error('Failed to load currency details'),
    });
  }

  /** Fetch the latest exchange rate from sys_exchange_rate for the given currency. */
  private loadLatestRate(currencyNo: number): void {
    this.data.loadRateHistory(currencyNo).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data && res.data.length > 0) {
          // API returns descending by rate_date — first active entry is the latest
          const latest = res.data.find((r: RateHistory) => r.rate != null);
          this.latestExchangeRate.set(latest?.rate ?? null);
        } else {
          this.latestExchangeRate.set(null);
        }
      },
      error: () => this.latestExchangeRate.set(null),
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
    const isBase   = val.is_base_currency === true || val.is_base_currency === 1;

    const payload = {
      currency_no:      val.currency_no,
      branch_nos:       val.branch_nos ?? [],   // empty = all branches (one NULL record)
      currency_code:    val.currency_code.toUpperCase(),
      currency_name:    val.currency_name,
      currency_symbol:  val.currency_symbol,
      fraction_name:    val.fraction_name,
      decimal_places:   val.decimal_places,
      number_system:    val.number_system,
      is_base_currency: isBase ? 1 : 0,
      // Include exchange_rate on insert only (creates initial sys_exchange_rate record)
      ...(!isUpdate ? { exchange_rate: isBase ? 1.0 : val.exchange_rate } : {}),
      remarks:          val.remarks,
    };

    const obs = isUpdate
      ? this.data.updateCurrency(this.selectedCurrencyNo()!, payload)
      : this.data.saveCurrency(payload);

    obs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Currency updated' : 'Currency registered');

          if (isBase) {
            this.currencySettings.applySettings({
              currency_code:   payload.currency_code,
              currency_name:   payload.currency_name,
              currency_symbol: payload.currency_symbol,
              number_format:   payload.number_system === 1 ? 'International' : 'Indian',
              decimal_places:  payload.decimal_places,
            });
          }

          // After create: select the newly created record by its PK from the response.
          // After update: keep the current selection.
          const savedNo = isUpdate
            ? this.selectedCurrencyNo()
            : (res.data as { currency_no?: number } | null)?.currency_no ?? null;
          this.loadCurrencies(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.toastr.error('Server error during save');
      },
    });
  }

  onDelete(callback?: () => void): void {
    const currencyNo = this.selectedCurrencyNo();
    if (!currencyNo) return;

    this.data.deleteCurrency(currencyNo).subscribe({
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

    this.data.loadRateHistory(currencyNo).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.modalService.openDataList({
            title: `Rate History: ${currencyCode}`,
            width: 'lg',
            columns: [
              { field: 'rate_date',  label: 'Effective Date', pipe: 'date' },
              { field: 'rate',       label: 'Exchange Rate',  pipe: 'number', pipeArgs: '1.2-6', align: 'right' },
              { field: 'created_at', label: 'Timestamp',      pipe: 'date', pipeArgs: 'short' },
            ],
            data: res.data as unknown as Record<string, unknown>[],
          });
        }
      },
      error: () => this.toastr.error('Failed to load rate history'),
    });
  }

  onNew(): void {
    this.selectedCurrencyNo.set(null);
    this.latestExchangeRate.set(null);
    this.form?.reset({
      decimal_places:   2,
      number_system:    1,
      exchange_rate:    1.0,
      is_base_currency: false,
      // Default the branch assignment to the current login branch.
      branch_nos:       this.currentBranchNo != null ? [this.currentBranchNo] : [],
    });
  }
}
