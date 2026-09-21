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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';

interface RepUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
  gender: string;
  isActive: boolean;
}

@Component({
  selector: 'app-rep-list',
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
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Representatives & Pharmacy Staff"
        subtitle="Manage pharmacy employees, sales operators, cashiers, and login credentials"
        formId="REP_1801"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Staff Directory' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-72 shrink-0 rounded-md">
            <input
              type="text"
              nz-input
              placeholder="Search by name, phone or role..."
              [(ngModel)]="searchQuery"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="searchQuery = ''">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/representative/add" class="rounded-md">
            <span nz-icon nzType="user-add"></span> Staff Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Representative (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Name</th>
                <th class="p-3">Phone</th>
                <th class="p-3">Role</th>
                <th class="p-3 text-center w-48">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredReps(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full theme-avatar flex items-center justify-center text-xs font-bold shrink-0">
                        {{ r.name[0] }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-900 text-sm mb-0">{{ r.name }}</p>
                        <p class="text-xs text-slate-400 mb-0">{{ r.email }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="p-3 font-mono text-xs text-slate-600">
                    {{ r.phone }}
                  </td>

                  <td class="p-3">
                    <nz-tag
                      [nzColor]="r.role.includes('Manager') ? 'purple' : r.role.includes('Salesman') ? 'blue' : 'green'"
                      class="text-xs font-semibold"
                    >
                      {{ r.role }}
                    </nz-tag>
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="openEditModal(r)"
                        nz-tooltip
                        nzTooltipTitle="Edit Representative"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openPassModal(r)"
                        nz-tooltip
                        nzTooltipTitle="Change Password"
                        class="btn-tbl-action btn-tbl-warning"
                      >
                        <span nz-icon nzType="key"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteRep(r)"
                        nz-tooltip
                        nzTooltipTitle="Delete Representative"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No staff representatives match your search query.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Total Staff Members: <strong class="text-slate-900 font-semibold font-mono">{{ filteredReps().length }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Pharmacy Staff Accounts</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add Representative (SCR-37)' : ('Modify Representative: ' + form.firstName + ' ' + form.lastName)"
      [nzOkText]="modalMode === 'create' ? 'Save Representative' : 'Update Details'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveRep()"
      nzWidth="780px"
      [nzStyle]="{ top: '24px' }"
    >
      <ng-container *nzModalContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-1 text-xs">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              nz-input
              placeholder="First name"
              [(ngModel)]="form.firstName"
              class="rounded-md"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Last Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              nz-input
              placeholder="Last name"
              [(ngModel)]="form.lastName"
              class="rounded-md"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span class="text-rose-500">*</span>
            </label>
            <div class="flex gap-1.5">
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

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              nz-input
              placeholder="name@pharmacy.com"
              [(ngModel)]="form.email"
              class="rounded-md"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Role <span class="text-rose-500">*</span>
            </label>
            <nz-select [(ngModel)]="form.role" class="w-full">
              <nz-option nzValue="PMS Manager" nzLabel="PMS Manager"></nz-option>
              <nz-option nzValue="PMS Salesman" nzLabel="PMS Salesman"></nz-option>
              <nz-option nzValue="PMS Cashier" nzLabel="PMS Cashier"></nz-option>
            </nz-select>
          </div>

          @if (modalMode === 'create') {
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Password <span class="text-rose-500">*</span>
              </label>
              <input
                type="password"
                nz-input
                placeholder="••••••"
                [(ngModel)]="form.password"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span class="text-rose-500">*</span>
              </label>
              <input
                type="password"
                nz-input
                placeholder="••••••"
                [(ngModel)]="form.confirmPassword"
                class="rounded-md"
              />
            </div>
          }
        </div>
      </ng-container>
    </nz-modal>

    <!-- Change Password Modal -->
    <nz-modal
      [(nzVisible)]="isPassOpen"
      [nzTitle]="'Change Password for ' + activeRep?.name"
      nzOkText="Update Password"
      [nzStyle]="{ top: '32px' }"
      (nzOnCancel)="isPassOpen = false"
      (nzOnOk)="savePassword()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
            <input
              type="password"
              nz-input
              placeholder="Minimum 6 characters"
              [(ngModel)]="newPassword"
              class="rounded-md"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              nz-input
              placeholder="Confirm new password"
              [(ngModel)]="confirmNewPassword"
              class="rounded-md"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class RepListComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  searchQuery = '';

  reps = signal<RepUser[]>([
    { id: '1', name: 'Mohammad Admin', firstName: 'Mohammad', lastName: 'Admin', phone: '+880 1711-234567', role: 'PMS Manager', email: 'admin@kazi.pharmacy', gender: 'Male', isActive: true },
    { id: '2', name: 'Sumon Hossain', firstName: 'Sumon', lastName: 'Hossain', phone: '+880 1811-345678', role: 'PMS Salesman', email: 'sumon@kazi.pharmacy', gender: 'Male', isActive: true },
    { id: '3', name: 'Kohinoor Akter', firstName: 'Kohinoor', lastName: 'Akter', phone: '+880 1611-456789', role: 'PMS Cashier', email: 'kohinoor@kazi.pharmacy', gender: 'Female', isActive: true },
  ]);

  filteredReps = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.reps();
    return this.reps().filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.role.toLowerCase().includes(q)
    );
  });

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    id: '',
    firstName: '',
    lastName: '',
    phoneSuffix: '',
    gender: 'Male',
    email: '',
    role: 'PMS Salesman',
    password: '',
    confirmPassword: '',
  };

  // Pass Modal
  isPassOpen = false;
  activeRep: RepUser | null = null;
  newPassword = '';
  confirmNewPassword = '';

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      id: '',
      firstName: '',
      lastName: '',
      phoneSuffix: '',
      gender: 'Male',
      email: '',
      role: 'PMS Salesman',
      password: '',
      confirmPassword: '',
    };
    this.isModalVisible = true;
  }

  openEditModal(r: RepUser): void {
    this.modalMode = 'edit';
    const phoneClean = r.phone.replace(/^\+880\s*/, '');
    this.form = {
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      phoneSuffix: phoneClean,
      gender: r.gender,
      email: r.email,
      role: r.role,
      password: '',
      confirmPassword: '',
    };
    this.isModalVisible = true;
  }

  saveRep(): void {
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.msg.error('Please enter first and last name');
      return;
    }
    if (!this.form.phoneSuffix.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }

    const fullPhone = `+880 ${this.form.phoneSuffix.trim()}`;
    const fullName = `${this.form.firstName.trim()} ${this.form.lastName.trim()}`;

    if (this.modalMode === 'create') {
      if (this.form.password && this.form.password !== this.form.confirmPassword) {
        this.msg.error('Passwords do not match');
        return;
      }
      const newRep: RepUser = {
        id: Date.now().toString(),
        name: fullName,
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        phone: fullPhone,
        email: this.form.email.trim() || `${this.form.firstName.toLowerCase()}@pharmacy.com`,
        role: this.form.role,
        gender: this.form.gender,
        isActive: true,
      };
      this.reps.update(list => [...list, newRep]);
      this.msg.success(`Staff member "${newRep.name}" created!`);
    } else {
      this.reps.update(list =>
        list.map(r =>
          r.id === this.form.id
            ? {
                ...r,
                name: fullName,
                firstName: this.form.firstName.trim(),
                lastName: this.form.lastName.trim(),
                phone: fullPhone,
                email: this.form.email.trim(),
                role: this.form.role,
                gender: this.form.gender,
              }
            : r
        )
      );
      this.msg.success(`Staff member "${fullName}" updated!`);
    }
    this.isModalVisible = false;
  }

  openPassModal(r: RepUser): void {
    this.activeRep = r;
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.isPassOpen = true;
  }

  savePassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.msg.error('Password must be at least 6 characters');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.msg.error('Passwords do not match');
      return;
    }
    this.msg.success(`Password updated for ${this.activeRep?.name}!`);
    this.isPassOpen = false;
  }

  toggleActive(r: RepUser): void {
    this.reps.update(list =>
      list.map(item => (item.id === r.id ? { ...item, isActive: !item.isActive } : item))
    );
    this.msg.info(`User ${r.name} ${r.isActive ? 'deactivated' : 'activated'}`);
  }

  deleteRep(r: RepUser): void {
    this.modal.confirmAction(
      'Delete Representative?',
      `Are you sure you want to delete staff user "${r.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.reps.update(list => list.filter(item => item.id !== r.id));
        this.msg.success(`Staff user "${r.name}" deleted successfully`);
      }
    });
  }
}
