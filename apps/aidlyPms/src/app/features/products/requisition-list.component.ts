import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProdCompany, ProdProduct, LowStockProduct } from '../../core/models/product.models';
import { SuppSupplier } from '../../core/models/supplier.models';

export interface RequisitionItemRow {
  product_no: number;
  product_name: string;
  generic_name: string;
  company_name: string;
  company_no?: number;
  current_stock_pcs: number;
  min_stock_qty_pcs: number;
  shortfall_pcs: number;
  quantity_in_box: number;
  box_qty: number;
  unit_cost: number;
  vat_percent: number;
  sale_qty_6mth_pcs: number;
  is_from_low_stock?: boolean;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzInputNumberModule,
    NzIconModule,
    NzTooltipModule,
    NzBadgeModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <!-- Page Header -->
      <app-page-header
        title="Inventory Requisition Planner"
        subtitle="Master-Detail purchase requisition, low-stock shortfall auto-population & supplier procurement"
        formId="PROD_1605"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Requisition Planner' }]"
      >
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a routerLink="/products/requisition/records" nz-button nzType="default" class="rounded-md">
            <span nz-icon nzType="history"></span> Requisition Records
          </a>
          <button
            nz-button
            nzType="default"
            class="rounded-md border-amber-400 bg-amber-50/60 text-amber-900 font-semibold hover:bg-amber-100"
            [nzLoading]="isLoadingLowStock()"
            (click)="populateLowStock()"
          >
            <span nz-icon nzType="thunderbolt" class="text-amber-600"></span> Populate Low Stock Items
          </button>
          <button nz-button nzType="default" class="rounded-md" (click)="openProductSelector()">
            <span nz-icon nzType="plus"></span> Add Item (F2)
          </button>
          <button
            nz-button
            nzType="primary"
            class="rounded-md font-semibold"
            [nzLoading]="isSaving()"
            [disabled]="items().length === 0"
            (click)="saveRequisition()"
          >
            <span nz-icon nzType="save"></span> Save Requisition (F8)
          </button>
        </div>
      </app-page-header>

      <!-- MASTER HEADER CARD -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 shrink-0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <!-- Requisition ID / Code -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Requisition Code
            </label>
            <div class="flex items-center h-8">
              @if (savedRequisitionCode()) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono font-bold text-xs">
                  <span nz-icon nzType="check-circle" class="text-emerald-600"></span>
                  {{ savedRequisitionCode() }}
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs">
                  <span nz-icon nzType="clock-circle"></span>
                  DRAFT (Auto on save)
                </span>
              }
            </div>
          </div>

          <!-- Requisition Date -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Requisition Date *
            </label>
            <nz-date-picker
              class="w-full rounded-md"
              [(ngModel)]="requisitionDate"
              nzFormat="dd-MM-yyyy"
              [nzAllowClear]="false"
            ></nz-date-picker>
          </div>

          <!-- Supplier (Distributor) -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Supplier / Distributor
            </label>
            <nz-select
              class="w-full"
              [(ngModel)]="selectedSupplierNo"
              nzPlaceHolder="Select Supplier / Distributor"
              nzShowSearch
              nzAllowClear
            >
              @for (sup of suppliers(); track sup.supplier_no) {
                <nz-option
                  [nzValue]="sup.supplier_no"
                  [nzLabel]="sup.name + (sup.phone ? ' (' + sup.phone + ')' : '')"
                ></nz-option>
              }
            </nz-select>
          </div>

          <!-- Target Company / Manufacturer -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Manufacturer (Company)
            </label>
            <nz-select
              class="w-full"
              [(ngModel)]="selectedCompanyNo"
              nzPlaceHolder="All Manufacturers"
              nzShowSearch
              nzAllowClear
              (ngModelChange)="onCompanyFilterChange()"
            >
              <nz-option [nzValue]="null" nzLabel="All Manufacturers"></nz-option>
              @for (comp of companies(); track comp.company_no) {
                <nz-option [nzValue]="comp.company_no" [nzLabel]="comp.name"></nz-option>
              }
            </nz-select>
          </div>

          <!-- Remarks / Procurement Note -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Remarks / Note
            </label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Urgent OTC morning restock..."
              [(ngModel)]="remarks"
              class="rounded-md w-full"
            />
          </div>
        </div>

        <!-- Master Quick Action Toolbar -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-medium">Quick Actions:</span>
            <button
              nz-button
              nzType="dashed"
              nzSize="small"
              class="rounded border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100"
              [nzLoading]="isLoadingLowStock()"
              (click)="populateLowStock()"
            >
              <span nz-icon nzType="thunderbolt" class="text-amber-500"></span> Populate Low Stock
              @if (selectedCompanyNo) {
                <span>(Selected Company)</span>
              }
            </button>
            <button
              nz-button
              nzType="default"
              nzSize="small"
              class="rounded"
              (click)="openProductSelector()"
            >
              <span nz-icon nzType="search"></span> Search & Add (F2)
            </button>
            @if (items().length > 0) {
              <button
                nz-button
                nzType="text"
                nzDanger
                nzSize="small"
                class="rounded"
                (click)="clearAllItems()"
              >
                <span nz-icon nzType="delete"></span> Clear All
              </button>
            }
          </div>

          <div class="flex items-center gap-3 text-slate-500">
            <span>Shortcut: <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">F2</kbd> Add Item</span>
            <span><kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">F8</kbd> Save</span>
          </div>
        </div>
      </div>

      <!-- DETAIL ITEMS TABLE SECTION -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Title Bar -->
        <div class="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
              Requisition Detail Items
            </h3>
            <span class="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-mono text-xs font-semibold">
              {{ items().length }}
            </span>
          </div>

          <div class="flex items-center gap-3 text-xs">
            <input
              type="text"
              nz-input
              nzSize="small"
              placeholder="Filter items in table..."
              [(ngModel)]="tableFilter"
              class="w-48 rounded"
            />
          </div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-2.5 text-center w-12">#</th>
                <th class="p-2.5">Product & Generic</th>
                <th class="p-2.5 text-center w-28">Current Stock</th>
                <th class="p-2.5 text-center w-28">Box Qty</th>
                <th class="p-2.5 text-center w-24">Pcs / Box</th>
                <th class="p-2.5 text-center w-24">Total Pcs</th>
                <th class="p-2.5 text-right w-28">BTP Unit (৳)</th>
                <th class="p-2.5 text-right w-20">VAT (%)</th>
                <th class="p-2.5 text-right w-32">Total (৳)</th>
                <th class="p-2.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (item of displayedItems(); track item.product_no; let i = $index) {
                <tr class="hover:bg-slate-50/70 transition-colors" [class.bg-amber-50/30]="item.is_from_low_stock">
                  <!-- Index -->
                  <td class="p-2.5 text-center font-mono text-xs text-slate-400">
                    {{ i + 1 }}
                  </td>

                  <!-- Product details -->
                  <td class="p-2.5">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-900 text-xs leading-tight">
                          {{ item.product_name }}
                        </span>
                        @if (item.is_from_low_stock) {
                          <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        }
                      </div>
                      <span class="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {{ item.generic_name }} · {{ item.company_name }}
                      </span>
                    </div>
                  </td>

                  <!-- Current Stock / Shortfall -->
                  <td class="p-2.5 text-center">
                    <div class="flex flex-col items-center">
                      <span
                        class="px-2 py-0.5 rounded font-mono text-xs font-semibold"
                        [ngClass]="{
                          'bg-rose-50 text-rose-700 border border-rose-200': item.current_stock_pcs <= item.min_stock_qty_pcs,
                          'bg-slate-100 text-slate-700': item.current_stock_pcs > item.min_stock_qty_pcs
                        }"
                      >
                        {{ item.current_stock_pcs }} pcs
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5">
                        Min: {{ item.min_stock_qty_pcs }} pcs
                      </span>
                    </div>
                  </td>

                  <!-- Box Qty (Editable) -->
                  <td class="p-2.5 text-center">
                    <nz-input-number
                      class="w-20 rounded text-center font-mono font-bold"
                      nzSize="small"
                      [nzMin]="1"
                      [nzStep]="1"
                      [(ngModel)]="item.box_qty"
                    ></nz-input-number>
                  </td>

                  <!-- Pcs / Box -->
                  <td class="p-2.5 text-center font-mono text-xs text-slate-600">
                    {{ item.quantity_in_box }}
                  </td>

                  <!-- Total Pieces -->
                  <td class="p-2.5 text-center font-mono text-xs font-bold text-slate-800">
                    {{ item.box_qty * item.quantity_in_box }}
                  </td>

                  <!-- Unit Cost / BTP (Editable) -->
                  <td class="p-2.5 text-right">
                    <nz-input-number
                      class="w-24 rounded text-right font-mono"
                      nzSize="small"
                      [nzMin]="0"
                      [nzStep]="0.5"
                      [(ngModel)]="item.unit_cost"
                    ></nz-input-number>
                  </td>

                  <!-- VAT % -->
                  <td class="p-2.5 text-right font-mono text-xs text-slate-500">
                    {{ item.vat_percent }}%
                  </td>

                  <!-- Line Total -->
                  <td class="p-2.5 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ calculateLineTotal(item) | number: '1.2-2' }}
                  </td>

                  <!-- Actions -->
                  <td class="p-2.5 text-center">
                    <button
                      type="button"
                      (click)="removeItem(item)"
                      nz-tooltip
                      nzTooltipTitle="Remove Item"
                      class="btn-tbl-action btn-tbl-delete"
                    >
                      <span nz-icon nzType="delete"></span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" class="p-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <span nz-icon nzType="shopping-cart" class="text-4xl text-slate-300"></span>
                      <p class="font-semibold text-slate-700 text-sm m-0">No Requisition Items in Plan</p>
                      <p class="text-xs text-slate-400 max-w-md m-0">
                        Add medicines one-by-one by clicking <strong>Add Item (F2)</strong>, or automatically pull all items below safety threshold by clicking <strong>Populate Low Stock Items</strong>.
                      </p>
                      <div class="flex items-center gap-2 pt-2">
                        <button
                          nz-button
                          nzType="primary"
                          nzSize="small"
                          class="rounded"
                          (click)="openProductSelector()"
                        >
                          <span nz-icon nzType="plus"></span> Add Product (F2)
                        </button>
                        <button
                          nz-button
                          nzType="default"
                          nzSize="small"
                          class="rounded border-amber-300 text-amber-800 bg-amber-50"
                          (click)="populateLowStock()"
                        >
                          <span nz-icon nzType="thunderbolt"></span> Populate Low Stock
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- STICKY BOTTOM SUMMARY FOOTER -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-slate-500">Products:</span>
              <strong class="text-slate-900 font-bold ml-1 font-mono text-sm">{{ items().length }}</strong>
            </div>
            <span class="text-slate-300">|</span>
            <div>
              <span class="text-slate-500">Total Boxes:</span>
              <strong class="text-slate-900 font-bold ml-1 font-mono text-sm">{{ totalBoxes() }}</strong>
            </div>
            <span class="text-slate-300">|</span>
            <div>
              <span class="text-slate-500">Total Pieces:</span>
              <strong class="text-slate-900 font-bold ml-1 font-mono text-sm">{{ totalPieces() }}</strong>
            </div>
            <span class="text-slate-300">|</span>
            <div>
              <span class="text-slate-500">Estimated Total Cost:</span>
              <strong class="theme-total-text font-bold ml-1.5 font-mono text-base">
                ৳ {{ grandTotal() | number: '1.2-2' }}
              </strong>
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (items().length > 0) {
              <button nz-button nzType="default" nzSize="small" class="rounded" (click)="clearAllItems()">
                Reset
              </button>
            }
            <button
              nz-button
              nzType="primary"
              class="rounded font-semibold px-4"
              [nzLoading]="isSaving()"
              [disabled]="items().length === 0"
              (click)="saveRequisition()"
            >
              <span nz-icon nzType="check"></span> Save & Generate (F8)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Search & Add Selector Modal (F2) -->
    <nz-modal
      [(nzVisible)]="isProductSelectorVisible"
      nzTitle="Search & Add Product to Requisition"
      [nzFooter]="null"
      nzWidth="720px"
      (nzOnCancel)="isProductSelectorVisible = false"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div class="relative">
            <input
              #searchInput
              type="text"
              nz-input
              placeholder="Search by brand name, generic formulation, or barcode..."
              [(ngModel)]="productSearchQuery"
              (ngModelChange)="searchCatalogProducts()"
              class="rounded-md text-sm pl-8 py-2 w-full"
            />
            <span nz-icon nzType="search" class="absolute left-2.5 top-3 text-slate-400"></span>
          </div>

          <!-- Catalog Products List -->
          <div class="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            @for (p of catalogProducts(); track p.product_no) {
              <div
                class="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                (click)="addProductToRequisition(p)"
              >
                <div class="flex flex-col flex-1 mr-4">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 text-xs">{{ p.product_name }}</span>
                    @if (p.strength) {
                      <span class="text-[11px] text-slate-500 font-mono">{{ p.strength }}</span>
                    }
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
                      {{ p.company_name }}
                    </span>
                  </div>
                  <span class="text-[11px] text-slate-400 mt-0.5">
                    Generic: {{ p.generic_name || 'N/A' }} · {{ p.quantity_per_box }} pcs/box
                  </span>
                </div>

                <div class="flex items-center gap-4 text-right">
                  <div>
                    <p class="text-[11px] text-slate-400 m-0">Stock</p>
                    <p
                      class="font-mono text-xs font-semibold m-0"
                      [class.text-rose-600]="(p.stock_qty || 0) <= p.min_stock_qty_pcs"
                      [class.text-slate-800]="(p.stock_qty || 0) > p.min_stock_qty_pcs"
                    >
                      {{ p.stock_qty || 0 }} pcs
                    </p>
                  </div>
                  <div>
                    <p class="text-[11px] text-slate-400 m-0">BTP Price</p>
                    <p class="font-mono text-xs font-bold text-slate-800 m-0">
                      ৳ {{ p.purchase_price_per_piece || 0 | number: '1.2-2' }}
                    </p>
                  </div>
                  <button
                    nz-button
                    nzType="primary"
                    nzSize="small"
                    class="rounded"
                    (click)="addProductToRequisition(p); $event.stopPropagation()"
                  >
                    <span nz-icon nzType="plus"></span> Add
                  </button>
                </div>
              </div>
            } @empty {
              <div class="p-8 text-center text-slate-400 text-xs">
                No matching products found in catalog.
              </div>
            }
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Success Modal after save -->
    <nz-modal
      [(nzVisible)]="isSuccessModalVisible"
      nzTitle="Requisition Order Created"
      [nzFooter]="successModalFooter"
      (nzOnCancel)="isSuccessModalVisible = false"
    >
      <ng-container *nzModalContent>
        <div class="py-4 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl">
            <span nz-icon nzType="check"></span>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-base m-0">Requisition Generated Successfully!</h4>
            <p class="text-xs text-slate-500 mt-1 m-0">
              The purchase requisition order has been logged and sent for manager approval.
            </p>
          </div>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg inline-block text-left">
            <p class="text-xs text-slate-500 m-0">Requisition Number:</p>
            <p class="font-mono font-bold text-base text-emerald-800 m-0">{{ savedRequisitionCode() }}</p>
            <p class="text-xs text-slate-500 mt-2 m-0">Total Estimated Cost:</p>
            <p class="font-mono font-bold text-sm theme-total-text m-0">৳ {{ lastSavedCost() | number: '1.2-2' }}</p>
          </div>
        </div>
      </ng-container>
      <ng-template #successModalFooter>
        <div class="flex items-center justify-end gap-2">
          <button nz-button nzType="default" (click)="startNewRequisition()">
            <span nz-icon nzType="plus"></span> Create Another
          </button>
          <a routerLink="/products/requisition/records" nz-button nzType="primary" (click)="isSuccessModalVisible = false">
            <span nz-icon nzType="history"></span> View in Records
          </a>
        </div>
      </ng-template>
    </nz-modal>
  `,
})
export class RequisitionListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);

  // Master State
  savedRequisitionCode = signal<string | null>(null);
  lastSavedCost = signal<number>(0);
  requisitionDate: Date = new Date();
  selectedSupplierNo: number | null = null;
  selectedCompanyNo: number | null = null;
  remarks = '';

  // Data lookups
  suppliers = signal<SuppSupplier[]>([]);
  companies = signal<ProdCompany[]>([]);

  // Detail Items State
  items = signal<RequisitionItemRow[]>([]);
  tableFilter = '';

  // Loading States
  isLoadingLowStock = signal(false);
  isSaving = signal(false);

  // Product Selector Modal State
  isProductSelectorVisible = false;
  productSearchQuery = '';
  catalogProducts = signal<ProdProduct[]>([]);
  allProducts: ProdProduct[] = [];

  // Success Modal
  isSuccessModalVisible = false;

  // Filtered Detail Items
  displayedItems = computed(() => {
    const q = this.tableFilter.trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      i =>
        i.product_name.toLowerCase().includes(q) ||
        i.generic_name.toLowerCase().includes(q) ||
        i.company_name.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  totalBoxes = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.box_qty || 0), 0);
  });

  totalPieces = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.box_qty || 0) * (item.quantity_in_box || 1), 0);
  });

  grandTotal = computed(() => {
    return this.items().reduce((sum, item) => sum + this.calculateLineTotal(item), 0);
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadCompanies();
    this.loadCatalogProducts();
  }

  // Keyboard Shortcuts (F2: Add Item, F8: Save Requisition)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      this.openProductSelector();
    } else if (event.key === 'F8') {
      event.preventDefault();
      if (!this.isSaving() && this.items().length > 0) {
        this.saveRequisition();
      }
    }
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.suppliers.set([...(res.data.items || [])]);
        }
      },
    });
  }

  loadCompanies(): void {
    this.productService.getCompanies().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.companies.set(res.data || []);
        }
      },
    });
  }

  loadCatalogProducts(): void {
    this.productService.getProducts({ pageSize: 100 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allProducts = [...(res.data.items || [])];
          this.catalogProducts.set(this.allProducts);
        }
      },
    });
  }

  onCompanyFilterChange(): void {
    if (this.selectedCompanyNo) {
      const filtered = this.allProducts.filter(p => p.company_no === this.selectedCompanyNo);
      this.catalogProducts.set(filtered);
    } else {
      this.catalogProducts.set(this.allProducts);
    }
  }

  // Master Action: Populate Low Stock Items
  populateLowStock(): void {
    this.isLoadingLowStock.set(true);
    const companyFilter = this.selectedCompanyNo || undefined;

    this.productService.getLowStockProducts(companyFilter, true).subscribe({
      next: res => {
        this.isLoadingLowStock.set(false);
        if (res.success && res.data && res.data.length > 0) {
          const incoming: LowStockProduct[] = res.data;
          let addedCount = 0;
          let updatedCount = 0;

          this.items.update(current => {
            const list = [...current];
            for (const p of incoming) {
              const existingIdx = list.findIndex(i => i.product_no === p.product_no);
              const boxQty = p.suggested_box_qty > 0 ? p.suggested_box_qty : 1;
              const unitCost = p.purchase_price_per_piece > 0 ? p.purchase_price_per_piece : (p.cost_per_box / (p.quantity_per_box || 1));

              if (existingIdx >= 0) {
                // Keep the max box qty
                list[existingIdx].box_qty = Math.max(list[existingIdx].box_qty, boxQty);
                list[existingIdx].current_stock_pcs = p.current_stock_pcs;
                list[existingIdx].min_stock_qty_pcs = p.min_stock_qty_pcs;
                list[existingIdx].shortfall_pcs = p.shortfall_pcs;
                list[existingIdx].is_from_low_stock = true;
                updatedCount++;
              } else {
                list.push({
                  product_no: p.product_no,
                  product_name: p.product_name,
                  generic_name: p.generic_name,
                  company_name: p.company_name,
                  company_no: p.company_no || undefined,
                  current_stock_pcs: p.current_stock_pcs,
                  min_stock_qty_pcs: p.min_stock_qty_pcs,
                  shortfall_pcs: p.shortfall_pcs,
                  quantity_in_box: p.quantity_per_box || 1,
                  box_qty: boxQty,
                  unit_cost: unitCost,
                  vat_percent: p.vat_percent || 0,
                  sale_qty_6mth_pcs: p.sale_qty_6mth_pcs || 0,
                  is_from_low_stock: true,
                });
                addedCount++;
              }
            }
            return list;
          });

          this.msg.success(
            `Populated ${addedCount} items into requisition plan (${updatedCount} updated).`
          );
        } else {
          this.msg.info('No low-stock products found for the selected criteria.');
        }
      },
      error: err => {
        this.isLoadingLowStock.set(false);
        this.msg.error(err?.error?.message || 'Failed to fetch low stock items');
      },
    });
  }

  // Detail Item Management
  openProductSelector(): void {
    this.productSearchQuery = '';
    this.searchCatalogProducts();
    this.isProductSelectorVisible = true;
  }

  searchCatalogProducts(): void {
    const q = this.productSearchQuery.trim().toLowerCase();
    let source = this.allProducts;
    if (this.selectedCompanyNo) {
      source = source.filter(p => p.company_no === this.selectedCompanyNo);
    }
    if (!q) {
      this.catalogProducts.set(source);
      return;
    }
    const matched = source.filter(
      p =>
        p.product_name.toLowerCase().includes(q) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
        (p.barcode_value && p.barcode_value.toLowerCase().includes(q))
    );
    this.catalogProducts.set(matched);
  }

  addProductToRequisition(p: ProdProduct): void {
    const existing = this.items().find(i => i.product_no === p.product_no);
    const qtyInBox = p.quantity_per_box || 1;
    const unitCost = p.purchase_price_per_piece || (p.cost_per_box ? p.cost_per_box / qtyInBox : 0);

    if (existing) {
      this.items.update(list =>
        list.map(i => (i.product_no === p.product_no ? { ...i, box_qty: i.box_qty + 1 } : i))
      );
      this.msg.success(`Incremented box quantity for ${p.product_name}`);
    } else {
      const newLine: RequisitionItemRow = {
        product_no: p.product_no,
        product_name: p.product_name,
        generic_name: p.generic_name || 'General',
        company_name: p.company_name || 'Pharmaceuticals Ltd.',
        company_no: p.company_no,
        current_stock_pcs: p.stock_qty || 0,
        min_stock_qty_pcs: p.min_stock_qty_pcs || 10,
        shortfall_pcs: Math.max(0, (p.min_stock_qty_pcs || 10) - (p.stock_qty || 0)),
        quantity_in_box: qtyInBox,
        box_qty: 1,
        unit_cost: unitCost,
        vat_percent: 0,
        sale_qty_6mth_pcs: 0,
        is_from_low_stock: false,
      };
      this.items.update(list => [newLine, ...list]);
      this.msg.success(`Added ${p.product_name} to requisition`);
    }

    this.isProductSelectorVisible = false;
  }

  removeItem(item: RequisitionItemRow): void {
    this.items.update(list => list.filter(i => i.product_no !== item.product_no));
    this.msg.info(`Removed ${item.product_name} from plan.`);
  }

  clearAllItems(): void {
    this.modal
      .confirmDelete('All Requisition Items', 'Are you sure you want to clear all items from the current requisition draft?')
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.set([]);
          this.msg.info('Requisition items cleared.');
        }
      });
  }

  calculateLineTotal(item: RequisitionItemRow): number {
    const totalPcs = (item.box_qty || 0) * (item.quantity_in_box || 1);
    const unitPriceWithVat = (item.unit_cost || 0) * (1 + (item.vat_percent || 0) / 100);
    return Math.round(totalPcs * unitPriceWithVat * 100) / 100;
  }

  // Final Save to Backend
  saveRequisition(): void {
    if (this.items().length === 0) {
      this.msg.warning('Please add at least one product item to create a requisition.');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      company_no: this.selectedCompanyNo,
      supplier_no: this.selectedSupplierNo,
      status: 'Pending',
      remarks: this.remarks.trim() || undefined,
      items: this.items().map(i => {
        const boxQty = i.box_qty || 1;
        const qtyInBox = i.quantity_in_box || 1;
        const pcs = boxQty * qtyInBox;
        const btp = i.unit_cost || 0;
        const vat = i.vat_percent || 0;
        const btpVat = btp * (1 + vat / 100);
        const totalPrice = Math.round(pcs * btpVat * 100) / 100;

        return {
          product_no: i.product_no,
          box_qty: boxQty,
          requested_box_qty: boxQty,
          quantity_in_box: qtyInBox,
          min_qty_pcs: i.min_stock_qty_pcs,
          requested_pcs_qty: pcs,
          sale_qty_6mth_pcs: i.sale_qty_6mth_pcs || 0,
          btp: btp,
          estimated_unit_cost: btp,
          vat: vat,
          vat_percent: vat,
          btp_vat: btpVat,
          total_price: totalPrice,
          is_selected: true,
          remarks: this.remarks.trim() || `${i.product_name} requisition`,
        };
      }),
    };

    this.productService.createRequisition(payload).subscribe({
      next: res => {
        this.isSaving.set(false);
        if (res.success && res.data) {
          const reqCode = res.data.requisition_code;
          this.savedRequisitionCode.set(reqCode);
          this.lastSavedCost.set(this.grandTotal());
          this.isSuccessModalVisible = true;
          this.msg.success(`Requisition ${reqCode} generated successfully!`);
        } else {
          this.msg.error(res.message || 'Failed to save requisition');
        }
      },
      error: err => {
        this.isSaving.set(false);
        this.msg.error(err?.error?.message || 'Failed to save requisition');
      },
    });
  }

  startNewRequisition(): void {
    this.isSuccessModalVisible = false;
    this.savedRequisitionCode.set(null);
    this.remarks = '';
    this.items.set([]);
    this.requisitionDate = new Date();
    this.msg.info('Ready for new requisition order.');
  }
}
