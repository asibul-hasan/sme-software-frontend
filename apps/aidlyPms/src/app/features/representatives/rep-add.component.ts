import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-rep-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Add Representative"
        subtitle="Register new pharmacy staff, store manager, or POS operator account"
        formId="REP_1802"
        [breadcrumbs]="[{ label: 'Representatives', url: '/representative' }, { label: 'Add Staff' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="default" (click)="goBack()" class="rounded-md">
            <span nz-icon nzType="arrow-left"></span> Back
          </button>
        </div>
      </app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <form (ngSubmit)="submitForm()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="First name"
                [(ngModel)]="firstName"
                name="firstName"
                class="rounded-md"
                required
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
                [(ngModel)]="lastName"
                name="lastName"
                class="rounded-md"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <span class="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">
                  +880
                </span>
                <input
                  type="text"
                  nz-input
                  placeholder="1XXXXXXXXX"
                  [(ngModel)]="phone"
                  name="phone"
                  class="rounded-md flex-1"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <nz-select [(ngModel)]="gender" name="gender" class="w-full">
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
                [(ngModel)]="email"
                name="email"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Role <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select [(ngModel)]="role" name="role" class="flex-1">
                  @for (r of roles; track r) {
                    <nz-option [nzValue]="r" [nzLabel]="r"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="openAddRoleModal()"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Role"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Password <span class="text-rose-500">*</span>
              </label>
              <input
                type="password"
                nz-input
                placeholder="••••••"
                [(ngModel)]="password"
                name="password"
                class="rounded-md"
                required
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
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                class="rounded-md"
                required
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="rounded-md">
              <span nz-icon nzType="check"></span> Create Representative
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Add Role Modal -->
    <nz-modal
      [(nzVisible)]="isAddRoleModalOpen"
      nzTitle="Quick Add Role"
      nzOkText="Add Role"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isAddRoleModalOpen = false"
      (nzOnOk)="saveNewRole()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Role Title <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Lead Pharmacist, Billing Associate"
            [(ngModel)]="newRoleName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class RepAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);

  firstName = '';
  lastName = '';
  phone = '';
  gender = 'Male';
  email = '';
  role = 'PMS Salesman';
  roles = ['PMS Manager', 'PMS Salesman', 'PMS Cashier', 'Pharmacist', 'Store Keeper'];
  password = '';
  confirmPassword = '';

  isAddRoleModalOpen = false;
  newRoleName = '';

  openAddRoleModal(): void {
    this.newRoleName = '';
    this.isAddRoleModalOpen = true;
  }

  saveNewRole(): void {
    const val = this.newRoleName.trim();
    if (!val) {
      this.msg.error('Please enter a role name');
      return;
    }
    if (!this.roles.includes(val)) {
      this.roles.push(val);
    }
    this.role = val;
    this.isAddRoleModalOpen = false;
    this.msg.success(`Role "${val}" added!`);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/representative']);
    }
  }

  submitForm(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.msg.error('Please enter full name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }
    if (this.password && this.password !== this.confirmPassword) {
      this.msg.error('Passwords do not match');
      return;
    }

    this.msg.success(`Staff member "${this.firstName} ${this.lastName}" registered!`);
    this.router.navigate(['/representative']);
  }
}
