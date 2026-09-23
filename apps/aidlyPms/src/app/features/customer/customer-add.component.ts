import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CustomerService } from '../../core/services/customer.service';
import { CustCustomer } from '../../core/models';

@Component({
  selector: 'app-customer-add',
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
    NzModalModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Add Customer"
        subtitle="Register a new retail, wholesale, or corporate pharmacy client"
        formId="SALE_1403"
        [breadcrumbs]="[{ label: 'Customers', url: '/customer/list' }, { label: 'Add Customer' }]"
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
                Customer Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="Full name"
                [(ngModel)]="name"
                name="name"
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
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span class="text-rose-500">*</span>
              </label>
              <nz-select [(ngModel)]="gender" name="gender" class="w-full">
                <nz-option nzValue="Male" nzLabel="Male"></nz-option>
                <nz-option nzValue="Female" nzLabel="Female"></nz-option>
                <nz-option nzValue="Other" nzLabel="Other"></nz-option>
              </nz-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Customer Type <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select [(ngModel)]="type" name="type" class="flex-1">
                  @for (t of customerTypes; track t) {
                    <nz-option [nzValue]="t" [nzLabel]="t"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="isAddCustomerTypeOpen = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Customer Type"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Discount % <span class="text-xs text-slate-400 font-normal">(Default line discount)</span>
              </label>
              <input
                type="number"
                nz-input
                placeholder="0"
                min="0"
                max="100"
                [(ngModel)]="discountPercent"
                name="discountPercent"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                nz-input
                placeholder="email@example.com"
                [(ngModel)]="email"
                name="email"
                class="rounded-md"
              />
            </div>

            <div class="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span class="text-sm font-semibold text-slate-800 block">Has Opening Due Balance?</span>
                <span class="text-xs text-slate-500">Record customer's prior unpaid ledger debt</span>
              </div>
              <label nz-checkbox [(ngModel)]="dueEnabled" name="dueEnabled"></label>
            </div>

            @if (dueEnabled) {
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Due Amount (৳) <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="dueAmount"
                  name="dueAmount"
                  class="rounded-md"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Promised Payment Date</label>
                <input
                  type="date"
                  nz-input
                  [(ngModel)]="dueDate"
                  name="dueDate"
                  class="rounded-md"
                />
              </div>
            }

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <textarea
                nz-input
                rows="2"
                placeholder="Street address, area, city..."
                [(ngModel)]="address"
                name="address"
                class="rounded-md"
              ></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Note</label>
              <textarea
                nz-input
                rows="2"
                placeholder="Additional notes about customer preferences..."
                [(ngModel)]="note"
                name="note"
                class="rounded-md"
              ></textarea>
            </div>

            <div class="md:col-span-2 flex items-center justify-between p-4 theme-highlight-card rounded-lg">
              <div>
                <p class="text-sm font-bold theme-highlight-title mb-0.5">Loyalty Member</p>
                <p class="text-xs theme-highlight-subtitle mb-0">Enroll in points accumulation and reward redemptions</p>
              </div>
              <label nz-checkbox [(ngModel)]="loyalty" name="loyalty"></label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="rounded-md">
              <span nz-icon nzType="check"></span> Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Add Customer Type Modal -->
    <nz-modal
      [(nzVisible)]="isAddCustomerTypeOpen"
      nzTitle="Quick Add Customer Type"
      nzOkText="Add Type"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isAddCustomerTypeOpen = false"
      (nzOnOk)="saveNewCustomerType()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Customer Type Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Clinic, Corporate, NGO"
            [(ngModel)]="newCustomerTypeName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class CustomerAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);

  private readonly customerService = inject(CustomerService);

  name = '';
  phone = '';
  gender = 'Male';
  type = 'Regular';
  customerTypes = ['Regular', 'Wholesale Client', 'VIP', 'Staff', 'Doctor Referral'];
  discountPercent = 0;
  email = '';
  dueEnabled = false;
  dueAmount = 0;
  dueDate = '';
  address = '';
  note = '';
  loyalty = false;

  isAddCustomerTypeOpen = false;
  newCustomerTypeName = '';

  saveNewCustomerType(): void {
    const val = this.newCustomerTypeName.trim();
    if (!val) {
      this.msg.error('Customer type name is required');
      return;
    }
    if (!this.customerTypes.includes(val)) {
      this.customerTypes.push(val);
    }
    this.type = val;
    this.isAddCustomerTypeOpen = false;
    this.msg.success(`Customer type "${val}" added!`);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/customer/list']);
    }
  }

  submitForm(): void {
    if (!this.name.trim()) {
      this.msg.error('Please enter customer name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter customer phone');
      return;
    }

    const typeCode = this.type === 'Doctor Referral' ? 2 : (this.type === 'VIP' ? 3 : (this.type === 'Wholesale Client' ? 4 : 1));

    const payload: Partial<CustCustomer> = {
      name: this.name.trim(),
      phone: `+880 ${this.phone.trim()}`,
      customer_type: typeCode,
      gender: this.gender === 'Female' ? 2 : 1,
      discount_percent: this.discountPercent,
      email: this.email,
      total_due: this.dueEnabled ? Number(this.dueAmount) || 0 : 0,
      address: this.address.trim() || 'Local Area',
      notes: this.note,
      is_loyalty_member: this.loyalty,
      is_active: true,
    };

    this.customerService.createCustomer(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success(`Customer "${this.name}" registered successfully!`);
          this.router.navigate(['/customer/list']);
        } else {
          this.msg.error(res.message || 'Failed to register customer');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to register customer'),
    });
  }
}
