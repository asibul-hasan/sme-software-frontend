import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DoctorService } from '../../core/services/doctor.service';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

@Component({
  selector: 'app-doctor-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    PageHeaderComponent,
    MenuActionDirective,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Add New Doctor"
        subtitle="Register prescribing physician profile, qualifications, and credentials"
        formId="DOC_1702"
        [breadcrumbs]="[{ label: 'Doctors Portal', url: '/doctors-portal/list' }, { label: 'Add Doctor' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="default" (click)="goBack()" class="rounded-md">
            <span nz-icon nzType="arrow-left"></span> Back
          </button>
        </div>
      </app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <form (ngSubmit)="submitDoctor()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="doctor-add-first-name-english-1" class="block text-xs font-semibold text-slate-700 mb-1">
                First Name (English) <span class="text-rose-500">*</span>
              </label>
              <input id="doctor-add-first-name-english-1"
                type="text"
                nz-input
                placeholder="First name"
                [(ngModel)]="firstName"
                name="firstName"
                class="rounded-md"
                required aria-label="First Name (English)" />
            </div>

            <div>
              <label for="doctor-add-last-name-english-2" class="block text-xs font-semibold text-slate-700 mb-1">Last Name (English)</label>
              <input id="doctor-add-last-name-english-2"
                type="text"
                nz-input
                placeholder="Last name"
                [(ngModel)]="lastName"
                name="lastName"
                class="rounded-md" aria-label="Last Name (English)" />
            </div>

            <div>
              <label for="doctor-add-field-3" class="block text-xs font-semibold text-slate-700 mb-1">প্রথম নাম (বাংলা)</label>
              <input id="doctor-add-field-3"
                type="text"
                nz-input
                placeholder="প্রথম নাম"
                [(ngModel)]="firstNameBn"
                name="firstNameBn"
                class="rounded-md font-bengali" aria-label="প্রথম নাম (বাংলা)" />
            </div>

            <div>
              <label for="doctor-add-field-4" class="block text-xs font-semibold text-slate-700 mb-1">শেষ নাম (বাংলা)</label>
              <input id="doctor-add-field-4"
                type="text"
                nz-input
                placeholder="শেষ নাম"
                [(ngModel)]="lastNameBn"
                name="lastNameBn"
                class="rounded-md font-bengali" aria-label="শেষ নাম (বাংলা)" />
            </div>

            <div class="md:col-span-2">
              <label for="doctor-add-description-degrees-english-5" class="block text-xs font-semibold text-slate-700 mb-1">
                Description & Degrees (English)
              </label>
              <textarea id="doctor-add-description-degrees-english-5"
                nz-input
                rows="2"
                placeholder="MBBS, FCPS (Medicine) — Qualifications & designation"
                [(ngModel)]="desc"
                name="desc"
                class="rounded-md" aria-label="Description & Degrees (English)"></textarea>
            </div>

            <div class="md:col-span-2">
              <label for="doctor-add-field-6" class="block text-xs font-semibold text-slate-700 mb-1">
                বিবরণ ও ডিগ্রি (বাংলা)
              </label>
              <textarea id="doctor-add-field-6"
                nz-input
                rows="2"
                placeholder="এমবিবিএস, এফসিপিএস — যোগ্যতা ও পদবি"
                [(ngModel)]="descBn"
                name="descBn"
                class="rounded-md font-bengali" aria-label="বিবরণ ও ডিগ্রি (বাংলা)"></textarea>
            </div>

            <div>
              <label for="doctor-add-phone-number-7" class="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <span class="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">
                  +880
                </span>
                <input id="doctor-add-phone-number-7"
                  type="text"
                  nz-input
                  placeholder="1XXXXXXXXX"
                  [(ngModel)]="phone"
                  name="phone"
                  class="rounded-md flex-1"
                  required aria-label="Phone Number" />
              </div>
            </div>

            <div>
              <label for="doctor-add-bmdc-reg-no-e-g-a-12345-8" class="block text-xs font-semibold text-slate-700 mb-1">
                BMDC Reg. No.
                <span class="text-slate-400 font-normal ml-1">(e.g. A-12345)</span>
              </label>
              <input id="doctor-add-bmdc-reg-no-e-g-a-12345-8"
                type="text"
                nz-input
                placeholder="A-XXXXX"
                [(ngModel)]="bmdcRegNo"
                name="bmdcRegNo"
                class="rounded-md" aria-label="BMDC Reg. No. (e.g. A-12345)" />
            </div>

            <div>
              <label for="doctor-add-gender-9" class="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <nz-select id="doctor-add-gender-9" nzId="doctor-add-gender-9" [(ngModel)]="gender" name="gender" class="w-full" aria-label="Gender">
                <nz-option nzValue="Male" nzLabel="Male"></nz-option>
                <nz-option nzValue="Female" nzLabel="Female"></nz-option>
                <nz-option nzValue="Other" nzLabel="Other"></nz-option>
              </nz-select>
            </div>

            <div>
              <label for="doctor-add-password-min-6-characters-10" class="block text-xs font-semibold text-slate-700 mb-1">
                Password <span class="text-rose-500">*</span>
                <span class="text-slate-400 font-normal ml-1">(Min 6 characters)</span>
              </label>
              <input id="doctor-add-password-min-6-characters-10"
                type="password"
                nz-input
                placeholder="••••••"
                [(ngModel)]="password"
                name="password"
                class="rounded-md"
                required aria-label="Password (Min 6 characters)" />
            </div>

            <div>
              <label for="doctor-add-confirm-password-11" class="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span class="text-rose-500">*</span>
              </label>
              <input id="doctor-add-confirm-password-11"
                type="password"
                nz-input
                placeholder="••••••"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                class="rounded-md"
                required aria-label="Confirm Password" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Upload Digital Signature
              </label>
              <div
                (click)="hasSignature = true"
                class="theme-dropzone rounded-lg p-6 text-center cursor-pointer bg-slate-50"
              >
                @if (hasSignature) {
                  <p class="text-xs theme-total-text font-semibold mb-0">
                    ✓ Doctor signature attached: dr_signature.png
                  </p>
                } @else {
                  <p class="text-sm text-slate-500 mb-1">📎 Click to upload signature</p>
                  <p class="text-xs text-slate-400 mb-0">PNG, JPG up to 2MB</p>
                }
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button *appMenuAction="'DOC_1702:create'" type="submit" nz-button nzType="primary" class="rounded-md">
              <span nz-icon nzType="check"></span> Submit Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class DoctorAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly doctorService = inject(DoctorService);

  firstName = '';
  lastName = '';
  firstNameBn = '';
  lastNameBn = '';
  desc = '';
  descBn = '';
  phone = '';
  gender = 'Male';
  bmdcRegNo = '';
  hasSignature = false;
  password = '';
  confirmPassword = '';

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/doctors-portal/list']);
    }
  }

  submitDoctor(): void {
    if (!this.firstName.trim()) {
      this.msg.error('Please enter doctor first name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }

    const fullPhone = `+880 ${this.phone.trim()}`;
    const fullName = `Dr. ${this.firstName.trim()} ${this.lastName.trim()}`.trim();

    this.doctorService.createDoctor({
      first_name_en: this.firstName.trim(),
      last_name_en: this.lastName.trim() || undefined,
      first_name_bn: this.firstNameBn.trim() || this.firstName.trim(),
      last_name_bn: this.lastNameBn.trim() || undefined,
      description_en: this.desc.trim() || undefined,
      description_bn: this.descBn.trim() || undefined,
      phone: fullPhone,
      gender: this.gender,
      bmdc_reg_no: this.bmdcRegNo.trim() || undefined,
      is_active: true,
    }).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Doctor "${fullName}" registered successfully!`);
        this.router.navigate(['/doctors-portal/list']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to register doctor');
      },
    });
  }
}
