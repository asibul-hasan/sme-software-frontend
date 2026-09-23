import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccReconciliation, AccTransactionAccount } from '../../core/models/accounting.models';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface ReconcileRecord {
  id: string;
  reconciliationNo: number;
  voucher: string;
  date: string;
  by: string;
  from: string;
  to: string;
  amount: number;
  note: string;
}

@Component({
  selector: 'app-reconciliation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Inter-Account Reconciliation & Fund Transfers"
        subtitle="Transfer and reconcile balances between cash drawers, banks, and mobile wallets"
        formId="CASH_1204"
        [breadcrumbs]="[{ label: 'Cash & Finance', url: '/cash/receive' }, { label: 'Reconciliation' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-nowrap py-1">
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">From Date</label>
            <input
              type="date"
              nz-input
              [(ngModel)]="fromDate"
              (ngModelChange)="onFilterChange()"
              class="w-32 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">To Date</label>
            <input
              type="date"
              nz-input
              [(ngModel)]="toDate"
              (ngModelChange)="onFilterChange()"
              class="w-32 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Source Account</label>
            <nz-select
              [(ngModel)]="filterFromAccountNo"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Sources"
              class="w-44 shrink-0"
              nzAllowClear
            >
              <nz-option [nzValue]="null" nzLabel="All Sources"></nz-option>
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name"></nz-option>
              }
            </nz-select>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Destination Account</label>
            <nz-select
              [(ngModel)]="filterToAccountNo"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Destinations"
              class="w-44 shrink-0"
              nzAllowClear
            >
              <nz-option [nzValue]="null" nzLabel="All Destinations"></nz-option>
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name"></nz-option>
              }
            </nz-select>
          </div>
          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/reconciliation/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Transfer Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Reconciliation (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3">Transfer Info</th>
                <th class="p-3">Note</th>
                <th class="p-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of records(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ r.voucher }}</p>
                    <p class="text-xs text-slate-400 mb-0">{{ r.date }} · {{ r.by }}</p>
                  </td>

                  <td class="p-3">
                    <p class="text-xs text-slate-700 font-medium mb-0.5">
                      {{ r.from }} <span class="theme-highlight-subtitle font-bold">→</span> {{ r.to }}
                    </p>
                    <p class="mono text-xs font-bold theme-total-text mb-0">
                      ৳ {{ r.amount.toLocaleString() }}
                    </p>
                  </td>

                  <td class="p-3 text-xs text-slate-500 italic">
                    {{ r.note || '—' }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="viewVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="View Voucher Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="printVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="Print Transfer Voucher"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="Delete Transfer Voucher"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No reconciliation fund transfers match your search.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Vouchers: <strong class="text-slate-900 font-semibold font-mono">{{ records().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Transferred: <strong class="theme-total-text font-mono text-sm">৳ {{ totalReconciledAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Inter-Account Transfers</span>
        </div>
      </div>
    </div>

    <!-- Add Reconciliation Modal -->
    <nz-modal
      [(nzVisible)]="isModalOpen"
      nzTitle="Add Reconciliation (SCR-35)"
      nzOkText="Submit Transfer"
      (nzOnCancel)="isModalOpen = false"
      (nzOnOk)="saveReconciliation()"
      nzWidth="500px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment From (Source Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="form.payment_from_account_no" class="w-full" nzPlaceHolder="Select Source Account">
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name + ' (৳ ' + (acc.current_balance || 0).toLocaleString() + ')'"></nz-option>
              }
            </nz-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment To (Destination Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="form.payment_to_account_no" class="w-full" nzPlaceHolder="Select Destination Account">
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name + ' (৳ ' + (acc.current_balance || 0).toLocaleString() + ')'"></nz-option>
              }
            </nz-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Amount (৳) <span class="text-rose-500">*</span>
            </label>
            <input
              type="number"
              nz-input
              placeholder="0.00"
              [(ngModel)]="form.amount"
              class="rounded-md font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Note / Reference</label>
            <textarea
              nz-input
              rows="2"
              placeholder="Bank deposit slip number or transfer remarks..."
              [(ngModel)]="form.note"
              class="rounded-md"
            ></textarea>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class ReconciliationListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  // Standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  filterFromAccountNo: number | null = null;
  filterToAccountNo: number | null = null;

  records = signal<ReconcileRecord[]>([]);
  accounts = signal<AccTransactionAccount[]>([]);

  totalReconciledAmount = computed(() => this.records().reduce((sum, r) => sum + (r.amount || 0), 0));

  isModalOpen = false;
  form = {
    payment_from_account_no: null as number | null,
    payment_to_account_no: null as number | null,
    amount: 0,
    note: '',
  };

  ngOnInit(): void {
    this.loadAccounts();
    this.loadReconciliations();
  }

  loadAccounts(): void {
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        if (res.data) {
          this.accounts.set(res.data);
          if (res.data.length >= 2) {
            this.form.payment_from_account_no = res.data[0].account_no;
            this.form.payment_to_account_no = res.data[1].account_no;
          }
        }
      },
      error: () => {},
    });
  }

  loadReconciliations(): void {
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.filterFromAccountNo) params['fromAccountNo'] = this.filterFromAccountNo;
    if (this.filterToAccountNo) params['toAccountNo'] = this.filterToAccountNo;

    this.accountingService.getReconciliations(params).subscribe({
      next: (res) => {
        const rawItems = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        const rows: ReconcileRecord[] = rawItems.map((item: any) => ({
          id: (item.reconciliation_no || item.reconciliationNo || Math.random()).toString(),
          reconciliationNo: item.reconciliation_no || item.reconciliationNo,
          voucher: item.voucher_no || item.voucherNo || `REC-${item.reconciliation_no}`,
          date: item.transfer_date ? new Date(item.transfer_date).toLocaleDateString('en-GB') + ' ' + new Date(item.transfer_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          by: item.created_by_user_name || 'Admin',
          from: item.from_account_name || item.fromAccountName || item.from_account?.account_name || 'Counter Cash',
          to: item.to_account_name || item.toAccountName || item.to_account?.account_name || 'Bank',
          amount: Number(item.amount) || 0,
          note: item.note || '',
        }));
        this.records.set(rows);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load reconciliation records');
      },
    });
  }

  onFilterChange(): void {
    this.loadReconciliations();
  }

  resetFilters(): void {
    const def = getDefaultMonthDateRange();
    this.fromDate = def.fromDate;
    this.toDate = def.toDate;
    this.filterFromAccountNo = null;
    this.filterToAccountNo = null;
    this.loadReconciliations();
  }

  openAddModal(): void {
    const accs = this.accounts();
    this.form = {
      payment_from_account_no: accs.length > 0 ? accs[0].account_no : null,
      payment_to_account_no: accs.length > 1 ? accs[1].account_no : (accs.length > 0 ? accs[0].account_no : null),
      amount: 0,
      note: '',
    };
    this.isModalOpen = true;
  }

  saveReconciliation(): void {
    if (!this.form.payment_from_account_no || !this.form.payment_to_account_no) {
      this.msg.error('Please select both source and destination accounts');
      return;
    }
    if (this.form.payment_from_account_no === this.form.payment_to_account_no) {
      this.msg.error('Source and destination accounts must be different');
      return;
    }
    if (this.form.amount <= 0) {
      this.msg.error('Please enter a valid transfer amount');
      return;
    }

    const payload: Partial<AccReconciliation> = {
      payment_from_account_no: this.form.payment_from_account_no,
      payment_to_account_no: this.form.payment_to_account_no,
      amount: Number(this.form.amount),
      note: this.form.note.trim() || undefined,
      transfer_date: new Date().toISOString(),
    };

    this.accountingService.createReconciliation(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'Transfer voucher recorded successfully!');
        this.isModalOpen = false;
        this.loadReconciliations();
        this.loadAccounts();
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to submit fund transfer');
      },
    });
  }

  viewVoucher(r: ReconcileRecord): void {
    this.msg.info(`${r.voucher}: ${r.from} -> ${r.to} (৳ ${r.amount.toLocaleString()})`);
  }

  printVoucher(r: ReconcileRecord): void {
    this.msg.success(`Printing reconciliation voucher ${r.voucher}`);
  }

  deleteVoucher(r: ReconcileRecord): void {
    this.modal.confirmAction(
      'Delete Transfer Voucher?',
      `Are you sure you want to delete reconciliation transfer voucher "${r.voucher}"?`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.accountingService.deleteReconciliation(r.reconciliationNo).subscribe({
          next: () => {
            this.msg.success(`Voucher "${r.voucher}" deleted`);
            this.loadReconciliations();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete voucher');
          },
        });
      }
    });
  }
}
