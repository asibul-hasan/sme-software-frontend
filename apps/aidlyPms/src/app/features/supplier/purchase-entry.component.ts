import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  PURCHASE_CALC_MODE_OPTIONS,
  INVENTORY_TYPE_OPTIONS,
  DiscountType,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
} from '../../shared/constants/label-values.constant';

interface PurchaseLine {
  id: string;
  product: string;
  barcode?: string;
  box: number;
  qtyBox: number;
  totalQtyPcs: number;
  btpVat: number;
  salePrice: number;
  freeQty: number;
  expiryDate: string;
  total: number;
}

interface SupplierOption {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

@Component({
  selector: 'app-purchase-entry',
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
    <div class="h-[calc(100vh-100px)] flex flex-col space-y-2.5">
      <app-page-header
        title="Purchase"
        subtitle="Record inventory intake from suppliers with batch and pricing details"
        formId="PUR_1503"
        [breadcrumbs]="[{ label: 'Suppliers', url: '/supplier/list' }, { label: 'Purchase' }]"
      >
        <div actions class="flex items-center justify-between gap-3 w-full flex-nowrap">
          <div class="flex items-center gap-3">
            <!-- Navigation Links -->
            <div class="flex items-center gap-2 text-xs text-slate-500 mr-2">
              <a routerLink="/supplier/records" class="theme-link">
                Record
              </a>
              <span>|</span>
              <a routerLink="/supplier/list" class="theme-link">
                Supplier list
              </a>
              <span>|</span>
              <span
                nz-icon
                nzType="question-circle"
                class="text-slate-400 cursor-pointer"
                nz-tooltip
                nzTooltipTitle="F2: Add Product, Enter: Add Line, Mode: calculation method"
              ></span>
            </div>

            <!-- Calculation Mode Dropdown Pill directly in Header -->
            <div class="flex items-center">
              <nz-select
                [(ngModel)]="calcMode"
                class="w-40"
                nzTooltipTitle="Calculation Formula Mode"
                nz-tooltip
              >
                @for (opt of calcModeOptions; track opt.value) {
                  <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                }
              </nz-select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500 hidden sm:inline">
              <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">F2</kbd> Quick Product
            </span>
          </div>
        </div>
      </app-page-header>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        <!-- LEFT PANEL: Entry Form + Purchase Lines (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-3 min-h-0">
          
          <!-- Product Entry Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-4 shrink-0">
            <!-- Row 1: Product, Box, BTP+VAT, Sale Price -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2.5">
              <div class="md:col-span-6">
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  Product <span class="text-rose-500">*</span>
                </label>
                <div class="flex gap-1.5">
                  <nz-select
                    nzShowSearch
                    nzPlaceHolder="Please select product"
                    [(ngModel)]="currentLine.product"
                    (ngModelChange)="onProductSelected($event)"
                    (nzOnSearch)="onProductSearch($event)"
                    (keyup.enter)="onProductEnterKey()"
                    class="flex-1"
                  >
                    @for (p of availableProducts; track p.name) {
                      <nz-option [nzValue]="p.name" [nzLabel]="p.name + ' (' + p.generic + ')'"></nz-option>
                    }
                  </nz-select>
                  <button
                    type="button"
                    nz-button
                    nzType="primary"
                    (click)="openNewProductModal()"
                    nz-tooltip
                    nzTooltipTitle="Quick Add Product (F2)"
                    class="btn-quick-add"
                  >
                    <span nz-icon nzType="plus"></span>
                  </button>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  Box <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  placeholder="1"
                  [(ngModel)]="currentLine.box"
                  (ngModelChange)="onBoxOrQtyChange()"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  BTP + VAT (৳) <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="currentLine.btpVat"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">Sale Price (৳)</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="currentLine.salePrice"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>
            </div>

            <!-- Row 2: QTY in Box, Total QTY (pcs), Expiry Date, Barcode Value, Add Button -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  QTY In Box <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  placeholder="10"
                  [(ngModel)]="currentLine.qtyBox"
                  (ngModelChange)="onBoxOrQtyChange()"
                  class="rounded-md"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  Total QTY: <span class="text-slate-400 font-normal">(pcs)</span> <span class="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  nz-input
                  placeholder="10"
                  [(ngModel)]="currentLine.totalQtyPcs"
                  class="rounded-md font-mono"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">Free</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0"
                  [(ngModel)]="currentLine.freeQty"
                  class="rounded-md"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  nz-input
                  [(ngModel)]="currentLine.expiryDate"
                  class="rounded-md"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs font-semibold text-slate-700 block mb-1">Barcode Value</label>
                <input
                  type="text"
                  nz-input
                  placeholder="Scan / code"
                  [(ngModel)]="currentLine.barcode"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs block mb-1 text-slate-500 truncate">
                  <span class="text-rose-600 font-bold">Press Enter</span> / Click:
                </label>
                <button
                  type="button"
                  nz-button
                  nzType="primary"
                  (click)="addLine()"
                  class="w-full rounded-md font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <!-- Purchase Lines Table Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
            <div class="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 class="font-semibold text-slate-800 text-xs uppercase tracking-wider">Purchase Items</h3>
              <span class="text-xs text-slate-500 font-mono">
                {{ lines().length }} item(s) in batch
              </span>
            </div>

            <div class="flex-1 overflow-y-auto min-h-[140px]">
              <table class="w-full text-sm text-left border-collapse">
                <thead class="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th class="p-2.5">Details</th>
                    <th class="p-2.5 text-center">Box</th>
                    <th class="p-2.5 text-center">QTY In Box</th>
                    <th class="p-2.5 text-center">Total QTY</th>
                    <th class="p-2.5 text-right">BTP + Vat</th>
                    <th class="p-2.5 text-right">Sale Price</th>
                    <th class="p-2.5 text-right">Total Price</th>
                    <th class="p-2.5 text-center">Free</th>
                    <th class="p-2.5 text-center">Exp Date</th>
                    <th class="p-2.5 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  @for (l of lines(); track l.id; let idx = $index) {
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="p-2.5 font-semibold text-slate-900 text-xs">
                        {{ l.product }}
                        <div class="flex items-center gap-2 mt-0.5">
                          @if (l.barcode) {
                            <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              #{{ l.barcode }}
                            </span>
                          }
                          @if (l.expiryDate) {
                            <span class="text-[11px] text-slate-400 font-normal">
                              Exp: {{ l.expiryDate }}
                            </span>
                          }
                        </div>
                      </td>
                      <td class="p-2.5 text-center font-mono text-xs">{{ l.box }}</td>
                      <td class="p-2.5 text-center font-mono text-xs">{{ l.qtyBox }}</td>
                      <td class="p-2.5 text-center font-mono text-xs font-bold text-slate-700">{{ l.totalQtyPcs }} pcs</td>
                      <td class="p-2.5 text-right font-mono text-xs">৳ {{ l.btpVat.toFixed(2) }}</td>
                      <td class="p-2.5 text-right font-mono text-xs">৳ {{ l.salePrice.toFixed(2) }}</td>
                      <td class="p-2.5 text-right font-mono text-xs font-bold theme-total-text">
                        ৳ {{ l.total.toLocaleString() }}
                      </td>
                      <td class="p-2.5 text-center font-mono text-xs text-slate-500">
                        {{ l.freeQty || 0 }}
                      </td>
                      <td class="p-2.5 text-center font-mono text-xs text-slate-500">
                        {{ l.expiryDate || '-' }}
                      </td>
                      <td class="p-2.5 text-center">
                        <button
                          type="button"
                          (click)="removeLine(idx)"
                          nz-tooltip
                          nzTooltipTitle="Remove Line Item"
                          class="btn-tbl-action btn-tbl-delete inline-flex"
                        >
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="10" class="p-8 text-center text-slate-400 text-xs">
                        No product lines entered yet. Fill the inputs above and click "Add".
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Sticky Bottom Footer -->
            <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
              <div class="flex items-center gap-3">
                <span>Items: <strong class="text-slate-900 font-mono font-semibold">{{ lines().length }}</strong></span>
                <span class="text-slate-300">|</span>
                <span>Total Quantity: <strong class="text-slate-900 font-mono font-semibold">{{ totalQuantityPcs() }} pcs</strong></span>
                <span class="text-slate-300">|</span>
                <span class="font-semibold text-slate-700">Total Purchase Price: <strong class="theme-total-text font-mono text-sm">৳ {{ grossTotal() | number: '1.2-2' }}</strong></span>
              </div>
              <span class="text-slate-400 font-mono text-[11px]">Batch Intake</span>
            </div>
          </div>
        </div>

        <!-- Right: Checkout & Purchase Summary Drawer -->
        <div class="lg:col-span-4 flex flex-col min-h-0 overflow-y-auto">
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
            <h3 class="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2.5">
              Purchase Summary
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Total items:</span>
                <span class="font-mono font-medium">{{ lines().length }}</span>
              </div>

              <div class="flex justify-between text-sm border-b border-slate-100 pb-2.5">
                <span class="text-slate-600">Total price:</span>
                <span class="font-mono font-bold text-slate-900 text-base">
                  ৳ {{ grossTotal().toLocaleString() }}
                </span>
              </div>

              <!-- Discount with Flat / % toggle -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700">Discount</span>
                  <div class="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                    <button
                      type="button"
                      (click)="discountType = DiscountType.Flat"
                      class="px-2 py-0.5 text-[11px] rounded border-0 cursor-pointer font-medium"
                      [class.bg-white]="discountType === DiscountType.Flat"
                      [class.shadow-xs]="discountType === DiscountType.Flat"
                      [class.text-slate-800]="discountType === DiscountType.Flat"
                      [class.text-slate-500]="discountType !== DiscountType.Flat"
                    >
                      Flat
                    </button>
                    <button
                      type="button"
                      (click)="discountType = DiscountType.Percentage"
                      class="px-2 py-0.5 text-[11px] rounded border-0 cursor-pointer font-medium"
                      [class.bg-white]="discountType === DiscountType.Percentage"
                      [class.shadow-xs]="discountType === DiscountType.Percentage"
                      [class.text-slate-800]="discountType === DiscountType.Percentage"
                      [class.text-slate-500]="discountType !== DiscountType.Percentage"
                    >
                      %
                    </button>
                  </div>
                </div>
                <div class="relative">
                  <input
                    type="number"
                    nz-input
                    placeholder="0"
                    [(ngModel)]="discountValue"
                    class="rounded-md font-mono text-right"
                  />
                </div>
              </div>

              <div class="flex justify-between py-2 theme-highlight-card rounded-lg px-3">
                <span class="text-sm font-bold theme-highlight-title">Final price:</span>
                <span class="font-mono font-bold theme-total-text text-base">
                  ৳ {{ finalPrice().toLocaleString() }}
                </span>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Paid:</label>
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="paidAmount"
                  class="rounded-md font-mono bg-sky-50/50 border-sky-200 focus:bg-white"
                />
              </div>

              <div
                class="flex justify-between py-2 rounded-lg px-3 border"
                [ngClass]="balanceDue() > 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'"
              >
                <span class="text-xs font-semibold">
                  {{ balanceDue() > 0 ? 'Balance Due:' : 'Surplus / Change:' }}
                </span>
                <span class="font-mono font-bold text-sm">
                  ৳ {{ Math.abs(balanceDue()).toLocaleString() }}
                </span>
              </div>

              <!-- Vendor Info Section -->
              <div class="pt-2 border-t border-slate-100">
                <div class="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                  Vendor Info
                </div>

                <div class="space-y-2.5">
                  <div>
                    <label class="text-xs font-semibold text-slate-700 block mb-1">Choose supplier: *</label>
                    <div class="flex gap-2">
                      <nz-select
                        nzShowSearch
                        [(ngModel)]="selectedSupplier"
                        nzPlaceHolder="Select supplier"
                        class="flex-1"
                      >
                        @for (sup of suppliers(); track sup.id) {
                          <nz-option [nzValue]="sup.name" [nzLabel]="sup.name"></nz-option>
                        }
                      </nz-select>
                      <button
                        type="button"
                        nz-button
                        nzType="primary"
                        (click)="openQuickAddSupplier()"
                        nz-tooltip
                        nzTooltipTitle="Quick Add Supplier"
                        class="btn-quick-add"
                      >
                        <span nz-icon nzType="plus"></span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-slate-700 block mb-1">Inventory type:</label>
                    <nz-select [(ngModel)]="inventoryType" class="w-full">
                      @for (t of inventoryTypeOptions; track t.value) {
                        <nz-option [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
                      }
                    </nz-select>
                  </div>

                  <div>
                    <label class="text-xs font-semibold text-slate-700 block mb-1">Invoice number:</label>
                    <input
                      type="text"
                      nz-input
                      placeholder="Vendor invoice / challan #"
                      [(ngModel)]="invoiceNumber"
                      class="rounded-md"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                nz-button
                nzType="primary"
                nzBlock
                (click)="completePurchase()"
                class="rounded-lg h-10 font-bold text-sm mt-2"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Product Modal -->
    <nz-modal
      [(nzVisible)]="isQuickProductOpen"
      nzTitle="Quick Add New Product"
      nzOkText="Add Product"
      (nzOnCancel)="isQuickProductOpen = false"
      (nzOnOk)="saveQuickProduct()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Product Brand Name *</label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Napa Extra 500mg"
              [(ngModel)]="quickProductName"
              class="rounded-md"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Generic Formulation</label>
            <div class="flex gap-1.5">
              <nz-select
                nzShowSearch
                nzAllowClear
                nzPlaceHolder="Select generic..."
                [(ngModel)]="quickProductGeneric"
                class="flex-1"
              >
                @for (g of genericsList; track g) {
                  <nz-option [nzValue]="g" [nzLabel]="g"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isQuickGenericOpen = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Generic"
                class="btn-quick-add"
              >
                <span nz-icon nzType="plus"></span>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Company</label>
            <div class="flex gap-1.5">
              <nz-select
                nzShowSearch
                nzAllowClear
                nzPlaceHolder="Select company..."
                [(ngModel)]="quickProductCompany"
                class="flex-1"
              >
                @for (c of companiesList; track c) {
                  <nz-option [nzValue]="c" [nzLabel]="c"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isQuickCompanyOpen = true"
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
              <label class="block text-xs font-semibold text-slate-700 mb-1">Default Box QTY</label>
              <input
                type="number"
                nz-input
                placeholder="10"
                [(ngModel)]="quickProductQtyBox"
                class="rounded-md"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Default BTP + VAT (৳)</label>
              <input
                type="number"
                nz-input
                placeholder="0.00"
                [(ngModel)]="quickProductBtp"
                class="rounded-md"
              />
            </div>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Generic Sub-Modal for Purchase -->
    <nz-modal
      [(nzVisible)]="isQuickGenericOpen"
      nzTitle="Quick Add Generic Formulation"
      nzOkText="Add Generic"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isQuickGenericOpen = false"
      (nzOnOk)="saveQuickGeneric()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Esomeprazole Magnesium"
            [(ngModel)]="newQuickGeneric"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Company Sub-Modal for Purchase -->
    <nz-modal
      [(nzVisible)]="isQuickCompanyOpen"
      nzTitle="Quick Add Manufacturer Company"
      nzOkText="Add Company"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isQuickCompanyOpen = false"
      (nzOnOk)="saveQuickCompany()"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Renata Limited"
            [(ngModel)]="newQuickCompany"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Supplier Modal -->
    <nz-modal
      [(nzVisible)]="isQuickSupplierOpen"
      nzTitle="Quick Add Supplier"
      nzOkText="Save Supplier"
      [nzCentered]="true"
      [nzWidth]="480"
      (nzOnCancel)="isQuickSupplierOpen = false"
      (nzOnOk)="saveQuickSupplier()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Supplier Company Name *</label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Square Pharmaceuticals Ltd."
              [(ngModel)]="quickSupplierName"
              class="rounded-md"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="text"
              nz-input
              placeholder="e.g. +8801700000000"
              [(ngModel)]="quickSupplierPhone"
              class="rounded-md"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Address / Depot</label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Tejgaon I/A, Dhaka"
              [(ngModel)]="quickSupplierAddress"
              class="rounded-md"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class PurchaseEntryComponent {
  private readonly msg = inject(NzMessageService);
  readonly Math = Math;
  readonly DiscountType = DiscountType;

  calcModeOptions = PURCHASE_CALC_MODE_OPTIONS;
  inventoryTypeOptions = INVENTORY_TYPE_OPTIONS;

  calcMode = 1; // Default
  inventoryType = 1; // INVENTORY PURCHASED
  selectedSupplier = 'Beximco Distribution Ltd.';
  invoiceNumber = '';

  suppliers = signal<SupplierOption[]>([
    { id: '1', name: 'Beximco Distribution Ltd.', phone: '+8801711001122', address: 'Tongi, Gazipur' },
    { id: '2', name: 'ACI Pharma Distributors', phone: '+8801711334455', address: 'Tejgaon, Dhaka' },
    { id: '3', name: 'Square Dist. Network', phone: '+8801711556677', address: 'Uttara, Dhaka' },
    { id: '4', name: 'Incepta Healthcare Dist.', phone: '+8801711778899', address: 'Savar, Dhaka' },
  ]);

  availableProducts = [
    { name: 'Napa 500mg Tablet', generic: 'Paracetamol', btp: 4.5, sale: 10.0, qtyBox: 10, barcode: '894100101' },
    { name: 'Seclo 20mg Capsule', generic: 'Omeprazole', btp: 65.0, sale: 180.0, qtyBox: 10, barcode: '894100102' },
    { name: 'Sergel 20mg Capsule', generic: 'Esomeprazole', btp: 70.0, sale: 200.0, qtyBox: 10, barcode: '894100103' },
    { name: 'Ace 500mg Tablet', generic: 'Paracetamol', btp: 4.2, sale: 9.5, qtyBox: 10, barcode: '894100104' },
    { name: 'Ceevit 250mg Chewable', generic: 'Ascorbic Acid', btp: 18.0, sale: 45.0, qtyBox: 10, barcode: '894100105' },
    { name: 'Monas 10mg Tablet', generic: 'Montelukast', btp: 120.0, sale: 250.0, qtyBox: 10, barcode: '894100106' },
    { name: 'Maxpro 20mg Capsule', generic: 'Esomeprazole', btp: 68.0, sale: 190.0, qtyBox: 10, barcode: '894100107' },
    { name: 'Amodis 400mg Tablet', generic: 'Metronidazole', btp: 22.0, sale: 55.0, qtyBox: 10, barcode: '894100108' },
  ];

  lines = signal<PurchaseLine[]>([
    {
      id: '1',
      product: 'Napa 500mg Tablet',
      barcode: '894100101',
      box: 10,
      qtyBox: 10,
      totalQtyPcs: 100,
      btpVat: 4.5,
      salePrice: 10.0,
      freeQty: 0,
      expiryDate: '2027-08-31',
      total: 450,
    },
    {
      id: '2',
      product: 'Seclo 20mg Capsule',
      barcode: '894100102',
      box: 5,
      qtyBox: 10,
      totalQtyPcs: 50,
      btpVat: 65.0,
      salePrice: 180.0,
      freeQty: 0,
      expiryDate: '2028-01-31',
      total: 3250,
    },
  ]);

  currentLine = {
    product: '',
    barcode: '',
    box: 1,
    qtyBox: 10,
    totalQtyPcs: 10,
    btpVat: 0,
    salePrice: 0,
    freeQty: 0,
    expiryDate: '',
  };

  discountType: number = DiscountType.Flat;
  discountValue = 0;
  paidAmount = 4000;

  grossTotal = computed(() => {
    return this.lines().reduce((sum, item) => sum + item.total, 0);
  });

  totalQuantityPcs = computed(() => {
    return this.lines().reduce((sum, item) => sum + (item.totalQtyPcs || 0), 0);
  });

  finalPrice = computed(() => {
    const gross = this.grossTotal();
    const val = Number(this.discountValue) || 0;
    if (val <= 0) return gross;
    if (this.discountType === DiscountType.Flat) {
      return Math.max(0, gross - val);
    } else {
      return Math.max(0, gross - (gross * val) / 100);
    }
  });

  balanceDue = computed(() => {
    return this.finalPrice() - (Number(this.paidAmount) || 0);
  });

  // Quick Product Modal
  isQuickProductOpen = false;
  quickProductName = '';
  quickProductGeneric = '';
  quickProductCompany = '';
  quickProductQtyBox = 10;
  quickProductBtp = 0;

  // Quick Supplier Modal
  isQuickSupplierOpen = false;
  quickSupplierName = '';
  quickSupplierPhone = '';
  quickSupplierAddress = '';

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      this.openNewProductModal();
    }
  }

  currentSearchTerm = '';

  onProductSearch(term: string): void {
    this.currentSearchTerm = term || '';
  }

  onProductEnterKey(): void {
    if (!this.currentLine.product && this.currentSearchTerm) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.availableProducts.find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        p.barcode.toLowerCase() === term
      );
      if (match) {
        this.currentLine.product = match.name;
        this.onProductSelected(match.name);
      } else {
        this.currentLine.product = this.currentSearchTerm.trim();
      }
    }
    this.addLine();
  }

  onProductSelected(name: string): void {
    const p = this.availableProducts.find(item => item.name === name);
    if (p) {
      this.currentLine.btpVat = p.btp;
      this.currentLine.salePrice = p.sale;
      this.currentLine.qtyBox = p.qtyBox;
      this.currentLine.barcode = p.barcode;
      this.onBoxOrQtyChange();
    }
  }

  onBoxOrQtyChange(): void {
    const box = Number(this.currentLine.box) || 0;
    const qtyBox = Number(this.currentLine.qtyBox) || 0;
    this.currentLine.totalQtyPcs = box * qtyBox;
  }

  addLine(): void {
    if (!this.currentLine.product && this.currentSearchTerm.trim()) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.availableProducts.find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        p.barcode.toLowerCase() === term
      );
      if (match) {
        this.currentLine.product = match.name;
        this.onProductSelected(match.name);
      } else {
        this.currentLine.product = this.currentSearchTerm.trim();
      }
    }

    if (!this.currentLine.product) {
      this.msg.warning('Please select a product first');
      return;
    }
    const box = Number(this.currentLine.box) || 1;
    const btp = Number(this.currentLine.btpVat) || 0;
    const lineTotal = box * (btp > 0 ? btp : 10);

    const newLine: PurchaseLine = {
      id: Date.now().toString(),
      product: this.currentLine.product,
      barcode: this.currentLine.barcode,
      box,
      qtyBox: Number(this.currentLine.qtyBox) || 10,
      totalQtyPcs: Number(this.currentLine.totalQtyPcs) || (box * 10),
      btpVat: btp,
      salePrice: Number(this.currentLine.salePrice) || 0,
      freeQty: Number(this.currentLine.freeQty) || 0,
      expiryDate: this.currentLine.expiryDate,
      total: lineTotal,
    };

    this.lines.update(items => [...items, newLine]);
    this.msg.success(`Added ${newLine.product} (${newLine.box} boxes)`);

    // Reset line form
    this.currentLine = {
      product: '',
      barcode: '',
      box: 1,
      qtyBox: 10,
      totalQtyPcs: 10,
      btpVat: 0,
      salePrice: 0,
      freeQty: 0,
      expiryDate: '',
    };
    this.currentSearchTerm = '';
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
  }

  // Sub-Modals for Quick Product
  companiesList: string[] = [...DEFAULT_COMPANIES];
  genericsList: string[] = [...DEFAULT_GENERICS];
  isQuickGenericOpen = false;
  newQuickGeneric = '';
  isQuickCompanyOpen = false;
  newQuickCompany = '';

  openNewProductModal(): void {
    this.quickProductName = '';
    this.quickProductGeneric = this.genericsList[0] || 'Paracetamol';
    this.quickProductCompany = this.companiesList[0] || 'Beximco Pharmaceuticals Ltd.';
    this.quickProductQtyBox = 10;
    this.quickProductBtp = 0;
    this.isQuickProductOpen = true;
  }

  saveQuickGeneric(): void {
    if (!this.newQuickGeneric.trim()) {
      this.msg.warning('Please enter generic formulation');
      return;
    }
    const name = this.newQuickGeneric.trim();
    if (!this.genericsList.includes(name)) {
      this.genericsList = [...this.genericsList, name];
    }
    this.quickProductGeneric = name;
    this.newQuickGeneric = '';
    this.isQuickGenericOpen = false;
    this.msg.success(`Generic "${name}" added!`);
  }

  saveQuickCompany(): void {
    if (!this.newQuickCompany.trim()) {
      this.msg.warning('Please enter company name');
      return;
    }
    const name = this.newQuickCompany.trim();
    if (!this.companiesList.includes(name)) {
      this.companiesList = [...this.companiesList, name];
    }
    this.quickProductCompany = name;
    this.newQuickCompany = '';
    this.isQuickCompanyOpen = false;
    this.msg.success(`Company "${name}" added!`);
  }

  saveQuickProduct(): void {
    const name = this.quickProductName.trim();
    if (!name) {
      this.msg.error('Please enter product name');
      return;
    }
    const newProd = {
      name,
      generic: this.quickProductGeneric || 'General',
      btp: Number(this.quickProductBtp) || 10,
      sale: (Number(this.quickProductBtp) || 10) * 1.25,
      qtyBox: Number(this.quickProductQtyBox) || 10,
      barcode: Date.now().toString().slice(-8),
    };
    this.availableProducts.push(newProd);
    this.currentLine.product = name;
    this.onProductSelected(name);
    this.msg.success(`Product "${name}" added to list!`);
    this.isQuickProductOpen = false;
  }

  openQuickAddSupplier(): void {
    this.quickSupplierName = '';
    this.quickSupplierPhone = '';
    this.quickSupplierAddress = '';
    this.isQuickSupplierOpen = true;
  }

  saveQuickSupplier(): void {
    const name = this.quickSupplierName.trim();
    if (!name) {
      this.msg.error('Please enter supplier name');
      return;
    }
    const newSup: SupplierOption = {
      id: Date.now().toString(),
      name,
      phone: this.quickSupplierPhone,
      address: this.quickSupplierAddress,
    };
    this.suppliers.update(list => [...list, newSup]);
    this.selectedSupplier = name;
    this.msg.success(`Supplier "${name}" registered successfully!`);
    this.isQuickSupplierOpen = false;
  }

  completePurchase(): void {
    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one product line before purchasing.');
      return;
    }
    if (!this.selectedSupplier) {
      this.msg.warning('Please select a supplier.');
      return;
    }

    this.msg.success(
      `Purchase of ৳ ${this.finalPrice().toLocaleString()} from ${this.selectedSupplier} recorded successfully!`
    );
  }
}
