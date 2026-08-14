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
import { ErpGridComponent, GridConfig, GridColumns, GridLookupOption } from '../../../../shared/ag-grid';
import { sysConstants } from '../../../sys/constants/sys.constants';
import {
  Fin1101ModelService,
  Voucher,
  VoucherLine,
} from './services/model.service';
import { Fin1101DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { finConstants, SelectOption } from '../../constants/fin.constants';
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
    ErpGridComponent,
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

  readonly gridConfig: GridConfig<VoucherLine> = {
    gridKey: 'FIN_1101_VOUCHER_LINE_GRID',
    rowIdField: '__uid',
    selectionMode: 'single',
    autoSelectFirstRow: true,
    externalRowState: true,
    showPagination: false,
    canAdd: () => this.editable && this.permissionService.canInsert(),
    canEdit: () => this.editable && this.permissionService.canUpdate(),
    canDeleteRow: () => this.editable && this.permissionService.canDelete(),
    toolbar: {
      title: 'Voucher Lines',
      showAdd: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search voucher lines...',
    },
    columns: [
      GridColumns.select<VoucherLine>('dr_cr', 'Type', this.drCrOptions)
        .width(100)
        .build(),
      GridColumns.lookup<VoucherLine>('account_no', 'Account', () => this.accountOptions())
        .flex(1)
        .minWidth(260)
        .footer('Total')
        .build(),
      GridColumns.select<VoucherLine>('tax_type', 'VAT/Tax', sysConstants.taxTypes as GridLookupOption[])
        .width(150)
        .build(),
      GridColumns.text<VoucherLine>('line_narration', 'Narration')
        .flex(1)
        .minWidth(220)
        .build(),
      GridColumns.decimal<VoucherLine>('debit_fc', `Debit (${this.model.currencySymbol()})`)
        .editable((row) => this.editable && row['dr_cr'] === 'dr')
        .sum()
        .build(),
      GridColumns.decimal<VoucherLine>('credit_fc', `Credit (${this.model.currencySymbol()})`)
        .editable((row) => this.editable && row['dr_cr'] === 'cr')
        .sum()
        .build(),
      GridColumns.decimal<VoucherLine>('debit', 'Debit Base')
        .sum()
        .width(130)
        .build(),
      GridColumns.decimal<VoucherLine>('credit', 'Credit Base')
        .sum()
        .width(130)
        .build(),
      GridColumns.action<VoucherLine>().build(),
    ],
  };

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
    this.model.addBlankLine();
  }
  onRowChange(row: VoucherLine): void {
    this.updateLine(row as any);
  }
  onRowRemove(row: VoucherLine): void {
    this.model.removeLine(row.__uid);
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
