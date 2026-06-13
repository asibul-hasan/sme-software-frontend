import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, SelectOption, TableConfig } from '../../../../shared/components/common-table';
import { Fin1004DataService, OpeningAccount } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { CurrencyLookup } from '../../../../shared/services/common-data.service';
import { debitCreditOptions, DebitCreditValue } from '../../../../core/constants/common-options.constants';

interface WorkingLine {
  __uid: number;
  dr_cr: DebitCreditValue;
  account_no: number | null;
  account_code?: string;
  account_name?: string;
  dr_amount: number;
  cr_amount: number;
  debit: number;
  credit: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1004',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1004DataService],
  templateUrl: './fin1004.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1004Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data    = inject(Fin1004DataService);
  private toastr  = inject(ToastrService);
  private alert   = inject(AlertService);

  accounts   = signal<OpeningAccount[]>([]);
  currencies = signal<CurrencyLookup[]>([]);
  lines      = signal<WorkingLine[]>([]);
  isLoading  = signal(false);
  isSaving   = signal(false);
  currencyRevision = signal(0);
  readonly lineTable = viewChild(CommonTableComponent);
  private uid = 0;

  voucherDate            = new Date().toISOString().split('T')[0];
  currencyNo: number | null = null;
  exchangeRate = 1;
  narration              = '';

  readonly drCrOptions: SelectOption[] = debitCreditOptions.map((o) => ({ label: o.label, value: o.value }));
  readonly accountOptions = computed<SelectOption[]>(() =>
    this.accounts().map((a) => ({ value: a.account_no, label: `${a.account_code} - ${a.account_name}` })),
  );
  readonly selectedCurrency = computed(() => {
    this.currencyRevision();
    return this.currencies().find((c) => c.currency_no === this.currencyNo) ?? null;
  });
  readonly baseCurrency = computed(() => this.currencies().find((c) => Number(c.is_base_currency) === 1) ?? null);
  readonly currencyCode = computed(() => this.selectedCurrency()?.currency_code ?? this.baseCurrency()?.currency_code ?? 'BASE');
  readonly baseCurrencyCode = computed(() => this.baseCurrency()?.currency_code ?? 'BASE');
  readonly isBaseCurrencySelected = computed(() => {
    const selected = this.selectedCurrency();
    const base = this.baseCurrency();
    return !!selected && !!base && selected.currency_no === base.currency_no;
  });
  enteredDebit  = computed(() => this.lines().reduce((s, l) => s + (Number(l.dr_amount) || 0), 0));
  enteredCredit = computed(() => this.lines().reduce((s, l) => s + (Number(l.cr_amount) || 0), 0));
  enteredDifference = computed(() => this.enteredDebit() - this.enteredCredit());
  totalDebit  = computed(() => this.lines().reduce((s, l) => s + (Number(l.debit) || 0), 0));
  totalCredit = computed(() => this.lines().reduce((s, l) => s + (Number(l.credit) || 0), 0));
  difference  = computed(() => this.totalDebit() - this.totalCredit());
  isBalanced  = computed(() => Math.abs(this.difference()) < 0.005);
  canPost     = computed(() => this.validLines().length > 0 && this.isBalanced() && !this.isSaving());
  absoluteBaseDifference = computed(() => Math.abs(this.difference()));

  readonly lineColumns = computed<ColumnDef[]>(() => {
    this.currencyRevision();
    return [
      {
      title: 'Type',
      field: 'dr_cr',
      cellType: 'select',
      editable: (row) => Number(row['__uid']) !== this.firstLineUid(),
      options: this.drCrOptions,
      width: '120px',
      onChange: (_value, row) => this.normalizeRow(row),
    },
    {
      title: 'Account',
      field: 'account_no',
      cellType: 'select',
      editable: true,
      options: () => this.accountOptions(),
      minWidth: '280px',
      footerLabel: 'Total',
      onChange: (_value, row) => this.normalizeRow(row),
    },
    {
      title: this.enteredColumnTitle('Debit'),
      field: 'dr_amount',
      cellType: 'decimal',
      editable: (row) => row['dr_cr'] === 'dr',
      align: 'right',
      precision: 2,
      bottomTotal: true,
      minWidth: '140px',
      onChange: (_value, row) => this.normalizeRow(row),
    },
    {
      title: this.enteredColumnTitle('Credit'),
      field: 'cr_amount',
      cellType: 'decimal',
      editable: (row) => row['dr_cr'] === 'cr',
      align: 'right',
      precision: 2,
      bottomTotal: true,
      minWidth: '140px',
      onChange: (_value, row) => this.normalizeRow(row),
    },
    {
      title: this.baseColumnTitle('Debit Base'),
      field: 'debit',
      cellType: 'decimal',
      align: 'right',
      precision: 2,
      bottomTotal: true,
      minWidth: '150px',
    },
    {
      title: this.baseColumnTitle('Credit Base'),
      field: 'credit',
      cellType: 'decimal',
      align: 'right',
      precision: 2,
      bottomTotal: true,
      minWidth: '150px',
    },
    ];
  });
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search opening lines...',
    pagination: false,
    defaultPageSize: 12,
    pageSizeOptions: [12, 25, 50, 100],
    dense: true,
    striped: true,
    showColumnToggle: true,
    showExport: true,
    showTitle: false,
    minHeight: '16vh',
    maxHeight: '100%',
    showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.removeLine(row['__uid'] as number) }],
  };
  readonly lineData = computed(() => this.lines() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1004'); this.loadMasterData(); });
  }

  loadMasterData(): void {
    this.isLoading.set(true);
    forkJoin({ accounts: this.data.getAccounts(), currencies: this.data.getCurrencies() })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ accounts, currencies }) => {
          if (isSuccess(accounts) && accounts.data) this.accounts.set(accounts.data);
          if (isSuccess(currencies) && currencies.data) {
            this.currencies.set(currencies.data);
            const base = currencies.data.find((c) => Number(c.is_base_currency) === 1) ?? currencies.data[0] ?? null;
            this.currencyNo = base?.currency_no ?? null;
            this.exchangeRate = 1;
            this.refreshCurrencyDisplay();
          }
          if (!this.lines().length) this.addLine();
        },
        error: () => this.toastr.error('Failed to load opening balance setup data'),
      });
  }

  onCurrencyChange(selected?: CurrencyLookup | number): void {
    if (typeof selected === 'number') this.currencyNo = selected;
    else if (selected?.currency_no != null) this.currencyNo = selected.currency_no;
    this.refreshCurrencyDisplay();
    const currency = typeof selected === 'object' ? selected : this.selectedCurrency();
    if (!currency) {
      this.exchangeRate = 1;
      this.recalculateLines();
      return;
    }
    if (Number(currency.is_base_currency) === 1) {
      this.exchangeRate = 1;
      this.recalculateLines();
      return;
    }
    const rate = Number(currency.exchange_rate) || 0;
    this.exchangeRate = rate;
    this.recalculateLines();
    if (rate <= 0) this.toastr.warning(`No exchange rate found for ${currency.currency_code}`);
  }

  addLine(): void {
    if (this.lines().some((line) => !line.account_no)) {
      this.toastr.warning('Select an account before adding another row');
      return;
    }
    const side = this.nextLineSide();
    const amount = this.nextLineAmount(side);
    const line = this.createLine(side, amount);
    this.lines.update((ls) => [...ls, line]);
    this.focusLine(line.__uid);
  }

  removeLine(uid: number): void {
    this.lines.update((ls) => {
      const next = ls.filter((l) => l.__uid !== uid);
      if (!next.length) return [];
      return next.map((line, index) => index === 0 ? this.forceDebitLine(line) : line);
    });
    if (!this.lines().length) this.addLine();
  }

  onReset(): void {
    this.voucherDate = new Date().toISOString().split('T')[0];
    const base = this.baseCurrency() ?? this.currencies()[0] ?? null;
    this.currencyNo = base?.currency_no ?? null;
    this.exchangeRate = 1;
    this.refreshCurrencyDisplay();
    this.narration = '';
    this.lines.set([]);
    this.addLine();
  }

  post(): void {
    if (!this.currencyNo) { this.toastr.warning('Select a currency'); return; }
    if (!(Number(this.exchangeRate) > 0)) { this.toastr.warning('Enter a valid exchange rate'); return; }
    const validLines = this.validLines();
    if (validLines.length === 0) { this.toastr.warning('Enter at least one opening line'); return; }
    if (!this.isBalanced()) {
      this.toastr.error('Opening balance is out of balance. Total debit and total credit must be equal before posting.');
      return;
    }
    if (validLines.some((l) => !l.account_no)) { this.toastr.warning('Each opening line needs an account'); return; }
    const seen = new Set<number>();
    for (const line of validLines) {
      if (!line.account_no) continue;
      if (seen.has(line.account_no)) { this.toastr.warning('Each account can appear once'); return; }
      seen.add(line.account_no);
    }
    this.alert.confirm('Post these balanced opening balances as one Opening voucher?', 'Post Opening Balances', 'primary')
      .subscribe((ok) => { if (ok) this.doPost(); });
  }

  normalizeRow(row: Record<string, unknown>): void {
    const uid = Number(row['__uid']);
    const accountNo = row['account_no'] == null ? null : Number(row['account_no']);
    const account = this.accounts().find((a) => a.account_no === accountNo);
    const drCr = uid === this.firstLineUid() ? 'dr' : row['dr_cr'] === 'cr' ? 'cr' : 'dr';
    const drAmount = drCr === 'dr' ? Math.max(0, Number(row['dr_amount']) || 0) : 0;
    const crAmount = drCr === 'cr' ? Math.max(0, Number(row['cr_amount']) || 0) : 0;
    const rate = Number(this.exchangeRate) > 0 ? Number(this.exchangeRate) : 0;
    const debit = this.roundMoney(drAmount * rate);
    const credit = this.roundMoney(crAmount * rate);
    const next: WorkingLine = {
      __uid: uid,
      dr_cr: drCr,
      account_no: accountNo,
      account_code: account?.account_code,
      account_name: account?.account_name,
      dr_amount: drAmount,
      cr_amount: crAmount,
      debit,
      credit,
    };
    this.lines.update((ls) => ls.map((l) => l.__uid === uid ? next : l));
  }

  recalculateLines(): void {
    this.lines.update((ls) => ls.map((l) => {
      const rate = Number(this.exchangeRate) > 0 ? Number(this.exchangeRate) : 1;
      const baseDebit = l.dr_cr === 'dr' ? Math.max(0, Number(l.debit) || 0) : 0;
      const baseCredit = l.dr_cr === 'cr' ? Math.max(0, Number(l.credit) || 0) : 0;
      return {
        ...l,
        dr_amount: this.roundMoney(baseDebit / rate),
        cr_amount: this.roundMoney(baseCredit / rate),
        debit: baseDebit,
        credit: baseCredit,
      };
    }));
  }

  private doPost(): void {
    const lines = this.validLines();
    this.isSaving.set(true);
    this.data.post({
      voucher_date: this.voucherDate,
      currency_no: this.currencyNo,
      exchange_rate: Number(this.exchangeRate),
      narration: this.narration || undefined,
      lines: lines.map((l) => ({
        account_no: l.account_no,
        dr_cr: l.dr_cr,
        amount: l.dr_cr === 'dr' ? l.dr_amount : l.cr_amount,
        amount_base: l.dr_cr === 'dr' ? l.debit : l.credit,
        debit: l.debit,
        credit: l.credit,
      })),
    }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(`Opening balances posted as ${res.data.voucher_id}`);
          this.lines.set([]); this.addLine(); this.narration = '';
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to post opening balances'),
    });
  }

  validLines(): WorkingLine[] {
    return this.lines().filter((l) => !!l.account_no && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
  }

  private createLine(side: DebitCreditValue, amount: number): WorkingLine {
    const cleanAmount = this.roundMoney(Math.max(0, Number(amount) || 0));
    const rate = Number(this.exchangeRate) > 0 ? Number(this.exchangeRate) : 0;
    const drAmount = side === 'dr' ? cleanAmount : 0;
    const crAmount = side === 'cr' ? cleanAmount : 0;
    return {
      __uid: ++this.uid,
      dr_cr: side,
      account_no: null,
      dr_amount: drAmount,
      cr_amount: crAmount,
      debit: this.roundMoney(drAmount * rate),
      credit: this.roundMoney(crAmount * rate),
    };
  }

  private forceDebitLine(line: WorkingLine): WorkingLine {
    const baseAmount = Number(line.debit) || Number(line.credit) || 0;
    const rate = Number(this.exchangeRate) > 0 ? Number(this.exchangeRate) : 1;
    return {
      ...line,
      dr_cr: 'dr',
      dr_amount: this.roundMoney(Math.max(0, baseAmount) / rate),
      cr_amount: 0,
      debit: this.roundMoney(Math.max(0, baseAmount)),
      credit: 0,
    };
  }

  private firstLineUid(): number | null {
    return this.lines()[0]?.__uid ?? null;
  }

  private nextLineSide(): DebitCreditValue {
    const lines = this.lines();
    if (!lines.length) return 'dr';
    const diff = this.difference();
    if (Math.abs(diff) < 0.005) return 'dr';
    return diff > 0 ? 'cr' : 'dr';
  }

  private nextLineAmount(side: DebitCreditValue): number {
    const diff = this.difference();
    if (Math.abs(diff) < 0.005) return 0;
    const rate = Number(this.exchangeRate) > 0 ? Number(this.exchangeRate) : 1;
    const neededBase = side === 'cr' ? Math.max(0, diff) : Math.max(0, -diff);
    return this.roundMoney(neededBase / rate);
  }

  private roundMoney(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  private focusLine(uid: number): void {
    setTimeout(() => {
      const index = this.lines().findIndex((line) => line.__uid === uid);
      const line = this.lines()[index];
      const table = this.lineTable();
      if (index >= 0 && line && table) {
        table.startRowEdit(line as unknown as Record<string, unknown>, index);
      }
    });
  }

  private enteredColumnTitle(label: string): string {
    return `${label} (${this.currencySymbol()})`;
  }

  private baseColumnTitle(label: string): string {
    return label;
  }

  currencyLabel(currency: CurrencyLookup): string {
    const symbol = currency.currency_symbol ? ` (${currency.currency_symbol})` : '';
    return `${currency.currency_code}${symbol} - ${currency.currency_name}`;
  }

  private currencySymbol(): string {
    return this.selectedCurrency()?.currency_symbol || this.currencyCode();
  }

  private refreshCurrencyDisplay(): void {
    this.currencyRevision.update((v) => v + 1);
  }
}
