import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';

interface DoctorRow {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  gender: string;
  desc: string;
  descBn: string;
}

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Doctors Portal & Prescribers Directory"
        subtitle="Manage prescribing physicians, medical qualifications, and electronic signatures"
        formId="DOC_1701"
        [breadcrumbs]="[{ label: 'Doctors Portal', url: '/doctors-portal/list' }, { label: 'Doctors' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-64 shrink-0 rounded-md">
            <input
              type="text"
              nz-input
              placeholder="Search doctor..."
              [(ngModel)]="searchName"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <input
            type="text"
            nz-input
            placeholder="Phone (+880...)"
            [(ngModel)]="searchPhone"
            class="w-36 shrink-0 rounded-md"
          />
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/doctors-portal/settings" class="rounded-md">
            <span nz-icon nzType="setting"></span> Rx Settings
          </a>
          <a nz-button nzType="default" routerLink="/doctors-portal/add" class="rounded-md">
            <span nz-icon nzType="user-add"></span> Doctor Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Doctor (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Doctor (English)</th>
                <th class="p-3">Doctor (বাংলা)</th>
                <th class="p-3">Phone</th>
                <th class="p-3">Gender</th>
                <th class="p-3">Qualifications</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (d of filteredDoctors(); track d.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 font-semibold text-slate-900">{{ d.name }}</td>
                  <td class="p-3 text-slate-700 font-medium font-bengali">{{ d.nameBn }}</td>
                  <td class="p-3 font-mono text-xs text-slate-600">{{ d.phone }}</td>
                  <td class="p-3 text-xs text-slate-600">{{ d.gender }}</td>
                  <td class="p-3">
                    <p class="text-xs font-medium text-slate-800 mb-0.5">{{ d.desc }}</p>
                    <p class="text-xs text-slate-400 mb-0 font-bengali">{{ d.descBn }}</p>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewPrescriptions(d)"
                        nz-tooltip
                        nzTooltipTitle="View Prescriptions"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openEditModal(d)"
                        nz-tooltip
                        nzTooltipTitle="Edit Doctor Profile"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteDoctor(d)"
                        nz-tooltip
                        nzTooltipTitle="Delete Doctor"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
                    No doctors match your search query.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Registered Doctors: <strong class="text-slate-900 font-semibold font-mono">{{ filteredDoctors().length }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Authorized Medical Practitioners</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add New Doctor (SCR-41)' : ('Modify Doctor: ' + form.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Doctor' : 'Update Doctor'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveDoctor()"
      nzWidth="820px"
      [nzStyle]="{ top: '24px' }"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Name (English) <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="e.g. Dr. Mohammad Ali"
                [(ngModel)]="form.name"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                ডাক্তারের নাম (বাংলা)
              </label>
              <input
                type="text"
                nz-input
                placeholder="ডা. মোহাম্মদ আলী"
                [(ngModel)]="form.nameBn"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Description / Degrees (English)
              </label>
              <textarea
                nz-input
                rows="2"
                placeholder="MBBS, FCPS (Medicine) — Qualifications & designation"
                [(ngModel)]="form.desc"
                class="rounded-md"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                ডিগ্রি ও বিবরণ (বাংলা)
              </label>
              <textarea
                nz-input
                rows="2"
                placeholder="এমবিবিএস, এফসিপিএস (মেডিসিন) — যোগ্যতা ও পদবি"
                [(ngModel)]="form.descBn"
                class="rounded-md"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <span class="h-7 px-2.5 flex items-center bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-600 shrink-0">
                  +880
                </span>
                <input
                  type="text"
                  nz-input
                  placeholder="1XXXXXXXXX"
                  [(ngModel)]="form.phoneSuffix"
                  class="rounded-md flex-1"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <nz-select [(ngModel)]="form.gender" class="w-full">
                <nz-option nzValue="Male" nzLabel="Male"></nz-option>
                <nz-option nzValue="Female" nzLabel="Female"></nz-option>
                <nz-option nzValue="Other" nzLabel="Other"></nz-option>
              </nz-select>
            </div>

            <div class="col-span-1 md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Doctor E-Signature
              </label>
              <div
                (click)="simulateSignatureUpload()"
                class="theme-dropzone rounded-lg p-3 text-center cursor-pointer bg-slate-50"
              >
                @if (hasSignature) {
                  <p class="text-xs theme-total-text font-semibold mb-0">
                    ✓ Signature uploaded: dr_ali_signature.png
                  </p>
                } @else {
                  <p class="text-xs text-slate-600 mb-0.5 font-medium">📎 Click to upload digital signature</p>
                  <p class="text-[10px] text-slate-400 mb-0">PNG, JPG up to 2MB (transparent background recommended)</p>
                }
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class DoctorListComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  searchName = '';
  searchPhone = '';

  doctors = signal<DoctorRow[]>([
    { id: '1', name: 'Dr. Mohammad Ali', nameBn: 'ডা. মোহাম্মদ আলী', phone: '+880 1711-234567', gender: 'Male', desc: 'MBBS, FCPS (Medicine)', descBn: 'এমবিবিএস, এফসিপিএস (মেডিসিন)' },
    { id: '2', name: 'Dr. Fatema Khanam', nameBn: 'ডা. ফাতেমা খানম', phone: '+880 1811-345678', gender: 'Female', desc: 'MBBS, MS (Gynaecology)', descBn: 'এমবিবিএস, এমএস (গাইনোকোলজি)' },
    { id: '3', name: 'Dr. Karim Ahmed', nameBn: 'ডা. করিম আহমেদ', phone: '+880 1611-456789', gender: 'Male', desc: 'BDS (Dental)', descBn: 'বিডিএস (ডেন্টাল)' },
  ]);

  filteredDoctors = computed(() => {
    const qName = this.searchName.trim().toLowerCase();
    const qPhone = this.searchPhone.trim();

    return this.doctors().filter(d => {
      const matchName = !qName || d.name.toLowerCase().includes(qName) || d.nameBn.includes(qName);
      const matchPhone = !qPhone || d.phone.includes(qPhone);
      return matchName && matchPhone;
    });
  });

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  hasSignature = false;
  form = {
    id: '',
    name: '',
    nameBn: '',
    phoneSuffix: '',
    gender: 'Male',
    desc: '',
    descBn: '',
  };

  resetFilters(): void {
    this.searchName = '';
    this.searchPhone = '';
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.hasSignature = false;
    this.form = {
      id: '',
      name: '',
      nameBn: '',
      phoneSuffix: '',
      gender: 'Male',
      desc: '',
      descBn: '',
    };
    this.isModalVisible = true;
  }

  openEditModal(d: DoctorRow): void {
    this.modalMode = 'edit';
    this.hasSignature = true;
    const phoneClean = d.phone.replace(/^\+880\s*/, '');
    this.form = {
      id: d.id,
      name: d.name,
      nameBn: d.nameBn,
      phoneSuffix: phoneClean,
      gender: d.gender,
      desc: d.desc,
      descBn: d.descBn,
    };
    this.isModalVisible = true;
  }

  simulateSignatureUpload(): void {
    this.hasSignature = true;
    this.msg.success('Signature file attached.');
  }

  saveDoctor(): void {
    if (!this.form.name.trim()) {
      this.msg.error('Please enter doctor name');
      return;
    }
    if (!this.form.phoneSuffix.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }

    const fullPhone = `+880 ${this.form.phoneSuffix.trim()}`;

    if (this.modalMode === 'create') {
      const newDoc: DoctorRow = {
        id: Date.now().toString(),
        name: this.form.name.trim(),
        nameBn: this.form.nameBn.trim() || this.form.name.trim(),
        phone: fullPhone,
        gender: this.form.gender,
        desc: this.form.desc.trim() || 'MBBS',
        descBn: this.form.descBn.trim() || 'এমবিবিএস',
      };
      this.doctors.update(list => [...list, newDoc]);
      this.msg.success(`Doctor "${newDoc.name}" registered!`);
    } else {
      this.doctors.update(list =>
        list.map(d =>
          d.id === this.form.id
            ? {
                ...d,
                name: this.form.name.trim(),
                nameBn: this.form.nameBn.trim(),
                phone: fullPhone,
                gender: this.form.gender,
                desc: this.form.desc.trim(),
                descBn: this.form.descBn.trim(),
              }
            : d
        )
      );
      this.msg.success(`Doctor "${this.form.name}" updated!`);
    }
    this.isModalVisible = false;
  }

  viewPrescriptions(d: DoctorRow): void {
    this.msg.info(`Loading prescriptions signed by ${d.name}`);
  }

  deleteDoctor(d: DoctorRow): void {
    this.modal.confirmDelete(`Doctor "${d.name}"`, 'Remove this doctor from directory?').subscribe(ok => {
      if (ok) {
        this.doctors.update(list => list.filter(item => item.id !== d.id));
        this.msg.success(`Doctor "${d.name}" removed.`);
      }
    });
  }
}
