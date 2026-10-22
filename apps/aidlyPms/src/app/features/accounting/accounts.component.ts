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
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ModalService } from '../../core/services/modal.service';
import { AccountingService } from '../../core/services/accounting.service';

interface AccountRow {
  account_no: number;
  name: string;
  provider: string;
  number: string;
  balance: number;
  type: string;
  account_code?: string;
  transaction_count: number;
  has_transactions: boolean;
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
    EmptyStateComponent,
    NzSpinModule,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Transaction & Financial Accounts"
        subtitle="Manage cash drawers, bank accounts, and MFS wallets (bKash, Nagad, Rocket)"
        formId="ACC_1101"
        [breadcrumbs]="[{ label: 'Accounting', url: '/accounting/transaction' }, { label: 'Accounts' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <nz-select id="accounts-all-types-6" nzId="accounts-all-types-6" [(ngModel)]="typeFilter" nzPlaceHolder="All Types" class="w-44 shrink-0" aria-label="All Types">
            <nz-option nzValue="" nzLabel="All Types"></nz-option>
            <nz-option nzValue="Cash" nzLabel="Cash In Hand"></nz-option>
            <nz-option nzValue="Bank" nzLabel="Bank Account"></nz-option>
            <nz-option nzValue="MFS" nzLabel="MFS Wallets"></nz-option>
          </nz-select>
          <button nz-button class="btn-reset rounded-md h-7 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="typeFilter = ''">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <button nz-button class="btn-export rounded-md" (click)="exportAccountsCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <a nz-button class="btn-secondary-action rounded-md" routerLink="/accounting/transaction/add">
            <span nz-icon nzType="plus"></span> Account Form
          </a>
          <button nz-button nzType="primary" class="btn-save rounded-md font-semibold" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Create Account (F2)
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
                      @if (a.transaction_count > 0) {
                        <nz-tag nzColor="default" class="text-[10px] text-slate-500 font-mono">
                          {{ a.transaction_count }} txns
                        </nz-tag>
                      }
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
                       aria-label="View Statement">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openEditModal(a)"
                        nz-tooltip
                        nzTooltipTitle="Edit Account"
                        class="btn-tbl-action btn-tbl-edit"
                       aria-label="Edit Account">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      @if (a.has_transactions) {
                        <span
                          class="btn-tbl-action text-slate-300 border-slate-200 cursor-not-allowed select-none bg-slate-50"
                          nz-tooltip
                          [nzTooltipTitle]="a.transaction_count > 0 ? 'Account has ' + a.transaction_count + ' recorded transaction(s) and cannot be deleted' : (a.balance !== 0 ? 'Account has active balance and cannot be deleted' : 'System account cannot be deleted')"
                        >
                          <span nz-icon nzType="lock" class="text-slate-400"></span>
                        </span>
                      } @else {
                        <button
                          type="button"
                          (click)="deleteAccount(a)"
                          nz-tooltip
                          nzTooltipTitle="Delete Account"
                          class="btn-tbl-action btn-tbl-delete"
                         aria-label="Delete Account">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="p-6 text-center">
                    <app-empty-state
                      [title]="hasError() ? 'Failed to Load Accounts' : (typeFilter ? 'No Matching Accounts' : 'No Financial Accounts Configured')"
                      [description]="hasError() ? 'Unable to reach accounts ledger. Please check your connection and retry.' : (typeFilter ? 'No accounts match the selected account type filter.' : 'Configure cash registers, bank accounts, or MFS wallets (bKash/Nagad) for transaction posting.')"
                      [stateType]="hasError() ? 'error' : (typeFilter ? 'filtered' : 'empty')"
                      icon="bank"
                      [actionText]="hasError() ? 'Retry Loading' : (typeFilter ? 'Clear Filter' : 'Create First Account')"
                      [actionIcon]="hasError() ? 'reload' : (typeFilter ? 'clear' : 'plus')"
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
              <label for="accounts-account-name-holder-1" class="block text-xs font-semibold text-slate-700 mb-1">
                Account Name / Holder <span class="text-rose-500">*</span>
              </label>
              <input id="accounts-account-name-holder-1"
                type="text"
                nz-input
                placeholder="e.g. Counter Cash, Islami Bank Main"
                [(ngModel)]="form.name"
                class="rounded-md" aria-label="Account Name / Holder" />
            </div>

            <div>
              <label for="accounts-account-type-2" class="block text-xs font-semibold text-slate-700 mb-1">
                Account Type <span class="text-rose-500">*</span>
              </label>
              <nz-select id="accounts-account-type-2" nzId="accounts-account-type-2" [(ngModel)]="form.type" class="w-full" aria-label="Account Type">
                <nz-option nzValue="Cash" nzLabel="Cash In Hand"></nz-option>
                <nz-option nzValue="Bank" nzLabel="Bank Account"></nz-option>
                <nz-option nzValue="MFS" nzLabel="bKash / Nagad / Rocket"></nz-option>
              </nz-select>
            </div>

            <div>
              <label for="accounts-phone-account-number-3" class="block text-xs font-semibold text-slate-700 mb-1">
                Phone / Account Number
              </label>
              <input id="accounts-phone-account-number-3"
                type="text"
                nz-input
                placeholder="e.g. +880 1711... or IBBL-4012-..."
                [(ngModel)]="form.number"
                class="rounded-md" aria-label="Phone / Account Number" />
            </div>

            <div>
              <label for="accounts-provider-description-4" class="block text-xs font-semibold text-slate-700 mb-1">Provider Description</label>
              <input id="accounts-provider-description-4"
                type="text"
                nz-input
                placeholder="e.g. Bank Account, bKash Merchant, Drawer"
                [(ngModel)]="form.provider"
                class="rounded-md" aria-label="Provider Description" />
            </div>

            @if (modalMode === 'create') {
              <div class="col-span-1 md:col-span-2">
                <label for="accounts-initial-opening-balance-5" class="block text-xs font-semibold text-slate-700 mb-1">Initial Opening Balance (৳)</label>
                <input id="accounts-initial-opening-balance-5"
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="form.balance"
                  class="rounded-md font-mono" aria-label="Initial Opening Balance (৳)" />
              </div>
            }
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Printable Account Statement Modal -->
    <nz-modal
      [(nzVisible)]="isStatementModalVisible"
      nzTitle="Account Statement & Ledger"
      [nzFooter]="statementFooter"
      (nzOnCancel)="isStatementModalVisible = false"
      nzWidth="750px"
      [nzStyle]="{ top: '24px' }"
    >
      <ng-container *nzModalContent>
        @if (selectedAccount) {
          <div class="space-y-3 py-1 text-slate-800 text-xs">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 mb-0">{{ selectedAccount.name }}</h3>
                  <nz-tag [nzColor]="selectedAccount.type === 'Cash' ? 'green' : selectedAccount.type === 'Bank' ? 'blue' : 'gold'">
                    {{ selectedAccount.type }}
                  </nz-tag>
                </div>
                <p class="text-xs text-slate-500 mb-0">{{ selectedAccount.provider }} · {{ selectedAccount.number }}</p>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 uppercase font-semibold block">Current Balance</span>
                <span class="text-base font-bold font-mono text-emerald-700">৳ {{ selectedAccount.balance | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Ledger Table -->
            <div class="max-h-72 overflow-y-auto border border-slate-200 rounded-md">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 text-slate-600 sticky top-0 uppercase font-semibold text-[10px]">
                  <tr>
                    <th class="p-2">Date</th>
                    <th class="p-2">Ref / Voucher</th>
                    <th class="p-2">Narration</th>
                    <th class="p-2 text-right">Debit (৳)</th>
                    <th class="p-2 text-right">Credit (৳)</th>
                    <th class="p-2 text-right">Balance (৳)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (tx of accountTransactions(); track tx.ledger_no) {
                    <tr class="hover:bg-slate-50">
                      <td class="p-2 font-mono text-slate-500">{{ tx.transaction_date | date:'short' }}</td>
                      <td class="p-2 font-mono font-medium text-slate-800">{{ tx.source_document_no || '—' }}</td>
                      <td class="p-2 text-slate-600">{{ tx.narration || tx.source_document_type }}</td>
                      <td class="p-2 text-right font-mono text-emerald-600 font-semibold">
                        {{ tx.debit_amount > 0 ? (tx.debit_amount | number:'1.2-2') : '—' }}
                      </td>
                      <td class="p-2 text-right font-mono text-rose-600 font-semibold">
                        {{ tx.credit_amount > 0 ? (tx.credit_amount | number:'1.2-2') : '—' }}
                      </td>
                      <td class="p-2 text-right font-mono font-bold text-slate-900">
                        ৳ {{ tx.balance_after | number:'1.2-2' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-4 text-center text-slate-400">
                        {{ isLoadingStatement ? 'Loading ledger statement...' : 'No transactions recorded for this account.' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #statementFooter>
        <button nz-button nzType="default" (click)="isStatementModalVisible = false">Close</button>
        <button nz-button nzType="primary" (click)="printStatement()">
          <span nz-icon nzType="printer"></span> Print Statement
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class AccountsComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly accountingService = inject(AccountingService);

  typeFilter = '';
  isLoading = signal(false);

  accounts = signal<AccountRow[]>([]);
  hasError = signal(false);

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadAccounts();
    } else if (this.typeFilter) {
      this.typeFilter = '';
    } else {
      this.openAddModal();
    }
  }

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

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    const typeMap: Record<number, string> = {
      1: 'Cash',
      2: 'Bank',
      3: 'Bank',
      4: 'MFS',
      5: 'MFS',
      6: 'MFS',
      7: 'Card',
      99: 'Ledger',
    };
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.accounts.set(list.map(a => {
          const txCount = a.transaction_count || 0;
          const balance = Number(a.current_balance) || 0;
          const isSystemAccount = !!(a.account_code && a.account_code.length === 5 && /^[1-5]/.test(a.account_code));
          const hasTransactions = txCount > 0 || balance !== 0 || isSystemAccount;
          return {
            account_no: a.account_no,
            name: a.account_name,
            provider: a.bank_name || (a.account_type === 1 ? 'Cash In Hand' : (a.account_code || 'General')),
            number: a.bank_account_number || a.phone_number || '—',
            balance: balance,
            type: typeMap[a.account_type] || 'Cash',
            account_code: a.account_code || '',
            transaction_count: txCount,
            has_transactions: hasTransactions,
          };
        }));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

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

    const typeCode = this.form.type === 'Cash' ? 1 : this.form.type === 'Bank' ? 2 : 4;

    if (this.modalMode === 'create') {
      this.accountingService.createAccount({
        account_name: this.form.name.trim(),
        account_type: typeCode,
        bank_name: this.form.provider.trim() || undefined,
        bank_account_number: this.form.type === 'Bank' ? this.form.number.trim() : undefined,
        phone_number: this.form.type === 'MFS' ? this.form.number.trim() : undefined,
        opening_balance: Number(this.form.balance) || 0,
        current_balance: Number(this.form.balance) || 0,
      }).subscribe({
        next: () => {
          this.msg.success(`Account "${this.form.name}" created!`);
          this.isModalVisible = false;
          this.loadAccounts();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to create account');
        },
      });
    } else {
      this.accountingService.updateAccount(this.form.account_no, {
        account_name: this.form.name.trim(),
        account_type: typeCode,
        bank_name: this.form.provider.trim() || undefined,
        bank_account_number: this.form.type === 'Bank' ? this.form.number.trim() : undefined,
        phone_number: this.form.type === 'MFS' ? this.form.number.trim() : undefined,
      }).subscribe({
        next: () => {
          this.msg.success(`Account "${this.form.name}" updated!`);
          this.isModalVisible = false;
          this.loadAccounts();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to update account');
        },
      });
    }
  }

  isStatementModalVisible = false;
  selectedAccount: AccountRow | null = null;
  accountTransactions = signal<any[]>([]);
  isLoadingStatement = false;

  viewStatement(a: AccountRow): void {
    this.selectedAccount = a;
    this.accountTransactions.set([]);
    this.isLoadingStatement = true;
    this.isStatementModalVisible = true;
    this.accountingService.getAccountStatement(a.account_no).subscribe({
      next: res => {
        this.isLoadingStatement = false;
        if (res.success && res.data) {
          this.accountTransactions.set(res.data.transactions || []);
        }
      },
      error: () => {
        this.isLoadingStatement = false;
        this.msg.error('Failed to load account ledger statement.');
      }
    });
  }

  printStatement(): void {
    window.print();
  }

  exportAccountsCsv(): void {
    const list = this.filteredAccounts();
    if (!list.length) {
      this.msg.warning('No accounts to export.');
      return;
    }
    const headers = ['SL', 'Account Name', 'Type', 'Provider / Bank', 'Account Number', 'Current Balance (BDT)'];
    const rows = list.map((a, i) => [
      i + 1,
      `"${a.name}"`,
      `"${a.type}"`,
      `"${a.provider}"`,
      `"${a.number}"`,
      a.balance.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} transaction accounts.`);
  }

  deleteAccount(a: AccountRow): void {
    if (a.has_transactions) {
      const reason = a.transaction_count > 0
        ? `Account "${a.name}" has ${a.transaction_count} recorded transaction(s) and cannot be deleted.`
        : (a.balance !== 0 ? `Account "${a.name}" has an active balance of ৳ ${a.balance.toLocaleString()} and cannot be deleted.` : `System chart of account "${a.name}" cannot be deleted.`);
      this.msg.warning(reason);
      return;
    }

    this.modal.confirmAction(
      'Delete Account?',
      `Are you sure you want to delete "${a.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.accountingService.deleteAccount(a.account_no).subscribe({
          next: (res) => {
            if (res.success) {
              this.msg.success(res.message || `Account "${a.name}" deleted successfully`);
              this.loadAccounts();
            } else {
              this.msg.error(res.message || 'Failed to delete account');
            }
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete account');
          },
        });
      }
    });
  }
}
