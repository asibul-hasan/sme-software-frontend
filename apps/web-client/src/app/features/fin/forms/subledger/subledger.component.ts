import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { SubLedgerDataService, SubLedgerRecon, SubLedgerPartyRow } from './services/data.service';
import { SubLedgerStatementDialogComponent } from './components/statement-dialog/statement-dialog.component';

/**
 * FIN_1202 (Accounts Payable) and FIN_1203 (Accounts Receivable).
 *
 * One component serves both. AR and AP are the same reconciliation with the sign
 * flipped — the backend already models them that way (one service, a party-type
 * argument), and two copies of this screen would drift apart the first time either
 * one was touched. The routes stay separate, so each form keeps its own menu entry
 * and its own permission: `X-Form-Id` is resolved from the URL, not from here.
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin-subledger',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [SubLedgerDataService],
  templateUrl: './subledger.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class SubLedgerComponent implements OnInit {
  public permissionService = inject(FormPermissionService);
  private route  = inject(ActivatedRoute);
  private data   = inject(SubLedgerDataService);
  private dialog = inject(DialogService);
  private toastr = inject(ToastrService);

  /** 1 = customer (AR / FIN_1203), 2 = supplier (AP / FIN_1202). */
  readonly partyType: number = this.route.snapshot.data['partyType'] ?? 2;
  readonly formId: string = this.route.snapshot.data['formId'] ?? 'FIN_1202';
  private readonly formSegment = this.formId.toLowerCase().replace('_', '');

  readonly isAr = this.partyType === 1;
  readonly title = this.isAr ? 'Accounts Receivable' : 'Accounts Payable';
  readonly subtitle = this.isAr
    ? 'Customer sub-ledger against the AR control account'
    : 'Supplier sub-ledger against the AP control account';
  readonly partyLabel = this.isAr ? 'Customer' : 'Supplier';

  recon     = signal<SubLedgerRecon | null>(null);
  isLoading = signal(false);
  asOf      = new Date().toISOString().split('T')[0];

  rows = computed<SubLedgerPartyRow[]>(() => this.recon()?.rows ?? []);

  subLedgerTotal = computed(() => Number(this.recon()?.subledger_total ?? 0));
  glControlTotal = computed(() => Number(this.recon()?.gl_control_total ?? 0));
  unattributed   = computed(() => Number(this.recon()?.unattributed_gl ?? 0));
  difference     = computed(() => Number(this.recon()?.difference ?? 0));
  noControl      = computed(() => this.recon()?.no_control_account === true);

  /** Rounding noise is not a reconciliation break; a whole unit of currency is. */
  readonly isReconciled = computed(() => Math.abs(this.difference()) < 0.01);

  mismatchCount = computed(() => this.rows().filter((r) => Math.abs(Number(r.difference)) >= 0.01).length);

  readonly gridConfig: GridConfig<SubLedgerPartyRow> = {
    gridKey: 'FIN_SUBLEDGER_RECON_GRID',
    rowIdField: 'party_no',
    selectionMode: 'single',
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    toolbar: {
      title: 'By Party',
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search parties...',
    },
    columns: [
      GridColumns.text<SubLedgerPartyRow>('party_name', 'Party').flex(1).minWidth(180).build(),
      GridColumns.decimal<SubLedgerPartyRow>('subledger_balance', 'Sub-ledger').sum().build(),
      GridColumns.decimal<SubLedgerPartyRow>('gl_balance', 'General Ledger').sum().build(),
      GridColumns.decimal<SubLedgerPartyRow>('difference', 'Difference').sum().build(),
    ],
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions(this.formId);
      this.load();
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.data
      .reconciliation(this.formSegment, this.asOf)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) this.recon.set(res.data);
          else this.toastr.error(res.message || 'Failed to load reconciliation');
        },
        error: (err) => this.toastr.error(err?.error?.message || 'Failed to load reconciliation'),
      });
  }

  /** A difference is only actionable once you can see which documents caused it. */
  openStatement(row: SubLedgerPartyRow): void {
    this.dialog.open(SubLedgerStatementDialogComponent, {
      size: 'xl',
      data: {
        formSegment: this.formSegment,
        partyNo: row.party_no,
        partyName: row.party_name,
        partyLabel: this.partyLabel,
        asOf: this.asOf,
      },
    });
  }
}
