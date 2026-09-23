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
import { CfgSaleConfig } from '../../core/models/config.models';

interface SettingToggle {
  key: string;
  label: string;
  desc: string;
  value: boolean;
}

@Component({
  selector: 'app-sale-config',
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
    <div class="max-w-2xl space-y-4">
      <app-page-header
        title="Point of Sale Configuration"
        subtitle="Manage POS sales policies, loss limits, checkout prompts, and inventory visibility"
        formId="CFG_2001"
        [breadcrumbs]="[{ label: 'Settings', url: '/settings/sale-config' }, { label: 'Sale Config' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        @for (t of toggles; track t.key) {
          <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <p class="text-sm font-semibold text-slate-800 mb-0.5">{{ t.label }}</p>
              <p class="text-xs text-slate-400 mb-0">{{ t.desc }}</p>
            </div>
            <label nz-checkbox [(ngModel)]="t.value"></label>
          </div>
        }

        <div class="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <p class="text-sm font-semibold text-slate-800 mb-0.5">Default Business Mode</p>
            <p class="text-xs text-slate-400 mb-0">Initial checkout pricing tier</p>
          </div>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              type="button"
              (click)="businessMode = 'Retail'"
              class="px-4 py-1.5 text-xs font-medium border-0 cursor-pointer transition-colors"
              [ngClass]="businessMode === 'Retail' ? 'theme-pill-active' : 'text-slate-600 bg-white hover:bg-slate-50'"
            >
              Retail
            </button>
            <button
              type="button"
              (click)="businessMode = 'Wholesale'"
              class="px-4 py-1.5 text-xs font-medium border-0 cursor-pointer transition-colors"
              [ngClass]="businessMode === 'Wholesale' ? 'theme-pill-active' : 'text-slate-600 bg-white hover:bg-slate-50'"
            >
              Wholesale
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <p class="text-sm font-semibold text-slate-800 mb-0.5">Opening Stock Markup %</p>
            <p class="text-xs text-slate-400 mb-0">Default markup on opening stock medicine items</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              nz-input
              [(ngModel)]="openingStockMarkup"
              class="w-20 text-center rounded-md font-mono"
            />
            <span class="text-xs text-slate-500 font-semibold">%</span>
          </div>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-semibold text-slate-800 mb-0.5">Maximum Sale Discount %</p>
            <p class="text-xs text-slate-400 mb-0">Salesman authorization ceiling on discounts</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              nz-input
              [(ngModel)]="maxDiscount"
              class="w-20 text-center rounded-md font-mono"
            />
            <span class="text-xs text-slate-500 font-semibold">%</span>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" nz-button nzType="primary" (click)="saveSettings()" class="rounded-md">
            <span nz-icon nzType="save"></span> Save POS Config
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SaleConfigComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly settingsService = inject(SettingsService);

  toggles: SettingToggle[] = [
    { key: 'cashReceived', label: 'Prompt Cash Received', desc: 'Ask for customer cash tendered on checkout to compute change', value: true },
    { key: 'outOfStock', label: 'Allow Out of Stock Sale', desc: 'Allow sale when system inventory is zero or negative', value: false },
    { key: 'allowLoss', label: 'Allow Loss Sale', desc: 'Permit selling medicine below purchase cost price', value: false },
    { key: 'showCost', label: 'Product Purchase Cost Display', desc: 'Show wholesale cost price to sales counter staff', value: false },
    { key: 'showStock', label: 'Show Stock QTY in Search', desc: 'Display available pack units in POS product search', value: true },
    { key: 'showCompany', label: 'Display Company Name', desc: 'Display manufacturer name under product brand', value: true },
    { key: 'showRak', label: 'Show Rack / Shelf Number', desc: 'Display physical store shelf number in POS results', value: false },
  ];

  businessMode: 'Retail' | 'Wholesale' = 'Retail';
  openingStockMarkup = 10;
  maxDiscount = 10;

  ngOnInit(): void {
    this.settingsService.getSaleConfig().subscribe({
      next: (res) => {
        if (res.data) {
          const c: any = res.data;
          this.setToggle('cashReceived', c.cash_received ?? c.cashReceived ?? true);
          this.setToggle('outOfStock', c.out_of_stock_sale ?? c.outOfStockSale ?? false);
          this.setToggle('allowLoss', c.allow_loss_sale ?? c.allowLossSale ?? false);
          this.setToggle('showCost', c.product_purchase_cost ?? c.productPurchaseCost ?? false);
          this.setToggle('showStock', c.stock_qty ?? c.stockQty ?? true);
          this.setToggle('showCompany', c.company_name ?? c.companyName ?? true);
          this.setToggle('showRak', c.rak_number ?? c.rakNumber ?? false);

          if (c.business_type === 2 || c.businessType === 2) {
            this.businessMode = 'Wholesale';
          } else {
            this.businessMode = 'Retail';
          }

          if (c.opening_stock_percent !== undefined) this.openingStockMarkup = c.opening_stock_percent;
          if (c.max_sale_discount_percent !== undefined) this.maxDiscount = c.max_sale_discount_percent;
        }
      },
      error: () => {},
    });
  }

  private setToggle(key: string, val: boolean): void {
    const t = this.toggles.find(x => x.key === key);
    if (t) t.value = val;
  }

  private getToggle(key: string): boolean {
    return this.toggles.find(x => x.key === key)?.value || false;
  }

  saveSettings(): void {
    const payload: Partial<CfgSaleConfig> = {
      cash_received: this.getToggle('cashReceived'),
      out_of_stock_sale: this.getToggle('outOfStock'),
      allow_loss_sale: this.getToggle('allowLoss'),
      product_purchase_cost: this.getToggle('showCost'),
      stock_qty: this.getToggle('showStock'),
      company_name: this.getToggle('showCompany'),
      rak_number: this.getToggle('showRak'),
      business_type: this.businessMode === 'Wholesale' ? 2 : 1,
      opening_stock_percent: Number(this.openingStockMarkup) || 0,
      max_sale_discount_percent: Number(this.maxDiscount) || 0,
      is_max_discount_enabled: (Number(this.maxDiscount) || 0) > 0,
    };

    this.settingsService.updateSaleConfig(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'POS sales configuration saved successfully!');
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to save POS configuration');
      },
    });
  }
}
