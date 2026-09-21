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
            <nz-select [(ngModel)]="from" name="from" class="w-full">
              <nz-option nzValue="Counter Cash (৳ 84,250)" nzLabel="Counter Cash (৳ 84,250)"></nz-option>
              <nz-option nzValue="Islami Bank (৳ 2,42,000)" nzLabel="Islami Bank (৳ 2,42,000)"></nz-option>
              <nz-option nzValue="bKash Merchant (৳ 6,300)" nzLabel="bKash Merchant (৳ 6,300)"></nz-option>
            </nz-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment To (Destination Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="to" name="to" class="w-full">
              <nz-option nzValue="Counter Cash" nzLabel="Counter Cash"></nz-option>
              <nz-option nzValue="Islami Bank" nzLabel="Islami Bank"></nz-option>
              <nz-option nzValue="bKash Merchant" nzLabel="bKash Merchant"></nz-option>
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
export class ReconciliationAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);

  from = 'Counter Cash (৳ 84,250)';
  to = 'Islami Bank';
  amount = 0;
  note = '';

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/reconciliation']);
    }
  }

  submitForm(): void {
    if (this.amount <= 0) {
      this.msg.error('Please enter a valid transfer amount');
      return;
    }
    this.msg.success(`Fund transfer of ৳ ${this.amount.toLocaleString()} submitted!`);
    this.router.navigate(['/reconciliation']);
  }
}
