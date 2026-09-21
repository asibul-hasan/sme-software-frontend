import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-product-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-md space-y-4">
      <app-page-header
        title="Product & Expiry Thresholds"
        subtitle="Configure batch expiry warnings and inventory lead alert settings"
        formId="CFG_2003"
        [breadcrumbs]="[{ label: 'Settings', url: '/settings/sale-config' }, { label: 'Product Config' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Expiry Warning Lead Time (Days) <span class="text-rose-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              type="number"
              nz-input
              [(ngModel)]="expiryDays"
              class="w-32 rounded-md font-mono"
              min="1"
            />
            <span class="text-xs text-slate-500 font-semibold">days before expiration</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Batches expiring within this window will trigger high-priority Near-Expiry dashboard alerts.
          </p>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" nz-button nzType="primary" (click)="saveConfig()" class="rounded-md">
            <span nz-icon nzType="save"></span> Save Settings
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductConfigComponent {
  private readonly msg = inject(NzMessageService);

  expiryDays = 90;

  saveConfig(): void {
    this.msg.success(`Expiry alert threshold set to ${this.expiryDays} days!`);
  }
}
