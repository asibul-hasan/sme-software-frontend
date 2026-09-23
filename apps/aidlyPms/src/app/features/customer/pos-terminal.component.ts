import { Component, inject, signal, computed, ChangeDetectionStrategy, HostListener, OnInit } from '@angular/core';
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
import { SaleInvoice } from '../../core/models/customer.models';

interface CartItem {
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
          
          <!-- Product Entry Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
            <div class="grid grid-cols-12 gap-3 items-end">
              <!-- Product Search / Select -->
              <div class="col-span-12 md:col-span-4">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Product <span class="text-rose-500">*</span>
                </label>
                <nz-select
                  nzShowSearch
                  nzPlaceHolder="Select Product..."
                  [(ngModel)]="selectedProductText"
                  (ngModelChange)="onProductPicked($event)"
                  (nzOnSearch)="onProductSearch($event)"
                  (keyup.enter)="onProductEnterKey()"
                  class="w-full"
                >
                  @for (p of catalogProducts; track p.id) {
                    <nz-option
                      [nzValue]="p.name"
                      [nzLabel]="p.name + ' (' + p.generic + ')'"
                    ></nz-option>
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
                    @for (item of cart(); track item.product_no; let idx = $index) {
                      <tr
                        class="hover:bg-slate-50/70 transition-colors"
                        [class.bg-rose-50/30]="isWholesale()"
                      >
                        <!-- Details -->
                        <td class="p-3">
                          <p class="font-bold text-slate-900 m-0 text-xs">{{ item.product_name }}</p>
                          <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>{{ item.generic_name }}</span>
                            @if (item.manufacturer) {
                              <span>• {{ item.manufacturer }}</span>
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
            <span class="text-xs font-bold text-slate-900 uppercase tracking-wider">Checkout</span>
            <span class="text-xs font-mono font-semibold text-slate-500">
              Total items: {{ cart().length }}
            </span>
          </div>

          <!-- Total price -->
          <div class="flex justify-between text-xs">
            <span class="text-slate-600 font-medium">Total price:</span>
            <span class="font-mono font-bold text-slate-900">
              ৳ {{ subtotal() | number: '1.2-2' }}
            </span>
          </div>

          <!-- Global Discount Section (Single Line, Full Width) -->
          <div class="flex items-center gap-2 pt-1">
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

          <!-- Card Commission Checkbox -->
          <div class="flex items-center justify-between pt-1">
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

          <!-- Final Price Banner (Prominent display matching reference images) -->
          <div
            class="rounded-xl p-4 text-center shadow-xs theme-shell-banner"
          >
            <div class="text-[11px] font-medium tracking-wider uppercase opacity-90 mb-1">
              Final Price:
            </div>
            <div class="text-2xl font-black font-mono">
              ৳ {{ finalPrice() | number: '1.2-2' }}
            </div>
            @if (discountAmount() > 0) {
              <div class="text-[10px] text-emerald-300 mt-1 font-medium">
                Savings: ৳ {{ discountAmount() | number: '1.2-2' }}
              </div>
            }
          </div>

          <!-- Split Payment Tender Chips (matching reference image) -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">Split Payment / Tender:</span>
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

            <!-- Active Split Payment Chips -->
            <div class="flex flex-wrap gap-1.5">
              @for (split of splitPayments(); track split.method; let sIdx = $index) {
                <div class="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2 py-1 rounded-md text-xs font-medium text-slate-800">
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
          </div>

          <!-- Customer will pay section -->
          <div class="space-y-1 pt-1">
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-slate-700">Customer will pay:</span>
              <button
                type="button"
                (click)="setExactPayment()"
                class="text-[11px] theme-link font-semibold bg-transparent border-0 cursor-pointer"
              >
                Exact (৳ {{ finalPrice() | number: '1.2-2' }})
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                nz-button
                nzType="default"
                (click)="stepTendered(-10)"
                class="rounded-md"
              >
                −
              </button>
              <input
                type="number"
                nz-input
                [ngModel]="tendered()"
                (ngModelChange)="onTenderedChange($event)"
                class="flex-1 text-center font-mono font-bold text-base rounded-md"
                min="0"
                step="10"
              />
              <button
                type="button"
                nz-button
                nzType="default"
                (click)="stepTendered(10)"
                class="rounded-md"
              >
                +
              </button>
            </div>
          </div>

          <!-- Advance vs Due Indicator Banner -->
          <div
            class="rounded-lg p-2.5 flex justify-between items-center text-xs font-bold border transition-colors"
            [ngClass]="isAdvance() ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'"
          >
            <span class="uppercase tracking-wider">
              {{ isAdvance() ? 'Advance' : 'Due' }}
            </span>
            <span class="font-mono text-base font-black">
              ৳ {{ (isAdvance() ? changeDue() : ticketDue()) | number: '1.2-2' }}
            </span>
          </div>

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
              <label class="text-xs font-semibold text-slate-700 block mb-1">Payment type:</label>
              <nz-select class="w-full" [ngModel]="selectedPaymentType()" (ngModelChange)="onPaymentTypeChange($event)">
                @for (m of paymentMethods; track m.value) {
                  <nz-option [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                }
              </nz-select>
            </div>

            <!-- Cash Received Checkbox -->
            <div class="pt-1">
              <label
                nz-checkbox
                [ngModel]="cashReceived()"
                (ngModelChange)="toggleCashReceived($event)"
                class="text-xs font-semibold text-slate-700"
              >
                Cash Received
              </label>
            </div>

            <div>
              <textarea
                nz-input
                placeholder="Note / remark..."
                [(ngModel)]="orderNote"
                rows="2"
                class="rounded-md text-xs"
              ></textarea>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              nz-button
              nzType="default"
              (click)="printInvoice()"
              class="rounded-lg font-medium h-10"
            >
              <span nz-icon nzType="printer"></span> Print
            </button>
            <button
              type="button"
              nz-button
              nzType="primary"
              [disabled]="cart().length === 0"
              (click)="confirmCheckout()"
              class="rounded-lg font-bold h-10"
            >
              Create Sale
            </button>
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
              @for (item of lastPrintedItems; track item.product_no) {
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
            <div class="flex justify-between pt-1"><span>Paid:</span><span>৳ {{ (lastPrintedInvoice?.customer_will_pay || 0) | number: '1.2-2' }}</span></div>
            <div class="flex justify-between"><span>Change:</span><span>৳ {{ (lastPrintedInvoice?.change_amount || 0) | number: '1.2-2' }}</span></div>
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
  catalogProducts: Array<{
    id: number;
    name: string;
    generic: string;
    manufacturer: string;
    cost: number;
    saleRetail: number;
    saleWholesale: number;
    pcsPerBox: number;
  }> = [];

  // Entry Form State
  selectedProductText = '';
  currentSearchTerm = '';
  selectedProductObj: (typeof this.catalogProducts)[0] | null = null;
  entryQty = 1;
  entryPrice = 0;
  entryDiscountType: number = DiscountType.Percentage;
  entryDiscountValue = 0;

  // Checkout State as Signals
  selectedCustomer = signal<string>('1');
  selectedPaymentType = signal<number>(1); // Cash
  cashReceived = signal<boolean>(true);
  orderNote = '';

  globalDiscountType = signal<number>(DiscountType.Percentage);
  globalDiscountValue = signal<number>(0);

  cardCommission = signal<boolean>(false);
  cardCommissionRate = signal<number>(1.5);

  tendered = signal<number>(0);

  // Split Payment List
  splitPayments = signal<SplitPayment[]>([]);

  // Held Orders State (F9)
  heldOrders = signal<HeldOrder[]>([]);
  isHeldOrdersModalVisible = false;

  customers: CustomerOption[] = [
    { id: '1', name: 'Walking Customer', phone: '', customer_type: 1, address: 'Counter', current_due: 0 },
  ];

  cart = signal<CartItem[]>([]);

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
    if (!this.cashReceived()) return 0;
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
    if (event.key === 'F2') {
      event.preventDefault();
      this.openQuickAddProduct();
    } else if (event.key === 'F9') {
      event.preventDefault();
      this.handleHoldAction();
    }
  }

  ngOnInit(): void {
    this.productService.getProducts({ pageSize: 200 }).subscribe(res => {
      if (res.data?.items?.length) {
        this.catalogProducts = res.data.items.map(p => ({
          id: p.product_no,
          name: p.product_name,
          generic: p.generic_name || p.generic?.name || 'General',
          manufacturer: p.company?.name || 'Local Pharma',
          cost: p.purchase_price_per_piece || 0,
          saleRetail: p.sale_price_per_piece || 0,
          saleWholesale: p.wholesale_price_per_piece || (p.sale_price_per_piece * 0.9),
          pcsPerBox: p.quantity_per_box || 10,
        }));
      }
    });

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
      const match = this.catalogProducts.find(p =>
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
    const found = this.catalogProducts.find(p => p.name === name);
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

  addEntryToCart(): void {
    // Fallback: If selectedProductText is empty but cashier typed in the search box
    if (!this.selectedProductText.trim() && this.currentSearchTerm.trim()) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.catalogProducts.find(p =>
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

    if (!this.selectedProductText.trim()) {
      this.msg.warning('Please select a product first.');
      return;
    }
    const product = this.selectedProductObj;
    const name = product ? product.name : this.selectedProductText;
    const generic = product ? product.generic : 'General';
    const manufacturer = product ? product.manufacturer : 'Local Pharma';
    const cost = product ? product.cost : (this.entryPrice * 0.8);
    const price = Number(this.entryPrice) || (this.isWholesale() ? 50 : 10);
    const qty = Number(this.entryQty) || 1;
    const pcsPerBox = product ? product.pcsPerBox : 10;

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

    // Check if item already exists in cart with same unit price
    const existingIndex = this.cart().findIndex(i => i.product_name === name && i.unit_price === price);
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
          };
        }
        return item;
      }));
      this.msg.success(`Updated ${name} quantity in basket`);
    } else {
      const newItem: CartItem = {
        product_no: Date.now(),
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
      };
      this.cart.update(list => [newItem, ...list]);
      this.msg.success(`Added ${newItem.product_name} to cart`);
    }

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
    this.applyItemQty(item, newQty);
  }

  setItemQty(item: CartItem, newQtyRaw: number | string): void {
    const val = Math.max(0.01, Number(newQtyRaw) || 0.01);
    this.applyItemQty(item, Math.round(val * 100) / 100);
  }

  private applyItemQty(item: CartItem, newQty: number): void {
    let newDisc = item.discount;
    if (item.discount_type === DiscountType.Percentage && item.qty > 0) {
      const pct = (item.discount / (item.unit_price * item.qty)) * 100 || 0;
      newDisc = Math.round(((item.unit_price * newQty * pct) / 100) * 100) / 100;
    }
    const newTotal = Math.round(Math.max(0, (item.unit_price * newQty) - newDisc) * 100) / 100;

    this.cart.update(list => list.map(i => {
      if (i.product_no === item.product_no) {
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
    this.cart.update(list => list.filter(i => i.product_no !== item.product_no));
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

    this.cart.update(list => list.map(i => i.product_no === updated.product_no ? updated : i));
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
    this.cashReceived.set(true);
    this.tendered.set(this.finalPrice());
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  stepTendered(delta: number): void {
    this.cashReceived.set(true);
    const curr = Number(this.tendered()) || 0;
    const next = Math.max(0, curr + delta);
    this.tendered.set(Math.round(next * 100) / 100);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onTenderedChange(val: number | string): void {
    this.cashReceived.set(true);
    this.tendered.set(Math.max(0, Number(val) || 0));
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onPaymentTypeChange(type: number): void {
    this.selectedPaymentType.set(type);
    if (type === 4) { // Due / Credit
      this.cashReceived.set(false);
      this.tendered.set(0);
      this.splitPayments.set([]);
    } else if (type === 2) { // Card
      this.cashReceived.set(true);
      this.cardCommission.set(true);
      this.tendered.set(this.finalPrice());
    } else { // Cash or MFS
      this.cashReceived.set(true);
      if (this.tendered() === 0) {
        this.tendered.set(this.finalPrice());
      }
    }
  }

  toggleCashReceived(checked: boolean): void {
    this.cashReceived.set(checked);
    if (!checked) {
      this.tendered.set(0);
      this.splitPayments.set([]);
    } else {
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
            this.tendered.set(0);
            this.splitPayments.set([]);
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
        const newProd = {
          id: res.data.product_no,
          name: res.data.product_name,
          generic: this.quickProductForm.generic_name || 'General',
          manufacturer: this.quickProductForm.manufacturer || 'Local Pharma',
          cost: res.data.purchase_price_per_piece,
          saleRetail: res.data.sale_price_per_piece,
          saleWholesale: res.data.wholesale_price_per_piece || (res.data.sale_price_per_piece * 0.9),
          pcsPerBox: res.data.quantity_per_box,
        };
        this.catalogProducts.unshift(newProd);
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
    window.print();
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
      items: this.cart().map(item => ({
        product_no: item.product_no,
        sale_mode: this.businessMode(),
        sale_qty: Math.round(item.qty),
        box_qty: this.isWholesale() ? Math.round(item.qty) : 1,
        pcs_per_box: item.pcs_per_box || 10,
        unit_cost_price: item.cost_price,
        unit_sale_price: item.unit_price,
        discount_amount: item.discount,
        net_amount: item.total,
        total_price: item.total,
      })),
      payments: this.splitPayments().length > 0
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

    this.posSaleService.createSale(salePayload).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.lastPrintedInvoice = res.data;
          this.lastPrintedItems = [...this.cart()];
          this.msg.success(`Sale ${res.data.sales_number} completed! Total: ৳ ${this.finalPrice().toFixed(2)}`);

          if (this.quickPrint) {
            this.isReceiptModalVisible = true;
          }

          this.cart.set([]);
          this.tendered.set(0);
          this.splitPayments.set([]);
          this.globalDiscountValue.set(0);
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
