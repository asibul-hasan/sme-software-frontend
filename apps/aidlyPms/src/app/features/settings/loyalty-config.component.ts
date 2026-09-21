import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-loyalty-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-lg space-y-4">
      <app-page-header
        title="Customer Loyalty & Rewards Program"
        subtitle="Configure points accumulation rules, redemption ratios, and checkout deductions"
        formId="CFG_2004"
        [breadcrumbs]="[{ label: 'Settings', url: '/settings/sale-config' }, { label: 'Loyalty Config' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div class="flex items-center justify-between p-4 theme-highlight-card rounded-xl">
          <div>
            <p class="text-sm font-bold theme-highlight-title mb-0.5">Enable Loyalty Program</p>
            <p class="text-xs theme-highlight-subtitle mb-0">Allow customer points earning & checkout redemptions</p>
          </div>
          <label nz-checkbox [(ngModel)]="isEnabled"></label>
        </div>

        @if (isEnabled) {
          <div class="space-y-4 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Earning Rule (Spend threshold)
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="spendForPoint"
                  class="w-28 rounded-md font-mono"
                />
                <span class="text-sm text-slate-600">৳ spend = 1 loyalty point</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Redemption Rule (Point conversion value)
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="pointsPerTaka"
                  class="w-28 rounded-md font-mono"
                />
                <span class="text-sm text-slate-600">points = ৳ 1.00 cash deduction</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Points Required to Redeem
              </label>
              <input
                type="number"
                nz-input
                [(ngModel)]="minRedeemPoints"
                class="w-32 rounded-md font-mono"
              />
              <p class="text-xs text-slate-400 mt-1">
                Patients cannot redeem until reaching this account points threshold.
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Max Redeem Points per Transaction
              </label>
              <input
                type="number"
                nz-input
                [(ngModel)]="maxRedeemPoints"
                class="w-32 rounded-md font-mono"
              />
              <p class="text-xs text-slate-400 mt-1">
                Safety cap to protect revenue on single high-value purchases.
              </p>
            </div>
          </div>
        }

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" nz-button nzType="primary" (click)="saveLoyaltyConfig()" class="rounded-md">
            <span nz-icon nzType="save"></span> Save Loyalty Rules
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LoyaltyConfigComponent {
  private readonly msg = inject(NzMessageService);

  isEnabled = true;
  spendForPoint = 100;
  pointsPerTaka = 10;
  minRedeemPoints = 100;
  maxRedeemPoints = 500;

  saveLoyaltyConfig(): void {
    this.msg.success('Customer loyalty rewards program configuration updated!');
  }
}
