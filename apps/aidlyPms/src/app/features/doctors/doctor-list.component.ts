import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { DoctorService } from '../../core/services/doctor.service';
import { DocDoctor } from '../../core/models/doctor.models';

interface DoctorRow {
  id: string;
  doctorNo: number;
  name: string;
  nameBn: string;
  phone: string;
  gender: string;
  desc: string;
  descBn: string;
  bmdcRegNo: string;
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
    NzTagModule,
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
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-64 shrink-0 rounded-md">
            <input id="doctor-list-search-doctor-8"
              type="text"
              nz-input
              placeholder="Search doctor..."
              [(ngModel)]="searchName"
              (ngModelChange)="onSearchChange()" aria-label="Search doctor..." />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <button nz-button class="btn-reset rounded-md h-7 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <button nz-button class="btn-export rounded-md" (click)="exportDoctorsCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <a nz-button class="btn-secondary-action rounded-md" routerLink="/doctors-portal/settings">
            <span nz-icon nzType="setting"></span> Rx Settings
          </a>
          <a nz-button class="btn-secondary-action rounded-md" routerLink="/doctors-portal/add">
            <span nz-icon nzType="user-add"></span> Doctor Form
          </a>
          <button nz-button nzType="primary" class="btn-save rounded-md font-semibold" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Doctor (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          <table class="w-full text-sm text-left border-collapse min-w-[700px]">
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
              @for (d of doctors(); track d.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <div class="font-semibold text-slate-900">{{ d.name }}</div>
                    @if (d.bmdcRegNo) {
                      <div class="mt-0.5">
                        <span class="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          BMDC: {{ d.bmdcRegNo }}
                        </span>
                      </div>
                    }
                  </td>
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
                       aria-label="View Prescriptions">
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openEditModal(d)"
                        nz-tooltip
                        nzTooltipTitle="Edit Doctor Profile"
                        class="btn-tbl-action btn-tbl-edit"
                       aria-label="Edit Doctor Profile">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteDoctor(d)"
                        nz-tooltip
                        nzTooltipTitle="Delete Doctor"
                        class="btn-tbl-action btn-tbl-delete"
                       aria-label="Delete Doctor">
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
            <span>Registered Doctors: <strong class="text-slate-900 font-semibold font-mono">{{ doctors().length }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Authorized Medical Practitioners</span>
        </div>
      </div>
    </div>

    <!-- Quick Add/Edit Doctor Modal -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add Doctor' : 'Edit Doctor'"
      [nzOkText]="modalMode === 'create' ? 'Register Doctor' : 'Save Changes'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveDoctor()"
      nzWidth="580px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label for="doctor-list-doctor-name-english-1" class="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Name (English) <span class="text-rose-500">*</span>
              </label>
              <input id="doctor-list-doctor-name-english-1"
                type="text"
                nz-input
                placeholder="e.g. Dr. Mohammad Ali"
                [(ngModel)]="form.name"
                class="rounded-md" aria-label="Doctor Name (English)" />
            </div>

            <div>
              <label for="doctor-list-doctor-name-2" class="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Name (বাংলা)
              </label>
              <input id="doctor-list-doctor-name-2"
                type="text"
                nz-input
                placeholder="e.g. ডা. মোহাম্মদ আলী"
                [(ngModel)]="form.nameBn"
                class="rounded-md font-bengali" aria-label="Doctor Name (বাংলা)" />
            </div>

            <div>
              <label for="doctor-list-qualifications-degree-english-3" class="block text-xs font-semibold text-slate-700 mb-1">
                Qualifications & Degree (English)
              </label>
              <input id="doctor-list-qualifications-degree-english-3"
                type="text"
                nz-input
                placeholder="MBBS, FCPS (Medicine)"
                [(ngModel)]="form.desc"
                class="rounded-md" aria-label="Qualifications & Degree (English)" />
            </div>

            <div>
              <label for="doctor-list-field-4" class="block text-xs font-semibold text-slate-700 mb-1">
                ডিগ্রি ও পদবি (বাংলা)
              </label>
              <input id="doctor-list-field-4"
                type="text"
                nz-input
                placeholder="এমবিবিএস, এফসিপিএস"
                [(ngModel)]="form.descBn"
                class="rounded-md font-bengali" aria-label="ডিগ্রি ও পদবি (বাংলা)" />
            </div>

            <div>
              <label for="doctor-list-phone-number-5" class="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <span class="h-8 px-2 flex items-center bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-600 shrink-0">
                  +880
                </span>
                <input id="doctor-list-phone-number-5"
                  type="text"
                  nz-input
                  placeholder="1XXXXXXXXX"
                  [(ngModel)]="form.phoneSuffix"
                  class="rounded-md flex-1 text-xs" aria-label="Phone Number" />
              </div>
            </div>

            <div>
              <label for="doctor-list-bmdc-reg-no-e-g-a-12345-6" class="block text-xs font-semibold text-slate-700 mb-1">
                BMDC Reg. No.
                <span class="text-slate-400 font-normal ml-1">(e.g. A-12345)</span>
              </label>
              <input id="doctor-list-bmdc-reg-no-e-g-a-12345-6"
                type="text"
                nz-input
                placeholder="A-XXXXX"
                [(ngModel)]="form.bmdcRegNo"
                class="rounded-md text-xs" aria-label="BMDC Reg. No. (e.g. A-12345)" />
            </div>

            <div>
              <label for="doctor-list-gender-7" class="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <nz-select id="doctor-list-gender-7" nzId="doctor-list-gender-7" [(ngModel)]="form.gender" class="w-full" aria-label="Gender">
                <nz-option nzValue="Male" nzLabel="Male"></nz-option>
                <nz-option nzValue="Female" nzLabel="Female"></nz-option>
                <nz-option nzValue="Other" nzLabel="Other"></nz-option>
              </nz-select>
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Doctor Profile & Prescriptions Modal -->
    <nz-modal
      [(nzVisible)]="isProfileModalOpen"
      [nzTitle]="'Doctor Profile: ' + (selectedDoctor?.name || '')"
      [nzFooter]="profileFooter"
      (nzOnCancel)="isProfileModalOpen = false"
      nzWidth="600px"
    >
      <ng-container *nzModalContent>
        @if (selectedDoctor) {
          <div class="space-y-4 py-2 text-xs">
            <div class="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                Dr
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-bold text-slate-900 mb-0.5">{{ selectedDoctor.name }}</h3>
                <p class="text-xs text-slate-600 mb-0 font-bengali">{{ selectedDoctor.nameBn }}</p>
                <p class="text-xs text-blue-600 font-medium mb-0">{{ selectedDoctor.desc }}</p>
              </div>
              <nz-tag nzColor="blue">{{ selectedDoctor.gender }}</nz-tag>
            </div>

            <div class="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <div>
                <span class="text-slate-400 text-[11px] block">Contact Phone:</span>
                <span class="font-mono text-slate-900 font-semibold">{{ selectedDoctor.phone || '—' }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Hospital / Chamber:</span>
                <span class="text-slate-800 font-medium">{{ selectedDoctor.descBn || 'General Practice' }}</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-lg p-3 text-center bg-slate-50/50">
              <span nz-icon nzType="file-text" class="text-2xl text-slate-300 mb-1 block"></span>
              <p class="text-xs font-semibold text-slate-700 mb-1">Prescription Records Registry</p>
              <p class="text-[11px] text-slate-400 mb-2">Patients referred by {{ selectedDoctor.name }} are logged directly during POS dispensing.</p>
              <a nz-button nzType="dashed" nzSize="small" routerLink="/customer/sale" (click)="isProfileModalOpen = false">
                <span nz-icon nzType="shopping-cart"></span> Dispense Rx in POS
              </a>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #profileFooter>
        <button nz-button nzType="default" (click)="isProfileModalOpen = false">Close</button>
      </ng-template>
    </nz-modal>
  `,
})
export class DoctorListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly doctorService = inject(DoctorService);

  searchName = '';
  doctors = signal<DoctorRow[]>([]);

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    id: '',
    doctorNo: 0,
    name: '',
    nameBn: '',
    phoneSuffix: '',
    gender: 'Male',
    desc: '',
    descBn: '',
    bmdcRegNo: '',
  };

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.searchName.trim()) {
      params['search'] = this.searchName.trim();
    }

    this.doctorService.getDoctors(params).subscribe({
      next: (res) => {
        const rawItems = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        const rows: DoctorRow[] = rawItems.map((d: any) => ({
          id: (d.doctor_no || d.doctorNo || Math.random()).toString(),
          doctorNo: d.doctor_no || d.doctorNo,
          name: [d.first_name_en || d.firstNameEn, d.last_name_en || d.lastNameEn].filter(Boolean).join(' ') || 'Dr. Physician',
          nameBn: [d.first_name_bn || d.firstNameBn, d.last_name_bn || d.lastNameBn].filter(Boolean).join(' ') || '',
          phone: d.phone || '',
          gender: d.gender || 'Male',
          desc: d.description_en || d.descriptionEn || 'MBBS',
          descBn: d.description_bn || d.descriptionBn || '',
          bmdcRegNo: d.bmdc_reg_no || d.bmdcRegNo || '',
        }));
        this.doctors.set(rows);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load doctors');
      },
    });
  }

  onSearchChange(): void {
    this.loadDoctors();
  }

  resetFilters(): void {
    this.searchName = '';
    this.loadDoctors();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      id: '',
      doctorNo: 0,
      name: '',
      nameBn: '',
      phoneSuffix: '',
      gender: 'Male',
      desc: '',
      descBn: '',
      bmdcRegNo: '',
    };
    this.isModalVisible = true;
  }

  openEditModal(d: DoctorRow): void {
    this.modalMode = 'edit';
    const phoneClean = d.phone.replace(/^\+880\s*/, '');
    this.form = {
      id: d.id,
      doctorNo: d.doctorNo,
      name: d.name,
      nameBn: d.nameBn,
      phoneSuffix: phoneClean,
      gender: d.gender,
      desc: d.desc,
      descBn: d.descBn,
      bmdcRegNo: d.bmdcRegNo,
    };
    this.isModalVisible = true;
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
    const names = this.form.name.trim().split(' ');
    const firstName = names[0] || 'Dr.';
    const lastName = names.slice(1).join(' ') || '';

    const payload: Partial<DocDoctor> = {
      first_name_en: firstName,
      last_name_en: lastName,
      first_name_bn: this.form.nameBn.trim() || firstName,
      phone: fullPhone,
      gender: this.form.gender,
      bmdc_reg_no: this.form.bmdcRegNo.trim() || undefined,
      description_en: this.form.desc.trim() || undefined,
      description_bn: this.form.descBn.trim() || undefined,
      is_active: true,
    };

    if (this.modalMode === 'create') {
      this.doctorService.createDoctor(payload).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Doctor "${this.form.name}" registered!`);
          this.isModalVisible = false;
          this.loadDoctors();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to register doctor');
        },
      });
    } else {
      this.doctorService.updateDoctor(this.form.doctorNo, payload).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Doctor "${this.form.name}" updated!`);
          this.isModalVisible = false;
          this.loadDoctors();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to update doctor');
        },
      });
    }
  }

  isProfileModalOpen = false;
  selectedDoctor: DoctorRow | null = null;

  viewPrescriptions(d: DoctorRow): void {
    this.selectedDoctor = d;
    this.isProfileModalOpen = true;
  }

  exportDoctorsCsv(): void {
    const list = this.doctors();
    if (!list.length) {
      this.msg.warning('No doctors to export.');
      return;
    }
    const headers = ['SL', 'Doctor Name (EN)', 'Doctor Name (BN)', 'Phone', 'Gender', 'Degrees / Qualifications', 'Chamber / Hospital'];
    const rows = list.map((d, i) => [
      i + 1,
      `"${d.name}"`,
      `"${d.nameBn}"`,
      `"${d.phone}"`,
      `"${d.gender}"`,
      `"${(d.desc || '').replace(/"/g, '""')}"`,
      `"${(d.descBn || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} doctor profiles.`);
  }

  deleteDoctor(d: DoctorRow): void {
    this.modal.confirmDelete(`Doctor "${d.name}"`, 'Remove this doctor from directory?').subscribe(ok => {
      if (ok) {
        this.doctorService.deleteDoctor(d.doctorNo).subscribe({
          next: () => {
            this.msg.success(`Doctor "${d.name}" removed.`);
            this.loadDoctors();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to remove doctor');
          },
        });
      }
    });
  }
}
