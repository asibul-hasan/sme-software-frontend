import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  PAYMENT_METHOD_OPTIONS,
  CUSTOMER_TIER_OPTIONS,
  BusinessMode,
  DiscountType,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
} from '../../shared/constants/label-values.constant';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { PosSaleService } from '../../core/services/pos-sale.service';
import { PrintService } from '../../core/services/print.service';
import { SaleInvoice } from '../../core/models/customer.models';

interface CartItem {
  cart_item_id?: number;
  product_no: number;
  product_name: string;
  generic_name: string;
  manufacturer: string;
  cost_price: number;
  unit_price: number;
  qty: number; // Retail: pcs, Wholesale: box qty
  pcs_per_box: number;
  discount: number;
  discount_type: number; // 1: %, 2: Flat
  total: number;
  stock?: number;
  rak?: string;
  barcode?: string;
}

interface CatalogProduct {
  id: number;
  name: string;
  generic: string;
  manufacturer: string;
  cost: number;
  saleRetail: number;
  saleWholesale: number;
  pcsPerBox: number;
  stock: number;
  minStock: number;
  rak: string;
  barcode: string;
  strength: string;
}

interface SplitPayment {
  method: string;
  amount: number;
}

interface HeldOrder {
  id: string;
  heldAt: string;
  customerName: string;
  customerId: string;
  mode: number;
  items: CartItem[];
  total: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  customer_type: number;
  address: string;
  current_due: number;
}

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  styles: [`
    ::ng-deep .product-search-dropdown {
      min-width: 480px !important;
    }
    ::ng-deep .product-search-dropdown .cdk-virtual-scroll-viewport {
      min-height: 280px !important;
      max-height: 320px !important;
      height: 285px !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item {
      min-height: 56px !important;
      height: 56px !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      padding: 4px 10px !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-content {
      width: 100% !important;
    }
  `],
  template: `
    <div class="h-[calc(100vh-100px)] flex flex-col space-y-3">
      <!-- Header Bar -->
      <app-page-header
        title="Sale"
        subtitle="Unified Point of Sale & Checkout Terminal"
        formId="SALE_1401"
        [breadcrumbs]="[{ label: 'Sales', url: '/customer/sale' }, { label: 'POS Terminal' }]"
      >
        <div actions class="flex items-center justify-between gap-3 w-full flex-nowrap">
          <div class="flex items-center gap-3">
            <!-- Navigation Links -->
            <div class="flex items-center gap-2 text-xs text-slate-500 mr-2">
              <a routerLink="/customer/sales" class="theme-link">
                Record
              </a>
              <span>|</span>
              <a routerLink="/customer/list" class="theme-link">
                Customer list
              </a>
              <span>|</span>
              <span nz-icon nzType="question-circle" class="text-slate-400 cursor-pointer" nz-tooltip nzTooltipTitle="F9: Hold/Recall, F2: Add Product, Enter: Add to Cart"></span>
            </div>

            <!-- Retail / Wholesale Pill Toggle -->
            <div class="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                (click)="setBusinessMode(BusinessMode.Retail)"
                class="px-3.5 py-1 text-xs font-bold rounded-md transition-colors border-0 cursor-pointer"
                [class.theme-pill-active]="!isWholesale()"
                [class.text-slate-600]="isWholesale()"
                [class.bg-transparent]="isWholesale()"
              >
                Retail
              </button>
              <button
                type="button"
                (click)="setBusinessMode(BusinessMode.Wholesale)"
                class="px-3.5 py-1 text-xs font-bold rounded-md transition-colors border-0 cursor-pointer"
                [class.bg-rose-600]="isWholesale()"
                [class.text-white]="isWholesale()"
                [class.text-slate-600]="!isWholesale()"
                [class.bg-transparent]="!isWholesale()"
              >
                Wholesale
              </button>
            </div>

            <!-- F9 / Hold Button -->
            <button
              type="button"
              (click)="handleHoldAction()"
              nz-tooltip
              nzTooltipTitle="Press F9 to park active order or recall held orders"
              class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-md flex items-center gap-1.5 transition-colors shadow-xs border-0 cursor-pointer"
            >
              <span nz-icon nzType="pause-circle"></span>
              <span>F9 / Hold</span>
              @if (heldOrders().length > 0) {
                <span class="bg-white text-amber-800 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ml-0.5">
                  {{ heldOrders().length }}
                </span>
              }
            </button>
          </div>

          <div class="flex items-center gap-3">
            <!-- Quick Print Checkbox -->
            <div class="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <label nz-checkbox [(ngModel)]="quickPrint" class="text-xs font-medium text-slate-600 m-0">Quick Print</label>
            </div>

            <!-- Add Product Button (F2) -->
            <button
              type="button"
              nz-button
              nzType="primary"
              (click)="openQuickAddProduct()"
              class="rounded-md"
            >
              <span nz-icon nzType="plus"></span> Add New Product (F2)
            </button>

            <!-- Return Link Button -->
            <a
              nz-button
              nzType="default"
              routerLink="/customer/sales-returns"
              class="rounded-md border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <span nz-icon nzType="rollback"></span> Return
            </a>
          </div>
        </div>
      </app-page-header>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        <!-- LEFT PANEL: Entry Card + Cart Items Table -->
        <div class="lg:col-span-8 flex flex-col gap-3 min-h-0">
          
          <!-- Fast-Moving OTC Quick-Pick Bar -->
          @if (fastMovingProducts().length > 0) {
            <div class="bg-white rounded-xl border border-slate-200 shadow-2xs px-3.5 py-2 flex items-center gap-2 overflow-x-auto">
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                <span nz-icon nzType="thunderbolt" class="text-amber-500"></span>
                <span>Fast Pick OTC:</span>
              </div>
              <div class="flex items-center gap-1.5 flex-nowrap">
                @for (otc of fastMovingProducts(); track otc.id) {
                  <button
                    type="button"
                    (click)="quickAddProductToCart(otc)"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-all cursor-pointer shrink-0 group select-none"
                    nz-tooltip
                    [nzTooltipTitle]="'Available: ' + getAvailableStock(otc) + ' pcs (Total: ' + otc.stock + ')' + ' | Rak: ' + (otc.rak || 'N/A') + ' | Click to add 1 pcs'"
                  >
                    <span class="font-semibold text-slate-900 group-hover:text-indigo-600">{{ otc.name }}</span>
                    @if (otc.strength) {
                      <span class="text-[10px] text-slate-400 font-normal">({{ otc.strength }})</span>
                    }
                    <span class="font-mono text-[11px] font-bold text-emerald-700">৳{{ isWholesale() ? otc.saleWholesale : otc.saleRetail }}</span>
                    <span
                      class="text-[10px] px-1.5 py-0.2 rounded font-bold"
                      [class.bg-emerald-100]="getAvailableStock(otc) > otc.minStock"
                      [class.text-emerald-800]="getAvailableStock(otc) > otc.minStock"
                      [class.bg-amber-100]="getAvailableStock(otc) > 0 && getAvailableStock(otc) <= otc.minStock"
                      [class.text-amber-800]="getAvailableStock(otc) > 0 && getAvailableStock(otc) <= otc.minStock"
                      [class.bg-rose-100]="getAvailableStock(otc) <= 0"
                      [class.text-rose-800]="getAvailableStock(otc) <= 0"
                    >
                      {{ getAvailableStock(otc) }} pcs
                    </span>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Product Entry Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
            <div class="grid grid-cols-12 gap-3 items-end">
              <!-- Product Search / Select -->
              <div class="col-span-12 md:col-span-4">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-slate-700">
                    Product / Medicine <span class="text-rose-500">*</span>
                  </label>
                  <span class="text-[10px] text-slate-400 font-medium">Press F1 to search</span>
                </div>
                <nz-select
                  nzShowSearch
                  nzPlaceHolder="Search name, generic, barcode (F1)..."
                  [(ngModel)]="selectedProductText"
                  (ngModelChange)="onProductPicked($event)"
                  (nzOnSearch)="onProductSearch($event)"
                  (keyup.enter)="onProductEnterKey()"
                  [nzOptionHeightPx]="56"
                  [nzOptionOverflowSize]="5"
                  nzDropdownClassName="product-search-dropdown"
                  [nzDropdownStyle]="{ 'min-height': '280px', 'max-height': '320px' }"
                  class="w-full"
                >
                  @for (p of catalogProducts(); track p.id) {
                    <nz-option
                      [nzValue]="p.name"
                      [nzLabel]="p.name + (p.strength ? ' ' + p.strength : '') + ' • Avail: ' + getAvailableStock(p) + ' pcs' + (p.rak ? ' [Rak: ' + p.rak + ']' : '')"
                      nzCustomContent
                    >
                      <div class="h-[48px] flex items-center justify-between border-b border-slate-100 last:border-0 w-full">
                        <div class="flex-1 min-w-0 pr-2">
                          <div class="flex items-center gap-1.5 font-bold text-slate-900 text-xs truncate">
                            <span>{{ p.name }}</span>
                            @if (p.strength) {
                              <span class="text-[10px] text-slate-500 font-normal">({{ p.strength }})</span>
                            }
                          </div>
                          <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span class="truncate">{{ p.generic }}</span>
                            @if (p.rak) {
                              <span class="text-indigo-600 bg-indigo-50 px-1 rounded text-[10px] font-medium shrink-0">📍 Rak: {{ p.rak }}</span>
                            }
                          </div>
                        </div>
                        <div class="text-right shrink-0 flex flex-col items-end">
                          <div class="font-mono font-bold text-xs text-slate-800">
                            ৳ {{ (isWholesale() ? p.saleWholesale : p.saleRetail) | number: '1.2-2' }}
                          </div>
                          @if (getAvailableStock(p) <= 0) {
                            <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          } @else if (getAvailableStock(p) <= p.minStock) {
                            <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low: {{ getAvailableStock(p) }} pcs
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Avail: {{ getAvailableStock(p) }} pcs
                            </span>
                          }
                        </div>
                      </div>
                    </nz-option>
                  }
                </nz-select>
              </div>
              
              <!-- Quantity Input: Box Qty in Wholesale, Sale QTY in Retail -->
              <div class="col-span-4 md:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  {{ isWholesale() ? 'Box Qty' : 'Sale QTY' }} <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="entryQty"
                  (keyup.enter)="addEntryToCart()"
                  class="rounded-md font-mono"
                  [step]="isWholesale() ? 0.25 : 1"
                  [min]="0.01"
                />
              </div>
              
              <!-- Sale Price Input: Box Price in Wholesale, Piece Price in Retail -->
              <div class="col-span-4 md:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  {{ isWholesale() ? 'Price/Box (৳)' : 'Sale Price (৳)' }} <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="entryPrice"
                  (keyup.enter)="addEntryToCart()"
                  class="rounded-md font-mono"
                  min="0"
                  step="0.1"
                />
              </div>

              <!-- Item-Level Discount: Flat vs % toggle -->
              <div class="col-span-4 md:col-span-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-slate-700">Dis:</label>
                  <div class="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                    <button
                      type="button"
                      (click)="entryDiscountType = DiscountType.Percentage"
                      class="px-1.5 py-0.2 text-[10px] rounded border-0 cursor-pointer font-medium"
                      [class.bg-white]="entryDiscountType === DiscountType.Percentage"
                      [class.shadow-xs]="entryDiscountType === DiscountType.Percentage"
                    >
                      %
                    </button>
                    <button
                      type="button"
                      (click)="entryDiscountType = DiscountType.Flat"
                      class="px-1.5 py-0.2 text-[10px] rounded border-0 cursor-pointer font-medium"
                      [class.bg-white]="entryDiscountType === DiscountType.Flat"
                      [class.shadow-xs]="entryDiscountType === DiscountType.Flat"
                    >
                      Flat
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  nz-input
                  placeholder="0"
                  [(ngModel)]="entryDiscountValue"
                  class="rounded-md font-mono"
                  min="0"
                  (keyup.enter)="addEntryToCart()"
                />
              </div>
              
              <!-- Add Line Button -->
              <div class="col-span-12 md:col-span-2">
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="addEntryToCart()"
                  class="w-full rounded-md font-semibold"
                >
                  Add (Enter)
                  @if (getEntryLineTotal() > 0) {
                    <span class="text-[11px] opacity-85 font-mono ml-1">(৳{{ getEntryLineTotal() | number: '1.2-2' }})</span>
                  }
                </button>
              </div>

              <!-- Selected Product Live Stock & Location Info Banner -->
              @if (selectedProductObj) {
                <div
                  class="col-span-12 mt-1 p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs transition-all"
                  [class.bg-emerald-50/60]="getAvailableStock(selectedProductObj) > selectedProductObj.minStock"
                  [class.border-emerald-200]="getAvailableStock(selectedProductObj) > selectedProductObj.minStock"
                  [class.bg-amber-50/60]="getAvailableStock(selectedProductObj) > 0 && getAvailableStock(selectedProductObj) <= selectedProductObj.minStock"
                  [class.border-amber-200]="getAvailableStock(selectedProductObj) > 0 && getAvailableStock(selectedProductObj) <= selectedProductObj.minStock"
                  [class.bg-rose-50/60]="getAvailableStock(selectedProductObj) <= 0"
                  [class.border-rose-200]="getAvailableStock(selectedProductObj) <= 0"
                >
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900">{{ selectedProductObj.name }}</span>
                    @if (selectedProductObj.strength) {
                      <span class="text-slate-500 font-medium">({{ selectedProductObj.strength }})</span>
                    }
                    <span class="text-slate-500">• {{ selectedProductObj.generic }}</span>
                    @if (selectedProductObj.rak) {
                      <span class="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        📍 Shelf / Rak: {{ selectedProductObj.rak }}
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1.5">
                      <span class="text-slate-600 font-medium">Available Stock:</span>
                      <span
                        class="font-mono font-black text-sm"
                        [class.text-emerald-700]="getAvailableStock(selectedProductObj) > selectedProductObj.minStock"
                        [class.text-amber-700]="getAvailableStock(selectedProductObj) > 0 && getAvailableStock(selectedProductObj) <= selectedProductObj.minStock"
                        [class.text-rose-700]="getAvailableStock(selectedProductObj) <= 0"
                      >
                        {{ getAvailableStock(selectedProductObj) }} pcs
                      </span>
                      <span class="text-[11px] text-slate-500">
                        ({{ Math.floor(getAvailableStock(selectedProductObj) / (selectedProductObj.pcsPerBox || 10)) }} box + {{ getAvailableStock(selectedProductObj) % (selectedProductObj.pcsPerBox || 10) }} pcs)
                      </span>
                    </div>
                    @if (getAvailableStock(selectedProductObj) <= 0) {
                      <span class="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                        ⚠️ OUT OF STOCK
                      </span>
                    } @else if (entryQty > getAvailableStock(selectedProductObj)) {
                      <span class="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                        ⚠️ Requested qty ({{ entryQty }}) exceeds available ({{ getAvailableStock(selectedProductObj) }} pcs)
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Cart Table Card -->
          <div class="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div class="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span class="font-bold text-slate-700 text-xs uppercase tracking-wider">
                Cart Items ({{ cart().length }})
              </span>
              <div class="flex items-center gap-2">
                @if (heldOrders().length > 0) {
                  <button
                    type="button"
                    nz-button
                    nzSize="small"
                    (click)="isHeldOrdersModalVisible = true"
                    class="rounded text-xs bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  >
                    <span nz-icon nzType="inbox"></span> View Held Orders ({{ heldOrders().length }})
                  </button>
                }
                <button
                  type="button"
                  nz-button
                  nzType="default"
                  nzSize="small"
                  class="text-xs rounded"
                  (click)="startNewInvoice()"
                >
                  <span nz-icon nzType="clear"></span> Clear Basket
                </button>
              </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-0">
              @if (cart().length > 0) {
                <table class="w-full text-left border-collapse text-xs">
                  <!-- Table Header -->
                  <thead class="bg-slate-50 text-slate-600 uppercase font-semibold tracking-wider sticky top-0 border-b border-slate-200">
                    @if (isWholesale()) {
                      <!-- Wholesale Table Header -->
                      <tr>
                        <th class="p-3">Details</th>
                        <th class="p-3 text-center">Box Qty</th>
                        <th class="p-3 text-center">Pcs/Box</th>
                        <th class="p-3 text-right">Price/Box (৳)</th>
                        <th class="p-3 text-right">Discount</th>
                        <th class="p-3 text-right">Price (৳)</th>
                        <th class="p-3 text-center w-20">Action</th>
                      </tr>
                    } @else {
                      <!-- Retail Table Header -->
                      <tr>
                        <th class="p-3">Details</th>
                        <th class="p-3 text-center">Sale QTY</th>
                        <th class="p-3 text-center">Pcs/Box</th>
                        <th class="p-3 text-right">Price/Piece (৳)</th>
                        <th class="p-3 text-right">Discount</th>
                        <th class="p-3 text-right">Price (৳)</th>
                        <th class="p-3 text-center w-20">Action</th>
                      </tr>
                    }
                  </thead>

                  <!-- Table Body -->
                  <tbody class="divide-y divide-slate-100 text-slate-800">
                    @for (item of cart(); track (item.cart_item_id || item.product_no); let idx = $index) {
                      <tr
                        class="hover:bg-slate-50/70 transition-colors"
                        [class.bg-rose-50/30]="isWholesale()"
                      >
                        <!-- Details -->
                        <td class="p-3">
                          <p class="font-bold text-slate-900 m-0 text-xs">{{ item.product_name }}</p>
                          <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>{{ item.generic_name }}</span>
                            @if (item.manufacturer) {
                              <span>• {{ item.manufacturer }}</span>
                            }
                            @if (item.rak) {
                              <span class="text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium text-[10px]">
                                📍 Rak: {{ item.rak }}
                              </span>
                            }
                            <span class="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                              Stock: {{ item.stock ?? 0 }} pcs → Left: {{ Math.max(0, (item.stock ?? 0) - (isWholesale() ? Math.round(item.qty * (item.pcs_per_box || 10)) : Math.round(item.qty))) }} pcs
                            </span>
                            @if ((item.stock ?? 0) < (isWholesale() ? Math.round(item.qty * (item.pcs_per_box || 10)) : Math.round(item.qty))) {
                              <span class="bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold text-[10px] animate-pulse">
                                ⚠️ Exceeds stock (avail: {{ item.stock ?? 0 }} pcs)
                              </span>
                            }
                          </div>
                        </td>

                        <!-- QTY: Box Qty in Wholesale, Sale QTY in Retail (Interactive Stepper) -->
                        <td class="p-3 text-center">
                          <div class="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              (click)="updateItemQty(item, isWholesale() ? -0.25 : -1)"
                              class="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-0 bg-transparent cursor-pointer font-bold select-none"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              [ngModel]="item.qty"
                              (ngModelChange)="setItemQty(item, $event)"
                              [step]="isWholesale() ? 0.25 : 1"
                              min="0.01"
                              class="w-12 text-center font-mono font-bold text-xs border-0 outline-hidden p-0 text-slate-900"
                            />
                            <button
                              type="button"
                              (click)="updateItemQty(item, isWholesale() ? 0.25 : 1)"
                              class="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-0 bg-transparent cursor-pointer font-bold select-none"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <!-- Pcs/Box -->
                        <td class="p-3 text-center font-mono text-slate-600">
                          {{ item.pcs_per_box }}
                        </td>

                        <!-- Price column: stacked Cost/Sale in wholesale, unit price in retail -->
                        <td class="p-3 text-right font-mono">
                          @if (isWholesale()) {
                            <div class="text-[11px] text-slate-500">
                              Cost: ৳ {{ item.cost_price | number: '1.2-2' }}
                            </div>
                            <div class="text-xs font-semibold text-slate-800">
                              Sale: ৳ {{ item.unit_price | number: '1.2-2' }}
                            </div>
                          } @else {
                            <span class="text-slate-800 font-medium">
                              ৳ {{ item.unit_price | number: '1.2-2' }}
                            </span>
                          }
                        </td>

                        <!-- Discount column -->
                        <td class="p-3 text-right font-mono">
                          @if (item.discount > 0) {
                            <span class="text-rose-600 font-medium">
                              - ৳ {{ item.discount | number: '1.2-2' }}
                            </span>
                          } @else {
                            <span class="text-slate-400">0%</span>
                          }
                        </td>

                        <!-- Price total column: stacked Total/After Discount in wholesale -->
                        <td class="p-3 text-right font-mono">
                          @if (isWholesale()) {
                            <div class="text-[11px] text-slate-500">
                              Total: ৳ {{ (item.unit_price * item.qty) | number: '1.2-2' }}
                            </div>
                            <div class="text-xs font-bold theme-total-text">
                              After: ৳ {{ item.total | number: '1.2-2' }}
                            </div>
                          } @else {
                            <span class="font-bold theme-total-text text-sm">
                              ৳ {{ item.total | number: '1.2-2' }}
                            </span>
                          }
                        </td>

                        <!-- Standardized 28px Actions -->
                        <td class="p-3 text-center">
                          <div class="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              (click)="openEditItemModal(item)"
                              nz-tooltip
                              nzTooltipTitle="Edit Line"
                              class="btn-tbl-action btn-tbl-view"
                            >
                              <span nz-icon nzType="edit"></span>
                            </button>
                            <button
                              type="button"
                              (click)="removeItem(item)"
                              nz-tooltip
                              nzTooltipTitle="Remove Item"
                              class="btn-tbl-action btn-tbl-delete"
                            >
                              <span nz-icon nzType="delete"></span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-2">
                  <span nz-icon nzType="shopping-cart" class="text-4xl text-slate-300"></span>
                  <p class="font-medium text-sm text-slate-500 m-0">Basket is currently empty</p>
                  <p class="text-xs text-slate-400 m-0">
                    Select a medicine from the bar above or press <kbd class="bg-slate-100 border px-1 rounded">Enter</kbd> to add
                  </p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Checkout Drawer -->
        <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col p-4 space-y-3 overflow-y-auto">
          
          <!-- Summary Header -->
          <div class="flex justify-between items-center border-b border-slate-100 pb-2">
            <span class="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast Checkout</span>
            <span class="text-xs font-mono font-semibold text-slate-500">
              Total items: {{ cart().length }}
            </span>
          </div>

          <!-- Total price -->
          <div class="flex justify-between text-xs">
            <span class="text-slate-600 font-medium">Subtotal:</span>
            <span class="font-mono font-bold text-slate-900">
              ৳ {{ subtotal() | number: '1.2-2' }}
            </span>
          </div>

          <!-- Global Discount Section (Single Line, Full Width) -->
          <div class="flex items-center gap-2 pt-0.5">
            <span class="text-xs font-semibold text-slate-700 shrink-0 w-16">Discount:</span>
            <div class="flex items-center gap-1.5 flex-1">
              <div class="flex bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
                <button
                  type="button"
                  (click)="setGlobalDiscountType(DiscountType.Percentage)"
                  class="px-2.5 py-0.5 text-[10px] rounded border-0 cursor-pointer font-semibold"
                  [class.bg-white]="globalDiscountType() === DiscountType.Percentage"
                  [class.shadow-xs]="globalDiscountType() === DiscountType.Percentage"
                >
                  %
                </button>
                <button
                  type="button"
                  (click)="setGlobalDiscountType(DiscountType.Flat)"
                  class="px-2.5 py-0.5 text-[10px] rounded border-0 cursor-pointer font-semibold"
                  [class.bg-white]="globalDiscountType() === DiscountType.Flat"
                  [class.shadow-xs]="globalDiscountType() === DiscountType.Flat"
                >
                  Flat
                </button>
              </div>
              <input
                type="number"
                nz-input
                placeholder="0"
                [ngModel]="globalDiscountValue()"
                (ngModelChange)="onGlobalDiscountChange($event)"
                class="rounded-md font-mono text-right flex-1 h-8 text-xs"
                min="0"
              />
            </div>
          </div>

          <!-- Card Commission Checkbox (if card payment or custom check) -->
          @if (selectedPaymentType() === 6 || cardCommission()) {
            <div class="flex items-center justify-between pt-0.5">
              <label
                nz-checkbox
                [ngModel]="cardCommission()"
                (ngModelChange)="onCardCommissionToggle($event)"
                class="text-xs font-medium text-slate-700"
              >
                Card Commission ({{ cardCommissionRate() }}%):
              </label>
              @if (cardCommission()) {
                <span class="font-mono text-xs text-slate-800 font-bold">
                  + ৳ {{ cardFee() | number: '1.2-2' }}
                </span>
              }
            </div>
          }

          <!-- Net Payable Banner -->
          <div class="rounded-xl p-3.5 text-center shadow-xs theme-shell-banner">
            <div class="text-[11px] font-medium tracking-wider uppercase opacity-90 mb-0.5">
              Net Payable
            </div>
            <div class="text-3xl font-black font-mono">
              ৳ {{ finalPrice() | number: '1.2-2' }}
            </div>
            @if (discountAmount() > 0) {
              <div class="text-[10px] text-emerald-300 mt-0.5 font-medium">
                Total Savings: ৳ {{ discountAmount() | number: '1.2-2' }}
              </div>
            }
          </div>

          <!-- Payment Method Segmented Tabs -->
          <div class="space-y-1 pt-1">
            <label class="text-xs font-bold text-slate-700 block">Payment Method:</label>
            <div class="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                (click)="setPaymentMethod(1)"
                class="py-1.5 px-1 text-xs font-bold rounded-md transition-all border-0 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                [class.bg-white]="selectedPaymentType() === 1"
                [class.text-indigo-700]="selectedPaymentType() === 1"
                [class.shadow-xs]="selectedPaymentType() === 1"
                [class.text-slate-600]="selectedPaymentType() !== 1"
                [class.bg-transparent]="selectedPaymentType() !== 1"
              >
                <span class="text-xs">💵</span>
                <span>Cash</span>
              </button>
              <button
                type="button"
                (click)="setPaymentMethod(6)"
                class="py-1.5 px-1 text-xs font-bold rounded-md transition-all border-0 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                [class.bg-white]="selectedPaymentType() === 6"
                [class.text-indigo-700]="selectedPaymentType() === 6"
                [class.shadow-xs]="selectedPaymentType() === 6"
                [class.text-slate-600]="selectedPaymentType() !== 6"
                [class.bg-transparent]="selectedPaymentType() !== 6"
              >
                <span class="text-xs">💳</span>
                <span>Card</span>
              </button>
              <button
                type="button"
                (click)="setPaymentMethod(3)"
                class="py-1.5 px-1 text-xs font-bold rounded-md transition-all border-0 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                [class.bg-white]="selectedPaymentType() === 3"
                [class.text-indigo-700]="selectedPaymentType() === 3"
                [class.shadow-xs]="selectedPaymentType() === 3"
                [class.text-slate-600]="selectedPaymentType() !== 3"
                [class.bg-transparent]="selectedPaymentType() !== 3"
              >
                <span class="text-xs">📱</span>
                <span>MFS</span>
              </button>
              <button
                type="button"
                (click)="setPaymentMethod(8)"
                class="py-1.5 px-1 text-xs font-bold rounded-md transition-all border-0 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                [class.bg-white]="selectedPaymentType() === 8"
                [class.text-indigo-700]="selectedPaymentType() === 8"
                [class.shadow-xs]="selectedPaymentType() === 8"
                [class.text-slate-600]="selectedPaymentType() !== 8"
                [class.bg-transparent]="selectedPaymentType() !== 8"
              >
                <span class="text-xs">🔀</span>
                <span>Split</span>
              </button>
              <button
                type="button"
                (click)="setPaymentMethod(4)"
                class="py-1.5 px-1 text-xs font-bold rounded-md transition-all border-0 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                [class.bg-white]="selectedPaymentType() === 4"
                [class.text-rose-700]="selectedPaymentType() === 4"
                [class.shadow-xs]="selectedPaymentType() === 4"
                [class.text-slate-600]="selectedPaymentType() !== 4"
                [class.bg-transparent]="selectedPaymentType() !== 4"
              >
                <span class="text-xs">📝</span>
                <span>Due</span>
              </button>
            </div>
          </div>

          <!-- Split Payment Multi-Tender Box (When Split Tab is Selected) -->
          @if (selectedPaymentType() === 8) {
            <div class="space-y-2.5 pt-1">
              <!-- Allocation Summary Header Card -->
              <div
                class="p-2.5 rounded-xl border flex items-center justify-between shadow-2xs"
                [class.bg-emerald-50]="splitRemaining() === 0 && splitOverpaid() === 0"
                [class.border-emerald-300]="splitRemaining() === 0 && splitOverpaid() === 0"
                [class.bg-amber-50]="splitRemaining() > 0"
                [class.border-amber-300]="splitRemaining() > 0"
                [class.bg-blue-50]="splitOverpaid() > 0"
                [class.border-blue-300]="splitOverpaid() > 0"
              >
                <div>
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Split Allocation
                  </div>
                  <div class="text-base font-black font-mono text-slate-900">
                    ৳ {{ splitTotal() | number: '1.2-2' }}
                    <span class="text-xs font-normal text-slate-500">/ ৳ {{ finalPrice() | number: '1.2-2' }}</span>
                  </div>
                </div>

                <div class="text-right">
                  @if (splitRemaining() > 0) {
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-xs shadow-2xs">
                      <span>Rest: ৳ {{ splitRemaining() | number: '1.2-2' }}</span>
                    </div>
                  } @else if (splitOverpaid() > 0) {
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-200 text-blue-900 font-bold text-xs shadow-2xs">
                      <span>Change: ৳ {{ splitOverpaid() | number: '1.2-2' }}</span>
                    </div>
                  } @else {
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs">
                      <span nz-icon nzType="check-circle"></span>
                      <span>Balanced 100%</span>
                    </div>
                  }
                </div>
              </div>

              <!-- 3 Clear Payment Channel Cards -->
              <div class="space-y-2">
                <!-- Channel 1: Card -->
                <div
                  class="p-2.5 rounded-lg border bg-white shadow-2xs transition-all"
                  [class.border-indigo-400]="splitCard() > 0"
                  [class.bg-indigo-50/20]="splitCard() > 0"
                  [class.border-slate-200]="splitCard() <= 0"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <span>💳</span> Card Payment
                    </span>
                    <div class="flex items-center gap-1">
                      @if (splitRemaining() > 0) {
                        <button
                          type="button"
                          (click)="fillRemainingTo('card')"
                          class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded cursor-pointer transition-colors"
                        >
                          ⚡ Put Rest (৳{{ splitRemaining() | number: '1.0-2' }})
                        </button>
                      }
                      <button
                        type="button"
                        (click)="setSplitFull('card')"
                        class="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded cursor-pointer"
                      >
                        All
                      </button>
                      @if (splitCard() > 0) {
                        <button
                          type="button"
                          (click)="clearSplitChannel('card')"
                          class="px-1.5 py-0.5 text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  </div>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 font-bold text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      nz-input
                      [ngModel]="splitCard() || ''"
                      (ngModelChange)="onSplitChannelChange('card', $event)"
                      placeholder="0.00"
                      min="0"
                      class="pl-7 pr-3 h-8 font-mono font-bold text-sm text-slate-900 rounded-md border-slate-300 w-full"
                    />
                  </div>
                </div>

                <!-- Channel 2: Cash -->
                <div
                  class="p-2.5 rounded-lg border bg-white shadow-2xs transition-all"
                  [class.border-indigo-400]="splitCash() > 0"
                  [class.bg-indigo-50/20]="splitCash() > 0"
                  [class.border-slate-200]="splitCash() <= 0"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <span>💵</span> Cash Payment
                    </span>
                    <div class="flex items-center gap-1">
                      @if (splitRemaining() > 0) {
                        <button
                          type="button"
                          (click)="fillRemainingTo('cash')"
                          class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded cursor-pointer transition-colors"
                        >
                          ⚡ Put Rest (৳{{ splitRemaining() | number: '1.0-2' }})
                        </button>
                      }
                      <button
                        type="button"
                        (click)="setSplitFull('cash')"
                        class="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded cursor-pointer"
                      >
                        All
                      </button>
                      @if (splitCash() > 0) {
                        <button
                          type="button"
                          (click)="clearSplitChannel('cash')"
                          class="px-1.5 py-0.5 text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  </div>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 font-bold text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      nz-input
                      [ngModel]="splitCash() || ''"
                      (ngModelChange)="onSplitChannelChange('cash', $event)"
                      placeholder="0.00"
                      min="0"
                      class="pl-7 pr-3 h-8 font-mono font-bold text-sm text-slate-900 rounded-md border-slate-300 w-full"
                    />
                  </div>
                </div>

                <!-- Channel 3: MFS -->
                <div
                  class="p-2.5 rounded-lg border bg-white shadow-2xs transition-all"
                  [class.border-indigo-400]="splitMfs() > 0"
                  [class.bg-indigo-50/20]="splitMfs() > 0"
                  [class.border-slate-200]="splitMfs() <= 0"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <span>📱</span> MFS (bKash / Nagad)
                    </span>
                    <div class="flex items-center gap-1">
                      @if (splitRemaining() > 0) {
                        <button
                          type="button"
                          (click)="fillRemainingTo('mfs')"
                          class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded cursor-pointer transition-colors"
                        >
                          ⚡ Put Rest (৳{{ splitRemaining() | number: '1.0-2' }})
                        </button>
                      }
                      <button
                        type="button"
                        (click)="setSplitFull('mfs')"
                        class="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded cursor-pointer"
                      >
                        All
                      </button>
                      @if (splitMfs() > 0) {
                        <button
                          type="button"
                          (click)="clearSplitChannel('mfs')"
                          class="px-1.5 py-0.5 text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  </div>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 font-bold text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      nz-input
                      [ngModel]="splitMfs() || ''"
                      (ngModelChange)="onSplitChannelChange('mfs', $event)"
                      placeholder="0.00"
                      min="0"
                      class="pl-7 pr-3 h-8 font-mono font-bold text-sm text-slate-900 rounded-md border-slate-300 w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Quick Presets Toolbar -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="splitHalfAndHalf('cash', 'card')"
                    class="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 cursor-pointer"
                  >
                    50% Cash + 50% Card
                  </button>
                  <button
                    type="button"
                    (click)="splitHalfAndHalf('cash', 'mfs')"
                    class="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 cursor-pointer"
                  >
                    50% Cash + 50% MFS
                  </button>
                </div>
                <button
                  type="button"
                  (click)="resetAllSplit()"
                  class="text-[10px] text-slate-400 hover:text-rose-600 bg-transparent border-0 cursor-pointer"
                >
                  Reset All
                </button>
              </div>
            </div>
          } @else if (selectedPaymentType() !== 4) {
            <div class="space-y-2 pt-1">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-slate-800">Tendered / Pay Amount:</span>
                  @if (!isManualTender()) {
                    <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      ⚡ Auto-Exact
                    </span>
                  }
                </div>
                <button
                  type="button"
                  (click)="setQuickExact()"
                  class="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer transition-colors"
                  nz-tooltip
                  nzTooltipTitle="Press F4 to sync exact payable"
                >
                  ⚡ Exact (৳{{ finalPrice() | number: '1.2-2' }})
                </button>
              </div>

              <!-- Big Stepper & Tender Input -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  nz-button
                  nzType="default"
                  (click)="stepTendered(-10)"
                  class="h-10 w-10 rounded-lg text-base font-bold"
                >
                  −
                </button>
                <div class="relative flex-1">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    nz-input
                    [ngModel]="tendered()"
                    (ngModelChange)="onTenderedChange($event)"
                    class="w-full text-center font-mono font-black text-lg h-10 rounded-lg border-2 shadow-2xs"
                    [class.border-indigo-400]="!isManualTender()"
                    [class.border-slate-300]="isManualTender()"
                    min="0"
                    step="10"
                  />
                </div>
                <button
                  type="button"
                  nz-button
                  nzType="default"
                  (click)="stepTendered(10)"
                  class="h-10 w-10 rounded-lg text-base font-bold"
                >
                  +
                </button>
              </div>

              <!-- 1-Touch Cash Banknote Denominations Grid -->
              <div class="space-y-1">
                <div class="text-[11px] font-semibold text-slate-500 flex justify-between items-center">
                  <span>1-Touch Cash Notes:</span>
                  <button
                    type="button"
                    (click)="resetTenderToExact()"
                    class="text-[10px] text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                  >
                    Reset to Exact
                  </button>
                </div>
                <div class="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    (click)="setQuickCash(nextRoundTender())"
                    class="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                    nz-tooltip
                    nzTooltipTitle="Next round banknote"
                  >
                    ৳{{ nextRoundTender() }}
                  </button>
                  <button
                    type="button"
                    (click)="setQuickCash(50)"
                    class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    ৳50
                  </button>
                  <button
                    type="button"
                    (click)="setQuickCash(100)"
                    class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    ৳100
                  </button>
                  <button
                    type="button"
                    (click)="setQuickCash(200)"
                    class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    ৳200
                  </button>
                  <button
                    type="button"
                    (click)="setQuickCash(500)"
                    class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    ৳500
                  </button>
                  <button
                    type="button"
                    (click)="setQuickCash(1000)"
                    class="py-1.5 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    ৳1000
                  </button>
                  <button
                    type="button"
                    (click)="addQuickCash(50)"
                    class="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    +৳50
                  </button>
                  <button
                    type="button"
                    (click)="addQuickCash(100)"
                    class="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md font-mono font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    +৳100
                  </button>
                </div>
              </div>

              <!-- Split Payment Chips (if used) -->
              <div class="pt-1">
                <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Split Tender:</span>
                  <div class="flex gap-1">
                    <button
                      type="button"
                      (click)="addSplitPayment('Cash')"
                      class="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 font-medium cursor-pointer"
                    >
                      + Cash
                    </button>
                    <button
                      type="button"
                      (click)="addSplitPayment('MFS')"
                      class="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 font-medium cursor-pointer"
                    >
                      + MFS
                    </button>
                    <button
                      type="button"
                      (click)="addSplitPayment('Card')"
                      class="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 font-medium cursor-pointer"
                    >
                      + Card
                    </button>
                  </div>
                </div>

                @if (splitPayments().length > 0) {
                  <div class="flex flex-wrap gap-1.5">
                    @for (split of splitPayments(); track split.method; let sIdx = $index) {
                      <div class="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md text-xs font-medium text-slate-800">
                        <span class="font-bold theme-highlight-title">{{ split.method }}</span>
                        <span class="font-mono font-semibold">৳ {{ split.amount | number: '1.2-2' }}</span>
                        <button
                          type="button"
                          (click)="removeSplitPayment(sIdx)"
                          class="text-rose-500 hover:text-rose-700 ml-1 border-0 bg-transparent cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Prominent High-Contrast Change / Due Banner -->
          @if (selectedPaymentType() === 4) {
            <div class="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-3 text-center">
              <div class="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-center gap-1">
                <span nz-icon nzType="warning"></span> SALE ON FULL CREDIT (DUE)
              </div>
              <div class="text-2xl font-black font-mono text-rose-700 mt-0.5">
                ৳ {{ finalPrice() | number: '1.2-2' }}
              </div>
            </div>
          } @else if (changeDue() > 0) {
            <div class="bg-emerald-600 text-white rounded-xl p-3 shadow-md text-center">
              <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-center gap-1.5">
                <span nz-icon nzType="check-circle"></span> CHANGE TO RETURN
              </div>
              <div class="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                ৳ {{ changeDue() | number: '1.2-2' }}
              </div>
            </div>
          } @else if (ticketDue() > 0) {
            <div class="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-3 text-center">
              <div class="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-center gap-1">
                <span nz-icon nzType="warning"></span> DUE / SHORTAGE AMOUNT
              </div>
              <div class="text-2xl font-black font-mono text-rose-700 mt-0.5">
                ৳ {{ ticketDue() | number: '1.2-2' }}
              </div>
            </div>
          } @else {
            <div class="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-center flex items-center justify-center gap-2 text-xs font-semibold">
              <span nz-icon nzType="check-circle" class="text-emerald-600"></span>
              <span>Bill Settled (Exact Amount • No Change Due)</span>
            </div>
          }

          <!-- Customer Info Section -->
          <div class="pt-2 border-t border-slate-100 space-y-2">
            <div class="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Customer Info
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-700 block mb-1">Choose customer:</label>
              <div class="flex gap-2">
                <nz-select class="flex-1" [ngModel]="selectedCustomer()" (ngModelChange)="selectedCustomer.set($event)">
                  @for (c of customers; track c.id) {
                    <nz-option
                      [nzValue]="c.id"
                      [nzLabel]="c.name + (c.phone ? ' (' + c.phone + ')' : '')"
                    ></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="openAddCustomerModal()"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Customer"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
              @if (previousDue() > 0) {
                <div class="flex justify-between text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1 font-medium">
                  <span>Previous Due: ৳ {{ previousDue() | number: '1.2-2' }}</span>
                  @if (ticketDue() > 0) {
                    <span class="font-bold">Total Due: ৳ {{ totalCustomerDue() | number: '1.2-2' }}</span>
                  }
                </div>
              }
            </div>

            <div>
              <textarea
                nz-input
                placeholder="Order note / remark..."
                [(ngModel)]="orderNote"
                rows="2"
                class="rounded-md text-xs"
              ></textarea>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex flex-col gap-2 pt-2">
            <button
              type="button"
              nz-button
              nzType="primary"
              [disabled]="cart().length === 0"
              (click)="confirmCheckout()"
              class="w-full rounded-xl font-bold h-12 text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span nz-icon nzType="check"></span>
              <span>COMPLETE SALE (Enter / F10)</span>
              <span class="font-mono bg-white/20 px-2 py-0.5 rounded text-xs">৳ {{ finalPrice() | number: '1.2-2' }}</span>
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                nz-button
                nzType="default"
                (click)="printInvoice()"
                class="rounded-lg font-medium h-9 text-xs"
              >
                <span nz-icon nzType="printer"></span> Print Receipt
              </button>
              <button
                type="button"
                nz-button
                nzType="default"
                (click)="startNewInvoice()"
                class="rounded-lg font-medium h-9 text-xs text-rose-600 hover:text-rose-700"
              >
                <span nz-icon nzType="clear"></span> Clear Basket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Customer Modal -->
    <nz-modal
      [(nzVisible)]="isCustomerModalVisible"
      [nzTitle]="customerModalMode === 'create' ? 'Register New Customer' : ('Modify Customer: ' + customerForm.name)"
      [nzOkText]="customerModalMode === 'create' ? 'Save Customer' : 'Update Details'"
      (nzOnCancel)="isCustomerModalVisible = false"
      (nzOnOk)="saveCustomer()"
      nzWidth="550px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">
              Customer Full Name <span class="text-rose-500">*</span>
            </span>
            <input type="text" nz-input placeholder="e.g. Md. Tariqul Islam" [(ngModel)]="customerForm.name" class="rounded-md" />
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Phone <span class="text-rose-500">*</span>
            </span>
            <input type="text" nz-input placeholder="+88017XXXXXXXX" [(ngModel)]="customerForm.phone" class="rounded-md" />
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">Customer Tier</span>
            <nz-select class="w-full" [(ngModel)]="customerForm.customer_type">
              @for (tier of customerTiers; track tier.value) {
                <nz-option [nzValue]="tier.value" [nzLabel]="tier.label"></nz-option>
              }
            </nz-select>
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">Address / Note</span>
            <input type="text" nz-input placeholder="e.g. Kandirpar, Cumilla" [(ngModel)]="customerForm.address" class="rounded-md" />
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">Opening Due Balance (৳)</span>
            <nz-input-number class="w-full" [nzMin]="0" [(ngModel)]="customerForm.current_due"></nz-input-number>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Product Modal (F2) -->
    <nz-modal
      [(nzVisible)]="isProductModalVisible"
      nzTitle="Quick Add New Product (F2)"
      nzOkText="Add Product"
      nzCancelText="Cancel"
      (nzOnCancel)="isProductModalVisible = false"
      (nzOnOk)="saveQuickProduct()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">
              Product Brand Name <span class="text-rose-500">*</span>
            </span>
            <input type="text" nz-input placeholder="e.g. Napa Extra 500mg" [(ngModel)]="quickProductForm.brand_name" class="rounded-md" />
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">Generic Formulation</span>
            <div class="flex gap-1.5">
              <nz-select
                nzShowSearch
                nzAllowClear
                nzPlaceHolder="Select generic..."
                [(ngModel)]="quickProductForm.generic_name"
                class="flex-1"
              >
                @for (g of genericsList; track g) {
                  <nz-option [nzValue]="g" [nzLabel]="g"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isQuickGenericModalVisible = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Generic"
                class="btn-quick-add"
              >
                <span nz-icon nzType="plus"></span>
              </button>
            </div>
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Company</span>
            <div class="flex gap-1.5">
              <nz-select
                nzShowSearch
                nzAllowClear
                nzPlaceHolder="Select company..."
                [(ngModel)]="quickProductForm.manufacturer"
                class="flex-1"
              >
                @for (c of companiesList; track c) {
                  <nz-option [nzValue]="c" [nzLabel]="c"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isQuickCompanyModalVisible = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Manufacturer"
                class="btn-quick-add"
              >
                <span nz-icon nzType="plus"></span>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (৳)</span>
              <input type="number" nz-input placeholder="0.00" [(ngModel)]="quickProductForm.cost_price" class="rounded-md" />
            </div>
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Sale Price (৳)</span>
              <input type="number" nz-input placeholder="0.00" [(ngModel)]="quickProductForm.sale_price" class="rounded-md" />
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Generic Sub-Modal for POS -->
    <nz-modal
      [(nzVisible)]="isQuickGenericModalVisible"
      nzTitle="Quick Add Generic Formulation"
      nzOkText="Add Generic"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isQuickGenericModalVisible = false"
      (nzOnOk)="saveQuickGeneric()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Generic Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Pantoprazole Sodium"
            [(ngModel)]="newQuickGenericName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Company Sub-Modal for POS -->
    <nz-modal
      [(nzVisible)]="isQuickCompanyModalVisible"
      nzTitle="Quick Add Manufacturer Company"
      nzOkText="Add Company"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isQuickCompanyModalVisible = false"
      (nzOnOk)="saveQuickCompany()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Company Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Popular Pharmaceuticals"
            [(ngModel)]="newQuickCompanyName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Held Orders Modal / Drawer (F9) -->
    <nz-modal
      [(nzVisible)]="isHeldOrdersModalVisible"
      nzTitle="Held Orders / Parked Baskets (F9)"
      [nzFooter]="null"
      (nzOnCancel)="isHeldOrdersModalVisible = false"
      nzWidth="650px"
    >
      <ng-container *nzModalContent>
        @if (heldOrders().length === 0) {
          <div class="text-center py-8 text-slate-400">
            <span nz-icon nzType="inbox" class="text-3xl text-slate-300 mb-2"></span>
            <p class="text-sm font-medium">No held orders found</p>
            <p class="text-xs">Press F9 while items are in cart to park a transaction</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (h of heldOrders(); track h.id; let hIdx = $index) {
              <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-slate-800">{{ h.customerName }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded font-bold"
                          [class.theme-badge]="h.mode === BusinessMode.Retail"
                          [class.bg-rose-100]="h.mode === BusinessMode.Wholesale"
                          [class.text-rose-800]="h.mode === BusinessMode.Wholesale">
                      {{ h.mode === BusinessMode.Retail ? 'Retail' : 'Wholesale' }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    Held at {{ h.heldAt }} • {{ h.items.length }} item(s) • Total: <strong class="theme-total-text font-mono">৳ {{ h.total | number: '1.2-2' }}</strong>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    nz-button
                    nzType="primary"
                    nzSize="small"
                    (click)="recallOrder(hIdx)"
                    class="rounded font-medium"
                  >
                    <span nz-icon nzType="rollback"></span> Recall
                  </button>
                  <button
                    type="button"
                    (click)="deleteHeldOrder(hIdx)"
                    nz-tooltip
                    nzTooltipTitle="Discard Order"
                    class="btn-tbl-action btn-tbl-delete"
                  >
                    <span nz-icon nzType="delete"></span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </ng-container>
    </nz-modal>

    <!-- Edit Cart Item Modal -->
    <nz-modal
      [(nzVisible)]="isEditItemModalVisible"
      nzTitle="Edit Cart Item"
      nzOkText="Update Item"
      (nzOnCancel)="isEditItemModalVisible = false"
      (nzOnOk)="saveEditedItem()"
    >
      <ng-container *nzModalContent>
        @if (editingItem) {
          <div class="space-y-3 py-1">
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Product</span>
              <input type="text" nz-input [disabled]="true" [ngModel]="editingItem.product_name" class="rounded-md bg-slate-50" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="block text-xs font-semibold text-slate-700 mb-1">{{ isWholesale() ? 'Box Qty' : 'Quantity' }}</span>
                <input type="number" nz-input [(ngModel)]="editingItem.qty" min="0.01" class="rounded-md font-mono" />
              </div>
              <div>
                <span class="block text-xs font-semibold text-slate-700 mb-1">{{ isWholesale() ? 'Price/Box (৳)' : 'Unit Price (৳)' }}</span>
                <input type="number" nz-input [(ngModel)]="editingItem.unit_price" min="0" class="rounded-md font-mono" />
              </div>
            </div>
            <div>
              <span class="block text-xs font-semibold text-slate-700 mb-1">Item Discount (৳)</span>
              <input type="number" nz-input [(ngModel)]="editingItem.discount" min="0" class="rounded-md font-mono" />
            </div>
            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <span class="font-medium text-slate-600">Calculated Line Total:</span>
              <span class="font-mono font-bold theme-total-text text-sm">৳ {{ getEditingItemTotal() | number: '1.2-2' }}</span>
            </div>
          </div>
        }
      </ng-container>
    <!-- 80mm Thermal Receipt Preview Modal -->
    <nz-modal
      [(nzVisible)]="isReceiptModalVisible"
      nzTitle="80mm Thermal Receipt Preview"
      [nzCentered]="true"
      [nzWidth]="380"
      [nzFooter]="receiptFooter"
      (nzOnCancel)="isReceiptModalVisible = false"
    >
      <ng-container *nzModalContent>
        <div id="thermal-receipt" class="p-4 bg-white text-black font-mono text-xs border border-dashed border-slate-300 rounded shadow-xs max-w-[340px] mx-auto select-none">
          <div class="text-center pb-2 border-b border-dashed border-slate-400">
            <div class="text-sm font-black uppercase">Aidly Model Pharmacy</div>
            <div class="text-[10px] text-slate-600">Main Branch (Banani), Dhaka</div>
            <div class="text-[10px] text-slate-600">Hotline: +880 1700-000000</div>
            <div class="text-[10px] text-slate-600">DL: DL-2024-DH-8841</div>
          </div>
          <div class="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
            <div class="flex justify-between"><span>Bill No:</span><span class="font-bold">{{ lastPrintedInvoice?.sales_number || 'POS-2026-000001' }}</span></div>
            <div class="flex justify-between"><span>Date:</span><span>{{ (lastPrintedInvoice?.sale_timestamp || '') | date: 'dd/MM/yyyy hh:mm a' }}</span></div>
            <div class="flex justify-between"><span>Customer:</span><span>{{ selectedCustomerObj()?.name || 'Walk-in' }}</span></div>
            <div class="flex justify-between"><span>Cashier:</span><span>Sales Counter 01</span></div>
          </div>
          <table class="w-full text-[10px] my-2 border-collapse">
            <thead>
              <tr class="border-b border-slate-400 text-left">
                <th class="py-1">Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of lastPrintedItems; track (item.cart_item_id || item.product_no)) {
                <tr>
                  <td class="py-0.5 pr-1 truncate max-w-[120px]">{{ item.product_name }}</td>
                  <td class="text-center">{{ item.qty }}</td>
                  <td class="text-right">{{ item.unit_price | number: '1.2-2' }}</td>
                  <td class="text-right">{{ item.total | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div class="border-t border-dashed border-slate-400 pt-1 text-[10px] space-y-0.5">
            <div class="flex justify-between"><span>Subtotal:</span><span>৳ {{ (lastPrintedInvoice?.gross_total_price || 0) | number: '1.2-2' }}</span></div>
            @if (lastPrintedInvoice?.discount_value) {
              <div class="flex justify-between"><span>Discount:</span><span>-৳ {{ lastPrintedInvoice?.discount_value | number: '1.2-2' }}</span></div>
            }
            @if (lastPrintedInvoice?.vat_amount) {
              <div class="flex justify-between"><span>VAT:</span><span>+৳ {{ lastPrintedInvoice?.vat_amount | number: '1.2-2' }}</span></div>
            }
            <div class="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
              <span>Net Payable:</span>
              <span>৳ {{ (lastPrintedInvoice?.final_price || 0) | number: '1.2-2' }}</span>
            </div>
            <div class="flex justify-between"><span>Change:</span><span>৳ {{ (lastPrintedInvoice?.change_amount || 0) | number: '1.2-2' }}</span></div>
            @if (lastPrintedPayments.length > 0) {
              <div class="border-t border-dashed border-slate-300 pt-1 mt-1 text-[10px]">
                <div class="font-bold text-slate-700 mb-0.5">Tender Breakdown:</div>
                @for (pay of lastPrintedPayments; track pay.method) {
                  <div class="flex justify-between text-slate-600">
                    <span>{{ pay.method }}:</span>
                    <span class="font-mono font-medium">৳ {{ pay.amount | number: '1.2-2' }}</span>
                  </div>
                }
              </div>
            }
          </div>
          <div class="text-center pt-3 text-[10px] text-slate-500 border-t border-dashed border-slate-400 mt-2">
            <div>*** Thank You for Shopping! ***</div>
            <div class="text-[9px]">Medicines sold cannot be returned without receipt</div>
          </div>
        </div>
      </ng-container>
      <ng-template #receiptFooter>
        <button nz-button nzType="default" (click)="isReceiptModalVisible = false">Close</button>
        <button nz-button nzType="primary" (click)="triggerBrowserPrint()">
          <span nz-icon nzType="printer"></span> Print Receipt
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class PosTerminalComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly printService = inject(PrintService);

  isReceiptModalVisible = false;
  lastPrintedInvoice: SaleInvoice | null = null;
  lastPrintedItems: CartItem[] = [];

  readonly paymentMethods = PAYMENT_METHOD_OPTIONS;
  readonly customerTiers = CUSTOMER_TIER_OPTIONS;
  readonly BusinessMode = BusinessMode;
  readonly DiscountType = DiscountType;
  readonly Math = Math;

  businessMode = signal<number>(BusinessMode.Retail);
  isWholesale = computed(() => this.businessMode() === BusinessMode.Wholesale);
  quickPrint = true;

  // Catalog Products for fast search & selection
  catalogProducts = signal<CatalogProduct[]>([]);

  // Entry Form State
  selectedProductText = '';
  currentSearchTerm = '';
  selectedProductObj: CatalogProduct | null = null;
  entryQty = 1;
  entryPrice = 0;
  entryDiscountType: number = DiscountType.Percentage;
  entryDiscountValue = 0;

  // Checkout State as Signals
  selectedCustomer = signal<string>('1');
  selectedPaymentType = signal<number>(1); // 1: Cash, 6: Card, 3: MFS, 8: Split, 4: Due
  cashReceived = signal<boolean>(true);
  orderNote = '';

  globalDiscountType = signal<number>(DiscountType.Percentage);
  globalDiscountValue = signal<number>(0);

  cardCommission = signal<boolean>(false);
  cardCommissionRate = signal<number>(1.5);

  tendered = signal<number>(0);
  isManualTender = signal<boolean>(false);

  // Dedicated Split Tender Channels (Card, Cash, MFS)
  splitCash = signal<number>(0);
  splitCard = signal<number>(0);
  splitMfs = signal<number>(0);
  lastPrintedPayments: { method: string; amount: number }[] = [];

  readonly splitTotal = computed(() => {
    return Math.round((this.splitCash() + this.splitCard() + this.splitMfs()) * 100) / 100;
  });

  readonly splitRemaining = computed(() => {
    const rem = this.finalPrice() - this.splitTotal();
    return rem > 0 ? Math.round(rem * 100) / 100 : 0;
  });

  readonly splitOverpaid = computed(() => {
    const over = this.splitTotal() - this.finalPrice();
    return over > 0 ? Math.round(over * 100) / 100 : 0;
  });

  // Legacy Split Payment List
  splitPayments = signal<SplitPayment[]>([]);

  // Held Orders State (F9)
  heldOrders = signal<HeldOrder[]>([]);
  isHeldOrdersModalVisible = false;

  customers: CustomerOption[] = [
    { id: '1', name: 'Walking Customer', phone: '', customer_type: 1, address: 'Counter', current_due: 0 },
  ];

  cart = signal<CartItem[]>([]);

  constructor() {
    // Auto-sync tender amount with finalPrice unless cashier explicitly entered cash notes or switched to credit/split
    effect(() => {
      const finalAmt = this.finalPrice();
      const isManual = this.isManualTender();
      const isCash = this.cashReceived();
      const payType = this.selectedPaymentType();

      if (!isManual && isCash && payType !== 4 && payType !== 8) {
        this.tendered.set(finalAmt);
      }
    }, { allowSignalWrites: true });
  }

  // Computed Values
  readonly subtotal = computed(() => {
    const sum = this.cart().reduce((acc, item) => acc + item.total, 0);
    return Math.round(sum * 100) / 100;
  });

  readonly discountAmount = computed(() => {
    const sub = this.subtotal();
    const val = Math.max(0, Number(this.globalDiscountValue()) || 0);
    if (val <= 0 || sub <= 0) return 0;
    const amt = this.globalDiscountType() === DiscountType.Percentage
      ? (sub * val) / 100
      : val;
    return Math.min(sub, Math.round(amt * 100) / 100);
  });

  readonly cardFee = computed(() => {
    if (!this.cardCommission()) return 0;
    const taxable = Math.max(0, this.subtotal() - this.discountAmount());
    const fee = (taxable * (Number(this.cardCommissionRate()) || 1.5)) / 100;
    return Math.round(fee * 100) / 100;
  });

  readonly finalPrice = computed(() => {
    const net = Math.max(0, this.subtotal() - this.discountAmount() + this.cardFee());
    return Math.round(net * 100) / 100;
  });

  readonly totalPaid = computed(() => {
    if (!this.cashReceived() && this.selectedPaymentType() === 4) return 0;
    if (this.selectedPaymentType() === 8) {
      return this.splitTotal();
    }
    if (this.splitPayments().length > 0) {
      return Math.round(this.splitPayments().reduce((s, p) => s + p.amount, 0) * 100) / 100;
    }
    return Math.max(0, Number(this.tendered()) || 0);
  });

  readonly balanceDiff = computed(() => {
    return Math.round((this.totalPaid() - this.finalPrice()) * 100) / 100;
  });

  readonly isAdvance = computed(() => this.balanceDiff() >= 0);

  readonly changeDue = computed(() => (this.isAdvance() ? this.balanceDiff() : 0));

  readonly ticketDue = computed(() => (!this.isAdvance() ? Math.abs(this.balanceDiff()) : 0));

  readonly selectedCustomerObj = computed(() => {
    return this.customers.find(c => c.id === this.selectedCustomer());
  });

  readonly previousDue = computed(() => {
    return this.selectedCustomerObj()?.current_due || 0;
  });

  readonly totalCustomerDue = computed(() => {
    return Math.round((this.previousDue() + this.ticketDue()) * 100) / 100;
  });

  readonly nextRoundTender = computed(() => {
    const total = this.finalPrice();
    if (total <= 0) return 0;
    const notes = [20, 50, 100, 200, 500, 1000];
    for (const note of notes) {
      if (note >= total) return note;
    }
    return Math.ceil(total / 500) * 500;
  });

  readonly fastMovingProducts = computed(() => {
    const list = this.catalogProducts();
    const inStock = list.filter(p => p.stock > 0);
    return inStock.length > 0 ? inStock.slice(0, 8) : list.slice(0, 8);
  });

  getCartPcsForProduct(productNo: number, productName?: string): number {
    const isWs = this.isWholesale();
    return this.cart()
      .filter(i => i.product_no === productNo || (productName && i.product_name === productName))
      .reduce((sum, i) => {
        const pcs = isWs ? Math.round(i.qty * (i.pcs_per_box || 10)) : Math.round(i.qty);
        return sum + pcs;
      }, 0);
  }

  getAvailableStock(p: CatalogProduct): number {
    return Math.max(0, (p.stock ?? 0) - this.getCartPcsForProduct(p.id, p.name));
  }

  // Modals State
  isCustomerModalVisible = false;
  customerModalMode: 'create' | 'edit' = 'create';
  customerForm: CustomerOption = { id: '', name: '', phone: '', customer_type: 1, address: '', current_due: 0 };

  isProductModalVisible = false;
  quickProductForm = { brand_name: '', generic_name: '', manufacturer: '', cost_price: 0, sale_price: 0 };

  isEditItemModalVisible = false;
  editingItem: CartItem | null = null;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'F1') {
      event.preventDefault();
      const inputEl = document.querySelector('nz-select input') as HTMLElement;
      if (inputEl) inputEl.focus();
    } else if (event.key === 'F2') {
      event.preventDefault();
      this.openQuickAddProduct();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.setQuickExact();
      this.msg.info('Set exact pay amount (F4)');
    } else if (event.key === 'F9') {
      event.preventDefault();
      this.handleHoldAction();
    } else if (event.key === 'F10' || (event.ctrlKey && event.key === 'Enter')) {
      event.preventDefault();
      this.confirmCheckout();
    }
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 200 }).subscribe(res => {
      if (res.data?.items?.length) {
        const mapped: CatalogProduct[] = res.data.items.map(p => ({
          id: p.product_no,
          name: p.product_name,
          generic: p.generic_name || p.generic?.name || 'General',
          manufacturer: p.company_name || p.company?.name || 'Local Pharma',
          cost: p.purchase_price_per_piece || 0,
          saleRetail: p.sale_price_per_piece || 0,
          saleWholesale: p.wholesale_price_per_piece || (p.sale_price_per_piece * 0.9),
          pcsPerBox: p.quantity_per_box || 10,
          stock: p.stock_qty ?? 0,
          minStock: p.min_stock_qty_pcs || 10,
          rak: p.rak_number || '',
          barcode: p.barcode_value || '',
          strength: p.strength || '',
        }));
        this.catalogProducts.set(mapped);
        if (this.selectedProductObj) {
          const fresh = mapped.find(p => p.id === this.selectedProductObj?.id);
          if (fresh) this.selectedProductObj = fresh;
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadProducts();

    this.customerService.getCustomers({ pageSize: 100 }).subscribe(res => {
      if (res.data?.items?.length) {
        const liveCusts = res.data.items.map(c => ({
          id: String(c.customer_no),
          name: c.name,
          phone: c.phone || '',
          customer_type: c.customer_type,
          address: c.address || '',
          current_due: c.current_due || 0,
        }));
        this.customers = [
          { id: '1', name: 'Walking Customer', phone: '', customer_type: 1, address: 'Counter', current_due: 0 },
          ...liveCusts,
        ];
      }
    });

    this.productService.getCompanies().subscribe(res => {
      if (res.data?.length) {
        this.companiesList = res.data.map(c => c.name);
      }
    });

    this.productService.getGenerics().subscribe(res => {
      if (res.data?.length) {
        this.genericsList = res.data.map(g => g.name);
      }
    });
  }

  setBusinessMode(mode: number): void {
    this.businessMode.set(mode);
    if (this.selectedProductObj) {
      this.entryPrice = mode === BusinessMode.Wholesale
        ? this.selectedProductObj.saleWholesale
        : this.selectedProductObj.saleRetail;
      this.entryQty = mode === BusinessMode.Wholesale ? 1 : 1;
    }
  }

  onProductSearch(term: string): void {
    this.currentSearchTerm = term || '';
  }

  onProductEnterKey(): void {
    if (!this.selectedProductText && this.currentSearchTerm) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.catalogProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        String(p.id) === term
      );
      if (match) {
        this.selectedProductText = match.name;
        this.onProductPicked(match.name);
      } else {
        this.selectedProductText = this.currentSearchTerm.trim();
        if (this.entryPrice <= 0) {
          this.entryPrice = this.isWholesale() ? 50 : 10;
        }
      }
    }
    this.addEntryToCart();
  }

  onProductPicked(name: string): void {
    const found = this.catalogProducts().find(p => p.name === name);
    if (found) {
      this.selectedProductObj = found;
      this.entryPrice = this.isWholesale() ? found.saleWholesale : found.saleRetail;
      this.entryQty = this.isWholesale() ? 1 : 1;
    }
  }

  getEntryLineTotal(): number {
    const price = Number(this.entryPrice) || 0;
    const qty = Number(this.entryQty) || 0;
    if (price <= 0 || qty <= 0) return 0;
    const gross = price * qty;
    let disc = 0;
    const val = Number(this.entryDiscountValue) || 0;
    if (val > 0) {
      disc = this.entryDiscountType === DiscountType.Flat ? val : (gross * val) / 100;
    }
    return Math.round(Math.max(0, gross - disc) * 100) / 100;
  }

  quickAddProductToCart(product: CatalogProduct): void {
    this.selectedProductObj = product;
    this.selectedProductText = product.name;
    this.entryPrice = this.isWholesale() ? product.saleWholesale : product.saleRetail;
    this.entryQty = 1;
    this.entryDiscountValue = 0;
    this.addEntryToCart();
  }

  addEntryToCart(): void {
    // Fallback: If selectedProductText is empty but cashier typed in the search box
    if (!this.selectedProductText.trim() && this.currentSearchTerm.trim()) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.catalogProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase() === term) ||
        String(p.id) === term
      );
      if (match) {
        this.selectedProductText = match.name;
        this.onProductPicked(match.name);
      } else {
        this.selectedProductText = this.currentSearchTerm.trim();
        if (this.entryPrice <= 0) {
          this.entryPrice = this.isWholesale() ? 50 : 10;
        }
      }
    }

    if (!this.selectedProductText.trim()) {
      this.msg.warning('Please select a product first.');
      return;
    }
    const product = this.selectedProductObj || this.catalogProducts().find(p =>
      p.name.toLowerCase() === this.selectedProductText.toLowerCase().trim() ||
      String(p.id) === this.selectedProductText.trim()
    );
    const targetProd = product || this.catalogProducts()[0];
    const targetProdNo = targetProd ? targetProd.id : 1;
    const name = product ? product.name : (targetProd ? targetProd.name : this.selectedProductText);
    const generic = product ? product.generic : (targetProd ? targetProd.generic : 'General');
    const manufacturer = product ? product.manufacturer : (targetProd ? targetProd.manufacturer : 'Local Pharma');
    const cost = product ? product.cost : (targetProd ? targetProd.cost : (this.entryPrice * 0.8));
    const price = Number(this.entryPrice) || (targetProd ? (this.isWholesale() ? targetProd.saleWholesale : targetProd.saleRetail) : (this.isWholesale() ? 50 : 10));
    const qty = Number(this.entryQty) || 1;
    const pcsPerBox = product ? product.pcsPerBox : (targetProd ? targetProd.pcsPerBox : 10);
    const availStock = product ? this.getAvailableStock(product) : (targetProd ? this.getAvailableStock(targetProd) : 0);
    const rakLocation = product ? product.rak : (targetProd ? targetProd.rak : '');
    const barcodeVal = product ? product.barcode : (targetProd ? targetProd.barcode : '');

    let lineDiscount = 0;
    const discountVal = Number(this.entryDiscountValue) || 0;
    if (discountVal > 0) {
      if (this.entryDiscountType === DiscountType.Flat) {
        lineDiscount = discountVal;
      } else {
        lineDiscount = (price * qty * discountVal) / 100;
      }
    }
    lineDiscount = Math.round(lineDiscount * 100) / 100;
    const lineTotal = Math.round(Math.max(0, (price * qty) - lineDiscount) * 100) / 100;

    if (availStock <= 0) {
      this.msg.warning(`Notice: ${name} is out of stock in inventory.`);
    } else if (qty > availStock) {
      this.msg.warning(`Notice: Requested ${qty} exceeds available stock (${availStock} pcs).`);
    }

    // Check if item already exists in cart with same product_no or name and same unit price
    const existingIndex = this.cart().findIndex(i => (i.product_no === targetProdNo || i.product_name === name) && i.unit_price === price);
    if (existingIndex > -1) {
      this.cart.update(items => items.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = Math.round((item.qty + qty) * 100) / 100;
          let newDisc = 0;
          if (item.discount_type === DiscountType.Flat) {
            newDisc = item.discount + lineDiscount;
          } else {
            const pct = (item.discount / (item.unit_price * item.qty)) * 100 || 0;
            newDisc = Math.round(((item.unit_price * newQty * pct) / 100) * 100) / 100;
          }
          const newTot = Math.round(Math.max(0, (item.unit_price * newQty) - newDisc) * 100) / 100;
          return {
            ...item,
            qty: newQty,
            discount: newDisc,
            total: newTot,
            stock: item.stock ?? availStock,
            rak: item.rak || rakLocation,
          };
        }
        return item;
      }));
      this.msg.success(`Updated ${name} quantity in basket`);
    } else {
      const newItem: CartItem = {
        cart_item_id: Date.now(),
        product_no: targetProdNo,
        product_name: name,
        generic_name: generic,
        manufacturer,
        cost_price: cost,
        unit_price: price,
        qty,
        pcs_per_box: pcsPerBox,
        discount: lineDiscount,
        discount_type: this.entryDiscountType,
        total: lineTotal,
        stock: availStock,
        rak: rakLocation,
        barcode: barcodeVal,
      };
      this.cart.update(list => [newItem, ...list]);
      this.msg.success(`Added ${newItem.product_name} to cart`);
    }

    this.isManualTender.set(false); // Reset to auto-tender for new cart state!
    this.selectedProductText = '';
    this.selectedProductObj = null;
    this.currentSearchTerm = '';
    this.entryQty = 1;
    this.entryPrice = 0;
    this.entryDiscountValue = 0;
  }

  updateItemQty(item: CartItem, delta: number): void {
    const step = this.isWholesale() ? 0.25 : 1;
    const currentQty = Number(item.qty) || 0;
    const newQty = Math.max(step, Math.round((currentQty + delta) * 100) / 100);
    if (item.stock && newQty > item.stock && delta > 0) {
      this.msg.warning(`Requested ${newQty} exceeds available stock (${item.stock} pcs)`);
    }
    this.applyItemQty(item, newQty);
  }

  setItemQty(item: CartItem, newQtyRaw: number | string): void {
    const val = Math.max(0.01, Number(newQtyRaw) || 0.01);
    const newQty = Math.round(val * 100) / 100;
    if (item.stock && newQty > item.stock) {
      this.msg.warning(`Requested ${newQty} exceeds available stock (${item.stock} pcs)`);
    }
    this.applyItemQty(item, newQty);
  }

  private applyItemQty(item: CartItem, newQty: number): void {
    let newDisc = item.discount;
    if (item.discount_type === DiscountType.Percentage && item.qty > 0) {
      const pct = (item.discount / (item.unit_price * item.qty)) * 100 || 0;
      newDisc = Math.round(((item.unit_price * newQty * pct) / 100) * 100) / 100;
    }
    const newTotal = Math.round(Math.max(0, (item.unit_price * newQty) - newDisc) * 100) / 100;

    this.cart.update(list => list.map(i => {
      const match = (item.cart_item_id && i.cart_item_id) ? (i.cart_item_id === item.cart_item_id) : (i.product_no === item.product_no);
      if (match) {
        return {
          ...i,
          qty: newQty,
          discount: newDisc,
          total: newTotal,
        };
      }
      return i;
    }));
  }

  removeItem(item: CartItem): void {
    this.cart.update(list => list.filter(i => {
      if (item.cart_item_id && i.cart_item_id) return i.cart_item_id !== item.cart_item_id;
      return i.product_no !== item.product_no;
    }));
  }

  openEditItemModal(item: CartItem): void {
    this.editingItem = { ...item };
    this.isEditItemModalVisible = true;
  }

  getEditingItemTotal(): number {
    if (!this.editingItem) return 0;
    const price = Number(this.editingItem.unit_price) || 0;
    const qty = Number(this.editingItem.qty) || 0;
    const disc = Number(this.editingItem.discount) || 0;
    return Math.round(Math.max(0, (price * qty) - disc) * 100) / 100;
  }

  saveEditedItem(): void {
    if (!this.editingItem) return;
    const updated = this.editingItem;
    const price = Number(updated.unit_price) || 0;
    const qty = Math.max(0.01, Number(updated.qty) || 1);
    const disc = Math.max(0, Number(updated.discount) || 0);
    updated.unit_price = price;
    updated.qty = qty;
    updated.discount = disc;
    updated.total = Math.round(Math.max(0, (price * qty) - disc) * 100) / 100;

    this.cart.update(list => list.map(i => {
      const match = (updated.cart_item_id && i.cart_item_id) ? (i.cart_item_id === updated.cart_item_id) : (i.product_no === updated.product_no);
      return match ? updated : i;
    }));
    this.isEditItemModalVisible = false;
    this.msg.success('Item updated');
  }

  // F9 Hold Order System
  handleHoldAction(): void {
    if (this.cart().length > 0) {
      const currentCust = this.customers.find(c => c.id === this.selectedCustomer());
      const held: HeldOrder = {
        id: 'HOLD-' + Date.now().toString().slice(-4),
        heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: currentCust ? currentCust.name : 'Walking Customer',
        customerId: this.selectedCustomer(),
        mode: this.businessMode(),
        items: [...this.cart()],
        total: this.finalPrice(),
      };

      this.heldOrders.update(orders => [held, ...orders]);
      this.cart.set([]);
      this.tendered.set(0);
      this.splitPayments.set([]);
      this.globalDiscountValue.set(0);
      this.msg.info(`Order held #${held.id}. Basket is ready for next customer.`);
    } else {
      if (this.heldOrders().length > 0) {
        this.isHeldOrdersModalVisible = true;
      } else {
        this.msg.warning('No items in cart to hold, and no parked orders available.');
      }
    }
  }

  recallOrder(idx: number): void {
    const order = this.heldOrders()[idx];
    if (!order) return;

    if (this.cart().length > 0) {
      this.msg.warning('Please clear or hold active basket before recalling another order.');
      return;
    }

    this.businessMode.set(order.mode);
    this.selectedCustomer.set(order.customerId);
    this.cart.set([...order.items]);
    this.heldOrders.update(orders => orders.filter((_, i) => i !== idx));
    this.isHeldOrdersModalVisible = false;
    this.msg.success(`Recalled order from ${order.customerName}`);
  }

  deleteHeldOrder(idx: number): void {
    this.heldOrders.update(orders => orders.filter((_, i) => i !== idx));
    this.msg.info('Held order discarded.');
  }

  // Split Payment Methods & Tender Operations
  setGlobalDiscountType(type: number): void {
    this.globalDiscountType.set(type);
  }

  onGlobalDiscountChange(val: number): void {
    this.globalDiscountValue.set(Math.max(0, Number(val) || 0));
  }

  onCardCommissionToggle(checked: boolean): void {
    this.cardCommission.set(checked);
  }

  setExactPayment(): void {
    this.isManualTender.set(false);
    this.cashReceived.set(true);
    this.tendered.set(this.finalPrice());
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  setQuickExact(): void {
    this.setExactPayment();
  }

  resetTenderToExact(): void {
    this.isManualTender.set(false);
    this.tendered.set(this.finalPrice());
  }

  setQuickCash(amount: number): void {
    this.isManualTender.set(true);
    this.cashReceived.set(true);
    this.tendered.set(amount);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  addQuickCash(extra: number): void {
    this.isManualTender.set(true);
    this.cashReceived.set(true);
    const curr = Number(this.tendered()) || 0;
    this.tendered.set(curr + extra);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  setPaymentMethod(type: number): void {
    this.selectedPaymentType.set(type);
    if (type === 4) { // Due / Credit
      this.cashReceived.set(false);
      this.tendered.set(0);
      this.cardCommission.set(false);
      this.splitPayments.set([]);
    } else if (type === 8) { // Split / Multi-Tender
      this.cashReceived.set(true);
      this.cardCommission.set(false);
      this.isManualTender.set(true);
      // If split channels are not initialized, leave at 0 so cashier can enter each channel
      if (this.splitTotal() === 0 && this.tendered() > 0 && this.tendered() < this.finalPrice()) {
        this.splitCash.set(this.tendered());
      }
    } else if (type === 6 || type === 2) { // Card
      this.cashReceived.set(true);
      this.cardCommission.set(true);
      this.isManualTender.set(false);
      this.tendered.set(this.finalPrice());
    } else { // Cash (1) or MFS (3)
      this.cashReceived.set(true);
      this.cardCommission.set(false);
      this.isManualTender.set(false);
      this.tendered.set(this.finalPrice());
    }
  }

  onSplitChannelChange(channel: 'cash' | 'card' | 'mfs', val: number | string): void {
    const num = Math.max(0, Number(val) || 0);
    const rounded = Math.round(num * 100) / 100;
    if (channel === 'cash') this.splitCash.set(rounded);
    else if (channel === 'card') this.splitCard.set(rounded);
    else if (channel === 'mfs') this.splitMfs.set(rounded);
  }

  fillRemainingTo(channel: 'cash' | 'card' | 'mfs'): void {
    const rem = this.splitRemaining();
    if (rem <= 0) return;
    if (channel === 'cash') {
      this.splitCash.set(Math.round((this.splitCash() + rem) * 100) / 100);
    } else if (channel === 'card') {
      this.splitCard.set(Math.round((this.splitCard() + rem) * 100) / 100);
    } else if (channel === 'mfs') {
      this.splitMfs.set(Math.round((this.splitMfs() + rem) * 100) / 100);
    }
  }

  setSplitFull(channel: 'cash' | 'card' | 'mfs'): void {
    this.splitCash.set(0);
    this.splitCard.set(0);
    this.splitMfs.set(0);
    const full = this.finalPrice();
    if (channel === 'cash') this.splitCash.set(full);
    else if (channel === 'card') this.splitCard.set(full);
    else if (channel === 'mfs') this.splitMfs.set(full);
  }

  clearSplitChannel(channel: 'cash' | 'card' | 'mfs'): void {
    if (channel === 'cash') this.splitCash.set(0);
    else if (channel === 'card') this.splitCard.set(0);
    else if (channel === 'mfs') this.splitMfs.set(0);
  }

  resetAllSplit(): void {
    this.splitCash.set(0);
    this.splitCard.set(0);
    this.splitMfs.set(0);
  }

  splitHalfAndHalf(chan1: 'cash' | 'card', chan2: 'card' | 'mfs'): void {
    const half = Math.round((this.finalPrice() / 2) * 100) / 100;
    const remainder = Math.round((this.finalPrice() - half) * 100) / 100;
    this.resetAllSplit();
    if (chan1 === 'cash') this.splitCash.set(half);
    else if (chan1 === 'card') this.splitCard.set(half);

    if (chan2 === 'card') this.splitCard.set(remainder);
    else if (chan2 === 'mfs') this.splitMfs.set(remainder);
  }

  stepTendered(delta: number): void {
    this.isManualTender.set(true);
    this.cashReceived.set(true);
    const curr = Number(this.tendered()) || 0;
    const next = Math.max(0, curr + delta);
    this.tendered.set(Math.round(next * 100) / 100);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onTenderedChange(val: number | string): void {
    this.isManualTender.set(true);
    this.cashReceived.set(true);
    this.tendered.set(Math.max(0, Number(val) || 0));
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onPaymentTypeChange(type: number): void {
    this.setPaymentMethod(type);
  }

  toggleCashReceived(checked: boolean): void {
    this.cashReceived.set(checked);
    if (!checked) {
      this.tendered.set(0);
      this.splitPayments.set([]);
    } else {
      this.isManualTender.set(false);
      this.tendered.set(this.finalPrice());
    }
  }

  addSplitPayment(method: string): void {
    const existingSum = this.splitPayments().reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, this.finalPrice() - existingSum);
    const amount = remaining > 0 ? remaining : (this.tendered() > 0 ? this.tendered() : 50);
    this.splitPayments.update(list => [...list, { method, amount: Math.round(amount * 100) / 100 }]);
    this.tendered.set(Math.round((existingSum + amount) * 100) / 100);
    this.cashReceived.set(true);
  }

  removeSplitPayment(idx: number): void {
    this.splitPayments.update(list => list.filter((_, i) => i !== idx));
    const newSum = this.splitPayments().reduce((s, p) => s + p.amount, 0);
    this.tendered.set(Math.round(newSum * 100) / 100);
  }

  startNewInvoice(): void {
    if (this.cart().length > 0) {
      this.modal.confirmAction('Start New Invoice?', 'Clear current basket?', 'Clear', true)
        .subscribe(confirmed => {
          if (confirmed) {
            this.cart.set([]);
            this.isManualTender.set(false);
            this.tendered.set(0);
            this.splitPayments.set([]);
            this.splitCash.set(0);
            this.splitCard.set(0);
            this.splitMfs.set(0);
            this.globalDiscountValue.set(0);
            this.cardCommission.set(false);
          }
        });
    }
  }

  openAddCustomerModal(): void {
    this.customerModalMode = 'create';
    this.customerForm = { id: crypto.randomUUID(), name: '', phone: '', customer_type: 1, address: '', current_due: 0 };
    this.isCustomerModalVisible = true;
  }

  saveCustomer(): void {
    if (!this.customerForm.name.trim()) {
      this.msg.warning('Customer name is required');
      return;
    }
    const customerPayload = {
      name: this.customerForm.name.trim(),
      phone: this.customerForm.phone?.trim() || '01700000000',
      customer_type: this.customerForm.customer_type || 1,
      address: this.customerForm.address || '',
      current_due: this.customerForm.current_due || 0,
      has_due: (this.customerForm.current_due || 0) > 0,
    };

    this.customerService.createCustomer(customerPayload).subscribe(res => {
      if (res.data) {
        const newCust = {
          id: String(res.data.customer_no),
          name: res.data.name,
          phone: res.data.phone,
          customer_type: res.data.customer_type,
          address: res.data.address || '',
          current_due: res.data.current_due || 0,
        };
        this.customers = [...this.customers, newCust];
        this.selectedCustomer.set(newCust.id);
        this.isCustomerModalVisible = false;
        this.msg.success(`Customer "${newCust.name}" registered!`);
      }
    });
  }

  // Sub-Modals for Quick Product
  companiesList: string[] = [...DEFAULT_COMPANIES];
  genericsList: string[] = [...DEFAULT_GENERICS];
  isQuickGenericModalVisible = false;
  newQuickGenericName = '';
  isQuickCompanyModalVisible = false;
  newQuickCompanyName = '';

  openQuickAddProduct(): void {
    this.quickProductForm = {
      brand_name: '',
      generic_name: this.genericsList[0] || 'Paracetamol',
      manufacturer: this.companiesList[0] || 'Beximco Pharmaceuticals Ltd.',
      cost_price: 0,
      sale_price: 0,
    };
    this.isProductModalVisible = true;
  }

  saveQuickGeneric(): void {
    if (!this.newQuickGenericName.trim()) {
      this.msg.warning('Please enter generic formulation');
      return;
    }
    const name = this.newQuickGenericName.trim();
    if (!this.genericsList.includes(name)) {
      this.genericsList = [...this.genericsList, name];
    }
    this.quickProductForm.generic_name = name;
    this.newQuickGenericName = '';
    this.isQuickGenericModalVisible = false;
    this.msg.success(`Generic "${name}" added!`);
  }

  saveQuickCompany(): void {
    if (!this.newQuickCompanyName.trim()) {
      this.msg.warning('Please enter company name');
      return;
    }
    const name = this.newQuickCompanyName.trim();
    if (!this.companiesList.includes(name)) {
      this.companiesList = [...this.companiesList, name];
    }
    this.quickProductForm.manufacturer = name;
    this.newQuickCompanyName = '';
    this.isQuickCompanyModalVisible = false;
    this.msg.success(`Company "${name}" added!`);
  }

  saveQuickProduct(): void {
    if (!this.quickProductForm.brand_name.trim()) {
      this.msg.error('Brand name is required');
      return;
    }
    const name = this.quickProductForm.brand_name.trim();
    const cost = Number(this.quickProductForm.cost_price) || 10;
    const sale = Number(this.quickProductForm.sale_price) || 15;

    const prodPayload = {
      product_name: name,
      brand_name: name,
      strength: 'Standard',
      volume: 'Standard',
      purchase_price_per_piece: cost,
      sale_price_per_piece: sale,
      wholesale_price_per_piece: sale * 0.9,
      cost_per_box: cost * 10,
      sale_price_per_box: sale * 10,
      wholesale_price_per_box: sale * 9,
      quantity_per_box: 10,
      medicine_type: 1,
      unit_type: 1,
      is_medicine: true,
      min_stock_qty_pcs: 20,
    };

    this.productService.createProduct(prodPayload).subscribe(res => {
      if (res.data) {
        const newProd: CatalogProduct = {
          id: res.data.product_no,
          name: res.data.product_name,
          generic: this.quickProductForm.generic_name || 'General',
          manufacturer: this.quickProductForm.manufacturer || 'Local Pharma',
          cost: res.data.purchase_price_per_piece,
          saleRetail: res.data.sale_price_per_piece,
          saleWholesale: res.data.wholesale_price_per_piece || (res.data.sale_price_per_piece * 0.9),
          pcsPerBox: res.data.quantity_per_box,
          stock: 0,
          minStock: res.data.min_stock_qty_pcs || 10,
          rak: '',
          barcode: '',
          strength: res.data.strength || '',
        };
        this.catalogProducts.update(prods => [newProd, ...prods]);
        this.selectedProductText = name;
        this.onProductPicked(name);
        this.msg.success(`Product "${name}" registered successfully!`);
        this.isProductModalVisible = false;
      }
    });
  }

  printInvoice(): void {
    if (!this.lastPrintedInvoice && this.cart().length === 0) {
      this.msg.warning('No completed sale available to print.');
      return;
    }
    this.isReceiptModalVisible = true;
  }

  triggerBrowserPrint(): void {
    this.printService.printElement('thermal-receipt', {
      title: `POS Receipt - ${this.lastPrintedInvoice?.sales_number || 'Receipt'}`,
    });
  }

  confirmCheckout(): void {
    if (this.cart().length === 0) {
      this.msg.warning('Cannot checkout an empty basket.');
      return;
    }

    const currentCust = this.customers.find(c => c.id === this.selectedCustomer());
    const customerNo = currentCust ? Number(currentCust.id) || 1 : 1;

    const salePayload = {
      invoice: {
        customer_no: customerNo,
        sale_mode: this.businessMode(),
        gross_total_price: this.subtotal(),
        discount_type: this.globalDiscountType(),
        discount_value: this.discountAmount(),
        card_commission_percent: this.cardCommission() ? Number(this.cardCommissionRate()) || 1.5 : 0,
        card_commission_amount: this.cardFee(),
        net_amount: Math.max(0, this.subtotal() - this.discountAmount()),
        vat_amount: 0,
        round_off_amount: 0,
        final_price: this.finalPrice(),
        approximate_profit: Math.round((this.finalPrice() - this.cart().reduce((sum, i) => sum + (i.cost_price * i.qty), 0)) * 100) / 100,
        customer_will_pay: this.totalPaid(),
        change_amount: this.changeDue(),
        due_amount: this.ticketDue(),
        payment_method: this.selectedPaymentType(),
        cash_received_status: this.cashReceived() ? 2 : 1,
        is_quick_printed: this.quickPrint,
      },
      items: this.cart().map(item => {
        const pcsPerBox = item.pcs_per_box || 10;
        const totalPcs = this.isWholesale()
          ? Math.max(1, Math.round(item.qty * pcsPerBox))
          : Math.max(1, Math.round(item.qty));
        const boxQty = this.isWholesale()
          ? Math.max(1, Math.round(item.qty))
          : Math.floor(totalPcs / pcsPerBox);

        return {
          product_no: item.product_no,
          sale_mode: this.businessMode(),
          sale_qty: totalPcs,
          box_qty: boxQty,
          pcs_per_box: pcsPerBox,
          unit_cost_price: item.cost_price,
          unit_sale_price: item.unit_price,
          discount_amount: item.discount,
          net_amount: item.total,
          total_price: item.total,
        };
      }),
      payments: this.selectedPaymentType() === 8
        ? [
            ...(this.splitCard() > 0 ? [{ account_no: 1, payment_method: 6, amount: this.splitCard() }] : []),
            ...(this.splitCash() > 0 ? [{ account_no: 1, payment_method: 1, amount: this.splitCash() }] : []),
            ...(this.splitMfs() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitMfs() }] : []),
          ]
        : this.splitPayments().length > 0
        ? this.splitPayments().map(p => ({
            account_no: 1,
            payment_method: p.method === 'Cash' ? 1 : p.method === 'Card' ? 6 : 3,
            amount: p.amount,
          }))
        : [
            {
              account_no: 1,
              payment_method: this.selectedPaymentType(),
              amount: this.totalPaid(),
            },
          ],
    };

    // If split mode was selected but all amounts were 0, default to cash full
    if (this.selectedPaymentType() === 8 && salePayload.payments.length === 0) {
      salePayload.payments = [
        { account_no: 1, payment_method: 1, amount: this.finalPrice() }
      ];
    }

    this.posSaleService.createSale(salePayload).subscribe({
      next: res => {
        if (res.success && res.data) {
          const soldCart = [...this.cart()];
          const wasWholesale = this.isWholesale();
          this.lastPrintedInvoice = res.data;
          this.lastPrintedItems = soldCart;

          // Set tender breakdown for receipt
          if (this.selectedPaymentType() === 8) {
            this.lastPrintedPayments = [
              ...(this.splitCard() > 0 ? [{ method: 'Card', amount: this.splitCard() }] : []),
              ...(this.splitCash() > 0 ? [{ method: 'Cash', amount: this.splitCash() }] : []),
              ...(this.splitMfs() > 0 ? [{ method: 'MFS (bKash/Nagad)', amount: this.splitMfs() }] : []),
            ];
          } else {
            const methodLabel = this.selectedPaymentType() === 1 ? 'Cash'
              : this.selectedPaymentType() === 6 ? 'Card'
              : this.selectedPaymentType() === 3 ? 'MFS'
              : this.selectedPaymentType() === 4 ? 'Due' : 'Cash';
            this.lastPrintedPayments = [{ method: methodLabel, amount: this.totalPaid() }];
          }

          this.msg.success(`Sale ${res.data.sales_number} completed! Total: ৳ ${this.finalPrice().toFixed(2)}`);

          if (this.quickPrint) {
            this.isReceiptModalVisible = true;
          }

          // Immediately deduct sold quantities in local catalog signal
          this.catalogProducts.update(list =>
            list.map(p => {
              const soldPcs = soldCart
                .filter(i => i.product_no === p.id || i.product_name === p.name)
                .reduce((sum, i) => sum + (wasWholesale ? Math.round(i.qty * (i.pcs_per_box || p.pcsPerBox || 10)) : Math.round(i.qty)), 0);
              return soldPcs > 0 ? { ...p, stock: Math.max(0, p.stock - soldPcs) } : p;
            })
          );

          this.cart.set([]);
          this.isManualTender.set(false);
          this.tendered.set(0);
          this.splitPayments.set([]);
          this.splitCash.set(0);
          this.splitCard.set(0);
          this.splitMfs.set(0);
          this.globalDiscountValue.set(0);

          // Refresh authoritative product stock from backend
          this.loadProducts();
        } else {
          this.msg.error(res.message || 'Failed to complete sale');
        }
      },
      error: () => {
        this.msg.error('An error occurred during sale processing');
      },
    });
  }
}
