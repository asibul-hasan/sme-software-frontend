import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, effect, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { activeStatusOptions, sysNumberSystemOptions } from '../../../../core/constants/common-options.constants';
import { Sys1004ModelService, CurrencyLookup } from './services/model.service';
import { Sys1004DataService } from './services/data.service';
import { Sys1006ModelService, IExchangeRate } from '../sys1006/services/model.service';
import { Sys1006DataService } from '../sys1006/services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ColumnDef, TableConfig, statusBadge } from '../../../../shared/components/common-table';
import { CurrencySettingsService } from '../../../../core/services/currency-settings.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1004',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Sys1004ModelService, Sys1004DataService, Sys1006ModelService, Sys1006DataService, DatePipe],
  templateUrl: './sys1004.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sys1004Component implements OnInit {
  public model             = inject(Sys1004ModelService);
  public rateModel         = inject(Sys1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);
  public dialog            = inject(MatDialog);
  private el               = inject(ElementRef);
  public currencySettings = inject(CurrencySettingsService);

  constructor() {
    // Scroll the selected sidebar item into view whenever selection changes.
    effect(() => {
      this.model.selectedCurrencyNo(); // reactive dependency
      setTimeout(() => {
        this.el.nativeElement
          .querySelector('.list-group-item.active')
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    });

    // ng-select resolves the displayed label by searching `items` at the moment
    // `writeValue` is called.  When `loadCurrencies()` and `rateModel.loadList()`
    // run concurrently the exchange-rate list often resolves first — ng-select
    // receives writeValue(8) while items is still [].  Re-writing the same value
    // after items arrive forces ng-select to re-evaluate and show the label.
    effect(() => {
      const options = this.rateCurrencyLookup();   // track signal
      if (options.length === 0) return;            // items not ready yet
      const ctrl = this.rateModel.form?.get('currency_no');
      const current = ctrl?.value;
      if (current != null) {
        ctrl!.setValue(current, { emitEvent: false });
      }
    });
  }

  readonly numberSystemOptions = sysNumberSystemOptions;
  readonly activeStatusOptions = activeStatusOptions;

  // ── Tab state ─────────────────────────────────────────────────────────────
  activeTab = signal<'currency' | 'exchange-rates'>('currency');

  // ── Non-base currencies for exchange-rate dropdown ────────────────────────
  // Derives from the already-loaded currency list — no extra HTTP call needed.
  // The base currency is excluded because its rate is always 1 and is managed
  // directly on the Currency Setup tab.
  /** Placeholder for the Rate input — "0.00", "0.000", etc. based on base-currency precision. */
  ratePlaceholder = computed(() => {
    const p = this.currencySettings.baseCurrency()?.decimal_places ?? 2;
    return '0.' + '0'.repeat(p);
  });

  rateCurrencyLookup = computed(() =>
    this.model.currencies()
      .filter((c) => c.is_base_currency !== 1)
      .map((c) => ({
        value: c.currency_no,
        label: `${c.currency_code} — ${c.currency_name}`,
      })),
  );

  // ── Exchange-rate table ───────────────────────────────────────────────────
  // Sorted newest-first; adds `status_derived` + computes `currency_label`
  // from the loaded currency list (API may not include it).
  rateTableData = computed(() => {
    const today = new Date().toISOString().split('T')[0];

    // Build a lookup map: currency_no → "CODE — Name"
    const currencyMap = new Map(
      this.model.currencies().map(c => [
        c.currency_no,
        `${c.currency_code} — ${c.currency_name}`,
      ]),
    );

    const sorted = [...this.rateModel.items()].sort(
      (a, b) => new Date(b.rate_date).getTime() - new Date(a.rate_date).getTime(),
    );
    const currentSet = new Set<number>();
    return sorted.map((item) => {
      const effective = item.rate_date <= today;
      const isCurrent =
        item.is_active === 1 && effective && !currentSet.has(item.currency_no);
      if (isCurrent) currentSet.add(item.currency_no);
      return {
        ...item,
        // Prefer the label resolved from the loaded currencies list; fall back
        // to whatever the API returned (may be null / absent).
        currency_label: currencyMap.get(item.currency_no) ?? item.currency_label ?? '',
        status_derived: isCurrent ? 'current' : item.is_active === 1 ? 'active' : 'inactive',
      } as unknown as Record<string, unknown>;
    });
  });

  // Rate column precision follows the base-currency decimal_places setting so
  // it stays consistent with the rest of the ERP.  Using computed() means it
  // reacts live if the user changes the base currency in this very form.
  rateTableColumns = computed<ColumnDef[]>(() => {
    const precision = this.currencySettings.baseCurrency()?.decimal_places ?? 2;
    return [
      { title: 'Currency',  field: 'currency_label',  cellType: 'text',    sort: true },
      { title: 'Rate Date', field: 'rate_date',        cellType: 'date',    dateFormat: 'dd/MM/yyyy', sort: true },
      { title: 'Rate',      field: 'rate',             cellType: 'decimal', precision, align: 'right', sort: true },
      {
        title: 'Status', field: 'status_derived', cellType: 'badge', sort: false, width: '110px',
        badgeConfig: statusBadge,
      },
    ];
  });

  rateTableConfig: Partial<TableConfig> = {
    showSearch:        false,
    showExport:        false,   // no export bar — this is an embedded form table
    showColumnToggle:  false,   // no column-toggle button
    showActions:       false,   // no auto Actions column — rowClick handles selection
    pagination:        true,
    defaultPageSize:   10,
    dense:             true,
    striped:           true,
  };

  ngOnInit(): void {
    this.model.initForm();
    this.rateModel.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('SYS_1004');
      this.model.loadBranches();
      this.model.loadCurrencies();
      // Exchange-rate list loads independently; currency dropdown is derived
      // from model.currencies() — no separate getCurrencies() call needed.
      this.rateModel.loadList();
    });
  }

  // ── Expose form to template ───────────────────────────────────────────────
  get formdata() { return this.model.form; }

  // ── Unified tab-aware action handlers ────────────────────────────────────
  onTabSave(): void   { this.activeTab() === 'currency' ? this.onSave()   : this.onSaveRate(); }
  onTabNew(): void    { this.activeTab() === 'currency' ? this.onNew()    : this.rateModel.onNew(); }
  onTabReset(): void  { this.activeTab() === 'currency' ? this.onReset()  : this.onRateReset(); }
  onTabDelete(): void { this.activeTab() === 'currency' ? this.onDelete() : this.onDeleteRate(); }

  onTabSearchChange(val: string): void {
    if (this.activeTab() === 'currency') {
      this.model.searchTerm.set(val);
      this.model.pager.reset();
    } else {
      this.rateModel.searchTerm.set(val);
      this.rateModel.pager.reset();
    }
  }

  // ── Currency tab ─────────────────────────────────────────────────────────
  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedCurrencyNo()) {
      const original = this.model
        .currencies()
        .find((c) => c.currency_no === this.model.selectedCurrencyNo());
      if (original) this.model.selectCurrency(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedCurrencyNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectCurrency(currency: CurrencyLookup, index?: number): void {
    this.model.selectCurrency(currency, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  viewRateHistory(): void {
    const code = this.model.form.get('currency_code')?.value ?? '';
    this.model.viewRateHistory(code);
  }

  // ── Exchange-rate tab ─────────────────────────────────────────────────────
  onSaveRate(): void { this.rateModel.onSave(); }

  onRateReset(): void {
    const no   = this.rateModel.selectedNo();
    const item = this.rateModel.items().find((x) => x.exchange_rate_no === no);
    item ? this.rateModel.select(item) : this.rateModel.onNew();
  }

  onDeleteRate(): void {
    if (!this.rateModel.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this exchange rate?').subscribe((ok) => {
      if (ok) this.rateModel.onDelete();
    });
  }

  onRateRowClick(row: Record<string, unknown>): void {
    this.rateModel.select(row as unknown as IExchangeRate);
  }
}
