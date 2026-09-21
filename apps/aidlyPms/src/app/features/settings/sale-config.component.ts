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
export class SaleConfigComponent {
  private readonly msg = inject(NzMessageService);

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

  saveSettings(): void {
    this.msg.success('POS sales configuration saved successfully!');
  }
}
