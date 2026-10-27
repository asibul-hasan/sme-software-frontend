import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AccountingService } from '../../core/services/accounting.service';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

@Component({
  selector: 'app-account-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    PageHeaderComponent,
    MenuActionDirective,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Create Account"
        subtitle="Add a new ledger or deposit account to your pharmacy finance book"
        formId="ACC_1102"
        [breadcrumbs]="[{ label: 'Accounts', url: '/accounting/transaction' }, { label: 'Create Account' }]"
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
            <label for="account-add-account-name-holder-1" class="block text-xs font-semibold text-slate-700 mb-1">
              Account Name / Holder <span class="text-rose-500">*</span>
            </label>
            <input id="account-add-account-name-holder-1"
              type="text"
              nz-input
              placeholder="e.g. Counter Cash, Islami Bank Main"
              [(ngModel)]="name"
              name="name"
              class="rounded-md"
              required aria-label="Account Name / Holder" />
          </div>

          <div>
            <label for="account-add-phone-account-number-2" class="block text-xs font-semibold text-slate-700 mb-1">
              Phone / Account Number <span class="text-rose-500">*</span>
            </label>
            <div class="flex gap-2">
              <span class="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">
                +880
              </span>
              <input id="account-add-phone-account-number-2"
                type="text"
                nz-input
                placeholder="1XXXXXXXXX"
                [(ngModel)]="phone"
                name="phone"
                class="rounded-md flex-1"
                required aria-label="Phone / Account Number" />
            </div>
          </div>

          <div>
            <label for="account-add-account-type-3" class="block text-xs font-semibold text-slate-700 mb-1">
              Account Type <span class="text-rose-500">*</span>
            </label>
            <nz-select id="account-add-account-type-3" nzId="account-add-account-type-3" [(ngModel)]="accountType" name="accountType" class="w-full" aria-label="Account Type">
              <nz-option nzValue="Cash In Hand" nzLabel="Cash In Hand"></nz-option>
              <nz-option nzValue="Bank Account" nzLabel="Bank Account"></nz-option>
              <nz-option nzValue="bKash Personal" nzLabel="bKash Personal"></nz-option>
              <nz-option nzValue="bKash Merchant" nzLabel="bKash Merchant"></nz-option>
              <nz-option nzValue="Nagad" nzLabel="Nagad"></nz-option>
              <nz-option nzValue="Rocket" nzLabel="Rocket"></nz-option>
              <nz-option nzValue="Card POS Machine" nzLabel="Card POS Machine"></nz-option>
            </nz-select>
          </div>

          <div>
            <label for="account-add-initial-balance-4" class="block text-xs font-semibold text-slate-700 mb-1">
              Initial Balance (৳)
            </label>
            <input id="account-add-initial-balance-4"
              type="number"
              nz-input
              placeholder="0.00"
              [(ngModel)]="initialBalance"
              name="initialBalance"
              class="rounded-md font-mono" aria-label="Initial Balance (৳)" />
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" nz-button class="btn-cancel rounded-md" (click)="goBack()">
              Cancel
            </button>
            <button *appMenuAction="'ACC_1102:create'" type="submit" nz-button nzType="primary" class="btn-save rounded-md font-semibold">
              <span nz-icon nzType="check"></span> Submit Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AccountAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly accountingService = inject(AccountingService);

  name = '';
  phone = '';
  accountType = 'Bank Account';
  initialBalance = 0;

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/accounting/transaction']);
    }
  }

  submitForm(): void {
    if (!this.name.trim()) {
      this.msg.error('Please enter account name');
      return;
    }

    const typeCode = this.accountType.includes('Cash')
      ? 1
      : this.accountType.includes('Bank')
      ? 2
      : this.accountType.includes('bKash')
      ? 4
      : this.accountType.includes('Nagad')
      ? 5
      : 7;

    const fullPhone = this.phone.trim() ? `+880 ${this.phone.trim()}` : undefined;

    this.accountingService.createAccount({
      account_name: this.name.trim(),
      account_type: typeCode,
      bank_name: this.accountType,
      bank_account_number: this.accountType.includes('Bank') ? fullPhone : undefined,
      phone_number: !this.accountType.includes('Bank') ? fullPhone : undefined,
      opening_balance: Number(this.initialBalance) || 0,
      current_balance: Number(this.initialBalance) || 0,
    }).subscribe({
      next: () => {
        this.msg.success(`Account "${this.name}" created successfully!`);
        this.router.navigate(['/accounting/transaction']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create account');
      },
    });
  }
}
