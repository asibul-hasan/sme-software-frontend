import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';

interface RequisitionRow {
  id: number;
  name: string;
  generic: string;
  company: string;
  box: number;
  minQty: number;
  sale6m: number;
  qtyBox: number;
  btp: number;
  vatPercent: number;
  total: number;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzModalModule,
    NzInputNumberModule,
    NzIconModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Inventory Requisitions"
        subtitle="Stock replenishment orders and supplier procurement requests"
        formId="PROD_1605"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Requisitions' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <input
            type="text"
            nz-input
            placeholder="Search brand or generic..."
            [(ngModel)]="searchQuery"
            class="w-48 shrink-0 rounded-md"
          />

          <nz-select class="w-36 shrink-0" [(ngModel)]="selectedCompany" nzPlaceHolder="Company">
            <nz-option nzValue="" nzLabel="All Companies"></nz-option>
            @for (comp of companies(); track comp) {
              <nz-option [nzValue]="comp" [nzLabel]="comp"></nz-option>
            }
          </nz-select>

          <nz-select class="w-32 shrink-0" [(ngModel)]="presetFilter" (ngModelChange)="applyPreset()" nzPlaceHolder="Preset">
            <nz-option nzValue="All" nzLabel="All"></nz-option>
            <nz-option nzValue="Fast Moving" nzLabel="Fast Moving"></nz-option>
            <nz-option nzValue="Low Stock" nzLabel="Low Stock"></nz-option>
          </nz-select>

          <div class="flex items-center gap-2.5 py-0.5 px-2 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
            <label nz-checkbox [(ngModel)]="allItems" class="text-xs text-slate-700 font-medium cursor-pointer m-0">
              All
            </label>
            <label nz-checkbox [(ngModel)]="asPerSale" class="text-xs text-slate-700 font-medium cursor-pointer m-0">
              As Sale
            </label>
            <label nz-checkbox [(ngModel)]="minQtyOnly" class="text-xs text-slate-700 font-medium cursor-pointer m-0">
              Min Qty
            </label>
          </div>

          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Product (F2)
          </button>
          <button nz-button nzType="primary" class="rounded-md" (click)="finalizeBilling()">
            <span nz-icon nzType="file-done"></span> Generate Bill (F8)
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
                <th class="p-3 text-center">Box</th>
                <th class="p-3 text-center">MIN QTY (Pcs)</th>
                <th class="p-3 text-center">Sale (6Mth)</th>
                <th class="p-3 text-center">Qty/Box</th>
                <th class="p-3 text-right">BTP (৳)</th>
                <th class="p-3 text-right">VAT (%)</th>
                <th class="p-3 text-right">BTP+VAT (৳)</th>
                <th class="p-3 text-right">Total (৳)</th>
                <th class="p-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (item of filteredItems(); track item.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 m-0 text-xs">{{ item.name }}</p>
                    <p class="text-slate-400 m-0 text-[11px]">{{ item.generic }} · {{ item.company }}</p>
                  </td>
                  <td class="p-3 text-center font-mono text-xs font-semibold">{{ item.box }}</td>
                  <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.minQty }}</td>
                  <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.sale6m }}</td>
                  <td class="p-3 text-center font-mono text-xs text-slate-600">{{ item.qtyBox }}</td>
                  <td class="p-3 text-right font-mono text-xs text-slate-600">{{ item.btp | number: '1.2-2' }}</td>
                  <td class="p-3 text-right font-mono text-xs text-slate-600">{{ item.vatPercent }}%</td>
                  <td class="p-3 text-right font-mono text-xs text-slate-600">{{ item.btp + (item.btp * item.vatPercent / 100) | number: '1.2-2' }}</td>
                  <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ item.total | number: '1.2-2' }}
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="openEditModal(item)"
                        nz-tooltip
                        nzTooltipTitle="Edit Line Item"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="removeItem(item)"
                        nz-tooltip
                        nzTooltipTitle="Remove Line Item"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" class="p-8 text-center text-slate-400 text-xs">
                    No requisition lines match the applied criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Requisition Lines: <strong class="text-slate-900 font-semibold">{{ filteredItems().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Estimated Price: <strong class="theme-total-text font-mono text-sm">৳ {{ totalEstimatedCost() | number: '1.2-2' }}</strong></span>
          </div>
          <button nz-button nzType="primary" nzSize="small" class="rounded" (click)="finalizeBilling()">
            <span nz-icon nzType="file-done"></span> Generate Bill (F8)
          </button>
        </div>
      </div>
    </div>

    <!-- Unified Add / Modify Requisition Item Modal -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add Requisition Line' : ('Modify Requisition: ' + currentForm.name)"
      [nzOkText]="modalMode === 'create' ? 'Add Line' : 'Update Line'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveItem()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Product Brand Name *</label>
            <input type="text" nz-input [(ngModel)]="currentForm.name" placeholder="e.g. Napa Extra 500mg" class="rounded-md" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Generic Name</label>
              <input type="text" nz-input [(ngModel)]="currentForm.generic" placeholder="e.g. Paracetamol" class="rounded-md" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Manufacturer</label>
              <input type="text" nz-input [(ngModel)]="currentForm.company" placeholder="e.g. Beximco Pharma" class="rounded-md" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Requisition Box</label>
              <nz-input-number class="w-full" [nzMin]="1" [(ngModel)]="currentForm.box"></nz-input-number>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Pcs/Box</label>
              <nz-input-number class="w-full" [nzMin]="1" [(ngModel)]="currentForm.qtyBox"></nz-input-number>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">BTP Price (৳)</label>
              <nz-input-number class="w-full" [nzMin]="0" [(ngModel)]="currentForm.btp"></nz-input-number>
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class RequisitionListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);

  searchQuery = '';
  selectedCompany = '';
  presetFilter = 'All';
  allItems = false;
  asPerSale = false;
  minQtyOnly = false;

  companies = signal<string[]>([]);
  items = signal<RequisitionRow[]>([]);

  filteredItems = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const comp = this.selectedCompany;
    const preset = this.presetFilter;
    const all = this.allItems;

    return this.items().filter(item => {
      const matchQ = !q || item.name.toLowerCase().includes(q) || item.generic.toLowerCase().includes(q);
      const matchComp = !comp || item.company === comp;

      let matchPreset = true;
      if (preset === 'Fast Moving') {
        matchPreset = item.sale6m > 800;
      } else if (preset === 'Low Stock') {
        matchPreset = item.minQty > 50;
      }

      return matchQ && matchComp && (all || matchPreset);
    });
  });

  totalEstimatedCost = computed(() => {
    return this.filteredItems().reduce((sum, item) => sum + item.total, 0);
  });

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  currentForm: RequisitionRow = {
    id: 0,
    name: '',
    generic: '',
    company: '',
    box: 1,
    minQty: 10,
    sale6m: 50,
    qtyBox: 10,
    btp: 10,
    vatPercent: 0,
    total: 100,
  };

  ngOnInit(): void {
    this.loadCompanies();
    this.loadInitialRequisitionItems();
  }

  loadCompanies(): void {
    this.productService.getCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const comps = res.data.map(c => c.name).filter(Boolean);
          this.companies.set(comps);
        }
      },
    });
  }

  loadInitialRequisitionItems(): void {
    this.productService.getProducts({ pageSize: 50 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const initial: RequisitionRow[] = (res.data.items || []).map((p: any, idx: number) => {
            const qtyBox = p.quantity_per_box || 10;
            const btp = p.purchase_price_per_piece || (p.cost_per_box ? p.cost_per_box / qtyBox : 5);
            const box = 2;
            return {
              id: p.product_no || (idx + 1),
              name: p.product_name,
              generic: p.generic_name || 'Generic Formulation',
              company: p.company_name || 'Pharmaceuticals Ltd.',
              box: box,
              minQty: p.min_stock_qty_pcs || 50,
              sale6m: 100,
              qtyBox: qtyBox,
              btp: btp,
              vatPercent: 0,
              total: box * btp * qtyBox,
            };
          });
          this.items.set(initial);
        }
      },
    });
  }

  applyPreset(): void {}

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCompany = '';
    this.presetFilter = 'All';
    this.allItems = false;
    this.asPerSale = false;
    this.minQtyOnly = false;
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.currentForm = {
      id: 0,
      name: '',
      generic: '',
      company: this.companies()[0] || 'Pharmaceuticals Ltd.',
      box: 1,
      minQty: 20,
      sale6m: 100,
      qtyBox: 10,
      btp: 10,
      vatPercent: 0,
      total: 100,
    };
    this.isModalVisible = true;
  }

  openEditModal(item: RequisitionRow): void {
    this.modalMode = 'edit';
    this.currentForm = { ...item };
    this.isModalVisible = true;
  }

  saveItem(): void {
    if (!this.currentForm.name.trim()) {
      this.msg.error('Please enter the product name.');
      return;
    }
    const computedTotal = this.currentForm.box * this.currentForm.btp * (1 + this.currentForm.vatPercent / 100) * this.currentForm.qtyBox;

    if (this.modalMode === 'create') {
      const nextId = Math.max(...this.items().map(i => i.id), 0) + 1;
      const newLine: RequisitionRow = {
        ...this.currentForm,
        id: nextId,
        total: computedTotal,
      };
      this.items.update(list => [...list, newLine]);
      this.msg.success(`Added ${newLine.name} to requisition.`);
    } else {
      this.items.update(list =>
        list.map(i => (i.id === this.currentForm.id ? { ...this.currentForm, total: computedTotal } : i))
      );
      this.msg.success(`Updated ${this.currentForm.name}.`);
    }
    this.isModalVisible = false;
  }

  removeItem(item: RequisitionRow): void {
    this.modal
      .confirmDelete(item.name, 'Remove this item from the current requisition order?')
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.update(list => list.filter(i => i.id !== item.id));
          this.msg.success(`${item.name} removed from requisition.`);
        }
      });
  }

  finalizeBilling(): void {
    if (this.items().length === 0) {
      this.msg.warning('No requisition lines to generate bill.');
      return;
    }
    const payload = {
      items: this.items().map(i => ({
        product_no: i.id,
        requested_box_qty: i.box,
        quantity_in_box: i.qtyBox,
        requested_pcs_qty: i.box * i.qtyBox,
        estimated_unit_cost: i.btp,
        remarks: `${i.name} requisition`,
      })),
    };
    this.productService.createRequisition(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success(`Requisition order generated for ${this.items().length} items (Total: ৳ ${this.totalEstimatedCost().toLocaleString()})!`);
          this.items.set([]);
        } else {
          this.msg.error(res.message || 'Failed to create requisition');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to create requisition'),
    });
  }
}
