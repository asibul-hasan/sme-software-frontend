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
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface ReconcileRecord {
  id: string;
  voucher: string;
  date: string;
  by: string;
  from: string;
  to: string;
  amount: number;
  note: string;
}

@Component({
  selector: 'app-reconciliation-list',
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
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Inter-Account Reconciliation & Fund Transfers"
        subtitle="Transfer and reconcile balances between cash drawers, banks, and mobile wallets"
        formId="CASH_1204"
        [breadcrumbs]="[{ label: 'Cash & Finance', url: '/cash/receive' }, { label: 'Reconciliation' }]"
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
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Source Account</label>
            <nz-select
              [(ngModel)]="filterFrom"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Sources"
              class="w-40 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Sources"></nz-option>
              <nz-option nzValue="Counter Cash" nzLabel="Counter Cash"></nz-option>
              <nz-option nzValue="bKash Merchant" nzLabel="bKash Merchant"></nz-option>
              <nz-option nzValue="Islami Bank" nzLabel="Islami Bank"></nz-option>
            </nz-select>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Destination Account</label>
            <nz-select
              [(ngModel)]="filterTo"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Destinations"
              class="w-40 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Destinations"></nz-option>
              <nz-option nzValue="Counter Cash" nzLabel="Counter Cash"></nz-option>
              <nz-option nzValue="bKash Merchant" nzLabel="bKash Merchant"></nz-option>
              <nz-option nzValue="Islami Bank" nzLabel="Islami Bank"></nz-option>
            </nz-select>
          </div>
          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/reconciliation/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Transfer Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Reconciliation (F2)
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
                <th class="p-3">Transfer Info</th>
                <th class="p-3">Note</th>
                <th class="p-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredRecords(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ r.voucher }}</p>
                    <p class="text-xs text-slate-400 mb-0">{{ r.date }} · {{ r.by }}</p>
                  </td>

                  <td class="p-3">
                    <p class="text-xs text-slate-700 font-medium mb-0.5">
                      {{ r.from }} <span class="theme-highlight-subtitle font-bold">→</span> {{ r.to }}
                    </p>
                    <p class="mono text-xs font-bold theme-total-text mb-0">
                      ৳ {{ r.amount.toLocaleString() }}
                    </p>
                  </td>

                  <td class="p-3 text-xs text-slate-500 italic">
                    {{ r.note || '—' }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="viewVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="View Voucher Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="printVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="Print Transfer Voucher"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteVoucher(r)"
                        nz-tooltip
                        nzTooltipTitle="Delete Transfer Voucher"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No reconciliation fund transfers match your search.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Vouchers: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRecords().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Transferred: <strong class="theme-total-text font-mono text-sm">৳ {{ totalReconciledAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Inter-Account Transfers</span>
        </div>
      </div>
    </div>

    <!-- Add Reconciliation Modal -->
    <nz-modal
      [(nzVisible)]="isModalOpen"
      nzTitle="Add Reconciliation (SCR-35)"
      nzOkText="Submit Transfer"
      (nzOnCancel)="isModalOpen = false"
      (nzOnOk)="saveReconciliation()"
      nzWidth="500px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment From (Source Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="form.from" class="w-full">
              <nz-option nzValue="Counter Cash (৳ 84,250)" nzLabel="Counter Cash (৳ 84,250)"></nz-option>
              <nz-option nzValue="Islami Bank (৳ 2,42,000)" nzLabel="Islami Bank (৳ 2,42,000)"></nz-option>
              <nz-option nzValue="bKash Merchant (৳ 6,300)" nzLabel="bKash Merchant (৳ 6,300)"></nz-option>
            </nz-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment To (Destination Account) <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="form.to" class="w-full">
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
              [(ngModel)]="form.amount"
              class="rounded-md font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Note / Reference</label>
            <textarea
              nz-input
              rows="2"
              placeholder="Bank deposit slip number or transfer remarks..."
              [(ngModel)]="form.note"
              class="rounded-md"
            ></textarea>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class ReconciliationListComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  // Standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  filterFrom = '';
  filterTo = '';

  records = signal<ReconcileRecord[]>([
    { id: '1', voucher: 'REC-2026-012', date: '15-09-2026 10:00', by: 'Admin', from: 'Counter Cash', to: 'Islami Bank', amount: 30000, note: 'Bank deposit via counter deposit slip #4102' },
    { id: '2', voucher: 'REC-2026-011', date: '14-09-2026 11:30', by: 'Admin', from: 'bKash Merchant', to: 'Counter Cash', amount: 5000, note: 'Cashout to drawer' },
  ]);

  filteredRecords = computed(() => {
    const f = this.filterFrom;
    const t = this.filterTo;
    return this.records().filter(r => {
      const matchF = !f || r.from.includes(f);
      const matchT = !t || r.to.includes(t);
      return matchF && matchT;
    });
  });

  totalReconciledAmount = computed(() => this.filteredRecords().reduce((sum, r) => sum + (r.amount || 0), 0));

  isModalOpen = false;
  form = {
    from: 'Counter Cash (৳ 84,250)',
    to: 'Islami Bank',
    amount: 0,
    note: '',
  };

  onFilterChange(): void {
    // Reactive filter change handler
  }

  resetFilters(): void {
    const def = getDefaultMonthDateRange();
    this.fromDate = def.fromDate;
    this.toDate = def.toDate;
    this.filterFrom = '';
    this.filterTo = '';
  }

  openAddModal(): void {
    this.form = {
      from: 'Counter Cash (৳ 84,250)',
      to: 'Islami Bank',
      amount: 0,
      note: '',
    };
    this.isModalOpen = true;
  }

  saveReconciliation(): void {
    if (this.form.amount <= 0) {
      this.msg.error('Please enter a valid transfer amount');
      return;
    }

    const fromClean = this.form.from.replace(/\s*\(.*\)/, '');
    const newRec: ReconcileRecord = {
      id: Date.now().toString(),
      voucher: `REC-2026-0${this.records().length + 13}`,
      date: new Date().toLocaleDateString('en-GB') + ' 10:00',
      by: 'Admin',
      from: fromClean,
      to: this.form.to,
      amount: Number(this.form.amount),
      note: this.form.note.trim(),
    };

    this.records.update(list => [newRec, ...list]);
    this.msg.success(`Transfer voucher ${newRec.voucher} recorded!`);
    this.isModalOpen = false;
  }

  viewVoucher(r: ReconcileRecord): void {
    this.msg.info(`${r.voucher}: ${r.from} -> ${r.to} (৳ ${r.amount.toLocaleString()})`);
  }

  printVoucher(r: ReconcileRecord): void {
    this.msg.success(`Printing reconciliation voucher ${r.voucher}`);
  }

  deleteVoucher(r: ReconcileRecord): void {
    this.modal.confirmAction(
      'Delete Transfer Voucher?',
      `Are you sure you want to delete reconciliation transfer voucher "${r.voucher}"?`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.records.update(list => list.filter(item => item.id !== r.id));
        this.msg.success(`Voucher "${r.voucher}" deleted`);
      }
    });
  }
}
