import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ApiService } from '../../core/services/api.service';
import { SubPharmacySubscription, SubSubscriptionPayment } from '../../core/models';

interface BillingHistoryRow {
  product: string;
  ref: string;
  date: string;
  start: string;
  end: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Software License & Subscription"
        subtitle="Manage cloud SaaS subscription tier, automated renewal billing, and payment history"
        formId="SUB_2101"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Subscription' }]"
      >
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            nz-button
            nzType="primary"
            class="rounded-md"
            (click)="isPayOpen = true"
          >
            <span nz-icon nzType="credit-card"></span> Renew / Pay Subscription
          </button>
        </div>
      </app-page-header>

      <!-- 4 Metric Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p class="text-xs font-semibold text-slate-500 mb-1">Billing Frequency</p>
          <div class="flex rounded-lg border border-slate-200 overflow-hidden mt-1">
            <button
              type="button"
              (click)="cycle = 'Monthly'"
              class="flex-1 py-1 text-xs font-medium border-0 cursor-pointer transition-colors"
              [ngClass]="cycle === 'Monthly' ? 'theme-pill-active' : 'bg-white text-slate-600 hover:bg-slate-50'"
            >
              Monthly
            </button>
            <button
              type="button"
              (click)="cycle = 'Yearly'"
              class="flex-1 py-1 text-xs font-medium border-0 cursor-pointer transition-colors"
              [ngClass]="cycle === 'Yearly' ? 'theme-pill-active' : 'bg-white text-slate-600 hover:bg-slate-50'"
            >
              Yearly
            </button>
          </div>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p class="text-xs font-semibold text-slate-500 mb-0.5">Next Renewal Due</p>
          <p class="font-mono font-bold text-slate-900 text-sm mb-0">{{ renewalDueDate() }}</p>
          <span class="text-[11px] text-amber-600 font-medium">{{ daysRemaining() }} days remaining</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p class="text-xs font-semibold text-slate-500 mb-0.5">Payable Fee</p>
          <p class="font-mono font-bold theme-total-text text-base mb-0">
            ৳ {{ cycle === 'Monthly' ? '500.00' : '5,000.00' }}
          </p>
          <span class="text-[11px] text-slate-400">per {{ cycle.toLowerCase() }}</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p class="text-xs font-semibold text-slate-500 mb-0.5">License Tier</p>
          <div>
            <nz-tag nzColor="success" class="text-[11px] font-semibold px-2 py-0.5">● Active Cloud</nz-tag>
          </div>
          <span class="text-[11px] text-slate-400 block mt-0.5">{{ planName() }}</span>
        </div>
      </div>

      <!-- History Table Area -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Plan / Product</th>
                <th class="p-3">Reference / TrxID</th>
                <th class="p-3">Payment Date</th>
                <th class="p-3">Coverage Period</th>
                <th class="p-3 text-right">Amount Paid</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-center w-24">Receipt</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (h of history; track h.ref) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 font-semibold text-slate-900 text-xs">{{ h.product }}</td>
                  <td class="p-3 font-mono text-xs text-slate-600">{{ h.ref }}</td>
                  <td class="p-3 font-mono text-xs text-slate-500">{{ h.date }}</td>
                  <td class="p-3 font-mono text-xs text-slate-500">{{ h.start }} → {{ h.end }}</td>
                  <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ h.amount.toFixed(2) }}
                  </td>
                  <td class="p-3 text-center">
                    <nz-tag nzColor="success" class="text-[11px] font-semibold px-2 py-0.5">
                      {{ h.status }}
                    </nz-tag>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center justify-center">
                      <button
                        type="button"
                        (click)="printInvoice(h)"
                        nz-tooltip
                        nzTooltipTitle="Print Billing Receipt"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-400 text-xs">
                    No payment history yet. Active on standard trial license.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Billing Invoices: <strong class="text-slate-900 font-semibold font-mono">{{ history.length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Subscription Paid: <strong class="theme-total-text font-mono text-sm">৳ {{ totalSubscriptionPaid() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">SaaS Cloud Billing History</span>
        </div>
      </div>
    </div>

    <!-- Renewal Payment Modal -->
    <nz-modal
      [(nzVisible)]="isPayOpen"
      nzTitle="Renew Aidly PMS Pro Subscription"
      [nzFooter]="payFooter"
      (nzOnCancel)="isPayOpen = false"
      nzWidth="440px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-2">
          <div class="p-4 theme-highlight-card rounded-xl text-center">
            <span class="text-xs font-semibold theme-highlight-title uppercase tracking-wide block">
              {{ cycle }} Renewal Amount
            </span>
            <span class="font-mono text-2xl font-bold theme-highlight-title">
              ৳ {{ cycle === 'Monthly' ? '500.00' : '5,000.00' }}
            </span>
            <span class="text-xs theme-highlight-subtitle block mt-1">Extends license valid through 30 days</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Select Gateway</label>
            <select
              [(ngModel)]="gateway"
              class="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-white"
            >
              <option value="bKash">bKash Merchant (Instant Auto-Activation)</option>
              <option value="Nagad">Nagad</option>
              <option value="Bank">Bank Deposit / Cheque</option>
            </select>
          </div>
        </div>
      </ng-container>
      <ng-template #payFooter>
        <button nz-button nzType="default" (click)="isPayOpen = false">Cancel</button>
        <button
          nz-button
          nzType="primary"
          style="background: #e2136e; border-color: #e2136e"
          (click)="confirmRenewal()"
        >
          Confirm Payment
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class SubscriptionComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly api = inject(ApiService);

  cycle: 'Monthly' | 'Yearly' = 'Monthly';
  isPayOpen = false;
  gateway = 'bKash';

  planName = signal<string>('Standard Pharmacy Cloud');
  renewalDueDate = signal<string>('14 Oct 2026');
  daysRemaining = signal<number>(30);

  history: BillingHistoryRow[] = [];

  ngOnInit(): void {
    this.loadSubscriptionData();
  }

  loadSubscriptionData(): void {
    this.api.get<any>('sub/subscription').subscribe({
      next: res => {
        if (res.data) {
          this.planName.set(res.data.plan_name || 'Standard Pharmacy Cloud');
          if (res.data.next_payment_date) {
            this.renewalDueDate.set(new Date(res.data.next_payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
          }
          this.daysRemaining.set(res.data.days_remaining ?? 30);
        }
      }
    });

    this.api.get<SubSubscriptionPayment[]>('sub/payments').subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          this.history = res.data.map(p => ({
            product: 'PMS Pro ' + (p.final_amount > 1000 ? 'Yearly' : 'Monthly'),
            ref: p.transaction_reference,
            date: new Date(p.payment_timestamp).toLocaleDateString('en-GB'),
            start: new Date(p.payment_timestamp).toLocaleDateString('en-GB'),
            end: new Date(new Date(p.payment_timestamp).getTime() + 30 * 86400000).toLocaleDateString('en-GB'),
            amount: Number(p.final_amount),
            status: p.payment_status
          }));
        }
      }
    });
  }

  totalSubscriptionPaid(): number {
    return this.history.reduce((sum, h) => sum + h.amount, 0);
  }

  confirmRenewal(): void {
    this.api.post<SubSubscriptionPayment>('sub/pay-bkash', {
      billing_cycle: this.cycle,
      payment_gateway: this.gateway
    }).subscribe({
      next: res => {
        this.msg.success(res.message || 'Subscription renewal verified! Cloud sync active.');
        this.isPayOpen = false;
        this.loadSubscriptionData();
      },
      error: err => {
        this.msg.error(err?.error?.message || 'Subscription payment failed');
      }
    });
  }

  printInvoice(h: BillingHistoryRow): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tax Invoice - ${h.ref}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; }
            .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            th { background: #f8fafc; font-weight: 600; }
            .total { font-weight: bold; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Aidly PMS — Subscription Tax Invoice</div>
            <div class="meta">Invoice Reference: ${h.ref} | Date: ${h.date}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Coverage Period</th>
                <th>Status</th>
                <th style="text-align: right;">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${h.product}</td>
                <td>${h.start} to ${h.end}</td>
                <td>${h.status}</td>
                <td style="text-align: right; font-weight: bold;">৳ ${h.amount.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="total" style="text-align: right;">Total Paid:</td>
                <td class="total" style="text-align: right;">৳ ${h.amount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center;">
            Thank you for subscribing to Aidly PMS. This is an electronically generated receipt.
          </p>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  }
}
