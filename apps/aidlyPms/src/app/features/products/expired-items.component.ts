import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';

interface ExpiredItem {
  id: number;
  name: string;
  form: string;
  strength: string;
  company: string;
  expiry: string;
  qty: number;
  daysLeft: number;
  unitPrice: number;
}

@Component({
  selector: 'app-expired-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
        title="Near Expiry & Expired Medicines"
        subtitle="Track batches approaching expiration or requiring supplier return"
        formId="PROD_1607"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Expired Items' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <input
            type="number"
            nz-input
            [(ngModel)]="daysThreshold"
            placeholder="Days (<)"
            class="w-24 shrink-0 rounded-md"
          />
          <nz-select class="w-48 shrink-0" [(ngModel)]="selectedProduct" nzShowSearch nzAllowClear nzPlaceHolder="Select product">
            <nz-option nzValue="" nzLabel="All Products"></nz-option>
            <nz-option nzValue="Cef-3 250mg Capsule" nzLabel="Cef-3 250mg Capsule"></nz-option>
            <nz-option nzValue="Azimex 250mg Tablet" nzLabel="Azimex 250mg Tablet"></nz-option>
            <nz-option nzValue="Rhinocort 64mcg Inhaler" nzLabel="Rhinocort 64mcg Inhaler"></nz-option>
            <nz-option nzValue="Amoxil 250mg Syrup" nzLabel="Amoxil 250mg Syrup"></nz-option>
          </nz-select>
          <nz-select class="w-36 shrink-0" [(ngModel)]="selectedCompany" nzPlaceHolder="Select company">
            <nz-option nzValue="" nzLabel="All Companies"></nz-option>
            <nz-option nzValue="Renata" nzLabel="Renata"></nz-option>
            <nz-option nzValue="Beximco" nzLabel="Beximco"></nz-option>
            <nz-option nzValue="ACI" nzLabel="ACI"></nz-option>
            <nz-option nzValue="Square" nzLabel="Square"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="onSearch()">
            <span nz-icon nzType="search"></span> Search
          </button>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Expiry Report
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Container -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3 text-center">Expiry Date</th>
                <th class="p-3 text-right">Available Qty</th>
                <th class="p-3 text-right">Unit Price</th>
                <th class="p-3 text-right">Est. Loss Value</th>
                <th class="p-3 text-center">Days Left</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (item of filteredItems(); track item.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 m-0 text-xs">{{ item.name }}</p>
                    <p class="text-slate-400 m-0 text-[11px]">{{ item.form }} · {{ item.strength }} · {{ item.company }}</p>
                  </td>
                  <td class="p-3 text-center font-mono text-xs text-slate-700">{{ item.expiry }}</td>
                  <td class="p-3 text-right font-mono text-xs font-bold">{{ item.qty }} pcs</td>
                  <td class="p-3 text-right font-mono text-xs">৳ {{ item.unitPrice | number: '1.2-2' }}</td>
                  <td class="p-3 text-right font-mono text-xs font-semibold text-rose-700">৳ {{ (item.qty * item.unitPrice) | number: '1.2-2' }}</td>
                  <td class="p-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                      [ngClass]="{
                        'bg-rose-50 text-rose-700 border border-rose-200': item.daysLeft <= 15,
                        'bg-amber-50 text-amber-700 border border-amber-200': item.daysLeft > 15 && item.daysLeft <= 30,
                        'theme-badge': item.daysLeft > 30
                      }"
                    >
                      {{ item.daysLeft }} days
                    </span>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="initiateSupplierReturn(item)"
                        nz-tooltip
                        nzTooltipTitle="Supplier Return"
                        class="btn-tbl-action btn-tbl-warning"
                      >
                        <span nz-icon nzType="rollback"></span>
                      </button>
                      <button
                        type="button"
                        (click)="writeOffItem(item)"
                        nz-tooltip
                        nzTooltipTitle="Disposal / Write-off"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-400 text-xs">
                    No items expiring within {{ daysThreshold }} days.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Expired / Near Expiry Batches: <strong class="text-slate-900 font-semibold font-mono">{{ filteredItems().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Total Units: <strong class="text-slate-900 font-semibold font-mono">{{ totalExpiredQty() }}</strong> pcs</span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Expired Value: <strong class="text-rose-700 font-mono text-sm">৳ {{ totalExpiredValue() | number: '1.2-2' }}</strong></span>
          </div>
          <button nz-button nzType="default" nzSize="small" class="rounded" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Expiry Report
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ExpiredItemsComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  daysThreshold = 90;
  selectedCompany = '';
  selectedProduct = '';

  activeDays = 90;
  activeCompany = '';
  activeProduct = '';

  items = signal<ExpiredItem[]>([
    { id: 1, name: 'Cef-3 250mg Capsule', form: 'Capsule', strength: '250mg', company: 'Renata', expiry: '30-09-2026', qty: 120, daysLeft: 13, unitPrice: 35 },
    { id: 2, name: 'Azimex 250mg Tablet', form: 'Tablet', strength: '250mg', company: 'Beximco', expiry: '15-10-2026', qty: 48, daysLeft: 28, unitPrice: 25 },
    { id: 3, name: 'Rhinocort 64mcg Inhaler', form: 'Inhaler', strength: '64mcg', company: 'ACI', expiry: '01-11-2026', qty: 6, daysLeft: 45, unitPrice: 450 },
    { id: 4, name: 'Amoxil 250mg Syrup', form: 'Syrup', strength: '250mg/5ml', company: 'Square', expiry: '20-11-2026', qty: 24, daysLeft: 64, unitPrice: 65 },
  ]);

  totalExpiredQty = computed(() => this.filteredItems().reduce((sum, item) => sum + item.qty, 0));
  totalExpiredValue = computed(() => this.filteredItems().reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0));

  // Use a separate signal for active filter criteria to only update on Search click
  filterCriteria = signal({ days: 90, company: '', product: '' });

  filteredItems = computed(() => {
    const criteria = this.filterCriteria();
    return this.items().filter(item => {
      const matchComp = !criteria.company || item.company === criteria.company;
      const matchProd = !criteria.product || item.name === criteria.product;
      const matchDays = item.daysLeft <= criteria.days;
      return matchComp && matchDays && matchProd;
    });
  });

  onSearch(): void {
    this.filterCriteria.set({
      days: Number(this.daysThreshold) || 90,
      company: this.selectedCompany,
      product: this.selectedProduct
    });
  }

  resetFilters(): void {
    this.daysThreshold = 90;
    this.selectedCompany = '';
    this.selectedProduct = '';
    this.onSearch();
  }

  initiateSupplierReturn(item: ExpiredItem): void {
    this.modal
      .confirmAction(`Initiate Return for ${item.name}?`, `Create supplier debit note for ${item.qty} units from ${item.company}?`, 'Confirm Return')
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.update(list => list.filter(i => i.id !== item.id));
          this.msg.success(`Return invoice created for ${item.name}.`);
        }
      });
  }

  writeOffItem(item: ExpiredItem): void {
    this.modal
      .confirmDelete(item.name, `This will write off ${item.qty} units as damaged / expired inventory loss.`)
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.update(list => list.filter(i => i.id !== item.id));
          this.msg.success(`${item.name} written off from active inventory.`);
        }
      });
  }

  exportReport(): void {
    this.msg.success('Expiry audit report exported.');
  }
}
