import { Component, inject, OnInit, signal } from '@angular/core';
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
import { AccTransactionAccount, AccReconciliation } from '../../core/models/accounting.models';

@Component({
  selector: 'app-reconciliation-add',
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
  ],
  template: `
    <div class="max-w-lg space-y-4">
      <app-page-header
        title="Add Reconciliation"
        subtitle="Transfer funds between counter cash, bank account, and mobile wallets"
        formId="CASH_1205"
        [breadcrumbs]="[{ label: 'Reconciliation', url: '/reconciliation' }, { label: 'Add Reconciliation' }]"
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
              Payment From (Source Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="fromAccountNo" name="fromAccountNo" class="w-full" nzPlaceHolder="Select Source Account">
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name + ' (৳ ' + (acc.current_balance || 0).toLocaleString() + ')'"></nz-option>
              }
            </nz-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment To (Destination Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="toAccountNo" name="toAccountNo" class="w-full" nzPlaceHolder="Select Destination Account">
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
              [(ngModel)]="amount"
              name="amount"
              class="rounded-md font-mono"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Note / Reference</label>
            <textarea
              nz-input
              rows="3"
              placeholder="Bank deposit slip number or remarks..."
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
              <span nz-icon nzType="check"></span> Submit Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ReconciliationAddComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly accountingService = inject(AccountingService);

  accounts = signal<AccTransactionAccount[]>([]);
  fromAccountNo: number | null = null;
  toAccountNo: number | null = null;
  amount = 0;
  note = '';

  ngOnInit(): void {
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        if (res.data) {
          this.accounts.set(res.data);
          if (res.data.length >= 2) {
            this.fromAccountNo = res.data[0].account_no;
            this.toAccountNo = res.data[1].account_no;
          }
        }
      },
      error: () => {},
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/reconciliation']);
    }
  }

  submitForm(): void {
    if (!this.fromAccountNo || !this.toAccountNo) {
      this.msg.error('Please select both source and destination accounts');
      return;
    }
    if (this.fromAccountNo === this.toAccountNo) {
      this.msg.error('Source and destination accounts must be different');
      return;
    }
    if (this.amount <= 0) {
      this.msg.error('Please enter a valid transfer amount');
      return;
    }

    const payload: Partial<AccReconciliation> = {
      payment_from_account_no: this.fromAccountNo,
      payment_to_account_no: this.toAccountNo,
      amount: Number(this.amount),
      note: this.note.trim() || undefined,
      transfer_date: new Date().toISOString(),
    };

    this.accountingService.createReconciliation(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Fund transfer of ৳ ${this.amount.toLocaleString()} submitted!`);
        this.router.navigate(['/reconciliation']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to submit fund transfer');
      },
    });
  }
}
