import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../../../shared/components/date-picker';
import { isSuccess } from '../../../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { SubLedgerDataService, SubLedgerStatement, SubLedgerStatementRow } from '../../services/data.service';

export interface StatementDialogData {
  formSegment: string;
  partyNo: number;
  partyName: string;
  partyLabel: string;
  /** The reconciliation's as-of date, used as the statement's end date. */
  asOf: string;
}

/** Movements behind one party's balance — the drill-down from FIN_1202 / FIN_1203. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subledger-statement-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ErpGridComponent, AppDatePickerComponent],
  providers: [SubLedgerDataService],
  templateUrl: './statement-dialog.component.html',
})
export class SubLedgerStatementDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SubLedgerStatementDialogComponent>);
  private data = inject(SubLedgerDataService);
  private toastr = inject(ToastrService);

  // Injected as a field, not a constructor parameter: `toDate` below seeds itself from it, and a
  // parameter property is not assigned until after field initializers have already run.
  public dlg = inject<StatementDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  statement = signal<SubLedgerStatement | null>(null);
  isLoading = signal(false);

  /** Opens on the last 90 days — long enough to hold the documents that explain a balance. */
  fromDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  toDate = this.dlg?.asOf ?? new Date().toISOString().split('T')[0];

  rows = computed<SubLedgerStatementRow[]>(() => this.statement()?.rows ?? []);
  opening = computed(() => Number(this.statement()?.opening_balance ?? 0));
  closing = computed(() => Number(this.statement()?.closing_balance ?? 0));

  readonly gridConfig: GridConfig<SubLedgerStatementRow> = {
    gridKey: 'FIN_SUBLEDGER_STATEMENT_GRID',
    height: '55vh',
    showPagination: true,
    pageSize: 50,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.date<SubLedgerStatementRow>('txn_date', 'Date').width(120).build(),
      GridColumns.text<SubLedgerStatementRow>('ref_doc_no', 'Document').width(160).build(),
      GridColumns.decimal<SubLedgerStatementRow>('debit', 'Debit').sum().build(),
      GridColumns.decimal<SubLedgerStatementRow>('credit', 'Credit').sum().build(),
      // Running balance is a position, not a quantity — summing a column of them is meaningless.
      GridColumns.decimal<SubLedgerStatementRow>('running_balance', 'Balance').build(),
      GridColumns.text<SubLedgerStatementRow>('remarks', 'Remarks').flex(1).minWidth(160).build(),
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.dlg) return;
    this.isLoading.set(true);
    this.data
      .statement(this.dlg.formSegment, this.dlg.partyNo, this.fromDate, this.toDate)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) this.statement.set(res.data);
          else this.toastr.error(res.message || 'Failed to load statement');
        },
        error: (err) => this.toastr.error(err?.error?.message || 'Failed to load statement'),
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
