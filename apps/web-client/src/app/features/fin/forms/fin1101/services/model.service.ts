import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';
import { Fin1101DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { CurrencyLookup } from '../../../../../shared/services/common-data.service';
import { DebitCreditValue } from '../../../../../core/constants/common-options.constants';

export interface AccountLite { account_no: number; account_code: string; account_name: string; is_postable?: number | null; is_active?: number | null; }
export interface VoucherTypeLite { voucher_type_no: number; type_name: string; base_kind: number; is_active?: number | null; }

export interface VoucherLine {
  voucher_dtl_no?: number | null;
  account_no: number | null;
  dr_cr?: DebitCreditValue;
  debit_fc?: number;
  credit_fc?: number;
  debit: number;
  credit: number;
  cost_center_no?: number | null;
  line_narration?: string | null;
  account_code?: string | null;
  account_name?: string | null;
  __uid?: number;
}

export interface Voucher extends BaseEntity {
  voucher_no: number;
  voucher_id: string;
  voucher_type_no: number | null;
  voucher_date: string | null;
  narration?: string | null;
  reference_no?: string | null;
  currency_no?: number | null;
  fx_rate?: number | null;
  total_debit?: number | null;
  total_credit?: number | null;
  status: number;
  base_kind?: number | null;
  voucher_type_name?: string | null;
  is_active: number;
  row_version: number;
  lines?: VoucherLine[];
}

type VoucherAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** State + header form + working line-set for FIN_1101 – Voucher Entry. */
@Injectable()
export class Fin1101ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1101DataService);
  private toastr = inject(ToastrService);
  private uidSeq = 1;

  vouchers      = signal<Voucher[]>([]);
  accounts      = signal<AccountLite[]>([]);
  voucherTypes  = signal<VoucherTypeLite[]>([]);
  currencies    = signal<CurrencyLookup[]>([]);
  lines         = signal<VoucherLine[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<SortDirection>('');
  currencyRevision = signal(0);

  readonly isDraft = computed(() => this.status() === 1);

  postableAccounts = computed(() => this.accounts().filter((a) => (a.is_active ?? 1) === 1 && a.is_postable !== 0));
  activeVoucherTypes = computed(() => this.voucherTypes().filter((t) => (t.is_active ?? 1) === 1));
  accountName = (no?: number | null) => this.accounts().find((a) => a.account_no === no)?.account_name ?? `#${no ?? ''}`;
  selectedCurrency = computed(() => {
    this.currencyRevision();
    const no = Number(this.form?.get('currency_no')?.value ?? 0);
    return this.currencies().find((c) => c.currency_no === no) ?? this.baseCurrency();
  });
  baseCurrency = computed(() => this.currencies().find((c) => Number(c.is_base_currency) === 1) ?? this.currencies()[0] ?? null);
  currencySymbol = computed(() => this.selectedCurrency()?.currency_symbol || this.selectedCurrency()?.currency_code || 'CUR');

  totalDebit  = computed(() => this.validLines(this.lines()).reduce((s, l) => s + (Number(l.debit) || 0), 0));
  totalCredit = computed(() => this.validLines(this.lines()).reduce((s, l) => s + (Number(l.credit) || 0), 0));
  balanced    = computed(() => this.validLines(this.lines()).length > 0 && this.totalDebit() > 0 && Math.abs(this.totalDebit() - this.totalCredit()) < 0.005);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.vouchers()
      .filter((v) => (v.voucher_id || '').toLowerCase().includes(term) || (v.narration || '').toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.voucher_no - a.voucher_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      voucher_no:      [null],
      voucher_type_no: [null, [Validators.required]],
      voucher_date:    [new Date().toISOString().split('T')[0], [Validators.required]],
      currency_no:     [null, [Validators.required]],
      fx_rate:         [1, [Validators.required, Validators.min(0.000001)]],
      reference_no:    [''],
      narration:       [''],
    });
  }

  loadLookups(): void {
    forkJoin({
      accounts: this.data.loadAccounts(),
      voucherTypes: this.data.loadVoucherTypes(),
      currencies: this.data.loadCurrencies(),
    }).subscribe({
      next: ({ accounts, voucherTypes, currencies }) => {
        if (isSuccess(accounts) && accounts.data) this.accounts.set(accounts.data);
        if (isSuccess(voucherTypes) && voucherTypes.data) this.voucherTypes.set(voucherTypes.data);
        if (isSuccess(currencies) && currencies.data) {
          this.currencies.set(currencies.data);
          if (!this.form.get('currency_no')?.value) {
            const base = currencies.data.find((c) => Number(c.is_base_currency) === 1) ?? currencies.data[0] ?? null;
            this.form.patchValue({ currency_no: base?.currency_no ?? null, fx_rate: 1 }, { emitEvent: false });
          }
          this.refreshCurrencyDisplay();
        }
      },
    });
  }

  // ── working line set ──────────────────────────────────────────────────────
  addBlankLine(): number | null {
    if (this.lines().some((line) => !line.account_no)) {
      this.toastr.warning('Select an account before adding another row');
      return null;
    }
    const side = this.nextLineSide();
    const amount = this.nextLineAmount(side);
    const line = this.createLine(side, amount);
    this.lines.update((arr) => [...arr, line]);
    return line.__uid ?? null;
  }

  updateLine(next: VoucherLine): void {
    const acc = this.accounts().find((a) => a.account_no === next.account_no);
    const side = next.dr_cr === 'cr' ? 'cr' : 'dr';
    const debitFc = side === 'dr' ? Math.max(0, Number(next.debit_fc) || 0) : 0;
    const creditFc = side === 'cr' ? Math.max(0, Number(next.credit_fc) || 0) : 0;
    const rate = this.fxRate();
    const debit = this.roundMoney(debitFc * rate);
    const credit = this.roundMoney(creditFc * rate);
    this.lines.update((arr) => arr.map((l) => l.__uid === next.__uid ? {
      ...l,
      ...next,
      dr_cr: side,
      debit_fc: debitFc,
      credit_fc: creditFc,
      debit,
      credit,
      account_code: acc?.account_code ?? null,
      account_name: acc?.account_name ?? null,
    } : l));
  }

  addLine(accountNo: number | null, debit: number, credit: number, narration: string | null): boolean {
    if (accountNo == null) { this.toastr.warning('Pick an account'); return false; }
    const dr = Number(debit) || 0, cr = Number(credit) || 0;
    if (dr <= 0 && cr <= 0) { this.toastr.warning('Enter a debit or a credit'); return false; }
    if (dr > 0 && cr > 0) { this.toastr.warning('A line is debit OR credit, not both'); return false; }
    const acc = this.accounts().find((a) => a.account_no === accountNo);
    this.lines.update((arr) => [...arr, {
      account_no: accountNo, dr_cr: dr > 0 ? 'dr' : 'cr', debit_fc: dr, credit_fc: cr, debit: this.roundMoney(dr * this.fxRate()), credit: this.roundMoney(cr * this.fxRate()), line_narration: narration || null,
      account_code: acc?.account_code, account_name: acc?.account_name, __uid: this.uidSeq++,
    }]);
    return true;
  }
  removeLine(uid?: number): void { this.lines.update((arr) => arr.filter((l) => l.__uid !== uid)); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadVouchers().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.vouchers.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((v) => v.voucher_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load vouchers'),
    });
  }

  select(item: Voucher): void {
    this.selectedNo.set(item.voucher_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadDetail(item.voucher_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.vouchers.update((arr) => arr.map((x) => (x.voucher_no === d.voucher_no ? { ...x, ...d } : x)));
          this.lines.set((d.lines ?? []).map((l) => ({
            ...l,
            dr_cr: l.dr_cr ?? ((Number(l.debit) || 0) > 0 ? 'dr' : 'cr'),
            debit_fc: Number(l.debit_fc ?? l.debit) || 0,
            credit_fc: Number(l.credit_fc ?? l.credit) || 0,
            __uid: this.uidSeq++,
          })));
          this.form.patchValue({
            voucher_no:      d.voucher_no,
            voucher_type_no: d.voucher_type_no,
            voucher_date:    d.voucher_date ? d.voucher_date.slice(0, 10) : null,
            currency_no:     d.currency_no ?? this.baseCurrency()?.currency_no ?? null,
            fx_rate:         d.fx_rate ?? 1,
            reference_no:    d.reference_no,
            narration:       d.narration,
          });
          this.refreshCurrencyDisplay();
        }
      },
      error: () => this.toastr.error('Failed to load voucher'),
    });
  }

  current = computed(() => this.vouchers().find((v) => v.voucher_no === this.selectedNo()) ?? null);

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Pick a voucher type and date.'); return; }
    const lines = this.validLines(this.lines());
    if (lines.length < 2) { this.toastr.warning('A voucher needs at least two lines.'); return; }
    if (!this.balanced()) { this.toastr.warning('Out of balance — debit must equal credit.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = {
      ...val,
      lines: lines.map((l) => ({
        account_no: l.account_no,
        dr_cr: l.dr_cr ?? ((Number(l.debit) || 0) > 0 ? 'dr' : 'cr'),
        debit_fc: Number(l.debit_fc) || 0,
        credit_fc: Number(l.credit_fc) || 0,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        cost_center_no: l.cost_center_no ?? null,
        line_narration: l.line_narration ?? null,
      })),
    };
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Voucher updated' : 'Voucher created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.voucher_no ?? null));
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: VoucherAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<VoucherAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', cancel: 'cancelled' };
          this.toastr.success(`Voucher ${past[action]}`);
          this.load(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.remove(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Voucher deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.set([]);
    this.addBlankLine();
    const base = this.baseCurrency();
    this.form?.reset({ voucher_date: new Date().toISOString().split('T')[0], currency_no: base?.currency_no ?? null, fx_rate: 1 });
    this.refreshCurrencyDisplay();
  }

  onCurrencyChange(currencyNo?: number | null): void {
    const selected = this.currencies().find((c) => c.currency_no === Number(currencyNo));
    const rate = Number(selected?.is_base_currency) === 1 ? 1 : Number(selected?.exchange_rate) || 0;
    this.form.patchValue({ fx_rate: rate > 0 ? rate : 0 }, { emitEvent: false });
    this.refreshCurrencyDisplay();
    this.recalculateLines();
    if (selected && Number(selected.is_base_currency) !== 1 && rate <= 0) this.toastr.warning(`No exchange rate found for ${selected.currency_code}`);
  }

  recalculateLines(): void {
    const rate = this.fxRate();
    this.lines.update((arr) => arr.map((line) => ({
      ...line,
      debit: this.roundMoney((Number(line.debit_fc) || 0) * rate),
      credit: this.roundMoney((Number(line.credit_fc) || 0) * rate),
    })));
    this.refreshCurrencyDisplay();
  }

  currencyLabel(currency: CurrencyLookup): string {
    const symbol = currency.currency_symbol ? ` (${currency.currency_symbol})` : '';
    return `${currency.currency_code}${symbol} - ${currency.currency_name}`;
  }

  validLines(lines: VoucherLine[]): VoucherLine[] {
    return lines.filter((l) => !!l.account_no && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
  }

  private createLine(side: DebitCreditValue, amount: number): VoucherLine {
    const cleanAmount = this.roundMoney(Math.max(0, Number(amount) || 0));
    const debitFc = side === 'dr' ? cleanAmount : 0;
    const creditFc = side === 'cr' ? cleanAmount : 0;
    const rate = this.fxRate();
    return {
      account_no: null,
      dr_cr: side,
      debit_fc: debitFc,
      credit_fc: creditFc,
      debit: this.roundMoney(debitFc * rate),
      credit: this.roundMoney(creditFc * rate),
      line_narration: null,
      __uid: this.uidSeq++,
    };
  }

  private nextLineSide(): DebitCreditValue {
    const diff = this.totalDebit() - this.totalCredit();
    if (Math.abs(diff) < 0.005) return 'dr';
    return diff > 0 ? 'cr' : 'dr';
  }

  private nextLineAmount(side: DebitCreditValue): number {
    const diff = this.totalDebit() - this.totalCredit();
    if (Math.abs(diff) < 0.005) return 0;
    const neededBase = side === 'cr' ? Math.max(0, diff) : Math.max(0, -diff);
    return this.roundMoney(neededBase / this.fxRate());
  }

  private fxRate(): number {
    return Number(this.form?.get('fx_rate')?.value) > 0 ? Number(this.form?.get('fx_rate')?.value) : 1;
  }

  private roundMoney(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  private refreshCurrencyDisplay(): void {
    this.currencyRevision.update((v) => v + 1);
  }
}
