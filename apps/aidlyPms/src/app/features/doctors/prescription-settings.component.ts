import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DoctorService } from '../../core/services/doctor.service';

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

      <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
        <span nz-icon nzType="info-circle" class="text-amber-600 text-base mt-0.5 flex-shrink-0"></span>
        <div>
          <span class="font-bold text-amber-900">Feature Preview (Coming in Phase 3):</span>
          <p class="text-[11px] text-amber-700 mb-0 mt-0.5">Doctor prescription pad layout customization, digital logo embedding, and specialized clinic headers will be fully active in Phase 3.</p>
        </div>
      </div>

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
              <p class="text-sm font-semibold theme-total-text mb-0">✓ Pharmacy Logo Configured: pharmacy_brand_logo.png</p>
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
export class PrescriptionSettingsComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly doctorService = inject(DoctorService);

  hasLogo = false;
  bottomText =
    'Working Hours: Sat–Thu 8am–10pm, Fri 4pm–10pm\nHotline: +880 1711-234567\nDrugs once sold cannot be refunded. Prescription required for scheduled narcotics & antibiotics.';

  ngOnInit(): void {
    this.doctorService.getPrescriptionSettings().subscribe({
      next: (res) => {
        if (res.data) {
          if (res.data.prescription_bottom_row_text || (res.data as any).prescriptionBottomRowText) {
            this.bottomText = res.data.prescription_bottom_row_text || (res.data as any).prescriptionBottomRowText;
          }
          if (res.data.clinic_logo_url || (res.data as any).clinicLogoUrl) {
            this.hasLogo = true;
          }
        }
      },
      error: () => {},
    });
  }

  resetDefault(): void {
    this.bottomText =
      'Working Hours: Sat–Thu 8am–10pm, Fri 4pm–10pm\nHotline: +880 1711-234567\nDrugs once sold cannot be refunded. Prescription required for scheduled narcotics & antibiotics.';
    this.msg.info('Reset to default text.');
  }

  saveSettings(): void {
    this.doctorService.updatePrescriptionSettings({
      prescription_bottom_row_text: this.bottomText,
      clinic_logo_url: this.hasLogo ? 'assets/pharmacy_brand_logo.png' : undefined,
    }).subscribe({
      next: (res) => {
        this.msg.success(res.message || 'Prescription template settings saved successfully!');
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to save prescription settings');
      },
    });
  }
}
