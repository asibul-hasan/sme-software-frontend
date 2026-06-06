import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1004DataService, OpeningAccount } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

interface WorkingLine {
  __uid: number;
  account_no: number;
  account_code: string;
  account_name: string;
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
  lines      = signal<WorkingLine[]>([]);
  isLoading  = signal(false);
  isSaving   = signal(false);
  private uid = 0;

  voucherDate            = new Date().toISOString().split('T')[0];
  openingEquityAccountNo: number | null = null;
  narration              = '';

  // new-line entry
  newAccount: number | null = null;
  newDebit: number | null   = null;
  newCredit: number | null  = null;

  totalDebit  = computed(() => this.lines().reduce((s, l) => s + (Number(l.debit) || 0), 0));
  totalCredit = computed(() => this.lines().reduce((s, l) => s + (Number(l.credit) || 0), 0));
  difference  = computed(() => this.totalDebit() - this.totalCredit());

  readonly lineColumns: ColumnDef[] = [
    { title: 'Code',    field: 'account_code', cellType: 'text', width: '140px' },
    { title: 'Account', field: 'account_name', cellType: 'text' },
    { title: 'Debit',   field: 'debit',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Credit',  field: 'credit', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '360px',
    showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.removeLine(row['__uid'] as number) }],
  };
  readonly lineData = computed(() => this.lines() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1004'); this.loadAccounts(); });
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.data.getAccounts().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.accounts.set(res.data); },
      error: () => this.toastr.error('Failed to load accounts'),
    });
  }

  addLine(): void {
    if (!this.newAccount) { this.toastr.warning('Select an account'); return; }
    const dr = Number(this.newDebit) || 0, cr = Number(this.newCredit) || 0;
    if (dr <= 0 && cr <= 0) { this.toastr.warning('Enter a debit or credit amount'); return; }
    if (dr > 0 && cr > 0)   { this.toastr.warning('A line is either debit or credit, not both'); return; }
    if (this.newAccount === this.openingEquityAccountNo) { this.toastr.warning('That account is set as the opening-equity account'); return; }
    if (this.lines().some((l) => l.account_no === this.newAccount)) { this.toastr.warning('Account already added'); return; }
    const a = this.accounts().find((x) => x.account_no === this.newAccount);
    if (!a) return;
    this.lines.update((ls) => [...ls, { __uid: ++this.uid, account_no: a.account_no, account_code: a.account_code, account_name: a.account_name, debit: dr, credit: cr }]);
    this.newAccount = null; this.newDebit = null; this.newCredit = null;
  }

  removeLine(uid: number): void { this.lines.update((ls) => ls.filter((l) => l.__uid !== uid)); }

  post(): void {
    if (this.lines().length === 0) { this.toastr.warning('Add at least one opening line'); return; }
    if (!this.openingEquityAccountNo) { this.toastr.warning('Select an opening-balance equity account'); return; }
    this.alert.confirm('Post these opening balances as one Opening voucher? The imbalance is routed to the opening-equity account.', 'Post Opening Balances', 'primary')
      .subscribe((ok) => { if (ok) this.doPost(); });
  }

  private doPost(): void {
    this.isSaving.set(true);
    this.data.post({
      voucher_date: this.voucherDate,
      opening_equity_account_no: this.openingEquityAccountNo!,
      narration: this.narration || undefined,
      lines: this.lines().map((l) => ({ account_no: l.account_no, debit: l.debit, credit: l.credit })),
    }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(`Opening balances posted as ${res.data.voucher_id}`);
          this.lines.set([]); this.narration = '';
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to post opening balances'),
    });
  }
}
