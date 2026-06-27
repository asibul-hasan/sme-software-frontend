import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1102DataService, BankAccount, ReconLine } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1102',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1102DataService],
  templateUrl: './fin1102.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
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

  readonly columns: ColumnDef[] = [
    { title: 'Status', field: 'cleared', cellType: 'badge', width: '120px',
      value: (r) => (r['reconciled'] ? 'Reconciled' : r['cleared'] ? 'Selected' : 'Pending'),
      badgeConfig: (_v, r) => r['reconciled']
        ? { label: 'Reconciled', variant: 'success' }
        : r['cleared']
          ? { label: 'Selected', variant: 'primary' }
          : { label: 'Pending', variant: 'neutral' } },
    { title: 'Voucher', field: 'voucher_id', sort: true, cellType: 'text', width: '150px' },
    { title: 'Voucher No', field: 'voucher_no', sort: true, cellType: 'number', width: '120px' },
    { title: 'Voucher Date', field: 'voucher_date', sort: true, cellType: 'date', dateFormat: 'dd MMM yyyy', width: '140px' },
    { title: 'Bank Date', field: 'bank_date', sort: true, cellType: 'date', editable: (row) => !row['reconciled'], width: '140px',
      onChange: (value, row) => this.updateBankDate(row['ledger_no'] as number, String(value || row['voucher_date'] || '')) },
    { title: 'Reference', field: 'reference_no', cellType: 'text', width: '150px' },
    { title: 'Narration', field: 'narration', cellType: 'text', minWidth: '240px' },
    { title: 'Debit',   field: 'debit',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Credit',  field: 'credit', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 25, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '100%',
    showActions: true,
    actions: [{ type: 'custom', icon: 'rule', tooltip: 'Toggle cleared', label: 'Toggle Cleared', disabled: (r) => !!r['reconciled'], onClick: (r) => this.toggle(r['ledger_no'] as number) }],
  };
  readonly tableData = computed(() => this.lines() as unknown as Record<string, unknown>[]);

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
          this.loadWorksheet();   // refresh — cleared lines drop off
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to save reconciliation'),
    });
  }
}
