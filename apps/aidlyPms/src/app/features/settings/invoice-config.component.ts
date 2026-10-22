import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SettingsService } from '../../core/services/settings.service';
import { CfgInvoiceConfig } from '../../core/models/config.models';

@Component({
  selector: 'app-invoice-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-2xl space-y-4">
      <app-page-header
        title="Thermal Invoice & Receipt Configuration"
        subtitle="Customize POS thermal receipt printer layout, headers, logos, and footer disclaimers"
        formId="CFG_2002"
        [breadcrumbs]="[{ label: 'Settings', url: '/settings/sale-config' }, { label: 'Invoice Config' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <label for="invoice-config-paper-roll-format-1" class="block text-xs font-semibold text-slate-700 mb-1">Paper Roll Format</label>
          <nz-select id="invoice-config-paper-roll-format-1" nzId="invoice-config-paper-roll-format-1" [(ngModel)]="paperType" class="w-48" aria-label="Paper Roll Format">
            <nz-option nzValue="80mm" nzLabel="80mm Thermal Roll (Standard)"></nz-option>
            <nz-option nzValue="57mm" nzLabel="57mm Thermal Roll (Mini)"></nz-option>
          </nz-select>
        </div>

        <div>
          <label for="invoice-config-top-header-text-shop-name-info-2" class="block text-xs font-semibold text-slate-700 mb-1">
            Top Header Text (Shop Name & Info) <span class="text-rose-500">*</span>
          </label>
          <textarea id="invoice-config-top-header-text-shop-name-info-2"
            nz-input
            rows="4"
            [(ngModel)]="topText"
            class="rounded-md text-xs font-mono" aria-label="Top Header Text (Shop Name & Info)"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 border-y border-slate-100">
          @for (t of toggles; track t.key) {
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-xs font-medium text-slate-700">{{ t.label }}</span>
              <label nz-checkbox [(ngModel)]="t.value"></label>
            </div>
          }
        </div>

        @if (getToggleValue('shopLogo')) {
          <div>
            <label for="invoice-config-field-3" class="block text-xs font-semibold text-slate-700 mb-1">
              Upload Monochrome Shop Logo
            </label>
            <div
              (click)="hasLogo = true"
              class="theme-dropzone rounded-lg p-5 text-center cursor-pointer bg-slate-50"
            >
              @if (hasLogo) {
                <p class="text-xs theme-total-text font-semibold mb-0">✓ Logo configured: receipt_logo.png</p>
              } @else {
                <p class="text-xs text-slate-600 mb-1 font-medium">🖼 Click to configure logo for thermal receipt</p>
                <p class="text-[11px] text-slate-400 mb-0">High-contrast monochrome bitmap recommended</p>
              }
            </div>
          </div>
        }

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Bottom Footer Disclaimer Text
          </label>
          <textarea id="invoice-config-field-3"
            nz-input
            rows="3"
            [(ngModel)]="bottomText"
            class="rounded-md text-xs font-mono" aria-label="Field"></textarea>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" nz-button nzType="primary" (click)="saveInvoiceConfig()" class="rounded-md">
            <span nz-icon nzType="save"></span> Save Receipt Settings
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InvoiceConfigComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly settingsService = inject(SettingsService);

  paperType = '80mm';
  topText =
    'Aidly Pharmacy\nCumilla Sadar, Cumilla-3500\nDrug License: DL-01-0012345\nHotline: +880 1711-234567';

  toggles = [
    { label: 'Served By Row', key: 'servedBy', value: true },
    { label: 'Discount / Less Row', key: 'discountRow', value: true },
    { label: 'Card Fee Row', key: 'cardFee', value: true },
    { label: 'Customer Name', key: 'custName', value: true },
    { label: 'Customer Phone', key: 'custPhone', value: true },
    { label: 'Simple Print (compact)', key: 'simplePrint', value: false },
    { label: 'Customer | Vendor Balance', key: 'balance', value: true },
    { label: 'Print Shop Logo', key: 'shopLogo', value: true },
  ];

  hasLogo = true;
  bottomText =
    'Item purchased can be exchanged within 7 days with original receipt.\nMedicine once sold cannot be refunded for physical cash.';

  ngOnInit(): void {
    this.settingsService.getInvoiceConfig().subscribe({
      next: (res) => {
        if (res.data) {
          const c: any = res.data;
          this.paperType = c.paper_type === 2 ? '57mm' : '80mm';
          if (c.top_row_text) this.topText = c.top_row_text;
          if (c.bottom_row_text) this.bottomText = c.bottom_row_text;
          this.hasLogo = c.show_shop_logo ?? true;

          this.setToggle('servedBy', c.show_served_by_row ?? true);
          this.setToggle('discountRow', c.show_discount_less_row ?? true);
          this.setToggle('cardFee', c.show_card_fee_row ?? true);
          this.setToggle('custName', c.show_customer_name ?? true);
          this.setToggle('custPhone', c.show_customer_phone ?? true);
          this.setToggle('simplePrint', c.simple_print ?? false);
          this.setToggle('balance', c.show_customer_vendor_balance ?? true);
          this.setToggle('shopLogo', c.show_shop_logo ?? true);
        }
      },
      error: () => {},
    });
  }

  getToggleValue(key: string): boolean {
    return this.toggles.find(t => t.key === key)?.value || false;
  }

  private setToggle(key: string, val: boolean): void {
    const t = this.toggles.find(x => x.key === key);
    if (t) t.value = val;
  }

  saveInvoiceConfig(): void {
    const payload: Partial<CfgInvoiceConfig> = {
      paper_type: this.paperType === '57mm' ? 2 : 1,
      top_row_text: this.topText,
      bottom_row_text: this.bottomText,
      show_shop_logo: this.getToggleValue('shopLogo'),
      show_served_by_row: this.getToggleValue('servedBy'),
      show_discount_less_row: this.getToggleValue('discountRow'),
      show_card_fee_row: this.getToggleValue('cardFee'),
      show_customer_name: this.getToggleValue('custName'),
      show_customer_phone: this.getToggleValue('custPhone'),
      simple_print: this.getToggleValue('simplePrint'),
      show_customer_vendor_balance: this.getToggleValue('balance'),
      shop_logo_url: this.hasLogo ? 'assets/receipt_logo.png' : undefined,
    };

    this.settingsService.updateInvoiceConfig(payload).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'Thermal invoice printer configuration saved!');
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to save invoice settings');
      },
    });
  }
}
