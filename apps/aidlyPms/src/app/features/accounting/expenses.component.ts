import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface ExpenseRow {
  id: string;
  voucher: string;
  date: string;
  creator: string;
  note: string;
  category: string;
  account: string;
  amount: number;
  payment: string;
}

@Component({
  selector: 'app-expenses',
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
    NzSpinModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Operational Expenses"
        subtitle="Record shop rent, electricity, utilities, salaries, and daily maintenance overhead"
        formId="ACC_1103"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Expenses' }]"
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
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Expense Category</label>
            <nz-select
              [(ngModel)]="filterCategory"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Categories"
              class="w-44 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Categories"></nz-option>
              @for (cat of categories; track cat) {
                <nz-option [nzValue]="cat" [nzLabel]="cat"></nz-option>
              }
            </nz-select>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Payment Method</label>
            <nz-select
              [(ngModel)]="filterPayment"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Payment Types"
              class="w-40 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Payment Types"></nz-option>
              <nz-option nzValue="Cash" nzLabel="Cash"></nz-option>
              <nz-option nzValue="Bank" nzLabel="Bank"></nz-option>
              <nz-option nzValue="MFS" nzLabel="MFS"></nz-option>
            </nz-select>
          </div>
          <div class="flex items-center pb-0.5">
            <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
              <span nz-icon nzType="clear"></span> Reset
            </button>
          </div>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="dashed" class="rounded-md" (click)="openCatModal()">
            <span nz-icon nzType="folder-add"></span> + Category
          </button>
          <a nz-button nzType="default" routerLink="/accounting/expenses/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Expense Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Expense (F2)
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
                <th class="p-3">Expense Info</th>
                <th class="p-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (e of filteredExpenses(); track e.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ e.voucher }}</p>
                    <p class="text-xs text-slate-400 mb-0.5">{{ e.date }} · {{ e.creator }}</p>
                    <p class="text-xs text-slate-500 italic mb-0">{{ e.note }}</p>
                  </td>

                  <td class="p-3">
                    <p class="text-xs font-semibold text-slate-800 mb-0.5">{{ e.category }}</p>
                    <p class="text-xs text-slate-400 mb-1">{{ e.account }}</p>
                    <div class="flex items-center gap-1.5">
                      <span class="font-mono text-xs font-bold text-rose-600">
                        ৳ {{ e.amount.toLocaleString() }}
                      </span>
                      <nz-tag
                        [nzColor]="e.payment === 'MFS' ? 'gold' : e.payment === 'Bank' ? 'blue' : 'green'"
                        class="text-[10px]"
                      >
                        {{ e.payment }}
                      </nz-tag>
                    </div>
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewExpense(e)"
                        nz-tooltip
                        nzTooltipTitle="View Expense Voucher"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteExpense(e)"
                        nz-tooltip
                        nzTooltipTitle="Delete Expense"
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
                    No expenses recorded matching the selected filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Expense Vouchers: <strong class="text-slate-900 font-semibold font-mono">{{ filteredExpenses().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Expense: <strong class="text-rose-700 font-mono text-sm">৳ {{ totalExpenseAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Operational Overhead Ledger</span>
        </div>
      </div>
    </div>

    <!-- Unified Add / Modify Expense Modal -->
    <nz-modal
      [(nzVisible)]="isAddOpen"
      [nzTitle]="modalMode === 'create' ? 'Add Expense (SCR-29)' : ('Modify Expense: ' + form.voucher)"
      [nzOkText]="modalMode === 'create' ? 'Record Expense' : 'Update Expense'"
      (nzOnCancel)="isAddOpen = false"
      (nzOnOk)="saveExpense()"
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
                <nz-select [(ngModel)]="form.category" class="flex-1">
                  @for (cat of categories; track cat) {
                    <nz-option [nzValue]="cat" [nzLabel]="cat"></nz-option>
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
                <nz-select [(ngModel)]="form.account" class="flex-1">
                  @for (acc of accounts; track acc) {
                    <nz-option [nzValue]="acc" [nzLabel]="acc"></nz-option>
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
              <label class="block text-xs font-semibold text-slate-700 mb-1">Note / Narration</label>
              <input
                type="text"
                nz-input
                placeholder="Description or narration..."
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
      nzTitle="Add Expense Category (SCR-30)"
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
            placeholder="e.g. Office Supplies, Maintenance"
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
export class ExpensesComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  isLoading = signal(false);

  // Initialize with standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  filterCategory = '';
  filterPayment = '';

  categories: string[] = ['Rent', 'Salary', 'Utilities', 'Maintenance', 'Tea & Refreshment', 'Stationery'];
  accounts: string[] = ['Counter Cash', 'Islami Bank', 'bKash Merchant', 'BRAC Bank', 'Dutch-Bangla Bank'];

  expenses = signal<ExpenseRow[]>([
    { id: '1', voucher: 'EXP-2026-042', date: '16-09-2026 09:00', creator: 'Admin', note: 'Monthly shop rent', category: 'Rent', account: 'Counter Cash', amount: 8000, payment: 'Cash' },
    { id: '2', voucher: 'EXP-2026-041', date: '15-09-2026 11:30', creator: 'Admin', note: 'Electricity bill August', category: 'Utilities', account: 'Islami Bank', amount: 1200, payment: 'Bank' },
    { id: '3', voucher: 'EXP-2026-040', date: '14-09-2026 14:00', creator: 'Sumon', note: 'Staff salary — Sep advance', category: 'Salary', account: 'bKash Merchant', amount: 22000, payment: 'MFS' },
  ]);

  filteredExpenses = computed(() => {
    const cat = this.filterCategory;
    const pay = this.filterPayment;

    return this.expenses().filter(e => {
      const matchCat = !cat || e.category === cat;
      const matchPay = !pay || e.payment === pay;
      return matchCat && matchPay;
    });
  });

  totalExpenseAmount = computed(() => this.filteredExpenses().reduce((sum, e) => sum + (e.amount || 0), 0));

  // Modal State
  isAddOpen = false;
  isCatOpen = false;
  isAccountOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  newCategoryName = '';
  newAccountName = '';

  form = {
    id: '',
    voucher: '',
    category: 'Rent',
    account: 'Counter Cash',
    amount: 0,
    note: '',
  };

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadExpenses();
    });

    this.accountingService.getExpenseCategories().subscribe(res => {
      if (res.data?.length) {
        this.categories = res.data.map(c => c.name);
      }
    });

    this.accountingService.getAccounts().subscribe(res => {
      if (res.data?.length) {
        this.accounts = res.data.map(a => a.account_name);
      }
    });

    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onFilterChange(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoading.set(true);
    const params = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      category: this.filterCategory,
      paymentType: this.filterPayment,
    };
    this.accountingService.getExpenses(params).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  resetFilters(): void {
    const def = getDefaultMonthDateRange();
    this.fromDate = def.fromDate;
    this.toDate = def.toDate;
    this.filterCategory = '';
    this.filterPayment = '';
    this.loadExpenses();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      id: '',
      voucher: '',
      category: 'Utilities',
      amount: 0,
      account: 'Counter Cash',
      note: '',
    };
    this.isAddOpen = true;
  }

  saveExpense(): void {
    if (this.form.amount <= 0) {
      this.msg.error('Please enter a valid expense amount');
      return;
    }
    const paymentType = this.form.account === 'Counter Cash' ? 'Cash' : this.form.account.includes('Bank') ? 'Bank' : 'MFS';

    if (this.modalMode === 'create') {
      const nextVoucher = `EXP-2026-0${this.expenses().length + 43}`;
      const newExp: ExpenseRow = {
        id: Date.now().toString(),
        voucher: nextVoucher,
        date: new Date().toLocaleDateString('en-GB') + ' 12:00',
        creator: 'Admin',
        note: this.form.note.trim() || 'General Expense',
        category: this.form.category,
        account: this.form.account,
        amount: Number(this.form.amount),
        payment: paymentType,
      };
      this.expenses.update(list => [newExp, ...list]);
      this.msg.success(`Expense ${newExp.voucher} for ৳ ${newExp.amount.toLocaleString()} recorded!`);
    }
    this.isAddOpen = false;
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
    if (!this.categories.includes(name)) {
      this.categories.push(name);
      this.msg.success(`Expense category "${name}" added!`);
    }
    this.form.category = name;
    this.isCatOpen = false;
  }

  saveAccount(): void {
    const name = this.newAccountName.trim();
    if (!name) {
      this.msg.error('Please enter account name');
      return;
    }
    if (!this.accounts.includes(name)) {
      this.accounts.push(name);
      this.msg.success(`Account "${name}" added!`);
    }
    this.form.account = name;
    this.isAccountOpen = false;
  }

  viewExpense(e: ExpenseRow): void {
    this.msg.info(`Voucher: ${e.voucher} | ${e.category} | ৳ ${e.amount.toLocaleString()}`);
  }

  deleteExpense(e: ExpenseRow): void {
    this.modal.confirmDelete(`Voucher ${e.voucher}`, 'This will reverse the expense entry.').subscribe(ok => {
      if (ok) {
        this.expenses.update(list => list.filter(item => item.id !== e.id));
        this.msg.success(`Expense voucher ${e.voucher} removed.`);
      }
    });
  }
}
