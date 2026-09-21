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
  selector: 'app-prescription-settings',
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
    <div class="max-w-xl space-y-4">
      <app-page-header
        title="Prescription Settings"
        subtitle="Configure pharmacy logo, clinic hours, disclaimer text, and print layout"
        formId="DOC_1703"
        [breadcrumbs]="[{ label: 'Doctors Portal', url: '/doctors-portal/list' }, { label: 'Prescription Settings' }]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Upload Pharmacy Logo
          </label>
          <div
            (click)="hasLogo = true"
            class="theme-dropzone rounded-lg p-8 text-center cursor-pointer bg-slate-50"
          >
            @if (hasLogo) {
              <p class="text-sm font-semibold theme-total-text mb-0">✓ Pharmacy Logo Uploaded: pharmacy_brand_logo.png</p>
            } @else {
              <p class="text-sm text-slate-600 mb-1 font-medium">🖼 Click to upload pharmacy logo</p>
              <p class="text-xs text-slate-400 mb-0">PNG or JPG up to 2MB</p>
            }
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Prescription Bottom Text & Disclaimer
          </label>
          <textarea
            nz-input
            rows="4"
            [(ngModel)]="bottomText"
            class="rounded-md text-xs font-mono"
          ></textarea>
          <p class="text-xs text-slate-400 mt-1">
            Printed at footer of electronic prescription slips (working hours, hotline, refill policy).
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" nz-button nzType="default" (click)="resetDefault()" class="rounded-md">
            Reset to Default
          </button>
          <button type="button" nz-button nzType="primary" (click)="saveSettings()" class="rounded-md">
            <span nz-icon nzType="save"></span> Save Prescription Settings
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PrescriptionSettingsComponent {
  private readonly msg = inject(NzMessageService);

  hasLogo = false;
  bottomText =
    'Working Hours: Sat–Thu 8am–10pm, Fri 4pm–10pm\nHotline: +880 1711-234567\nDrugs once sold cannot be refunded. Prescription required for scheduled narcotics & antibiotics.';

  resetDefault(): void {
    this.bottomText =
      'Working Hours: Sat–Thu 8am–10pm, Fri 4pm–10pm\nHotline: +880 1711-234567\nDrugs once sold cannot be refunded. Prescription required for scheduled narcotics & antibiotics.';
    this.msg.info('Reset to default text.');
  }

  saveSettings(): void {
    this.msg.success('Prescription template settings saved successfully!');
  }
}
