import { Component, inject } from '@angular/core';
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
          <label class="block text-xs font-semibold text-slate-700 mb-1">Paper Roll Format</label>
          <nz-select [(ngModel)]="paperType" class="w-48">
            <nz-option nzValue="80mm" nzLabel="80mm Thermal Roll (Standard)"></nz-option>
            <nz-option nzValue="57mm" nzLabel="57mm Thermal Roll (Mini)"></nz-option>
          </nz-select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Top Header Text (Shop Name & Info) <span class="text-rose-500">*</span>
          </label>
          <textarea
            nz-input
            rows="4"
            [(ngModel)]="topText"
            class="rounded-md text-xs font-mono"
          ></textarea>
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
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Upload Monochrome Shop Logo
            </label>
            <div
              (click)="hasLogo = true"
              class="theme-dropzone rounded-lg p-5 text-center cursor-pointer bg-slate-50"
            >
              @if (hasLogo) {
                <p class="text-xs theme-total-text font-semibold mb-0">✓ Logo attached: receipt_logo.png</p>
              } @else {
                <p class="text-xs text-slate-600 mb-1 font-medium">🖼 Click to upload logo for thermal receipt</p>
                <p class="text-[11px] text-slate-400 mb-0">High-contrast monochrome bitmap recommended</p>
              }
            </div>
          </div>
        }

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Bottom Footer Disclaimer Text
          </label>
          <textarea
            nz-input
            rows="3"
            [(ngModel)]="bottomText"
            class="rounded-md text-xs font-mono"
          ></textarea>
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
export class InvoiceConfigComponent {
  private readonly msg = inject(NzMessageService);

  paperType = '80mm';
  topText =
    'Kazi Pharmacy\nCumilla Sadar, Cumilla-3500\nDrug License: DL-01-0012345\nHotline: +880 1711-234567';

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

  getToggleValue(key: string): boolean {
    return this.toggles.find(t => t.key === key)?.value || false;
  }

  saveInvoiceConfig(): void {
    this.msg.success('Thermal invoice printer configuration saved!');
  }
}
