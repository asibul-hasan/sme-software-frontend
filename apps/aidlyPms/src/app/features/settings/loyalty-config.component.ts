import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SettingsService } from '../../core/services/settings.service';
import { CfgLoyaltyConfig } from '../../core/models/config.models';

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

      <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
        <span nz-icon nzType="info-circle" class="text-amber-600 text-base mt-0.5 flex-shrink-0"></span>
        <div>
          <span class="font-bold text-amber-900">Feature Preview (Coming in Phase 3):</span>
          <p class="text-[11px] text-amber-700 mb-0 mt-0.5">Points accumulation and checkout redemption ledger are currently in preview. Configuration saved here will activate once the customer points ledger engine is deployed.</p>
        </div>
      </div>

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
export class LoyaltyConfigComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly settingsService = inject(SettingsService);

  isEnabled = true;
  spendForPoint = 100;
  pointsPerTaka = 10;
  minRedeemPoints = 100;
  maxRedeemPoints = 500;

  ngOnInit(): void {
    this.settingsService.getLoyaltyConfig().subscribe({
      next: (res) => {
        if (res.data) {
          const c: any = res.data;
          this.isEnabled = c.is_enabled ?? c.isEnabled ?? true;
          if (c.earning_spend_amount_per_point !== undefined) this.spendForPoint = c.earning_spend_amount_per_point;
          if (c.redemption_points_per_taka !== undefined) this.pointsPerTaka = c.redemption_points_per_taka;
          if (c.min_redeem_points !== undefined) this.minRedeemPoints = c.min_redeem_points;
          if (c.max_redeem_limit_per_tx !== undefined) this.maxRedeemPoints = c.max_redeem_limit_per_tx;
        }
      },
      error: () => {},
    });
  }

  saveLoyaltyConfig(): void {
    const payload: Partial<CfgLoyaltyConfig> = {
      is_enabled: this.isEnabled,
      earning_spend_amount_per_point: Number(this.spendForPoint) || 100,
      redemption_points_per_taka: Number(this.pointsPerTaka) || 10,
      min_redeem_points: Number(this.minRedeemPoints) || 100,
      max_redeem_limit_per_tx: Number(this.maxRedeemPoints) || 500,
    };

    this.settingsService.updateLoyaltyConfig(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'Customer loyalty rewards program configuration updated!');
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to update loyalty settings');
      },
    });
  }
}
