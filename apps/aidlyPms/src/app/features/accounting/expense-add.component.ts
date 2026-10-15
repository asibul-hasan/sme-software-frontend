import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AccountingService } from '../../core/services/accounting.service';
import { AccExpenseCategory, AccTransactionAccount } from '../../core/models/accounting.models';

@Component({
  selector: 'app-expense-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Add Expense"
        subtitle="Record shop operational bill or expense payment"
        formId="ACC_1104"
        [breadcrumbs]="[{ label: 'Expenses', url: '/accounting/expenses' }, { label: 'Add Expense' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="default" (click)="goBack()" class="rounded-md">
            <span nz-icon nzType="arrow-left"></span> Back
          </button>
        </div>
      </app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <form (ngSubmit)="submitForm()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Category <span class="text-rose-500">*</span>
            </label>
            <div class="flex gap-1.5">
              <nz-select [(ngModel)]="category" name="category" class="flex-1">
                @for (c of categoriesList(); track c.expense_category_no) {
                  <nz-option [nzValue]="c.name" [nzLabel]="c.name"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isAddCategoryModalVisible = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Expense Category"
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
              [(ngModel)]="amount"
              name="amount"
              class="rounded-md font-mono"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment Account <span class="text-rose-500">*</span>
            </label>
            <div class="flex gap-1.5">
              <nz-select [(ngModel)]="account" name="account" class="flex-1">
                @for (acc of accountsList(); track acc.account_no) {
                  <nz-option [nzValue]="acc.account_name" [nzLabel]="acc.account_name"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isAddAccountModalVisible = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Payment Account"
                class="btn-quick-add"
              >
                <span nz-icon nzType="plus"></span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Note / Description
            </label>
            <textarea
              nz-input
              rows="3"
              placeholder="Description or narration..."
              [(ngModel)]="note"
              name="note"
              class="rounded-md"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" nz-button class="btn-cancel rounded-md" (click)="goBack()">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="btn-save rounded-md font-semibold">
              <span nz-icon nzType="check"></span> Submit Expense
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Add Category Modal -->
    <nz-modal
      [(nzVisible)]="isAddCategoryModalVisible"
      nzTitle="Quick Add Expense Category"
      nzOkText="Add Category"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isAddCategoryModalVisible = false"
      (nzOnOk)="saveNewCategory()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Courier & Delivery"
            [(ngModel)]="newCategoryName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Account Modal -->
    <nz-modal
      [(nzVisible)]="isAddAccountModalVisible"
      nzTitle="Quick Add Payment Account"
      nzOkText="Add Account"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isAddAccountModalVisible = false"
      (nzOnOk)="saveNewAccount()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Account Title / Bank Name *</label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Dutch-Bangla Bank, Nagad Merchant"
            [(ngModel)]="newAccountName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class ExpenseAddComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly accountingService = inject(AccountingService);

  categoriesList = signal<AccExpenseCategory[]>([]);
  accountsList = signal<AccTransactionAccount[]>([]);

  category = '';
  amount = 0;
  account = '';
  note = '';

  // Quick Category
  isAddCategoryModalVisible = false;
  newCategoryName = '';

  // Quick Account
  isAddAccountModalVisible = false;
  newAccountName = '';

  ngOnInit(): void {
    this.accountingService.getExpenseCategories().subscribe(res => {
      if (res.data?.length) {
        this.categoriesList.set(res.data);
        this.category = res.data[0].name;
      }
    });

    this.accountingService.getAccounts().subscribe(res => {
      if (res.data?.length) {
        this.accountsList.set(res.data);
        this.account = res.data[0].account_name;
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/accounting/expenses']);
    }
  }

  saveNewCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.msg.warning('Please enter category name');
      return;
    }
    const name = this.newCategoryName.trim();
    this.accountingService.createExpenseCategory({ name }).subscribe({
      next: (res) => {
        const createdCategory = res.data;
        if (createdCategory) {
          this.categoriesList.update(list => [...list, createdCategory]);
          this.category = createdCategory.name;
          this.msg.success(`Category "${name}" added!`);
        }
        this.newCategoryName = '';
        this.isAddCategoryModalVisible = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create category');
      },
    });
  }

  saveNewAccount(): void {
    if (!this.newAccountName.trim()) {
      this.msg.warning('Please enter account name');
      return;
    }
    const name = this.newAccountName.trim();
    this.accountingService.createAccount({
      account_name: name,
      account_type: 2,
    }).subscribe({
      next: (res) => {
        const createdAccount = res.data;
        if (createdAccount) {
          this.accountsList.update(list => [...list, createdAccount]);
          this.account = createdAccount.account_name;
          this.msg.success(`Payment account "${name}" added!`);
        }
        this.newAccountName = '';
        this.isAddAccountModalVisible = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create account');
      },
    });
  }

  submitForm(): void {
    if (this.amount <= 0) {
      this.msg.error('Please enter a valid expense amount');
      return;
    }

    const selectedCat = this.categoriesList().find(c => c.name === this.category);
    const selectedAcc = this.accountsList().find(a => a.account_name === this.account);

    const catNo = selectedCat ? selectedCat.expense_category_no : 1;
    const accNo = selectedAcc ? selectedAcc.account_no : 1;
    const methodCode = this.account.toLowerCase().includes('bank') ? 2 : this.account.toLowerCase().includes('bkash') ? 4 : 1;

    this.accountingService.createExpense({
      expense_category_no: catNo,
      account_no: accNo,
      amount: Number(this.amount),
      note: this.note.trim() || undefined,
      payment_method: methodCode,
    }).subscribe({
      next: () => {
        this.msg.success(`Expense of ৳ ${this.amount} recorded successfully under ${this.category}!`);
        this.router.navigate(['/accounting/expenses']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to record expense');
      },
    });
  }
}
