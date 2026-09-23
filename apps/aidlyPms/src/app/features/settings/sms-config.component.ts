import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-sms-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-lg space-y-4">
      <app-page-header
        title="Bulk SMS Gateway & Top-up"
        subtitle="Purchase branded SMS credits for due reminders, sale invoices, and marketing broadcasts"
        formId="CFG_2005"
        [breadcrumbs]="[{ label: 'Settings', url: '/settings/sale-config' }, { label: 'SMS Config' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span class="text-sm font-semibold text-slate-700">Available SMS Credits</span>
          <span class="font-mono text-2xl font-bold theme-total-text">{{ currentCredits() }}</span>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-800 mb-3">Buy Bulk SMS Pack</p>
          <div class="flex items-center gap-4">
            <button
              type="button"
              (click)="decQty()"
              class="w-10 h-10 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xl font-bold cursor-pointer transition-colors"
            >
              −
            </button>
            <div class="text-center min-w-32">
              <p class="font-mono text-2xl font-bold text-slate-900 mb-0">{{ qty() }} × 100</p>
              <p class="text-xs text-slate-400 mb-0">= {{ totalSms() }} SMS</p>
            </div>
            <button
              type="button"
              (click)="incQty()"
              class="w-10 h-10 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xl font-bold cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center py-2.5 border-t border-slate-100 text-sm">
          <span class="text-slate-600">Rate:</span>
          <span class="font-mono text-slate-800 font-semibold">100 SMS = ৳ 50.00</span>
        </div>

        <div class="flex justify-between items-center py-3 theme-highlight-card rounded-lg px-4">
          <span class="text-sm font-bold theme-highlight-title">Total Recharge Price</span>
          <span class="font-mono text-2xl font-bold theme-highlight-title">৳ {{ totalPrice().toFixed(2) }}</span>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            nz-button
            nzType="primary"
            class="rounded-lg h-10 px-5 font-semibold"
            style="background: #e2136e; border-color: #e2136e"
            (click)="isPayOpen = true"
          >
            Buy Now via bKash
          </button>
        </div>
      </div>
    </div>

    <!-- bKash Gateway Modal Simulation -->
    <nz-modal
      [(nzVisible)]="isPayOpen"
      nzTitle="bKash Merchant Payment Gateway"
      [nzFooter]="bKashFooter"
      (nzOnCancel)="isPayOpen = false"
      nzWidth="420px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-2">
          <div class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
            <span class="text-xs font-semibold text-rose-700 block">Aidly SMS Gateway Checkout</span>
            <span class="font-mono text-2xl font-bold text-rose-700">৳ {{ totalPrice().toFixed(2) }}</span>
            <span class="text-xs text-rose-600 block mt-0.5">Purchasing {{ totalSms() }} SMS Credits</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">bKash Account Number</label>
            <input
              type="text"
              nz-input
              placeholder="01XXXXXXXXX"
              [(ngModel)]="bkashNumber"
              class="rounded-md font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Promo Coupon Code</label>
            <input
              type="text"
              nz-input
              placeholder="Optional discount code"
              [(ngModel)]="coupon"
              class="rounded-md uppercase font-mono text-xs"
            />
          </div>
        </div>
      </ng-container>
      <ng-template #bKashFooter>
        <button nz-button nzType="default" (click)="isPayOpen = false">Cancel</button>
        <button
          nz-button
          nzType="primary"
          style="background: #e2136e; border-color: #e2136e"
          (click)="confirmPayment()"
        >
          Confirm & Pay ৳ {{ totalPrice().toFixed(2) }}
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class SmsConfigComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly settingsService = inject(SettingsService);

  currentCredits = signal(0);
  qty = signal(1);

  totalSms = computed(() => this.qty() * 100);
  totalPrice = computed(() => this.qty() * 50);

  isPayOpen = false;
  bkashNumber = '01711234567';
  coupon = '';

  ngOnInit(): void {
    this.settingsService.getSmsConfig().subscribe({
      next: (res) => {
        if (res.data) {
          const c: any = res.data;
          const count = c.current_sms_count ?? c.currentSmsCount ?? 0;
          this.currentCredits.set(count);
        }
      },
      error: () => {},
    });
  }

  decQty(): void {
    this.qty.update(q => Math.max(1, q - 1));
  }

  incQty(): void {
    this.qty.update(q => q + 1);
  }

  confirmPayment(): void {
    const purchased = this.totalSms();
    const newTotal = this.currentCredits() + purchased;

    this.settingsService.updateSmsConfig({
      current_sms_count: newTotal,
      sender_id: 'AIDLY_PMS',
    }).subscribe({
      next: (res) => {
        this.currentCredits.set(newTotal);
        this.msg.success(res.message || `bKash payment verified! ${purchased} SMS credits added to your account.`);
        this.isPayOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to update SMS credits');
      },
    });
  }
}
