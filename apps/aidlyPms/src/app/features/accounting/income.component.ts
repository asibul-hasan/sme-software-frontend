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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccIncome, AccIncomeCategory, AccTransactionAccount } from '../../core/models/accounting.models';
import { getDefaultMonthDates, formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

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
    NzDatePickerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    NzSpinModule,
    MenuActionDirective,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Income & Miscellaneous Receipts"
        subtitle="Record capital investments, scrap revenue, rent, and non-sales income"
        formId="ACC_1102"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Income' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-wrap py-1">
          <div class="flex flex-col">
            <label for="income-from-date-1" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">From Date</label>
            <nz-date-picker id="income-from-date-1" nzId="income-from-date-1"
              [(ngModel)]="fromDate"
              (ngModelChange)="onFilterChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="From Date"
              class="w-32 shrink-0 rounded-md text-xs" aria-label="From Date"></nz-date-picker>
          </div>
          <div class="flex flex-col">
            <label for="income-to-date-2" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">To Date</label>
            <nz-date-picker id="income-to-date-2" nzId="income-to-date-2"
              [(ngModel)]="toDate"
              (ngModelChange)="onFilterChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="To Date"
              class="w-32 shrink-0 rounded-md text-xs" aria-label="To Date"></nz-date-picker>
          </div>
          <div class="flex flex-col">
            <label for="income-income-category-3" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Income Category</label>
            <nz-select id="income-income-category-3" nzId="income-income-category-3"
              [(ngModel)]="filterCategoryNo"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Categories"
              class="w-44 shrink-0"
              nzAllowClear aria-label="Income Category">
              <nz-option [nzValue]="null" nzLabel="All Categories"></nz-option>
              @for (cat of categories(); track cat.income_category_no) {
                <nz-option [nzValue]="cat.income_category_no" [nzLabel]="cat.name"></nz-option>
              }
            </nz-select>
          </div>
          <button nz-button class="btn-reset rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <button nz-button class="btn-export rounded-md" (click)="exportIncomeCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <button nz-button class="btn-secondary-action rounded-md" (click)="openCatModal()">
            <span nz-icon nzType="folder-add"></span> + Category
          </button>
          <button *appMenuAction="'ACC_1106:create'" nz-button nzType="primary" class="btn-save rounded-md font-semibold" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Income (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          <table class="w-full text-sm text-left border-collapse min-w-[650px]">
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
                       aria-label="View Receipt">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        *appMenuAction="'ACC_1106:delete'"
                        type="button"
                        (click)="voidIncome(inc)"
                        nz-tooltip
                        nzTooltipTitle="Delete Voucher"
                        class="btn-tbl-action btn-tbl-delete"
                       aria-label="Delete Voucher">
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="p-6 text-center">
                    <app-empty-state
                      [title]="hasError() ? 'Failed to Load Revenue Entries' : (filterCategoryNo ? 'No Matching Revenue Entries' : 'No Revenue Entries Recorded')"
                      [description]="hasError() ? 'Unable to reach revenue records. Please check your connection and retry.' : (filterCategoryNo ? 'No entries match the selected income category.' : 'Record non-operating revenue, interest, scrap sales, or investment receipts.')"
                      [stateType]="hasError() ? 'error' : (filterCategoryNo ? 'filtered' : 'empty')"
                      icon="dollar"
                      [actionText]="hasError() ? 'Retry Loading' : (filterCategoryNo ? 'Clear Filter' : 'Record First Revenue')"
                      [actionIcon]="hasError() ? 'reload' : (filterCategoryNo ? 'clear' : 'plus')"
                      (actionClick)="onEmptyTableAction()"
                      [compact]="true"
                      [transparent]="true"
                    ></app-empty-state>
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
              <label for="income-category-4" class="block text-xs font-semibold text-slate-700 mb-1">
                Category <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select id="income-category-4" nzId="income-category-4" [(ngModel)]="form.income_category_no" class="flex-1" nzPlaceHolder="Select Category" aria-label="Category">
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
                 aria-label="Quick Add Category">
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label for="income-amount-5" class="block text-xs font-semibold text-slate-700 mb-1">
                Amount (৳) <span class="text-rose-500">*</span>
              </label>
              <input id="income-amount-5"
                type="number"
                nz-input
                placeholder="0.00"
                [(ngModel)]="form.amount"
                class="rounded-md font-mono" aria-label="Amount (৳)" />
            </div>

            <div>
              <label for="income-payment-account-6" class="block text-xs font-semibold text-slate-700 mb-1">
                Payment Account <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select id="income-payment-account-6" nzId="income-payment-account-6" [(ngModel)]="form.account_no" class="flex-1" nzPlaceHolder="Select Account" aria-label="Payment Account">
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
                 aria-label="Quick Add Account">
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label for="income-received-from-7" class="block text-xs font-semibold text-slate-700 mb-1">Received From</label>
              <input id="income-received-from-7"
                type="text"
                nz-input
                placeholder="Source of income / party name"
                [(ngModel)]="form.received_from"
                class="rounded-md" aria-label="Received From" />
            </div>

            <div class="col-span-1 md:col-span-2">
              <label for="income-note-8" class="block text-xs font-semibold text-slate-700 mb-1">Note</label>
              <input id="income-note-8"
                type="text"
                nz-input
                placeholder="Remarks..."
                [(ngModel)]="form.note"
                class="rounded-md" aria-label="Note" />
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
          <label for="income-category-name-9" class="block text-xs font-semibold text-slate-700 mb-1">
            Category Name <span class="text-rose-500">*</span>
          </label>
          <input id="income-category-name-9"
            type="text"
            nz-input
            placeholder="e.g. Capital, Rental Income"
            [(ngModel)]="newCategoryName"
            class="rounded-md" aria-label="Category Name" />
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
          <label for="income-account-name-bank-10" class="block text-xs font-semibold text-slate-700 mb-1">
            Account Name / Bank <span class="text-rose-500">*</span>
          </label>
          <input id="income-account-name-bank-10"
            type="text"
            nz-input
            placeholder="e.g. Dutch-Bangla Bank Ltd."
            [(ngModel)]="newAccountName"
            class="rounded-md" aria-label="Account Name / Bank" />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Printable Money Receipt Modal -->
    <nz-modal
      [(nzVisible)]="isReceiptModalOpen"
      nzTitle="Money Receipt (Miscellaneous Income)"
      [nzFooter]="receiptFooter"
      (nzOnCancel)="isReceiptModalOpen = false"
      nzWidth="600px"
      [nzStyle]="{ top: '30px' }"
    >
      <ng-container *nzModalContent>
        @if (selectedIncome) {
          <div class="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 space-y-4">
            <div class="text-center border-b pb-3 border-slate-200">
              <h2 class="text-base font-bold text-slate-900 tracking-wide uppercase">Aidly Pharmacy Ltd.</h2>
              <p class="text-xs text-slate-500">Dhaka Medical Plaza, Main Road, Dhaka</p>
              <div class="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded border border-emerald-200">
                OFFICIAL MONEY RECEIPT
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="text-slate-400">Receipt No:</span> <strong class="font-mono text-slate-900 ml-1">{{ selectedIncome.receipt }}</strong></div>
              <div class="text-right"><span class="text-slate-400">Date:</span> <span class="font-mono text-slate-800 ml-1">{{ selectedIncome.date }}</span></div>
              <div><span class="text-slate-400">Received From:</span> <strong class="text-slate-900 ml-1">{{ selectedIncome.from }}</strong></div>
              <div class="text-right"><span class="text-slate-400">Payment Account:</span> <span class="font-medium text-slate-800 ml-1">{{ selectedIncome.account }} ({{ selectedIncome.payment }})</span></div>
              <div><span class="text-slate-400">Revenue Head:</span> <span class="font-medium text-slate-800 ml-1">{{ selectedIncome.category }}</span></div>
              <div class="text-right"><span class="text-slate-400">Status:</span> <span class="text-emerald-600 font-bold ml-1">Received & Posted</span></div>
              <div class="col-span-2"><span class="text-slate-400">Purpose / Note:</span> <span class="text-slate-800 ml-1">{{ selectedIncome.note || 'None' }}</span></div>
            </div>

            <div class="bg-emerald-50/50 border border-emerald-200 rounded-md p-3 flex justify-between items-center">
              <div>
                <span class="text-xs font-semibold uppercase text-emerald-800 block">Total Amount Received</span>
                <span class="text-xs text-slate-500 italic">Credited into {{ selectedIncome.account }}</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-bold font-mono text-emerald-700">৳ {{ selectedIncome.amount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 pt-8 text-[11px] text-slate-500 text-center">
              <div class="border-t border-dashed border-slate-400 pt-1">Depositor / Payer Signature</div>
              <div class="border-t border-dashed border-slate-400 pt-1">Authorized Cashier Signature</div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #receiptFooter>
        <button nz-button nzType="default" (click)="isReceiptModalOpen = false">Close</button>
        <button nz-button nzType="primary" (click)="printReceipt()">
          <span nz-icon nzType="printer"></span> Print Receipt
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class IncomeComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  // Standard 1-month date range default
  defaultDates = getDefaultMonthDates();
  fromDate: Date | null = this.defaultDates.from;
  toDate: Date | null = this.defaultDates.to;
  filterCategoryNo: number | null = null;

  categories = signal<AccIncomeCategory[]>([]);
  accounts = signal<AccTransactionAccount[]>([]);
  incomes = signal<IncomeRow[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadIncomes();
    } else if (this.filterCategoryNo) {
      this.filterCategoryNo = null;
      this.loadIncomes();
    } else {
      this.openAddModal();
    }
  }

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
    this.isLoading.set(true);
    this.hasError.set(false);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.fromDate) params['fromDate'] = formatDateToDdMmYyyy(this.fromDate);
    if (this.toDate) params['toDate'] = formatDateToDdMmYyyy(this.toDate);
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
    const def = getDefaultMonthDates();
    this.fromDate = def.from;
    this.toDate = def.to;
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

  isReceiptModalOpen = false;
  selectedIncome: IncomeRow | null = null;

  viewIncome(inc: IncomeRow): void {
    this.selectedIncome = inc;
    this.isReceiptModalOpen = true;
  }

  printReceipt(): void {
    window.print();
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

  exportIncomeCsv(): void {
    const list = this.incomes();
    if (!list.length) {
      this.msg.warning('No income receipts to export.');
      return;
    }
    const headers = ['SL', 'Receipt #', 'Date', 'Received From', 'Category', 'Account', 'Payment Method', 'Amount (BDT)', 'Note'];
    const rows = list.map((inc, i) => [
      i + 1,
      `"${inc.receipt}"`,
      `"${inc.date}"`,
      `"${inc.from}"`,
      `"${inc.category}"`,
      `"${inc.account}"`,
      `"${inc.payment}"`,
      inc.amount.toFixed(2),
      `"${(inc.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_receipts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} income receipts.`);
  }
}
