import { Component, inject } from '@angular/core';
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
                @for (c of categories; track c) {
                  <nz-option [nzValue]="c" [nzLabel]="c"></nz-option>
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
                @for (acc of accounts; track acc) {
                  <nz-option [nzValue]="acc" [nzLabel]="acc"></nz-option>
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
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="rounded-md">
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
export class ExpenseAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);

  categories = ['Rent', 'Salary', 'Utilities', 'Maintenance', 'Tea & Refreshment', 'Stationery'];
  category = 'Rent';
  amount = 0;

  accounts = ['Counter Cash', 'Islami Bank Account', 'bKash Merchant Account', 'BRAC Bank Limited'];
  account = 'Counter Cash';
  note = '';

  // Quick Category
  isAddCategoryModalVisible = false;
  newCategoryName = '';

  // Quick Account
  isAddAccountModalVisible = false;
  newAccountName = '';

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
    this.categories = [...this.categories, name];
    this.category = name;
    this.newCategoryName = '';
    this.isAddCategoryModalVisible = false;
    this.msg.success(`Category "${name}" added!`);
  }

  saveNewAccount(): void {
    if (!this.newAccountName.trim()) {
      this.msg.warning('Please enter account name');
      return;
    }
    const name = this.newAccountName.trim();
    this.accounts = [...this.accounts, name];
    this.account = name;
    this.newAccountName = '';
    this.isAddAccountModalVisible = false;
    this.msg.success(`Payment account "${name}" added!`);
  }

  submitForm(): void {
    if (this.amount <= 0) {
      this.msg.error('Please enter a valid expense amount');
      return;
    }
    this.msg.success(`Expense of ৳ ${this.amount} recorded successfully under ${this.category}!`);
    setTimeout(() => {
      this.router.navigate(['/accounting/expenses']);
    }, 400);
  }
}
