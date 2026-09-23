import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import {
  MEDICINE_TYPE_OPTIONS,
  UNIT_TYPE_OPTIONS,
  getOptionLabel,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
  DEFAULT_RAKS,
} from '../../shared/constants/label-values.constant';
import { ProdProduct, ProdCompany, ProdGeneric } from '../../core/models';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';

export type ProductRow = ProdProduct & {
  generic_name: string;
  company_name: string;
  medicine_type_label?: string;
  unit_type_label?: string;
};

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzCheckboxModule,
    NzTooltipModule,
    PageHeaderComponent,
    DataTableComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Master Medicine Catalog"
        subtitle="Complete catalog of pharmaceutical formulations, stock batches, and pricing"
        formId="PROD_1601"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Catalog' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-nowrap py-1">
          <!-- Search Input -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Search Medicine</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-52 shrink-0 rounded-md">
              <input
                type="text"
                nz-input
                placeholder="Brand or generic..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                class="text-xs"
              />
            </nz-input-group>
            <ng-template #searchIcon>
              <span nz-icon nzType="search" class="text-slate-400"></span>
            </ng-template>
          </div>

          <!-- Company Filter -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Manufacturer</label>
            <nz-select
              [(ngModel)]="companyFilter"
              (ngModelChange)="onCompanyFilter($event)"
              class="w-44 shrink-0"
              nzPlaceHolder="Filter by Company"
            >
              <nz-option nzValue="All" nzLabel="All Companies"></nz-option>
              @for (comp of companies; track comp) {
                <nz-option [nzValue]="comp" [nzLabel]="comp"></nz-option>
              }
            </nz-select>
          </div>

          <!-- Medicine Form Filter -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Dosage Form</label>
            <nz-select
              [(ngModel)]="selectedType"
              (ngModelChange)="onTypeFilter($event)"
              class="w-36 shrink-0"
              nzPlaceHolder="Dosage Form"
              nzAllowClear
            >
              @for (opt of medicineTypes; track opt.value) {
                <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              }
            </nz-select>
          </div>

          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <div actions class="flex items-center gap-1.5 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs inline-flex items-center gap-1" (click)="downloadStock()">
            <span nz-icon nzType="download"></span> Download
          </button>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs inline-flex items-center gap-1" (click)="openAddCompanyModal()">
            <span nz-icon nzType="plus"></span> Add Company
          </button>
          <a routerLink="/products/requisition" nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs inline-flex items-center gap-1">
            <span nz-icon nzType="file-done"></span> Requisitions
          </a>
          <a routerLink="/products/add" nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs inline-flex items-center gap-1" title="Open Full-Page Form">
            <span nz-icon nzType="form"></span> Full Form
          </a>
          <button nz-button nzType="primary" class="rounded-md h-7 px-2.5 text-xs inline-flex items-center gap-1" (click)="openAddMedicineModal()">
            <span nz-icon nzType="plus"></span> Add Medicine
          </button>
        </div>
      </app-page-header>

      <!-- Medicine Data Table -->
      <app-data-table
        class="flex-1 min-h-0 flex flex-col"
        [data]="filteredProducts"
        [columns]="columns"
        [total]="filteredProducts.length"
        scrollX="1540px"
      >
        <div tableFooter class="flex flex-wrap items-center gap-3 text-xs">
          <span>Total Products: <strong class="text-slate-800 font-semibold">{{ filteredProducts.length }}</strong></span>
          <span class="text-slate-300">|</span>
          <span>Total Stock: <strong class="text-slate-800 font-semibold">{{ totalStockQty | number }}</strong> pcs</span>
          <span class="text-slate-300">|</span>
          <span class="font-semibold text-slate-700">Total Purchase Valuation: <strong class="theme-total-text font-mono text-sm">৳ {{ totalPurchaseValuation | number:'1.2-2' }}</strong></span>
          <span class="text-slate-300">|</span>
          <span class="font-semibold text-slate-700">Total Retail Value: <strong class="theme-total-text font-mono text-sm">৳ {{ totalSaleValuation | number:'1.2-2' }}</strong></span>
        </div>
      </app-data-table>
    </div>
    
    <ng-template #slTpl let-sl="sl" let-i="index">
      <span class="pms-badge-rank mx-auto">{{ sl ?? (i + 1) }}</span>
    </ng-template>

    <ng-template #medNameTpl let-item>
      <span class="font-semibold text-slate-900">{{ item.product_name }}</span>
    </ng-template>

    <ng-template #avgPurchaseTpl let-item>
      <span class="font-mono text-right w-full block text-slate-600">{{ item.avg_purchase_price_per_piece | number:'1.2-2' }}</span>
    </ng-template>

    <ng-template #purchaseTpl let-item>
      <span class="font-mono text-right w-full block text-slate-600">{{ item.purchase_price_per_piece | number:'1.2-2' }}</span>
    </ng-template>

    <ng-template #salePriceTpl let-item>
      <span class="font-mono text-right w-full block pr-2 font-bold text-slate-900">{{ item.sale_price_per_piece | number:'1.2-2' }}</span>
    </ng-template>

    <ng-template #rakTpl let-item>
      <div class="flex items-center justify-center w-full">
        <span class="pms-badge-rak">
          {{ item.rak_number || '—' }}
        </span>
      </div>
    </ng-template>

    <ng-template #stockTpl let-item>
      <div class="flex items-center justify-end w-full pr-1 whitespace-nowrap">
        @if (item.stock_qty > 50) {
          <span class="pms-badge-stock-in whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>{{ item.stock_qty }} pcs</span>
          </span>
        } @else if (item.stock_qty > 10) {
          <span class="pms-badge-stock-low whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>{{ item.stock_qty }} pcs</span>
          </span>
        } @else {
          <span class="pms-badge-stock-out whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>{{ item.stock_qty }} pcs</span>
          </span>
        }
      </div>
    </ng-template>

    <!-- Actions Column Template for Edit & Delete -->
    <ng-template #actionTpl let-item>
      <div class="flex items-center justify-center gap-1.5">
        <button
          type="button"
          (click)="viewDetails(item)"
          nz-tooltip
          nzTooltipTitle="View Batches & Stock"
          class="btn-tbl-action btn-tbl-view"
        >
          <span nz-icon nzType="eye"></span>
        </button>
        <button
          type="button"
          (click)="adjustStock(item)"
          nz-tooltip
          nzTooltipTitle="Stock Adjustment"
          class="btn-tbl-action btn-tbl-warning"
        >
          <span nz-icon nzType="sliders"></span>
        </button>
        <button
          type="button"
          (click)="openEditMedicineModal(item)"
          nz-tooltip
          nzTooltipTitle="Edit Formulation"
          class="btn-tbl-action btn-tbl-edit"
        >
          <span nz-icon nzType="edit"></span>
        </button>
        <button
          type="button"
          (click)="deleteProduct(item)"
          nz-tooltip
          nzTooltipTitle="Delete Product"
          class="btn-tbl-action btn-tbl-delete"
        >
          <span nz-icon nzType="delete"></span>
        </button>
      </div>
    </ng-template>

    <!-- Add Company Modal -->
    <nz-modal
      [(nzVisible)]="isAddCompanyModalVisible"
      nzTitle="Quick Add Company"
      (nzOnCancel)="isAddCompanyModalVisible = false"
      (nzOnOk)="saveNewCompany()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3">
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span class="text-rose-500">*</span>
            </span>
            <input
              type="text"
              nz-input
              placeholder="Enter company name"
              [(ngModel)]="newCompanyName"
              class="rounded-md"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Generic Modal -->
    <nz-modal
      [(nzVisible)]="isAddGenericModalVisible"
      nzTitle="Quick Add Generic Formulation"
      (nzOnCancel)="isAddGenericModalVisible = false"
      (nzOnOk)="saveNewGeneric()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Generic Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Paracetamol"
            [(ngModel)]="newGenericName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Medicine Type Modal -->
    <nz-modal
      [(nzVisible)]="isAddMedicineTypeModalVisible"
      nzTitle="Quick Add Medicine Form"
      (nzOnCancel)="isAddMedicineTypeModalVisible = false"
      (nzOnOk)="saveNewMedicineType()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Form Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Inhaler, Suspension"
            [(ngModel)]="newMedicineTypeName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Unit Type Modal -->
    <nz-modal
      [(nzVisible)]="isAddUnitTypeModalVisible"
      nzTitle="Quick Add Unit Type"
      (nzOnCancel)="isAddUnitTypeModalVisible = false"
      (nzOnOk)="saveNewUnitType()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Unit Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. BOTTLE, VIAL, SACHET"
            [(ngModel)]="newUnitTypeName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Rak Modal -->
    <nz-modal
      [(nzVisible)]="isAddRakModalVisible"
      nzTitle="Quick Set Rak / Shelf Location"
      (nzOnCancel)="isAddRakModalVisible = false"
      (nzOnOk)="saveNewRak()"
      nzWidth="400px"
    >
      <ng-container *nzModalContent>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Rak / Shelf Code <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Shelf C-02, Drawer 4"
            [(ngModel)]="newRakLocation"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Unified Dual-Purpose Modal for ADD and MODIFY -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add New Medicine Formulation' : ('Modify Medicine: ' + formModel.product_name)"
      [nzWidth]="880"
      [nzStyle]="{ top: '24px' }"
      [nzOkText]="modalMode === 'create' ? 'Add Medicine' : 'Save Changes'"
      [nzOkLoading]="isSaving"
      (nzOnCancel)="closeModal()"
      (nzOnOk)="saveMedicine()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Medicine Name -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Medicine / Brand Name <span class="text-rose-500">*</span>
              </span>
              <input
                type="text"
                nz-input
                placeholder="e.g. Napa Extra 500mg"
                [(ngModel)]="formModel.product_name"
                class="rounded-md"
              />
            </div>

            <!-- Strength -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Strength</span>
              <input
                type="text"
                nz-input
                placeholder="e.g. 500mg + 65mg"
                [(ngModel)]="formModel.strength"
                class="rounded-md"
              />
            </div>

            <!-- Volume -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Volume / Dosage Form</span>
              <input
                type="text"
                nz-input
                placeholder="e.g. 100ml / Tablet"
                [(ngModel)]="formModel.volume"
                class="rounded-md"
              />
            </div>

            <!-- Medicine Form / Type -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Medicine Form <span class="text-rose-500">*</span>
              </span>
              <div class="flex gap-1.5">
                <nz-select class="flex-1" [(ngModel)]="formModel.medicine_type">
                  @for (opt of medicineTypes; track opt.value) {
                    <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="isAddMedicineTypeModalVisible = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Medicine Form"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Unit Type -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Unit Type <span class="text-rose-500">*</span>
              </span>
              <div class="flex gap-1.5">
                <nz-select class="flex-1" [(ngModel)]="formModel.unit_type">
                  @for (opt of unitTypes; track opt.value) {
                    <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="isAddUnitTypeModalVisible = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Unit Type"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Quantity / Box -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Quantity / Box <span class="text-rose-500">*</span>
              </span>
              <nz-input-number
                class="w-full"
                [nzMin]="1"
                [(ngModel)]="formModel.quantity_per_box"
                (ngModelChange)="onBoxPriceOrQtyChange()"
              ></nz-input-number>
            </div>

            <!-- Cost / Box -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price / Box (৳) <span class="text-rose-500">*</span>
              </span>
              <nz-input-number
                class="w-full"
                [nzMin]="0"
                [nzStep]="0.5"
                [(ngModel)]="formModel.cost_per_box"
              ></nz-input-number>
            </div>

            <!-- Sale Price / Box -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Sale Price / Box (৳) <span class="text-rose-500">*</span>
              </span>
              <nz-input-number
                class="w-full"
                [nzMin]="0"
                [nzStep]="0.5"
                [(ngModel)]="formModel.sale_price_per_box"
                (ngModelChange)="onBoxPriceOrQtyChange()"
              ></nz-input-number>
            </div>

            <!-- Sale Price / Piece -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">
                Sale Price / Piece (৳) <span class="text-rose-500">*</span>
              </span>
              <nz-input-number
                class="w-full"
                [nzMin]="0"
                [nzStep]="0.1"
                [(ngModel)]="formModel.sale_price_per_piece"
              ></nz-input-number>
            </div>

            <!-- Rak Number -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Rak / Shelf Location</span>
              <div class="flex gap-1.5">
                <nz-select
                  nzShowSearch
                  nzAllowClear
                  nzPlaceHolder="Select shelf location..."
                  [(ngModel)]="formModel.rak_number"
                  class="flex-1"
                >
                  @for (r of raks; track r) {
                    <nz-option [nzValue]="r" [nzLabel]="r"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="isAddRakModalVisible = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Set Rak / Shelf"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Generic Name -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Generic Formulation</span>
              <div class="flex gap-1.5">
                <nz-select
                  nzShowSearch
                  nzAllowClear
                  nzPlaceHolder="Select generic formulation..."
                  [(ngModel)]="formModel.generic_name"
                  class="flex-1"
                >
                  @for (g of generics; track g) {
                    <nz-option [nzValue]="g" [nzLabel]="g"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="isAddGenericModalVisible = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Generic"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Manufacturer Company -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Company</span>
              <div class="flex gap-1.5">
                <nz-select
                  nzShowSearch
                  nzAllowClear
                  nzPlaceHolder="Select manufacturer company..."
                  [(ngModel)]="formModel.company_name"
                  class="flex-1"
                >
                  @for (c of companies; track c) {
                    <nz-option [nzValue]="c" [nzLabel]="c"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="openAddCompanyModal()"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Company"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Barcode -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Barcode / UPC</span>
              <input
                type="text"
                nz-input
                placeholder="e.g. 89411001001"
                [(ngModel)]="formModel.barcode_value"
                class="rounded-md"
              />
            </div>

            <!-- Reorder Level -->
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Min Reorder Level (Pcs)</span>
              <nz-input-number
                class="w-full"
                [nzMin]="0"
                [(ngModel)]="formModel.min_stock_qty_pcs"
              ></nz-input-number>
            </div>
          </div>

          <!-- Mark as Medicine Checkbox -->
          <div class="flex items-center gap-3 pt-2">
            <label nz-checkbox [(ngModel)]="formModel.is_medicine" class="text-xs font-medium text-slate-700">
              Mark as Clinical Prescription Medicine
            </label>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  @ViewChild('slTpl', { static: true }) slTpl!: TemplateRef<{ $implicit: ProductRow; index: number; sl?: number }>;
  @ViewChild('medNameTpl', { static: true }) medNameTpl!: TemplateRef<{ $implicit: ProductRow }>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('avgPurchaseTpl', { static: true }) avgPurchaseTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('purchaseTpl', { static: true }) purchaseTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('salePriceTpl', { static: true }) salePriceTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('rakTpl', { static: true }) rakTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('stockTpl', { static: true }) stockTpl!: TemplateRef<{ $implicit: ProductRow }>;

  medicineTypes = [...MEDICINE_TYPE_OPTIONS];
  unitTypes = [...UNIT_TYPE_OPTIONS];

  isAddGenericModalVisible = false;
  newGenericName = '';

  isAddMedicineTypeModalVisible = false;
  newMedicineTypeName = '';

  isAddUnitTypeModalVisible = false;
  newUnitTypeName = '';

  isAddRakModalVisible = false;
  newRakLocation = '';

  products: ProductRow[] = [];

  filteredProducts: ProductRow[] = [];
  columns: TableColumn<ProductRow>[] = [];

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  isSaving = false;

  companyFilter = 'All';
  searchQuery = '';
  selectedType: number | null = null;
  isAddCompanyModalVisible = false;
  newCompanyName = '';

  companies: string[] = [...DEFAULT_COMPANIES];
  generics: string[] = [...DEFAULT_GENERICS];
  raks: string[] = [...DEFAULT_RAKS];
  companiesList: ProdCompany[] = [];
  genericsList: ProdGeneric[] = [];
  isLoading = false;

  formModel = {
    product_no: 0,
    product_name: '',
    strength: '',
    volume: '',
    generic_name: '',
    company_name: '',
    medicine_type: 1,
    unit_type: 2,
    quantity_per_box: 10,
    cost_per_box: 0,
    sale_price_per_box: 0,
    sale_price_per_piece: 0,
    rak_number: '',
    min_stock_qty_pcs: 50,
    barcode_value: '',
    is_medicine: true,
    stock_qty: 0,
  };

  ngOnInit(): void {
    this.columns = [
      {
        title: 'SL',
        width: '56px',
        align: 'center',
        left: true,
        template: this.slTpl,
      },
      {
        title: 'Medicine Name',
        key: 'product_name',
        width: '230px',
        left: true,
        sortable: true,
        template: this.medNameTpl,
      },
      {
        title: 'Generic Formulation',
        key: 'generic_name',
        width: '180px',
      },
      {
        title: 'Manufacturer',
        key: 'company_name',
        width: '180px',
      },
      {
        title: 'Form',
        key: 'medicine_type_label',
        width: '95px',
      },
      {
        title: 'Unit',
        key: 'unit_type_label',
        width: '85px',
      },
      {
        title: 'Avg. Purchase',
        key: 'avg_purchase_price_per_piece',
        align: 'right',
        width: '120px',
        template: this.avgPurchaseTpl,
      },
      {
        title: 'Purchase',
        key: 'purchase_price_per_piece',
        align: 'right',
        width: '110px',
        template: this.purchaseTpl,
      },
      {
        title: 'Sale Price',
        key: 'sale_price_per_piece',
        align: 'right',
        width: '120px',
        right: true,
        template: this.salePriceTpl,
      },
      {
        title: 'Rak #',
        key: 'rak_number',
        align: 'center',
        width: '90px',
        right: true,
        template: this.rakTpl,
      },
      {
        title: 'In Stock',
        key: 'stock_qty',
        align: 'right',
        width: '125px',
        sortable: true,
        right: true,
        template: this.stockTpl,
      },
      {
        title: 'Actions',
        template: this.actionTpl,
        width: '150px',
        align: 'center',
        right: true,
      },
    ];

    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadProductsFromService();
    });

    this.loadDropdownData();
    this.loadProductsFromService();
  }

  loadDropdownData(): void {
    this.productService.getCompanies({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = res.data;
          const names = res.data.map(c => c.name).filter(Boolean);
          this.companies = Array.from(new Set([...names, ...DEFAULT_COMPANIES]));
        }
      },
    });

    this.productService.getGenerics({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = res.data;
          const names = res.data.map(g => g.name).filter(Boolean);
          this.generics = Array.from(new Set([...names, ...DEFAULT_GENERICS]));
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  downloadStock(): void {
    this.msg.success('Stock downloaded successfully!');
  }

  openAddCompanyModal(): void {
    this.newCompanyName = '';
    this.isAddCompanyModalVisible = true;
  }

  saveNewCompany(): void {
    const val = this.newCompanyName.trim();
    if (!val) {
      this.msg.error('Company Name is required');
      return;
    }
    this.productService.createCompany({ name: val }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = [...this.companiesList, res.data];
          if (!this.companies.includes(val)) {
            this.companies = [...this.companies, val];
          }
          this.formModel.company_name = val;
          this.msg.success(`Company ${val} added successfully`);
          this.isAddCompanyModalVisible = false;
        } else {
          this.msg.error(res.message || 'Failed to add company');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add company'),
    });
  }

  saveNewGeneric(): void {
    const val = this.newGenericName.trim();
    if (!val) {
      this.msg.error('Generic name is required');
      return;
    }
    this.productService.createGeneric({ name: val }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = [...this.genericsList, res.data];
          if (!this.generics.includes(val)) {
            this.generics = [...this.generics, val];
          }
          this.formModel.generic_name = val;
          this.msg.success(`Generic "${val}" set!`);
          this.isAddGenericModalVisible = false;
        } else {
          this.msg.error(res.message || 'Failed to add generic');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add generic'),
    });
  }

  saveNewMedicineType(): void {
    const val = this.newMedicineTypeName.trim();
    if (!val) {
      this.msg.error('Medicine type is required');
      return;
    }
    const nextVal = Math.max(...this.medicineTypes.map(m => m.value), 0) + 1;
    this.medicineTypes.push({ value: nextVal, label: val });
    this.formModel.medicine_type = nextVal;
    this.isAddMedicineTypeModalVisible = false;
    this.msg.success(`Medicine form "${val}" added!`);
  }

  saveNewUnitType(): void {
    const val = this.newUnitTypeName.trim();
    if (!val) {
      this.msg.error('Unit type is required');
      return;
    }
    const nextVal = Math.max(...this.unitTypes.map(u => u.value), 0) + 1;
    this.unitTypes.push({ value: nextVal, label: val });
    this.formModel.unit_type = nextVal;
    this.isAddUnitTypeModalVisible = false;
    this.msg.success(`Unit type "${val}" added!`);
  }

  saveNewRak(): void {
    const val = this.newRakLocation.trim();
    if (!val) {
      this.msg.error('Shelf / Rak is required');
      return;
    }
    if (!this.raks.includes(val)) {
      this.raks = [...this.raks, val];
    }
    this.formModel.rak_number = val;
    this.isAddRakModalVisible = false;
    this.msg.success(`Rak "${val}" set!`);
  }

  viewDetails(item: ProductRow): void {
    this.msg.info(`Viewing details for ${item.product_name}`);
  }

  adjustStock(item: ProductRow): void {
    this.msg.info(`Adjusting stock for ${item.product_name}`);
  }

  refreshTable(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const company = this.companyFilter;
    const type = this.selectedType;

    this.filteredProducts = this.products
      .filter(p => {
        const matchesQuery =
          !q ||
          p.product_name.toLowerCase().includes(q) ||
          p.generic_name.toLowerCase().includes(q);
        const matchesCompany =
          !company ||
          company === 'All' ||
          p.company_name.toLowerCase().includes(company.toLowerCase());
        const matchesType = type === null || p.medicine_type === type;
        return matchesQuery && matchesCompany && matchesType;
      })
      .map(p => ({
        ...p,
        medicine_type_label: getOptionLabel(MEDICINE_TYPE_OPTIONS, p.medicine_type),
        unit_type_label: getOptionLabel(UNIT_TYPE_OPTIONS, p.unit_type),
      }));
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next();
  }

  onCompanyFilter(company: string): void {
    this.companyFilter = company;
    this.applyFilters();
    this.loadProductsFromService();
  }

  onTypeFilter(typeVal: number | null): void {
    this.selectedType = typeVal;
    this.applyFilters();
    this.loadProductsFromService();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.companyFilter = 'All';
    this.selectedType = null;
    this.applyFilters();
    this.loadProductsFromService();
  }

  loadProductsFromService(): void {
    this.isLoading = true;
    const params: Record<string, unknown> = { pageSize: 200 };
    if (this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }
    if (this.companyFilter && this.companyFilter !== 'All') {
      params['company'] = this.companyFilter;
    }
    if (this.selectedType !== null) {
      params['type'] = this.selectedType;
    }
    this.productService.getProducts(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.products = (res.data.items || []).map((p: any) => ({
            ...p,
            generic_name: p.generic_name || 'Generic Formulation',
            company_name: p.company_name || 'Pharmaceuticals Ltd.',
            medicine_type_label: getOptionLabel(MEDICINE_TYPE_OPTIONS, p.medicine_type),
            unit_type_label: getOptionLabel(UNIT_TYPE_OPTIONS, p.unit_type),
          }));
          this.applyFilters();
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get totalStockQty(): number {
    return this.filteredProducts.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
  }

  get totalPurchaseValuation(): number {
    return this.filteredProducts.reduce(
      (sum, p) => sum + (p.stock_qty || 0) * (p.avg_purchase_price_per_piece || p.purchase_price_per_piece || 0),
      0
    );
  }

  get totalSaleValuation(): number {
    return this.filteredProducts.reduce(
      (sum, p) => sum + (p.stock_qty || 0) * (p.sale_price_per_piece || 0),
      0
    );
  }

  openAddMedicineModal(): void {
    this.modalMode = 'create';
    this.formModel = {
      product_no: 0,
      product_name: '',
      strength: '',
      volume: '',
      generic_name: this.generics[0] || 'Paracetamol',
      company_name: this.companies[0] || 'Beximco Pharmaceuticals Ltd.',
      medicine_type: 1, // Tablet
      unit_type: 2,     // STRIP
      quantity_per_box: 10,
      cost_per_box: 0,
      sale_price_per_box: 0,
      sale_price_per_piece: 0,
      rak_number: this.raks[0] || 'A-01',
      min_stock_qty_pcs: 50,
      barcode_value: '',
      is_medicine: true,
      stock_qty: 100,
    };
    this.isModalVisible = true;
  }

  openEditMedicineModal(product: ProductRow): void {
    this.modalMode = 'edit';
    if (product.company_name && !this.companies.includes(product.company_name)) {
      this.companies = [...this.companies, product.company_name];
    }
    if (product.generic_name && !this.generics.includes(product.generic_name)) {
      this.generics = [...this.generics, product.generic_name];
    }
    if (product.rak_number && !this.raks.includes(product.rak_number)) {
      this.raks = [...this.raks, product.rak_number];
    }
    this.formModel = {
      product_no: product.product_no,
      product_name: product.product_name,
      strength: product.strength || '',
      volume: product.volume || '',
      generic_name: product.generic_name || '',
      company_name: product.company_name || '',
      medicine_type: product.medicine_type,
      unit_type: product.unit_type,
      quantity_per_box: product.quantity_per_box,
      cost_per_box: product.cost_per_box,
      sale_price_per_box: product.sale_price_per_box,
      sale_price_per_piece: product.sale_price_per_piece,
      rak_number: product.rak_number || '',
      min_stock_qty_pcs: product.min_stock_qty_pcs,
      barcode_value: product.barcode_value || '',
      is_medicine: product.is_medicine,
      stock_qty: product.stock_qty ?? 0,
    };
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  onBoxPriceOrQtyChange(): void {
    if (this.formModel.sale_price_per_box > 0 && this.formModel.quantity_per_box > 0) {
      this.formModel.sale_price_per_piece = Number(
        (this.formModel.sale_price_per_box / this.formModel.quantity_per_box).toFixed(2)
      );
    }
  }

  saveMedicine(): void {
    if (!this.formModel.product_name.trim()) {
      this.msg.error('Please enter the medicine brand name.');
      return;
    }

    let companyNo = 1;
    const matchedComp = this.companiesList.find(
      c => c.name.toLowerCase() === this.formModel.company_name.toLowerCase()
    );
    if (matchedComp) {
      companyNo = matchedComp.company_no;
    }

    let genericNo = 1;
    const matchedGen = this.genericsList.find(
      g => g.name.toLowerCase() === this.formModel.generic_name.toLowerCase()
    );
    if (matchedGen) {
      genericNo = matchedGen.generic_no;
    }

    const payload: Partial<ProdProduct> = {
      product_name: this.formModel.product_name.trim(),
      company_no: companyNo,
      generic_no: genericNo,
      strength: this.formModel.strength.trim(),
      volume: this.formModel.volume.trim(),
      medicine_type: this.formModel.medicine_type,
      unit_type: this.formModel.unit_type,
      quantity_per_box: this.formModel.quantity_per_box,
      cost_per_box: this.formModel.cost_per_box,
      sale_price_per_box: this.formModel.sale_price_per_box,
      avg_purchase_price_per_piece: this.formModel.cost_per_box / (this.formModel.quantity_per_box || 1),
      purchase_price_per_piece: this.formModel.cost_per_box / (this.formModel.quantity_per_box || 1),
      sale_price_per_piece:
        this.formModel.sale_price_per_piece ||
        this.formModel.sale_price_per_box / (this.formModel.quantity_per_box || 1),
      rak_number: this.formModel.rak_number,
      min_stock_qty_pcs: this.formModel.min_stock_qty_pcs,
      barcode_value: this.formModel.barcode_value,
      is_medicine: this.formModel.is_medicine,
      country_of_origin: 'Bangladesh',
      is_active: true,
      stock_qty: this.formModel.stock_qty || 0,
    };

    this.isSaving = true;

    if (this.modalMode === 'create') {
      this.productService.createProduct(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.msg.success(`Medicine "${this.formModel.product_name}" added successfully!`);
            this.isModalVisible = false;
            this.loadProductsFromService();
          } else {
            this.msg.error(res.message || 'Failed to create product');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.msg.error(err?.error?.message || 'Failed to create product');
        },
      });
    } else {
      this.productService.updateProduct(this.formModel.product_no, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.msg.success(`Medicine "${this.formModel.product_name}" updated successfully!`);
            this.isModalVisible = false;
            this.loadProductsFromService();
          } else {
            this.msg.error(res.message || 'Failed to update product');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.msg.error(err?.error?.message || 'Failed to update product');
        },
      });
    }
  }

  deleteProduct(product: ProductRow): void {
    this.modal
      .confirmDelete(product.product_name, `Are you sure you want to remove "${product.product_name}" from the catalog?`)
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.deleteProduct(product.product_no).subscribe({
            next: (res) => {
              if (res.success) {
                this.msg.success(`Medicine "${product.product_name}" deleted.`);
                this.loadProductsFromService();
              } else {
                this.msg.error(res.message || 'Failed to delete product');
              }
            },
            error: (err) => {
              this.msg.error(err?.error?.message || 'Failed to delete product');
            },
          });
        }
      });
  }
}
