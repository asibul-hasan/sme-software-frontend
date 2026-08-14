import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1102DataService, BankAccount, ReconLine } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1102',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Fin1102DataService],
  templateUrl: './fin1102.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1102Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1102DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  bankAccounts = signal<BankAccount[]>([]);
  lines        = signal<ReconLine[]>([]);
  bookBalance  = signal(0);
  loaded       = signal(false);
  isLoading    = signal(false);
  isSaving     = signal(false);

  accountNo: number | null = null;
  statementDate = this.formatLocalDate(new Date());
  fromDate = this.formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  toDate = this.statementDate;
  lineStatus: 'pending' | 'reconciled' | 'all' = 'pending';
  statementBalance: number | null = null;
  narration = '';

  clearedLines    = computed(() => this.lines().filter((l) => l.cleared));
  newlyClearedLines = computed(() => this.lines().filter((l) => l.cleared && !l.reconciled));
  clearedBalance  = computed(() => this.clearedLines().reduce((s, l) => s + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0));
  pendingCount    = computed(() => this.lines().filter((l) => !l.reconciled).length);
  reconciledCount = computed(() => this.lines().filter((l) => l.reconciled).length);
  difference      = computed(() => (Number(this.statementBalance) || 0) - this.bookBalance());

  readonly gridConfig: GridConfig<ReconLine> = {
    gridKey: 'FIN_1102_BANK_RECON_GRID',
    rowIdField: 'ledger_no',
    selectionMode: 'single',
    autoSelectFirstRow: true,
    showPagination: true,
    pageSize: 25,
    canAdd: () => false,
    canEdit: () => true,
    canDeleteRow: () => false,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.text<ReconLine>('cleared', 'Status')
        .width(120)
        .align('center')
        .cellRenderer((params) => {
          if (params.data?.reconciled) return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Reconciled</span>`;
          if (params.data?.cleared) return `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">Selected</span>`;
          return `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Pending</span>`;
        })
        .build(),
      GridColumns.text<ReconLine>('voucher_id', 'Voucher').width(150).build(),
      GridColumns.number<ReconLine>('voucher_no', 'Voucher No').width(120).build(),
      GridColumns.date<ReconLine>('voucher_date', 'Voucher Date').width(140).build(),
      GridColumns.date<ReconLine>('bank_date', 'Bank Date').width(140).editable((row) => !row.reconciled).build(),
      GridColumns.text<ReconLine>('reference_no', 'Reference').width(150).build(),
      GridColumns.text<ReconLine>('narration', 'Narration').minWidth(240).build(),
      GridColumns.decimal<ReconLine>('debit', 'Debit').sum().build(),
      GridColumns.decimal<ReconLine>('credit', 'Credit').sum().build(),
      {
        field: '__actions',
        headerName: '',
        width: 60,
        pinned: 'right',
        sortable: false,
        filterable: false,
        cellRenderer: (params) => {
          if (params.data && !params.data.reconciled) {
            const btn = document.createElement('button');
            btn.className = 'btn-action btn-new';
            btn.title = params.data.cleared ? 'Uncheck' : 'Check Cleared';
            btn.style.padding = '4px';
            btn.innerHTML = `<span class="material-icons text-primary" style="font-size:18px;">${params.data.cleared ? 'check_box' : 'check_box_outline_blank'}</span>`;
            btn.onclick = (e) => {
              e.stopPropagation();
              this.toggle(params.data.ledger_no);
            };
            return btn;
          }
          return '';
        }
      }
    ]
  };

  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1102'); this.loadBankAccounts(); });
  }

  loadBankAccounts(): void {
    this.data.getBankAccounts().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.bankAccounts.set(res.data); },
      error: () => this.toastr.error('Failed to load bank accounts'),
    });
  }

  loadWorksheet(): void {
    if (!this.accountNo) { this.toastr.warning('Select a bank account'); return; }
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) { this.toastr.warning('From date cannot be after to date'); return; }
    this.isLoading.set(true);
    this.data.getWorksheet(this.accountNo, this.statementDate, this.fromDate, this.toDate, this.lineStatus).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.bookBalance.set(Number(res.data.book_balance) || 0);
          this.lines.set((res.data.lines ?? []).map((l) => ({ ...l, bank_date: l.bank_date || l.voucher_date, cleared: !!l.cleared })));
          this.loaded.set(true);
        }
      },
      error: () => this.toastr.error('Failed to load worksheet'),
    });
  }

  toggle(ledgerNo: number): void {
    this.lines.update((ls) => ls.map((l) => {
      if (l.ledger_no !== ledgerNo || l.reconciled) return l;
      const cleared = !l.cleared;
      return { ...l, cleared, bank_date: l.bank_date || l.voucher_date };
    }));
  }

  onRowChange(row: ReconLine): void {
    if (row.ledger_no && !row.reconciled) {
      this.updateBankDate(row.ledger_no, String(row.bank_date || row.voucher_date || ''));
    }
  }

  updateBankDate(ledgerNo: number, bankDate: string): void {
    this.lines.update((ls) => ls.map((l) => l.ledger_no === ledgerNo && !l.reconciled ? { ...l, bank_date: bankDate || l.voucher_date } : l));
  }

  save(): void {
    if (!this.accountNo) { this.toastr.warning('Select a bank account'); return; }
    if (this.statementBalance === null || this.statementBalance === undefined) { this.toastr.warning('Enter the statement balance'); return; }
    if (this.newlyClearedLines().length === 0) { this.toastr.warning('Select at least one pending line to reconcile'); return; }
    this.alert.confirm('Save this reconciliation? Ticked lines are marked cleared and won\'t reappear on future worksheets.', 'Save Reconciliation', 'primary')
      .subscribe((ok) => { if (ok) this.doSave(); });
  }

  private doSave(): void {
    this.isSaving.set(true);
    this.data.save({
      account_no: this.accountNo!,
      statement_date: this.statementDate,
      statement_balance: Number(this.statementBalance) || 0,
      narration: this.narration || undefined,
      cleared_lines: this.newlyClearedLines().map((l) => ({ ledger_no: l.ledger_no, bank_date: l.bank_date || l.voucher_date })),
    }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(`Reconciliation ${res.data.bank_recon_id} saved`);
          this.loadWorksheet();
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to save reconciliation'),
    });
  }
}
