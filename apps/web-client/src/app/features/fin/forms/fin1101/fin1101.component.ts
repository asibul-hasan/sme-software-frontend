import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  computed,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import {
  CommonTableComponent,
  ColumnDef,
  SelectOption,
  TableConfig,
} from '../../../../shared/components/common-table';
import {
  Fin1101ModelService,
  Voucher,
  VoucherLine,
} from './services/model.service';
import { Fin1101DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { finConstants } from '../../constants/fin.constants';
import { debitCreditOptions } from '../../../../core/constants/common-options.constants';

import { PdfTemplateService } from '../../../../shared/pdf-templates';
import {
  buildVoucherReportContext,
  VoucherReportContext,
} from '../../report-templates';
import { pdfReportTemplate } from '../../../../shared/pdf-templates';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1101',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
    CommonTableComponent,
    AppDatePickerComponent,
  ],
  providers: [Fin1101ModelService, Fin1101DataService],
  templateUrl: './fin1101.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Fin1101Component implements OnInit {
  public model = inject(Fin1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private pdfService = inject(PdfTemplateService);
  private authContext = inject(AuthContextService);
  readonly lineTable = viewChild(CommonTableComponent);

  readonly statusOptions = finConstants.voucherStatuses;
  readonly drCrOptions: SelectOption[] = debitCreditOptions.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  readonly accountOptions = computed<SelectOption[]>(() =>
    this.model.postableAccounts().map((a) => ({
      value: a.account_no,
      label: `${a.account_code} - ${a.account_name}`,
    })),
  );

  readonly lineColumns = computed<ColumnDef[]>(() => [
    {
      title: 'Type',
      field: 'dr_cr',
      cellType: 'select',
      editable: this.editable,
      options: this.drCrOptions,
      width: '100px',
      onChange: (_value, row) => this.updateLine(row),
    },
    {
      title: 'Account',
      field: 'account_no',
      cellType: 'select',
      editable: this.editable,
      options: () => this.accountOptions(),
      minWidth: '260px',
      footerLabel: 'Total',
      onChange: (_value, row) => this.updateLine(row),
    },
    {
      title: 'Narration',
      field: 'line_narration',
      cellType: 'text',
      editable: this.editable,
      minWidth: '220px',
      onChange: (_value, row) => this.updateLine(row),
    },
    {
      title: `Debit (${this.model.currencySymbol()})`,
      field: 'debit_fc',
      cellType: 'decimal',
      editable: (row) => this.editable && row['dr_cr'] === 'dr',
      align: 'right',
      precision: this.model.selectedCurrency()?.decimal_places ?? 2,
      bottomTotal: true,
      onChange: (_value, row) => this.updateLine(row),
    },
    {
      title: `Credit (${this.model.currencySymbol()})`,
      field: 'credit_fc',
      cellType: 'decimal',
      editable: (row) => this.editable && row['dr_cr'] === 'cr',
      align: 'right',
      precision: this.model.selectedCurrency()?.decimal_places ?? 2,
      bottomTotal: true,
      onChange: (_value, row) => this.updateLine(row),
    },
    {
      title: 'Debit Base',
      field: 'debit',
      cellType: 'decimal',
      align: 'right',
      precision: this.model.baseCurrency()?.decimal_places ?? 2,
      bottomTotal: true,
      minWidth: '130px',
    },
    {
      title: 'Credit Base',
      field: 'credit',
      cellType: 'decimal',
      align: 'right',
      precision: this.model.baseCurrency()?.decimal_places ?? 2,
      bottomTotal: true,
      minWidth: '130px',
    },
  ]);
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search voucher lines...',
    pagination: false,
    dense: true,
    striped: true,
    showColumnToggle: true,
    showExport: true,
    showTitle: false,
    minHeight: '20vh',
    maxHeight: '100%',
    showActions: true,
    actions: [
      {
        type: 'delete',
        icon: 'delete',
        tooltip: 'Remove',
        variant: 'danger',
        disabled: () => !this.editable,
        onClick: (row) => this.model.removeLine(row['__uid'] as number),
      },
    ],
  };
  readonly lineData = computed(
    () => this.model.lines() as unknown as Record<string, unknown>[],
  );

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('FIN_1101');
      this.model.loadLookups();
    });
  }

  onSearchTermChange(v: string): void {
    this.model.searchTerm.set(v);
    this.model.pager.reset();
  }
  get formdata() {
    return this.model.form;
  }
  get status(): number {
    return this.model.status();
  }
  get editable(): boolean {
    return this.model.isDraft();
  }

  onSave(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }
  onReset(): void {
    const o = this.model
      .vouchers()
      .find((v) => v.voucher_no === this.model.selectedNo());
    if (o) this.model.select(o);
    else this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
  select(item: Voucher): void {
    this.model.select(item);
  }

  addLine(): void {
    const uid = this.model.addBlankLine();
    if (uid == null) return;
    setTimeout(() => {
      const index = this.model.lines().findIndex((line) => line.__uid === uid);
      const line = this.model.lines()[index];
      const table = this.lineTable();
      if (index >= 0 && line && table)
        table.startRowEdit(line as unknown as Record<string, unknown>, index);
    });
  }
  updateLine(row: Record<string, unknown>): void {
    this.model.updateLine(row as unknown as VoucherLine);
  }

  submit(): void {
    this.alertService
      .confirm(
        'Submit this voucher for posting? Auto-posts to the ledger when no approval workflow is configured.',
        'Submit Voucher',
        'primary',
      )
      .subscribe((ok) => {
        if (ok) this.model.doAction('submit');
      });
  }
  approve(): void {
    this.model.doAction('approve');
  }
  reject(): void {
    this.model.doAction('reject');
  }
  cancel(): void {
    this.alertService
      .confirm(
        'Cancel this voucher? A posted voucher will be reversed in the ledger.',
        'Cancel Voucher',
        'warn',
      )
      .subscribe((ok) => {
        if (ok) this.model.doAction('cancel');
      });
  }

  statusLabel(v: number): string {
    return this.statusOptions.find((s) => s.value === v)?.label ?? String(v);
  }
  statusClass(v: number): string {
    return v === 2
      ? 'list-item-tag--primary'
      : v === 3
        ? 'list-item-tag--warning'
        : '';
  }

  // ── PDF Voucher Print ─────────────────────────────────────────────────────
  readonly voucherPdfContext = computed<VoucherReportContext | null>(() => {
    const cur = this.model.current();
    if (!cur) return null;
    const currency = this.model.selectedCurrency();
    return {
      voucher_no: cur.voucher_id ?? String(cur.voucher_no),
      voucher_date: cur.voucher_date ?? '',
      voucher_type_name: cur.voucher_type_name ?? 'Journal',
      voucher_narration: cur.narration ?? '',
      currency_name: currency
        ? currency.currency_symbol
          ? `${currency.currency_code} (${currency.currency_symbol})`
          : currency.currency_code
        : 'BDT',
      company_name: this.authContext.user()?.company_name ?? 'Company',
      ref_no: cur.reference_no ?? '',
      total_amount: cur.total_debit ?? cur.total_credit ?? 0,
      rows: this.model.validLines(this.model.lines()).map((l) => ({
        gl_code: l.account_code ?? '',
        gl_name: l.account_name ?? '',
        description: l.line_narration ?? '',
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      })),
    };
  });

  async printVoucher(): Promise<void> {
    const ctx = this.voucherPdfContext();
    if (!ctx) return;
    const reportCtx = buildVoucherReportContext(ctx);
    await this.pdfService.render(pdfReportTemplate, reportCtx);
  }
}
