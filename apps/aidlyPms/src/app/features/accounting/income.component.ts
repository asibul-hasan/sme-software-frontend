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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccIncome, AccIncomeCategory, AccTransactionAccount } from '../../core/models/accounting.models';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface IncomeRow {
  id: string;
  incomeNo: number;
  receipt: string;
  date: string;
  from: string;
  category: string;
  account: string;
  amount: number;
  payment: string;
  note?: string;
}

@Component({
  selector: 'app-income',
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
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Income & Miscellaneous Receipts"
        subtitle="Record capital investments, scrap revenue, rent, and non-sales income"
        formId="ACC_1102"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Income' }]"
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
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Income Category</label>
            <nz-select
              [(ngModel)]="filterCategoryNo"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Categories"
              class="w-44 shrink-0"
              nzAllowClear
            >
              <nz-option [nzValue]="null" nzLabel="All Categories"></nz-option>
              @for (cat of categories(); track cat.income_category_no) {
                <nz-option [nzValue]="cat.income_category_no" [nzLabel]="cat.name"></nz-option>
              }
            </nz-select>
          </div>
          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="dashed" class="rounded-md" (click)="openCatModal()">
            <span nz-icon nzType="folder-add"></span> + Category
          </button>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Income (F2)
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
                <th class="p-3">Income Info</th>
                <th class="p-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (inc of incomes(); track inc.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ inc.receipt }}</p>
                    <p class="text-xs text-slate-400 mb-0.5">{{ inc.date }} · {{ inc.from }}</p>
                    @if (inc.note) {
                      <p class="text-xs text-slate-500 italic mb-0">{{ inc.note }}</p>
                    }
                  </td>

                  <td class="p-3">
                    <p class="text-xs font-semibold text-slate-800 mb-0.5">
                      {{ inc.category }} · <span class="text-slate-500 font-normal">{{ inc.account }}</span>
                    </p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="font-mono text-xs font-bold theme-total-text">
                        ৳ {{ inc.amount.toLocaleString() }}
                      </span>
                      <nz-tag [nzColor]="inc.payment === 'Bank' ? 'blue' : 'green'" class="text-[10px]">
                        {{ inc.payment }}
                      </nz-tag>
                    </div>
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewIncome(inc)"
                        nz-tooltip
                        nzTooltipTitle="View Receipt"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="voidIncome(inc)"
                        nz-tooltip
                        nzTooltipTitle="Delete Voucher"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="p-8 text-center text-slate-400 text-xs">
                    No other revenue vouchers recorded.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Revenue Entries: <strong class="text-slate-900 font-semibold font-mono">{{ incomes().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Income: <strong class="theme-total-text font-mono text-sm">৳ {{ totalIncomeAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Non-Operating Revenue Ledger</span>
        </div>
      </div>
    </div>

    <!-- Add Income Modal -->
    <nz-modal
      [(nzVisible)]="isAddOpen"
      nzTitle="Add Other Income"
      nzOkText="Submit Income"
      (nzOnCancel)="isAddOpen = false"
      (nzOnOk)="saveIncome()"
      nzWidth="680px"
      [nzStyle]="{ top: '32px' }"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Category <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select [(ngModel)]="form.income_category_no" class="flex-1" nzPlaceHolder="Select Category">
                  @for (c of categories(); track c.income_category_no) {
                    <nz-option [nzValue]="c.income_category_no" [nzLabel]="c.name"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="openCatModal()"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Category"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
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
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Payment Account <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select [(ngModel)]="form.account_no" class="flex-1" nzPlaceHolder="Select Account">
                  @for (acc of accounts(); track acc.account_no) {
                    <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="isAccountOpen = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Account"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Received From</label>
              <input
                type="text"
                nz-input
                placeholder="Source of income / party name"
                [(ngModel)]="form.received_from"
                class="rounded-md"
              />
            </div>

            <div class="col-span-1 md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Note</label>
              <input
                type="text"
                nz-input
                placeholder="Remarks..."
                [(ngModel)]="form.note"
                class="rounded-md"
              />
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Add Category Modal -->
    <nz-modal
      [(nzVisible)]="isCatOpen"
      nzTitle="Add Income Category"
      nzOkText="Create Category"
      [nzStyle]="{ top: '40px' }"
      (nzOnCancel)="isCatOpen = false"
      (nzOnOk)="saveCategory()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Category Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Capital, Rental Income"
            [(ngModel)]="newCategoryName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Add Account Modal -->
    <nz-modal
      [(nzVisible)]="isAccountOpen"
      nzTitle="Add Payment Account"
      nzOkText="Create Account"
      [nzStyle]="{ top: '40px' }"
      (nzOnCancel)="isAccountOpen = false"
      (nzOnOk)="saveAccount()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Account Name / Bank <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Dutch-Bangla Bank Ltd."
            [(ngModel)]="newAccountName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class IncomeComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  // Standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  filterCategoryNo: number | null = null;

  categories = signal<AccIncomeCategory[]>([]);
  accounts = signal<AccTransactionAccount[]>([]);
  incomes = signal<IncomeRow[]>([]);

  totalIncomeAmount = computed(() => this.incomes().reduce((sum, inc) => sum + (inc.amount || 0), 0));

  isAddOpen = false;
  form = {
    income_category_no: null as number | null,
    amount: 0,
    account_no: null as number | null,
    received_from: '',
    note: '',
  };

  isCatOpen = false;
  newCategoryName = '';

  isAccountOpen = false;
  newAccountName = '';

  ngOnInit(): void {
    this.loadCategories();
    this.loadAccounts();
    this.loadIncomes();
  }

  loadCategories(): void {
    this.accountingService.getIncomeCategories().subscribe({
      next: (res) => {
        if (res.data) {
          this.categories.set(res.data);
          if (!this.form.income_category_no && res.data.length > 0) {
            this.form.income_category_no = res.data[0].income_category_no;
          }
        }
      },
      error: () => {},
    });
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

  loadIncomes(): void {
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.fromDate) params['fromDate'] = this.fromDate;
    if (this.toDate) params['toDate'] = this.toDate;
    if (this.filterCategoryNo) params['categoryNo'] = this.filterCategoryNo;

    this.accountingService.getIncomes(params).subscribe({
      next: (res) => {
        const rawItems = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        const rows: IncomeRow[] = rawItems.map((item: any) => ({
          id: (item.income_no || item.incomeNo || Math.random()).toString(),
          incomeNo: item.income_no || item.incomeNo,
          receipt: item.receipt_no || item.receiptNo || `INC-${item.income_no}`,
          date: item.income_date ? new Date(item.income_date).toLocaleDateString('en-GB') + ' ' + new Date(item.income_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          from: item.received_from || item.receivedFrom || 'General Source',
          category: item.category_name || item.categoryName || item.category?.name || 'Income',
          account: item.account_name || item.accountName || item.account?.account_name || 'Cash',
          amount: Number(item.amount) || 0,
          payment: item.payment_type || item.paymentType || 'Cash',
          note: item.note,
        }));
        this.incomes.set(rows);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load incomes');
      },
    });
  }

  onFilterChange(): void {
    this.loadIncomes();
  }

  resetFilters(): void {
    const def = getDefaultMonthDateRange();
    this.fromDate = def.fromDate;
    this.toDate = def.toDate;
    this.filterCategoryNo = null;
    this.loadIncomes();
  }

  openAddModal(): void {
    this.form = {
      income_category_no: this.categories().length > 0 ? this.categories()[0].income_category_no : null,
      amount: 0,
      account_no: this.accounts().length > 0 ? this.accounts()[0].account_no : null,
      received_from: '',
      note: '',
    };
    this.isAddOpen = true;
  }

  saveIncome(): void {
    if (this.form.amount <= 0) {
      this.msg.error('Please enter a valid income amount');
      return;
    }
    if (!this.form.income_category_no) {
      this.msg.error('Please select an income category');
      return;
    }

    const selectedAcc = this.accounts().find(a => a.account_no === this.form.account_no);
    const payType = selectedAcc?.bank_name?.includes('Bank') ? 'Bank' : 'Cash';

    const payload: Partial<AccIncome> = {
      income_category_no: this.form.income_category_no,
      account_no: this.form.account_no || 1,
      amount: Number(this.form.amount),
      payment_type: payType,
      received_from: this.form.received_from.trim() || undefined,
      note: this.form.note.trim() || undefined,
      income_date: new Date().toISOString(),
    };

    this.accountingService.createIncome(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'Income receipt recorded successfully!');
        this.isAddOpen = false;
        this.loadIncomes();
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to save income receipt');
      },
    });
  }

  openCatModal(): void {
    this.newCategoryName = '';
    this.isCatOpen = true;
  }

  saveCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.msg.error('Please enter category name');
      return;
    }
    this.accountingService.createIncomeCategory({ name }).subscribe({
      next: (res) => {
        this.msg.success(`Category "${name}" created!`);
        this.isCatOpen = false;
        this.loadCategories();
        if (res.data?.income_category_no) {
          this.form.income_category_no = res.data.income_category_no;
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create category');
      },
    });
  }

  saveAccount(): void {
    const name = this.newAccountName.trim();
    if (!name) {
      this.msg.error('Please enter account name');
      return;
    }
    this.accountingService.createAccount({
      account_name: name,
      account_type: 1,
      opening_balance: 0,
      current_balance: 0,
    }).subscribe({
      next: (res) => {
        this.msg.success(`Account "${name}" created!`);
        this.isAccountOpen = false;
        this.loadAccounts();
        if (res.data?.account_no) {
          this.form.account_no = res.data.account_no;
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create account');
      },
    });
  }

  viewIncome(inc: IncomeRow): void {
    this.msg.info(`Receipt ${inc.receipt} | ${inc.from} | ৳ ${inc.amount.toLocaleString()}`);
  }

  voidIncome(inc: IncomeRow): void {
    this.modal.confirmDelete(`Receipt ${inc.receipt}`, 'This will void this income voucher.').subscribe(ok => {
      if (ok) {
        this.accountingService.deleteIncome(inc.incomeNo).subscribe({
          next: () => {
            this.msg.success(`Income voucher ${inc.receipt} voided.`);
            this.loadIncomes();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to void income voucher');
          },
        });
      }
    });
  }
}
