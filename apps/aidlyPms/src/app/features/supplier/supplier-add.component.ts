import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupplierService } from '../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="w-full space-y-4">
      <app-page-header
        title="Create Supplier"
        subtitle="Register a new pharmaceutical vendor or distributor account"
        formId="PUR_1502"
        [breadcrumbs]="[{ label: 'Suppliers', url: '/supplier/list' }, { label: 'Create Supplier' }]"
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
                Supplier Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="Enter supplier / vendor name"
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
              <p class="text-xs text-slate-400 mt-1">Format: 1XXXXXXXXX</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Address / Territory
              </label>
              <input
                type="text"
                nz-input
                placeholder="e.g. 45 Motijheel C/A, Dhaka-1000"
                [(ngModel)]="address"
                name="address"
                class="rounded-md"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Note</label>
              <textarea
                nz-input
                rows="3"
                placeholder="Additional notes about this supplier..."
                [(ngModel)]="note"
                name="note"
                class="rounded-md"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span class="text-sm font-semibold text-slate-800 block">Has Opening Due Balance?</span>
              <span class="text-xs text-slate-500">Record previous unpaid invoice balance from old records</span>
            </div>
            <label nz-checkbox [(ngModel)]="dueEnabled" name="dueEnabled"></label>
          </div>

          @if (dueEnabled) {
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Opening Due Amount (৳) <span class="text-rose-500">*</span>
              </label>
              <input
                type="number"
                nz-input
                placeholder="0.00"
                [(ngModel)]="openingDue"
                name="openingDue"
                class="rounded-md"
              />
            </div>
          }

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="rounded-md">
              <span nz-icon nzType="check"></span> Save Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SupplierAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly supplierService = inject(SupplierService);

  name = '';
  phone = '';
  address = '';
  note = '';
  dueEnabled = false;
  openingDue = 0;

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/supplier/list']);
    }
  }

  submitForm(): void {
    if (!this.name.trim()) {
      this.msg.error('Please enter supplier name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter supplier phone number');
      return;
    }

    const fullPhone = `+880 ${this.phone.trim()}`;
    const balance = this.dueEnabled ? Number(this.openingDue) || 0 : 0;
    this.supplierService.createSupplier({
      name: this.name.trim(),
      phone: fullPhone,
      current_due_balance: balance,
      note: this.note.trim(),
    }).subscribe({
      next: () => {
        this.msg.success(`Supplier "${this.name}" created successfully!`);
        this.router.navigate(['/supplier/list']);
      },
      error: (err: any) => {
        this.msg.error(err?.error?.message || 'Failed to create supplier');
      },
    });
  }
}
