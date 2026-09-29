import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
import { ProductService } from '../../core/services/product.service';
import { PosSaleService, CreateSaleReturnPayload } from '../../core/services/pos-sale.service';
import { Customer } from '../../core/models/customer.models';
import { Product } from '../../core/models/product.models';

interface ReturnLine {
  id: string;
  productNo: number;
  name: string;
  box: number;
  qtyBox: number;
  totalQty: number;
  salePrice: number;
  expiryDate: string;
  minQty: number;
  total: number;
}

@Component({
  selector: 'app-sale-return',
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
    <div class="space-y-4">
      <app-page-header
        title="Customer Sales Return"
        subtitle="Process customer medicine returns, stock restorations, and cash refunds"
        formId="SALE_1405"
        [breadcrumbs]="[{ label: 'POS Terminal', url: '/customer/sale' }, { label: 'Sale Return' }]"
      >
        <div actions class="flex items-center gap-2">
          <a nz-button nzType="default" routerLink="/customer/sales" class="rounded-md">
            <span nz-icon nzType="history"></span> View Sales Records
          </a>
        </div>
      </app-page-header>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Left: Line Entry + Return Lines -->
        <div class="xl:col-span-2 space-y-4">
          <!-- Return Item Entry Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 class="font-semibold text-slate-800 text-sm mb-3">Return Item Entry</h3>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="col-span-2">
                <label class="text-xs font-medium text-slate-600 block mb-1">Product *</label>
                <div class="flex gap-1.5">
                  <nz-select
                    nzShowSearch
                    nzPlaceHolder="Search product to return..."
                    [(ngModel)]="selectedProductNo"
                    (ngModelChange)="onProductSelect($event)"
                    class="flex-1"
                  >
                    @for (p of availableProducts(); track p.product_no) {
                      <nz-option [nzValue]="p.product_no" [nzLabel]="p.product_name"></nz-option>
                    }
                  </nz-select>
                  <button
                    type="button"
                    (click)="isProductModalOpen = true"
                    nz-tooltip
                    nzTooltipTitle="Quick Add Product"
                    class="btn-quick-add"
                  >
                    <span nz-icon nzType="plus"></span>
                  </button>
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">Box</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0"
                  [(ngModel)]="currentLine.box"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">Sale Price (৳)</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0.00"
                  [(ngModel)]="currentLine.salePrice"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">QTY/Box</label>
                <input
                  type="number"
                  nz-input
                  placeholder="10"
                  [(ngModel)]="currentLine.qtyBox"
                  class="rounded-md"
                />
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">Total QTY (Pcs)</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0"
                  [(ngModel)]="currentLine.totalQty"
                  class="rounded-md"
                  (keyup.enter)="addLine()"
                />
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  nz-input
                  [(ngModel)]="currentLine.expiryDate"
                  class="rounded-md"
                />
              </div>

              <div>
                <label class="text-xs font-medium text-slate-600 block mb-1">MIN QTY</label>
                <input
                  type="number"
                  nz-input
                  placeholder="0"
                  [(ngModel)]="currentLine.minQty"
                  class="rounded-md"
                />
              </div>
            </div>

            <div class="mt-4">
              <button
                type="button"
                nz-button
                nzType="primary"
                (click)="addLine()"
                class="rounded-md"
              >
                + Add Return Line (Enter)
              </button>
            </div>
          </div>

          <!-- Return Lines Table -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 class="font-semibold text-slate-800 text-sm">Return Items</h3>
              <span class="text-xs text-slate-500 font-mono">
                {{ lines().length }} item(s) returned
              </span>
            </div>

            <div class="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table class="w-full text-sm text-left border-collapse">
                <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                  <tr>
                    <th class="p-3">Product</th>
                    <th class="p-3 text-center">Box</th>
                    <th class="p-3 text-center">Total QTY</th>
                    <th class="p-3 text-right">Sale Price</th>
                    <th class="p-3 text-right">Refund Total</th>
                    <th class="p-3 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  @for (l of lines(); track l.id; let idx = $index) {
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="p-3 font-semibold text-slate-900 text-xs">
                        {{ l.name }}
                        @if (l.expiryDate) {
                          <span class="block text-[11px] text-slate-400 font-normal">Exp: {{ l.expiryDate }}</span>
                        }
                      </td>
                      <td class="p-3 text-center font-mono text-xs">{{ l.box }}</td>
                      <td class="p-3 text-center font-mono text-xs font-semibold text-slate-700">{{ l.totalQty }} pcs</td>
                      <td class="p-3 text-right font-mono text-xs">৳ {{ l.salePrice.toFixed(2) }}</td>
                      <td class="p-3 text-right font-mono text-xs font-bold text-rose-600">
                        ৳ {{ l.total.toFixed(2) }}
                      </td>
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          (click)="removeLine(idx)"
                          nz-tooltip
                          nzTooltipTitle="Remove Item"
                          class="btn-tbl-action btn-tbl-delete inline-flex"
                        >
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
                        No return items added yet. Select medicine above and specify quantity to refund.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="table-sticky-footer bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Items: <strong class="text-slate-800 font-mono">{{ lines().length }}</strong></span>
              <div class="flex items-center gap-4 font-mono">
                <span>Total Refund Price: <strong class="text-rose-600 font-bold">৳ {{ grossTotal() | number: '1.2-2' }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Return Summary Card -->
        <div>
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sticky top-4 space-y-4">
            <h3 class="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Return Summary
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Total Items:</span>
                <span class="font-mono font-medium">{{ lines().length }}</span>
              </div>

              <div class="flex justify-between text-sm border-b border-slate-100 pb-3">
                <span class="text-slate-600">Total Price:</span>
                <span class="font-mono font-bold text-slate-900">৳ {{ grossTotal().toFixed(2) }}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span class="text-sm font-medium text-slate-700">Deduct Discount</span>
                <label nz-checkbox [(ngModel)]="discountEnabled"></label>
              </div>

              @if (discountEnabled) {
                <div>
                  <label class="text-xs font-semibold text-slate-600 block mb-1">Discount Deduction (৳)</label>
                  <input
                    type="number"
                    nz-input
                    [(ngModel)]="discountAmount"
                    class="rounded-md"
                  />
                </div>
              }

              <div class="py-2.5 px-3 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center">
                <span class="text-sm font-bold text-slate-800">Final Refund Amount</span>
                <span class="font-mono font-bold text-rose-600 text-base">
                  ৳ {{ finalRefund().toFixed(2) }}
                </span>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  Paid (Cash Refunded ৳)
                </label>
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="paidRefund"
                  class="rounded-md font-mono"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Customer</label>
                <div class="flex gap-1.5">
                  <nz-select nzShowSearch [(ngModel)]="selectedCustomer" class="flex-1" nzPlaceHolder="Select customer...">
                    @for (c of customers(); track c.customer_no) {
                      <nz-option [nzValue]="c.customer_no" [nzLabel]="c.name + (c.phone ? ' (' + c.phone + ')' : '')"></nz-option>
                    }
                  </nz-select>
                  <button
                    type="button"
                    (click)="isCustomerModalOpen = true"
                    nz-tooltip
                    nzTooltipTitle="Quick Add Customer"
                    class="btn-quick-add"
                  >
                    <span nz-icon nzType="plus"></span>
                  </button>
                </div>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Inventory Action</label>
                <nz-select [(ngModel)]="inventoryType" class="w-full">
                  <nz-option nzValue="CUSTOMER RETURNED" nzLabel="CUSTOMER RETURNED (Restock)"></nz-option>
                  <nz-option nzValue="DAMAGED / EXPIRED" nzLabel="DAMAGED / EXPIRED (Write-off)"></nz-option>
                </nz-select>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">
                  Original Invoice Number <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  nz-input
                  placeholder="e.g. INV-2026-1028"
                  [(ngModel)]="originalInvoice"
                  class="rounded-md"
                />
              </div>

              <button
                type="button"
                nz-button
                nzDanger
                nzType="primary"
                nzBlock
                (click)="processReturn()"
                class="rounded-lg h-10 font-medium"
              >
                <span nz-icon nzType="rollback"></span> ↩ Process Return & Refund
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Customer Modal -->
    <nz-modal
      [(nzVisible)]="isCustomerModalOpen"
      nzTitle="Quick Add Customer"
      nzOkText="Register Customer"
      (nzOnCancel)="isCustomerModalOpen = false"
      (nzOnOk)="saveCustomer()"
      nzWidth="500px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
            <input type="text" nz-input placeholder="e.g. Rafiqul Islam" [(ngModel)]="newCustomerName" class="rounded-md" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
            <input type="text" nz-input placeholder="e.g. +8801700000000" [(ngModel)]="newCustomerPhone" class="rounded-md" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Address / Note</label>
            <input type="text" nz-input placeholder="e.g. Cumilla" [(ngModel)]="newCustomerAddress" class="rounded-md" />
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Product Modal -->
    <nz-modal
      [(nzVisible)]="isProductModalOpen"
      nzTitle="Quick Add Product"
      nzOkText="Add Product"
      (nzOnCancel)="isProductModalOpen = false"
      (nzOnOk)="saveProduct()"
      nzWidth="500px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
            <input type="text" nz-input placeholder="e.g. Napa 500mg" [(ngModel)]="newProductName" class="rounded-md" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
            <input type="text" nz-input placeholder="e.g. Paracetamol" [(ngModel)]="newProductGeneric" class="rounded-md" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Default Sale Price (৳)</label>
            <input type="number" nz-input placeholder="0.00" [(ngModel)]="newProductPrice" class="rounded-md" />
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class SaleReturnComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly route = inject(ActivatedRoute);

  customers = signal<Customer[]>([]);
  availableProducts = signal<Product[]>([]);
  selectedCustomer: number | null = null;
  selectedProductNo: number | null = null;

  // Customer modal
  isCustomerModalOpen = false;
  newCustomerName = '';
  newCustomerPhone = '';
  newCustomerAddress = '';

  // Product modal
  isProductModalOpen = false;
  newProductName = '';
  newProductGeneric = '';
  newProductPrice = 0;

  lines = signal<ReturnLine[]>([]);

  currentLine = {
    productNo: 0,
    name: '',
    box: 1,
    qtyBox: 10,
    totalQty: 10,
    salePrice: 0,
    expiryDate: '',
    minQty: 0,
  };

  discountEnabled = false;
  discountAmount = 0;
  paidRefund = 0;
  inventoryType = 'CUSTOMER RETURNED';
  originalInvoice = '';
  isSubmitting = signal(false);

  ngOnInit(): void {
    const invParam = this.route.snapshot.queryParamMap.get('invoice');
    if (invParam) {
      this.originalInvoice = invParam;
    }
    this.loadCustomers();
    this.loadProducts();
  }


  loadCustomers(): void {
    this.customerService.getCustomers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.customers.set([...res.data.items]);
          if (res.data.items.length > 0 && !this.selectedCustomer) {
            this.selectedCustomer = res.data.items[0].customer_no;
          }
        }
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 150 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.availableProducts.set([...res.data.items]);
        }
      },
    });
  }

  onProductSelect(productNo: number): void {
    const prod = this.availableProducts().find(p => p.product_no === productNo);
    if (prod) {
      this.currentLine.productNo = prod.product_no;
      this.currentLine.name = prod.product_name;
      this.currentLine.salePrice = Number(prod.sale_price_per_piece) || Number(prod.purchase_price_per_piece) || 0;
      this.currentLine.qtyBox = prod.quantity_per_box || 10;
      this.currentLine.totalQty = (this.currentLine.box || 1) * this.currentLine.qtyBox;
    }
  }

  grossTotal = computed(() => {
    return this.lines().reduce((acc, curr) => acc + curr.total, 0);
  });

  finalRefund = computed(() => {
    const gross = this.grossTotal();
    if (!this.discountEnabled) return gross;
    return Math.max(0, gross - (Number(this.discountAmount) || 0));
  });

  addLine(): void {
    if (!this.currentLine.name || !this.currentLine.productNo) {
      this.msg.warning('Please select a product to return');
      return;
    }
    const qty = Number(this.currentLine.totalQty) || (Number(this.currentLine.box) * Number(this.currentLine.qtyBox)) || 1;
    const price = Number(this.currentLine.salePrice) || 0;
    const lineTotal = qty * price;

    const newLine: ReturnLine = {
      id: Date.now().toString(),
      productNo: this.currentLine.productNo,
      name: this.currentLine.name,
      box: Number(this.currentLine.box) || 1,
      qtyBox: Number(this.currentLine.qtyBox) || 10,
      totalQty: qty,
      salePrice: price,
      expiryDate: this.currentLine.expiryDate,
      minQty: Number(this.currentLine.minQty) || 0,
      total: lineTotal,
    };

    this.lines.update(items => [...items, newLine]);
    this.paidRefund = this.finalRefund();
    this.msg.success(`Added return line for ${newLine.name}`);

    // reset
    this.selectedProductNo = null;
    this.currentLine = {
      productNo: 0,
      name: '',
      box: 1,
      qtyBox: 10,
      totalQty: 10,
      salePrice: 0,
      expiryDate: '',
      minQty: 0,
    };
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
    this.paidRefund = this.finalRefund();
  }

  processReturn(): void {
    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one item to return');
      return;
    }
    if (!this.originalInvoice.trim()) {
      this.msg.warning('Please provide the original invoice reference');
      return;
    }

    this.isSubmitting.set(true);
    const payload: CreateSaleReturnPayload = {
      original_invoice_no: this.originalInvoice.trim(),
      customer_no: this.selectedCustomer || 1,
      return_amount: this.finalRefund(),
      refund_method: 'Cash',
      items: this.lines().map(l => ({
        product_no: l.productNo,
        return_qty: l.totalQty,
        unit_price: l.salePrice,
        total_price: l.total,
      })),
    };

    this.posSaleService.createSaleReturn(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.msg.success(
          `Return for ${this.originalInvoice} processed successfully! Refund of ৳ ${this.finalRefund().toFixed(2)} recorded.`
        );
        this.lines.set([]);
        this.originalInvoice = '';
        this.paidRefund = 0;
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.msg.error(err?.error?.message || 'Failed to process sale return');
      },
    });
  }

  saveCustomer(): void {
    if (!this.newCustomerName.trim()) {
      this.msg.warning('Please enter customer name');
      return;
    }
    this.customerService.createCustomer({
      name: this.newCustomerName.trim(),
      phone: this.newCustomerPhone.trim(),
      address: this.newCustomerAddress.trim(),
    }).subscribe({
      next: (res) => {
        const createdCustomer = res.data;
        if (createdCustomer) {
          this.customers.update(list => [createdCustomer, ...list]);
          this.selectedCustomer = createdCustomer.customer_no;
          this.msg.success(`Customer "${createdCustomer.name}" registered and selected!`);
        }
        this.newCustomerName = '';
        this.newCustomerPhone = '';
        this.newCustomerAddress = '';
        this.isCustomerModalOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create customer');
      },
    });
  }

  saveProduct(): void {
    if (!this.newProductName.trim()) {
      this.msg.warning('Please enter brand name');
      return;
    }
    this.productService.createProduct({
      product_name: this.newProductName.trim(),
      sale_price_per_piece: this.newProductPrice || 0,
      purchase_price_per_piece: this.newProductPrice ? this.newProductPrice * 0.85 : 0,
    }).subscribe({
      next: (res) => {
        const createdProduct = res.data;
        if (createdProduct) {
          this.availableProducts.update(list => [createdProduct, ...list]);
          this.selectedProductNo = createdProduct.product_no;
          this.onProductSelect(createdProduct.product_no);
          this.msg.success(`Product "${createdProduct.product_name}" added and selected!`);
        }
        this.newProductName = '';
        this.newProductGeneric = '';
        this.newProductPrice = 0;
        this.isProductModalOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to quick-add product');
      },
    });
  }
}
