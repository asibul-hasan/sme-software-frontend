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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccAdditionalBalance, AccTransactionAccount } from '../../core/models/accounting.models';
import { formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

interface BalanceEntry {
  id: string;
  additionalBalanceNo: number;
  ref: string;
  user: string;
  amount: number;
  account: string;
  note: string;
  date: string;
}

@Component({
  selector: 'app-additional-balance',
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
    NzDatePickerModule,
    PageHeaderComponent,
    MenuActionDirective,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Owner Capital & Additional Balance"
        subtitle="Record proprietor capital injections and direct bank/cash account adjustments"
        formId="ACC_1106"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Additional Balance' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <nz-date-picker id="additional-balance-from-date-5" nzId="additional-balance-from-date-5" class="w-32 shrink-0 rounded-md" [(ngModel)]="fromDate" (ngModelChange)="loadBalances()" nzFormat="dd-MM-yyyy" nzPlaceHolder="From Date" aria-label="From Date"></nz-date-picker>
          <nz-date-picker id="additional-balance-to-date-6" nzId="additional-balance-to-date-6" class="w-32 shrink-0 rounded-md" [(ngModel)]="toDate" (ngModelChange)="loadBalances()" nzFormat="dd-MM-yyyy" nzPlaceHolder="To Date" aria-label="To Date"></nz-date-picker>
          <button nz-button class="btn-reset rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <button nz-button class="btn-export rounded-md" (click)="exportBalancesCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <button *appMenuAction="'ACC_1109:create'" nz-button nzType="primary" class="btn-save rounded-md font-semibold" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Balance
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          <table class="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3">Target Account</th>
                <th class="p-3 text-right">Amount</th>
                <th class="p-3">Note / Source</th>
                <th class="p-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (b of balances(); track b.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ b.ref }}</p>
                    <p class="text-xs text-slate-400 mb-0">{{ b.date }} · {{ b.user }}</p>
                  </td>

                  <td class="p-3 text-xs font-semibold text-slate-700">
                    {{ b.account }}
                  </td>

                  <td class="p-3 text-right font-mono text-sm font-bold theme-total-text">
                    ৳ {{ b.amount.toLocaleString() }}
                  </td>

                  <td class="p-3 text-xs text-slate-500 italic">
                    {{ b.note }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="viewDetails(b)"
                        nz-tooltip
                        nzTooltipTitle="View Details"
                        class="btn-tbl-action btn-tbl-view"
                       aria-label="View Details">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        *appMenuAction="'ACC_1109:delete'"
                        type="button"
                        (click)="deleteEntry(b)"
                        nz-tooltip
                        nzTooltipTitle="Delete Capital Entry"
                        class="btn-tbl-action btn-tbl-delete"
                       aria-label="Delete Capital Entry">
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-slate-400 text-xs">
                    No additional capital injections recorded.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Capital Injections: <strong class="text-slate-900 font-semibold font-mono">{{ balances().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Capital: <strong class="theme-total-text font-mono text-sm">৳ {{ totalCapitalAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Owner Equity Journal</span>
        </div>
      </div>
    </div>

    <!-- Add Balance Modal -->
    <nz-modal
      [(nzVisible)]="isModalOpen"
      nzTitle="Add Additional Balance"
      nzOkText="Confirm Balance Injection"
      (nzOnCancel)="isModalOpen = false"
      (nzOnOk)="saveBalance()"
      nzWidth="440px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label for="additional-balance-date-1" class="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <nz-date-picker id="additional-balance-date-1" nzId="additional-balance-date-1" [(ngModel)]="form.date" nzFormat="dd-MM-yyyy" class="w-full rounded-md" aria-label="Date"></nz-date-picker>
          </div>

          <div>
            <label for="additional-balance-target-deposit-account-2" class="block text-xs font-semibold text-slate-700 mb-1">Target Deposit Account *</label>
            <nz-select id="additional-balance-target-deposit-account-2" nzId="additional-balance-target-deposit-account-2" [(ngModel)]="form.account_no" class="w-full" nzPlaceHolder="Select Account" aria-label="Target Deposit Account">
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name"></nz-option>
              }
            </nz-select>
          </div>

          <div>
            <label for="additional-balance-amount-3" class="block text-xs font-semibold text-slate-700 mb-1">
              Amount (৳) <span class="text-rose-500">*</span>
            </label>
            <input id="additional-balance-amount-3"
              type="number"
              nz-input
              placeholder="0.00"
              [(ngModel)]="form.amount"
              class="rounded-md font-mono" aria-label="Amount (৳)" />
          </div>

          <div>
            <label for="additional-balance-source-remarks-4" class="block text-xs font-semibold text-slate-700 mb-1">Source / Remarks</label>
            <textarea id="additional-balance-source-remarks-4"
              nz-input
              rows="2"
              placeholder="e.g. Owner capital injection, personal loan..."
              [(ngModel)]="form.note"
              class="rounded-md" aria-label="Source / Remarks"></textarea>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Printable Capital Voucher Modal -->
    <nz-modal
      [(nzVisible)]="isVoucherModalOpen"
      nzTitle="Owner Capital Investment Voucher"
      [nzFooter]="voucherFooter"
      (nzOnCancel)="isVoucherModalOpen = false"
      nzWidth="580px"
      [nzStyle]="{ top: '30px' }"
    >
      <ng-container *nzModalContent>
        @if (selectedBalance) {
          <div class="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 space-y-4">
            <div class="text-center border-b pb-3 border-slate-200">
              <h2 class="text-base font-bold text-slate-900 tracking-wide uppercase">Aidly Pharmacy Ltd.</h2>
              <p class="text-xs text-slate-500">Dhaka Medical Plaza, Main Road, Dhaka</p>
              <div class="inline-block mt-1 px-3 py-0.5 bg-purple-50 text-purple-700 font-bold text-xs rounded border border-purple-200">
                CAPITAL INJECTION / CREDIT VOUCHER
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="text-slate-400">Voucher Ref:</span> <strong class="font-mono text-slate-900 ml-1">{{ selectedBalance.ref }}</strong></div>
              <div class="text-right"><span class="text-slate-400">Date:</span> <span class="font-mono text-slate-800 ml-1">{{ selectedBalance.date }}</span></div>
              <div><span class="text-slate-400">Target Account:</span> <span class="font-medium text-slate-800 ml-1">{{ selectedBalance.account }}</span></div>
              <div class="text-right"><span class="text-slate-400">Recorded By:</span> <span class="font-medium text-slate-800 ml-1">{{ selectedBalance.user }}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Narration / Note:</span> <span class="text-slate-800 ml-1">{{ selectedBalance.note }}</span></div>
            </div>

            <div class="bg-purple-50/50 border border-purple-200 rounded-md p-3 flex justify-between items-center">
              <div>
                <span class="text-xs font-semibold uppercase text-purple-800 block">Total Capital Injected</span>
                <span class="text-xs text-slate-400 italic">Credited into {{ selectedBalance.account }}</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-bold font-mono text-purple-700">৳ {{ selectedBalance.amount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 pt-8 text-[11px] text-slate-500 text-center">
              <div class="border-t border-dashed border-slate-400 pt-1">Investor / Owner Signature</div>
              <div class="border-t border-dashed border-slate-400 pt-1">Managing Pharmacist Signature</div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #voucherFooter>
        <button nz-button nzType="default" (click)="isVoucherModalOpen = false">Close</button>
        <button nz-button nzType="primary" (click)="triggerPrint()">
          <span nz-icon nzType="printer"></span> Print Voucher
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class AdditionalBalanceComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  fromDate: Date | null = null;
  toDate: Date | null = null;

  balances = signal<BalanceEntry[]>([]);
  accounts = signal<AccTransactionAccount[]>([]);

  totalCapitalAmount = computed(() => this.balances().reduce((sum, b) => sum + (b.amount || 0), 0));

  isModalOpen = false;
  form = {
    date: new Date() as Date | string | null,
    amount: 0,
    account_no: null as number | null,
    note: '',
  };

  ngOnInit(): void {
    this.loadAccounts();
    this.loadBalances();
  }

  loadAccounts(): void {
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        if (res.data) {
          this.accounts.set(res.data);
          if (!this.form.account_no && res.data.length > 0) {
            this.form.account_no = res.data[0].account_no;
          }
        }
      },
      error: () => {},
    });
  }

  loadBalances(): void {
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.fromDate) params['fromDate'] = formatDateToDdMmYyyy(this.fromDate);
    if (this.toDate) params['toDate'] = formatDateToDdMmYyyy(this.toDate);

    this.accountingService.getAdditionalBalances(params).subscribe({
      next: (res) => {
        const rawItems = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        const rows: BalanceEntry[] = rawItems.map((item: any) => ({
          id: (item.additional_balance_no || item.additionalBalanceNo || Math.random()).toString(),
          additionalBalanceNo: item.additional_balance_no || item.additionalBalanceNo,
          ref: `CAP-${String(item.additional_balance_no || item.additionalBalanceNo || '').padStart(6, '0')}`,
          user: item.created_by_user_name || 'Admin',
          amount: Number(item.amount) || 0,
          account: item.account_name || item.accountName || 'Cash / Deposit Account',
          note: item.note || 'Owner equity addition',
          date: item.entry_date ? new Date(item.entry_date).toLocaleDateString('en-GB') : '-',
        }));
        this.balances.set(rows);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load capital balance entries');
      },
    });
  }

  resetFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.loadBalances();
  }

  openAddModal(): void {
    this.form = {
      date: new Date(),
      amount: 0,
      account_no: this.accounts().length > 0 ? this.accounts()[0].account_no : null,
      note: '',
    };
    this.isModalOpen = true;
  }

  saveBalance(): void {
    if (this.form.amount <= 0) {
      this.msg.error('Please enter a valid amount');
      return;
    }

    const payload: Partial<AccAdditionalBalance> = {
      amount: Number(this.form.amount),
      account_no: this.form.account_no || 1,
      entry_date: this.form.date ? new Date(this.form.date).toISOString() : new Date().toISOString(),
      note: this.form.note.trim() || undefined,
    };

    this.accountingService.createAdditionalBalance(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Capital of ৳ ${payload.amount?.toLocaleString()} added to pharmacy accounts!`);
        this.isModalOpen = false;
        this.loadBalances();
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to add capital balance');
      },
    });
  }

  isVoucherModalOpen = false;
  selectedBalance: BalanceEntry | null = null;

  viewDetails(b: BalanceEntry): void {
    this.selectedBalance = b;
    this.isVoucherModalOpen = true;
  }

  triggerPrint(): void {
    window.print();
  }

  exportBalancesCsv(): void {
    const list = this.balances();
    if (!list.length) {
      this.msg.warning('No capital injection entries to export.');
      return;
    }
    const headers = ['SL', 'Voucher Ref', 'Date', 'Target Account', 'Recorded By', 'Amount (BDT)', 'Note'];
    const rows = list.map((b, i) => [
      i + 1,
      `"${b.ref}"`,
      `"${b.date}"`,
      `"${b.account}"`,
      `"${b.user}"`,
      b.amount.toFixed(2),
      `"${(b.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capital_injections_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} capital entries.`);
  }

  deleteEntry(b: BalanceEntry): void {
    this.modal.confirmAction(
      'Delete Capital Entry?',
      `Are you sure you want to delete balance entry "${b.ref}" of ৳ ${b.amount.toLocaleString()}?`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.accountingService.deleteAdditionalBalance(b.additionalBalanceNo).subscribe({
          next: () => {
            this.msg.success(`Entry "${b.ref}" deleted`);
            this.loadBalances();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete capital entry');
          },
        });
      }
    });
  }
}
