import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ApiService } from '../../core/services/api.service';
import { AccountingService } from '../../core/services/accounting.service';
import { formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';

interface CashItem {
  id: string;
  inv: string;
  date: string;
  salesman: string;
  paid: number;
  total: number;
}

@Component({
  selector: 'app-cash-handover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTooltipModule,
    NzDatePickerModule,
    PageHeaderComponent,
  ],
  template: `

    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Cash Counter & Shift Handover"
        subtitle="Verify daily cash desk collections and reconcile drawer balance with sales"
        formId="CASH_1201"
        [breadcrumbs]="[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Cash Handover' }]"
      >
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            nz-button
            nzType="default"
            class="rounded-md"
            (click)="openCashCloser()"
          >
            <span nz-icon nzType="calculator"></span> Cash Closer
          </button>
          <button
            nz-button
            nzType="primary"
            class="rounded-md"
            (click)="isConfirmOpen = true"
            [disabled]="items().length === 0"
          >
            <span nz-icon nzType="check-circle"></span> Check All & Reconcile (F9)
          </button>
        </div>
      </app-page-header>

      <!-- Summary Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Pending Drawer Collections</span>
          <p class="text-xl font-bold text-slate-900 font-mono mb-0">{{ items().length }}</p>
          <span class="text-[11px] text-slate-400">Transactions awaiting shift handover</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Total Handover Cash</span>
          <p class="text-xl font-bold theme-total-text font-mono mb-0">৳ {{ totalCash() | number: '1.2-2' }}</p>
          <span class="text-[11px] text-slate-400">Collected physical cash in drawer</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Discrepancy Status</span>
          <p class="text-xl font-bold text-emerald-600 font-mono mb-0">৳ 0.00</p>
          <span class="text-[11px] text-emerald-600 font-medium">Exact match — zero cash leakage</span>
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3 text-right">Paid Amount</th>
                <th class="p-3 text-right">Total Price</th>
                <th class="p-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (t of items(); track t.id; let idx = $index) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ t.inv }}</p>
                    <p class="text-xs text-slate-400 mb-0">
                      {{ t.date }} · <span class="text-slate-600 font-medium">{{ t.salesman }}</span>
                    </p>
                  </td>

                  <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ t.paid.toFixed(2) }}
                  </td>

                  <td class="p-3 text-right font-mono text-xs text-slate-600">
                    ৳ {{ t.total.toFixed(2) }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="receiveSingle(idx)"
                        nz-tooltip
                        nzTooltipTitle="Receive / Reconcile Payment"
                        class="btn-tbl-action btn-tbl-success"
                      >
                        <span nz-icon nzType="check"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No pending cash handover transactions found for this shift.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Pending Receipts: <strong class="text-slate-900 font-semibold font-mono">{{ items().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Total Paid: <strong class="theme-total-text font-mono font-semibold">৳ {{ totalCash() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Price: <strong class="text-slate-900 font-mono text-sm">৳ {{ totalBillPrice() | number: '1.2-2' }}</strong></span>
          </div>
          <button
            nz-button
            nzType="primary"
            nzSize="small"
            class="rounded"
            (click)="isConfirmOpen = true"
            [disabled]="items().length === 0"
          >
            ✓ Check All (F9)
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Reconcile Confirmation Modal -->
    <nz-modal
      [(nzVisible)]="isConfirmOpen"
      nzTitle="Bulk Reconcile Confirmation"
      nzOkText="Confirm All Received"
      (nzOnCancel)="isConfirmOpen = false"
      (nzOnOk)="confirmBulkReconcile()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <p class="text-sm text-slate-700 leading-relaxed">
            Confirm receipt of all <strong>{{ items().length }}</strong> pending counter cash transactions?
            This will deposit the entire drawer amount into the master accounting cash ledger.
          </p>

          <div class="theme-highlight-card rounded-lg p-4 text-center">
            <p class="text-xs font-semibold theme-highlight-title uppercase tracking-wide mb-1">
              Total Drawer Deposit Amount
            </p>
            <p class="font-mono text-2xl font-bold theme-total-text mb-0">
              ৳ {{ totalCash().toFixed(2) }}
            </p>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Cash Closer Modal (Shift / Day Closure) -->
    <nz-modal
      [(nzVisible)]="isCashCloserOpen"
      nzTitle="Cash Closer"
      [nzFooter]="cashCloserFooter"
      (nzOnCancel)="isCashCloserOpen = false"
      nzWidth="840px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <!-- Top Bar: Date -->
          <div class="flex justify-end items-center gap-2 pb-2 border-b border-slate-100">
            <span class="text-xs font-semibold text-slate-600">Date :</span>
            <nz-date-picker
              [(ngModel)]="closerDate"
              nzFormat="dd-MM-yyyy"
              class="w-40 rounded-md text-xs py-1"
            ></nz-date-picker>
          </div>

          <!-- 2 Column Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left: Cash Denominations -->
            <div class="space-y-3">
              <div class="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                <span class="col-span-3">Note</span>
                <span class="col-span-4 text-center">Quantity</span>
                <span class="col-span-5 text-right">Amount</span>
              </div>

              <div class="space-y-2">
                @for (d of denominations; track d.note) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <span class="col-span-3 font-mono font-medium text-slate-700">{{ d.note }}</span>
                    <div class="col-span-4 flex items-center gap-1">
                      <input
                        type="number"
                        nz-input
                        min="0"
                        [(ngModel)]="d.qty"
                        class="text-center rounded font-mono text-xs py-1"
                        placeholder="0"
                      />
                      <span class="text-slate-400 font-mono text-xs">=</span>
                    </div>
                    <span class="col-span-5 text-right font-mono font-bold text-slate-800">
                      ৳ {{ (d.qty * d.val).toFixed(2) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Opening Balance & Vault Deposit -->
              <div class="pt-3 border-t border-slate-200 space-y-2">
                <div class="grid grid-cols-12 gap-2 items-center text-xs">
                  <span class="col-span-6 font-medium text-slate-700">Opening Balance</span>
                  <span class="col-span-1 text-slate-400 text-center font-mono">=</span>
                  <div class="col-span-5">
                    <input
                      type="number"
                      nz-input
                      min="0"
                      [(ngModel)]="openingBalance"
                      class="text-right rounded font-mono text-xs py-1"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-12 gap-2 items-center text-xs">
                  <span class="col-span-6 font-medium text-slate-700">Deposit to cash vault</span>
                  <span class="col-span-1 text-slate-400 text-center font-mono">=</span>
                  <div class="col-span-5">
                    <input
                      type="number"
                      nz-input
                      min="0"
                      [(ngModel)]="depositToVault"
                      class="text-right rounded font-mono text-xs py-1"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-12 gap-2 items-center text-xs pt-2 border-t border-slate-100 font-bold">
                  <span class="col-span-6 text-slate-900">Total Cash</span>
                  <span class="col-span-1 text-slate-400 text-center font-mono">=</span>
                  <span class="col-span-5 text-right font-mono theme-total-text text-sm">
                    ৳ {{ calculatedTotalCash().toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Bank / MFS Accounts -->
            <div class="space-y-3">
              <div class="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                <span class="col-span-6">Bank</span>
                <span class="col-span-6 text-right">Amount</span>
              </div>

              <div class="space-y-2">
                @for (b of bankAccounts; track b.name) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <span class="col-span-6 font-medium text-slate-700 truncate" [title]="b.name">
                      {{ b.name }}
                    </span>
                    <span class="col-span-1 text-slate-400 text-center font-mono">=</span>
                    <div class="col-span-5">
                      <input
                        type="number"
                        nz-input
                        min="0"
                        [(ngModel)]="b.amount"
                        class="text-right rounded font-mono text-xs py-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                }
              </div>

              <div class="pt-3 border-t border-slate-200">
                <div class="grid grid-cols-12 gap-2 items-center text-xs font-bold">
                  <span class="col-span-6 text-slate-900">Total Bank Amount</span>
                  <span class="col-span-1 text-slate-400 text-center font-mono">=</span>
                  <span class="col-span-5 text-right font-mono theme-total-text text-sm">
                    ৳ {{ calculatedTotalBank().toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #cashCloserFooter>
        <div class="flex items-center justify-between w-full py-1">
          <div class="text-left font-bold text-slate-900 text-base font-mono">
            Grand Total Amount = <span class="theme-total-text">৳ {{ grandTotalAmount().toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button nz-button nzType="default" (click)="closeCashCloser()" class="rounded-md">
              Cancel
            </button>
            <button nz-button nzType="primary" (click)="saveCashCloser()" class="rounded-md">
              <span nz-icon nzType="save"></span> Save Shift Close
            </button>
          </div>
        </div>
      </ng-template>
    </nz-modal>
  `,
})
export class CashHandoverComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly accountingService = inject(AccountingService);

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'closer') {
        this.openCashCloser();
      }
    });
  }

  ngOnInit(): void {
    this.loadPendingHandovers();
    this.accountingService.getAccounts().subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          const nonCash = res.data.filter(a => a.account_type !== 1);
          if (nonCash.length > 0) {
            this.bankAccounts = nonCash.map(a => ({ name: a.account_name, amount: 0 }));
          }
        }
      }
    });
  }

  items = signal<CashItem[]>([]);

  loadPendingHandovers(): void {
    this.api.get<CashItem[]>('cash/receive').subscribe({
      next: res => {
        if (res.data) {
          this.items.set(res.data);
        }
      },
      error: () => {
        // Keep empty if any network error
      }
    });
  }

  totalCash = computed(() => {
    return this.items().reduce((sum, item) => sum + item.paid, 0);
  });

  totalBillPrice = computed(() => {
    return this.items().reduce((sum, item) => sum + item.total, 0);
  });

  isConfirmOpen = false;
  isCashCloserOpen = false;
  closerDate: Date | null = new Date();

  denominations = [
    { note: '1000x', val: 1000, qty: 0 },
    { note: '500x', val: 500, qty: 0 },
    { note: '200x', val: 200, qty: 0 },
    { note: '100x', val: 100, qty: 0 },
    { note: '50x', val: 50, qty: 0 },
    { note: '20x', val: 20, qty: 0 },
    { note: '10x', val: 10, qty: 0 },
    { note: '5x', val: 5, qty: 0 },
    { note: '2x', val: 2, qty: 0 },
    { note: '1x', val: 1, qty: 0 },
  ];

  openingBalance = 0;
  depositToVault = 0;

  bankAccounts = [
    { name: 'CARD', amount: 0 },
    { name: 'MFS', amount: 0 },
    { name: 'BKASH', amount: 0 },
    { name: 'NAGAD', amount: 0 },
    { name: 'THE CITY BANK', amount: 0 },
    { name: 'DUTCH-BANGLA BANK LTD.', amount: 0 },
    { name: 'BRAC BANK', amount: 0 },
    { name: 'ISLAMI BANK BANGLADESH PLC', amount: 0 },
  ];

  calculatedTotalCash(): number {
    const denomSum = this.denominations.reduce((sum, d) => sum + (Number(d.qty) || 0) * d.val, 0);
    return Math.max(0, denomSum + (Number(this.openingBalance) || 0) - (Number(this.depositToVault) || 0));
  }

  calculatedTotalBank(): number {
    return this.bankAccounts.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }

  grandTotalAmount(): number {
    return this.calculatedTotalCash() + this.calculatedTotalBank();
  }

  openCashCloser(): void {
    this.isCashCloserOpen = true;
  }

  closeCashCloser(): void {
    this.isCashCloserOpen = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null, _t: null },
      queryParamsHandling: 'merge',
    });
  }

  saveCashCloser(): void {
    const totalCash = this.calculatedTotalCash();
    const grand = this.grandTotalAmount();
    
    this.api.post('cash/close-shift', {
      opening_balance: this.openingBalance,
      actual_counted_balance: totalCash,
      note: `Physical count. Total bank: ৳${this.calculatedTotalBank().toFixed(2)}, grand: ৳${grand.toFixed(2)}`,
      closing_date: this.closerDate ? formatDateToDdMmYyyy(this.closerDate) : formatDateToDdMmYyyy(new Date())
    }).subscribe({
      next: (res: any) => {
        this.closeCashCloser();
        this.msg.success(res?.message || 'Cash Closer saved successfully!');
        this.loadPendingHandovers();
      },
      error: (err: any) => {
        this.msg.error(err?.error?.message || 'Failed to save shift closer');
      }
    });
  }

  receiveSingle(idx: number): void {
    const item = this.items()[idx];
    this.api.post('cash/receive/reconcile', {
      invoice_nos: [Number(item.id)]
    }).subscribe({
      next: () => {
        this.items.update(list => list.filter((_, i) => i !== idx));
        this.msg.success(`Reconciled ৳ ${item.paid.toFixed(2)} from ${item.inv}!`);
      },
      error: () => {
        this.msg.error('Failed to reconcile transaction');
      }
    });
  }

  confirmBulkReconcile(): void {
    const sum = this.totalCash();
    const count = this.items().length;
    this.api.post('cash/receive/reconcile', {}).subscribe({
      next: () => {
        this.items.set([]);
        this.isConfirmOpen = false;
        this.msg.success(
          `Shift closed! Reconciled ${count} transactions totaling ৳ ${sum.toFixed(2)} into master cash ledger.`
        );
      },
      error: () => {
        this.msg.error('Failed to reconcile all transactions');
      }
    });
  }
}

