import { Component, inject, signal, computed } from '@angular/core';
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

interface AccountRow {
  account_no: number;
  name: string;
  provider: string;
  number: string;
  balance: number;
  type: string;
}

@Component({
  selector: 'app-accounts',
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
        title="Transaction & Financial Accounts"
        subtitle="Manage cash drawers, bank accounts, and MFS wallets (bKash, Nagad, Rocket)"
        formId="ACC_1101"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Accounts' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-select [(ngModel)]="typeFilter" nzPlaceHolder="All Types" class="w-44 shrink-0">
            <nz-option nzValue="" nzLabel="All Types"></nz-option>
            <nz-option nzValue="Cash" nzLabel="Cash In Hand"></nz-option>
            <nz-option nzValue="Bank" nzLabel="Bank Account"></nz-option>
            <nz-option nzValue="MFS" nzLabel="MFS Wallets"></nz-option>
          </nz-select>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="typeFilter = ''">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/accounting/transaction/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Account Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Create Account (F2)
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
                <th class="p-3 text-right">Balance</th>
                <th class="p-3 text-center w-48">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (a of filteredAccounts(); track a.account_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <div class="flex items-center gap-2 mb-0.5">
                      <p class="font-semibold text-slate-900 text-sm mb-0">{{ a.name }}</p>
                      <nz-tag
                        [nzColor]="a.type === 'Cash' ? 'green' : a.type === 'Bank' ? 'blue' : 'gold'"
                        class="text-[11px] font-semibold"
                      >
                        {{ a.type }}
                      </nz-tag>
                    </div>
                    <p class="text-xs text-slate-400 mb-0">
                      {{ a.provider }} @if (a.number !== '—') { <span> · {{ a.number }}</span> }
                    </p>
                  </td>

                  <td class="p-3 text-right font-mono text-sm font-bold theme-total-text">
                    ৳ {{ a.balance.toLocaleString() }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewStatement(a)"
                        nz-tooltip
                        nzTooltipTitle="View Statement"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openEditModal(a)"
                        nz-tooltip
                        nzTooltipTitle="Edit Account"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteAccount(a)"
                        nz-tooltip
                        nzTooltipTitle="Delete Account"
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
                    No transaction accounts match your filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Active Accounts: <strong class="text-slate-900 font-semibold font-mono">{{ filteredAccounts().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Liquid Balance: <strong class="theme-total-text font-mono text-sm">৳ {{ totalAccountBalance() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Treasury & Cash Drawers</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Create Account (SCR-27)' : ('Modify Account: ' + form.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Account' : 'Update Account'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveAccount()"
      nzWidth="680px"
      [nzStyle]="{ top: '32px' }"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Account Name / Holder <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="e.g. Counter Cash, Islami Bank Main"
                [(ngModel)]="form.name"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Account Type <span class="text-rose-500">*</span>
              </label>
              <nz-select [(ngModel)]="form.type" class="w-full">
                <nz-option nzValue="Cash" nzLabel="Cash In Hand"></nz-option>
                <nz-option nzValue="Bank" nzLabel="Bank Account"></nz-option>
                <nz-option nzValue="MFS" nzLabel="bKash / Nagad / Rocket"></nz-option>
              </nz-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Phone / Account Number
              </label>
              <input
                type="text"
                nz-input
                placeholder="e.g. +880 1711... or IBBL-4012-..."
                [(ngModel)]="form.number"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Provider Description</label>
              <input
                type="text"
                nz-input
                placeholder="e.g. Bank Account, bKash Merchant, Drawer"
                [(ngModel)]="form.provider"
                class="rounded-md"
              />
            </div>

            @if (modalMode === 'create') {
              <div class="col-span-1 md:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Initial Opening Balance (৳)</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="form.balance"
                  class="rounded-md font-mono"
                />
              </div>
            }
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class AccountsComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  typeFilter = '';

  accounts = signal<AccountRow[]>([
    { account_no: 1, name: 'Counter Cash', provider: 'Cash In Hand', number: '—', balance: 84250, type: 'Cash' },
    { account_no: 2, name: 'Islami Bank', provider: 'Bank Account', number: 'IBBL-4012-XXXX-5678', balance: 242000, type: 'Bank' },
    { account_no: 3, name: 'Modhumoti Bank', provider: 'Bank Account', number: 'MDB-2298-XXXX-4321', balance: 100000, type: 'Bank' },
    { account_no: 4, name: 'Admin bKash', provider: 'bKash Personal', number: '+880 1711-234567', balance: 12450, type: 'MFS' },
    { account_no: 5, name: 'Pharmacy bKash', provider: 'bKash Merchant', number: '+880 1811-345678', balance: 6300, type: 'MFS' },
  ]);

  filteredAccounts = computed(() => {
    const f = this.typeFilter;
    if (!f) return this.accounts();
    return this.accounts().filter(a => a.type === f);
  });

  totalAccountBalance = computed(() => this.filteredAccounts().reduce((sum, a) => sum + (a.balance || 0), 0));

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    account_no: 0,
    name: '',
    provider: '',
    number: '',
    balance: 0,
    type: 'Bank',
  };

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      account_no: 0,
      name: '',
      provider: 'Bank Account',
      number: '',
      balance: 0,
      type: 'Bank',
    };
    this.isModalVisible = true;
  }

  openEditModal(a: AccountRow): void {
    this.modalMode = 'edit';
    this.form = {
      account_no: a.account_no,
      name: a.name,
      provider: a.provider,
      number: a.number === '—' ? '' : a.number,
      balance: a.balance,
      type: a.type,
    };
    this.isModalVisible = true;
  }

  saveAccount(): void {
    if (!this.form.name.trim()) {
      this.msg.error('Please enter account name');
      return;
    }

    if (this.modalMode === 'create') {
      const nextId = Math.max(...this.accounts().map(x => x.account_no), 0) + 1;
      const newAcc: AccountRow = {
        account_no: nextId,
        name: this.form.name.trim(),
        provider: this.form.provider.trim() || this.form.type,
        number: this.form.number.trim() || '—',
        balance: Number(this.form.balance) || 0,
        type: this.form.type,
      };
      this.accounts.update(list => [...list, newAcc]);
      this.msg.success(`Account "${newAcc.name}" created!`);
    } else {
      this.accounts.update(list =>
        list.map(x =>
          x.account_no === this.form.account_no
            ? {
                ...x,
                name: this.form.name.trim(),
                provider: this.form.provider.trim(),
                number: this.form.number.trim() || '—',
                type: this.form.type,
              }
            : x
        )
      );
      this.msg.success(`Account "${this.form.name}" updated!`);
    }
    this.isModalVisible = false;
  }

  viewStatement(a: AccountRow): void {
    this.msg.info(`Viewing transactions and ledger for ${a.name}`);
  }

  deleteAccount(a: AccountRow): void {
    this.modal.confirmAction(
      'Delete Account?',
      `Are you sure you want to delete "${a.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.accounts.update(list => list.filter(item => item.account_no !== a.account_no));
        this.msg.success(`Account "${a.name}" deleted successfully`);
      }
    });
  }
}
