import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { SuppSupplier, PurPurchaseReturn, PurPurchaseReturnItem } from '../../core/models/supplier.models';
import { ProdProduct, ProdProductBatch } from '../../core/models/product.models';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

interface ReturnCartLine {
  productNo: number;
  productName: string;
  batchNo?: number | null;
  batchNumber: string;
  expiryDate?: string | null;
  availableStock: number;
  returnQty: number;
  unitCost: number;
  totalCost: number;
  reasonCode: number;
}

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzModalModule,
    PageHeaderComponent,
    MenuActionDirective,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Purchase Return & Vendor Debit Note"
        subtitle="Return defective, expired, or excess stock to pharmaceutical manufacturers and suppliers"
        formId="PUR_1508"
        [breadcrumbs]="[
          { label: 'Purchases', url: '/supplier/purchase' },
          { label: 'Purchase Returns' }
        ]"
      >
        <div actions class="flex items-center gap-2">
          <div class="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5">
            <button
              type="button"
              (click)="activeTab.set('entry')"
              [class]="activeTab() === 'entry' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5"
            >
              <i nz-icon nzType="plus-circle" nzTheme="outline"></i>
              New Return
            </button>
            <button
              type="button"
              (click)="activeTab.set('history'); loadHistory()"
              [class]="activeTab() === 'history' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5"
            >
              <i nz-icon nzType="history" nzTheme="outline"></i>
              Return History
            </button>
          </div>
        </div>
      </app-page-header>

      <!-- Tab 1: New Return Entry -->
      <div *ngIf="activeTab() === 'entry'" class="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        <!-- Left 8 Cols: Product Selection & Cart -->
        <div class="col-span-8 flex flex-col bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <!-- Selection Toolbar -->
          <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div class="w-1/3">
              <label for="purchase-return-select-supplier-1" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Supplier *</label>
              <nz-select id="purchase-return-select-supplier-1" nzId="purchase-return-select-supplier-1"
                [(ngModel)]="selectedSupplierNo"
                (ngModelChange)="onSupplierChange($event)"
                nzPlaceHolder="Search supplier..."
                class="w-full"
                nzShowSearch aria-label="Select Supplier">
                <nz-option
                  *ngFor="let s of suppliers()"
                  [nzValue]="s.supplier_no"
                  [nzLabel]="s.name + (s.current_due_balance > 0 ? ' (Due: ৳' + s.current_due_balance + ')' : '')"
                ></nz-option>
              </nz-select>
            </div>

            <div class="flex-1">
              <label for="purchase-return-add-product-by-name-or-barcode-2" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Add Product by Name or Barcode</label>
              <nz-select id="purchase-return-add-product-by-name-or-barcode-2" nzId="purchase-return-add-product-by-name-or-barcode-2"
                [(ngModel)]="selectedProductNo"
                (ngModelChange)="onProductSelect($event)"
                nzPlaceHolder="Type medicine name or scan barcode..."
                class="w-full"
                nzShowSearch
                [nzServerSearch]="true"
                (nzOnSearch)="searchProducts($event)" aria-label="Add Product by Name or Barcode">
                <nz-option
                  *ngFor="let p of productSearchResults()"
                  [nzValue]="p.product_no"
                  [nzLabel]="p.product_name + ' | TP: ৳' + (p.purchase_price_per_piece || 0) + ' | Stock: ' + (p.stock_qty || 0) + ' pcs'"
                ></nz-option>
              </nz-select>
            </div>
          </div>

          <!-- Return Lines Table -->
          <div class="flex-1 overflow-auto p-3 w-full max-w-full">
            <table class="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th class="p-2">#</th>
                  <th class="p-2">Product Name</th>
                  <th class="p-2">Batch #</th>
                  <th class="p-2 text-right">Available</th>
                  <th class="p-2 text-center w-24">Return Qty</th>
                  <th class="p-2 text-right">Unit TP</th>
                  <th class="p-2 text-right">Total (৳)</th>
                  <th class="p-2 w-32">Reason</th>
                  <th class="p-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let line of lines(); let idx = index" class="hover:bg-slate-50">
                  <td class="p-2 text-slate-400">{{ idx + 1 }}</td>
                  <td class="p-2 font-medium text-slate-800">{{ line.productName }}</td>
                  <td class="p-2">
                    <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600">
                      {{ line.batchNumber || 'N/A' }}
                    </span>
                  </td>
                  <td class="p-2 text-right font-mono text-slate-600">{{ line.availableStock }}</td>
                  <td class="p-2 text-center">
                    <input id="purchase-return-field-6"
                      type="number"
                      min="1"
                      [max]="line.availableStock > 0 ? line.availableStock : 9999"
                      aria-label="Return Quantity"
                      [(ngModel)]="line.returnQty"
                      (ngModelChange)="updateLineTotal(line)"
                      class="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded text-slate-800 focus:outline-indigo-500"
                    />
                  </td>
                  <td class="p-2 text-right font-mono text-slate-700">৳{{ line.unitCost | number:'1.2-2' }}</td>
                  <td class="p-2 text-right font-mono font-semibold text-indigo-700">৳{{ line.totalCost | number:'1.2-2' }}</td>
                  <td class="p-2">
                    <select
                      [(ngModel)]="line.reasonCode"
                      class="w-full text-[11px] px-1 py-1 border border-slate-200 rounded text-slate-700 bg-white"
                    >
                      <option [ngValue]="1">Damaged / Broken</option>
                      <option [ngValue]="2">Expired Batch</option>
                      <option [ngValue]="3">Near Expiry / Slow</option>
                      <option [ngValue]="4">Supplier Recall</option>
                      <option [ngValue]="5">Incorrect Goods</option>
                    </select>
                  </td>
                  <td class="p-2 text-center">
                    <button
                      type="button"
                      (click)="removeLine(idx)"
                      class="text-rose-500 hover:text-rose-700 p-1"
                      title="Remove line"
                     aria-label="Remove line">
                      <i nz-icon nzType="delete" nzTheme="outline"></i>
                    </button>
                  </td>
                </tr>

                <tr *ngIf="lines().length === 0">
                  <td colspan="9" class="p-8 text-center text-slate-400">
                    <i nz-icon nzType="inbox" nzTheme="outline" class="text-3xl text-slate-300 mb-2 block"></i>
                    No items selected for return. Search products above to add return lines.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right 4 Cols: Summary & Finalization -->
        <div class="col-span-4 flex flex-col bg-white border border-slate-200 rounded-lg shadow-xs p-4 justify-between">
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Return & Settlement Summary</h3>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Total Return Lines:</span>
                <span class="font-bold text-slate-800">{{ lines().length }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total Return Units:</span>
                <span class="font-bold text-slate-800">{{ totalUnits() }} pcs</span>
              </div>
              <div class="flex justify-between text-slate-600 border-t border-slate-100 pt-2 text-sm">
                <span class="font-bold text-slate-700">Gross Return Value:</span>
                <span class="font-extrabold text-indigo-700 text-base">৳{{ grossTotal() | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Settlement Options -->
            <div class="bg-indigo-50/50 border border-indigo-100 rounded-md p-3 space-y-3 text-xs">
              <div>
                <label for="purchase-return-supplier-due-adjustment-3" class="block text-[11px] font-semibold text-slate-600 mb-1">
                  Supplier Due Adjustment (৳)
                </label>
                <input id="purchase-return-supplier-due-adjustment-3"
                  type="number"
                  min="0"
                  [(ngModel)]="dueAdjustmentAmount"
                  placeholder="0.00"
                  class="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 font-mono" aria-label="Supplier Due Adjustment (৳)" />
                <span *ngIf="selectedSupplier()" class="text-[10px] text-slate-500 mt-0.5 block">
                  Supplier current due balance: ৳{{ selectedSupplier()?.current_due_balance || 0 }}
                </span>
              </div>

              <div>
                <label for="purchase-return-cash-refund-received-4" class="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cash / Refund Received (৳)
                </label>
                <input id="purchase-return-cash-refund-received-4"
                  type="number"
                  min="0"
                  [(ngModel)]="refundReceivedAmount"
                  placeholder="0.00"
                  class="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 font-mono" aria-label="Cash / Refund Received (৳)" />
              </div>
            </div>

            <div>
              <label for="purchase-return-return-note-remarks-5" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Return Note / Remarks</label>
              <textarea id="purchase-return-return-note-remarks-5"
                [(ngModel)]="note"
                rows="2"
                placeholder="Reason or credit note reference..."
                class="w-full text-xs p-2 border border-slate-300 rounded focus:outline-indigo-500" aria-label="Return Note / Remarks"></textarea>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200">
            <button
              *appMenuAction="'PUR_1508:create'"
              nz-button
              nzType="primary"
              nzBlock
              [nzLoading]="isSubmitting()"
              [disabled]="lines().length === 0 || !selectedSupplierNo"
              (click)="submitReturn()"
              class="h-10 text-sm font-bold bg-indigo-600 hover:bg-indigo-700"
            >
              <i nz-icon nzType="check-circle" nzTheme="outline"></i>
              Confirm & Post Purchase Return
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Return History -->
      <div *ngIf="activeTab() === 'history'" class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="w-72">
            <nz-input-group [nzPrefix]="prefixIcon">
              <input id="purchase-return-search-return-or-supplier-7"
                type="text"
                nz-input
                placeholder="Search return # or supplier..."
                [(ngModel)]="historySearch"
                (ngModelChange)="loadHistory()" aria-label="Search return # or supplier..." />
            </nz-input-group>
            <ng-template #prefixIcon><i nz-icon nzType="search"></i></ng-template>
          </div>
          <button nz-button (click)="loadHistory()">
            <i nz-icon nzType="reload"></i> Refresh
          </button>
        </div>

        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2">Return Number</th>
                <th class="p-2">Date</th>
                <th class="p-2">Supplier</th>
                <th class="p-2 text-right">Items</th>
                <th class="p-2 text-right">Gross Amount</th>
                <th class="p-2 text-right">Due Adjusted</th>
                <th class="p-2 text-right">Cash Received</th>
                <th class="p-2">Status</th>
                <th class="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let ret of historyReturns()" class="hover:bg-slate-50">
                <td class="p-2 font-mono font-bold text-indigo-700">{{ ret.return_number }}</td>
                <td class="p-2 text-slate-600">{{ ret.return_date | date:'dd MMM yyyy, hh:mm a' }}</td>
                <td class="p-2 font-medium text-slate-800">{{ ret.supplier_name || 'Supplier #' + ret.supplier_no }}</td>
                <td class="p-2 text-right font-mono">{{ ret.total_items }}</td>
                <td class="p-2 text-right font-mono font-bold text-slate-900">৳{{ ret.gross_return_amount | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono text-emerald-700">৳{{ ret.due_adjustment_amount | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono text-blue-700">৳{{ ret.refund_received_amount | number:'1.2-2' }}</td>
                <td class="p-2">
                  <nz-tag nzColor="green">Completed</nz-tag>
                </td>
                <td class="p-2 text-center">
                  <button
                    nz-button
                    nzSize="small"
                    nzType="default"
                    (click)="viewDetails(ret)"
                  >
                    View
                  </button>
                </td>
              </tr>

              <tr *ngIf="historyReturns().length === 0 && !isLoadingHistory()">
                <td colspan="9" class="p-8 text-center text-slate-400">
                  No purchase return records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsModalVisible"
      [nzTitle]="'Purchase Return Details: ' + selectedReturn()?.return_number"
      (nzOnCancel)="isDetailsModalVisible = false"
      [nzFooter]="null"
      nzWidth="700px"
    >
      <ng-container *nzModalContent>
        <div *ngIf="selectedReturn()" class="space-y-4 text-xs">
          <div class="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-100">
            <div>
              <span class="text-slate-500">Return Date:</span>
              <p class="font-bold text-slate-800">{{ selectedReturn()?.return_date | date:'dd MMM yyyy, hh:mm a' }}</p>
            </div>
            <div>
              <span class="text-slate-500">Supplier:</span>
              <p class="font-bold text-slate-800">{{ selectedReturn()?.supplier_name || 'Supplier #' + selectedReturn()?.supplier_no }}</p>
            </div>
            <div>
              <span class="text-slate-500">Gross Return:</span>
              <p class="font-bold text-indigo-700 text-sm">৳{{ selectedReturn()?.gross_return_amount | number:'1.2-2' }}</p>
            </div>
          </div>

          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th class="p-2">Product Name</th>
                <th class="p-2">Batch</th>
                <th class="p-2 text-right">Return Qty</th>
                <th class="p-2 text-right">Unit TP</th>
                <th class="p-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of selectedReturn()?.items">
                <td class="p-2 font-medium">{{ item.product_name || 'Product #' + item.product_no }}</td>
                <td class="p-2 font-mono">{{ item.batch_number || 'N/A' }}</td>
                <td class="p-2 text-right font-mono">{{ item.return_qty_pcs }}</td>
                <td class="p-2 text-right font-mono">৳{{ item.unit_purchase_price | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono font-bold">৳{{ item.total_return_amount | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class PurchaseReturnComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  activeTab = signal<'entry' | 'history'>('entry');
  suppliers = signal<SuppSupplier[]>([]);
  productSearchResults = signal<ProdProduct[]>([]);
  lines = signal<ReturnCartLine[]>([]);

  selectedSupplierNo: number | null = null;
  selectedProductNo: number | null = null;
  dueAdjustmentAmount = 0;
  refundReceivedAmount = 0;
  note = '';

  isSubmitting = signal(false);
  isLoadingHistory = signal(false);
  historyReturns = signal<PurPurchaseReturn[]>([]);
  historySearch = '';

  isDetailsModalVisible = false;
  selectedReturn = signal<PurPurchaseReturn | null>(null);

  selectedSupplier = computed(() => {
    return this.suppliers().find(s => s.supplier_no === this.selectedSupplierNo) || null;
  });

  grossTotal = computed(() => {
    return this.lines().reduce((sum, line) => sum + (line.totalCost || 0), 0);
  });

  totalUnits = computed(() => {
    return this.lines().reduce((sum, line) => sum + (line.returnQty || 0), 0);
  });

  ngOnInit(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe(res => {
      if (res.data?.items) {
        this.suppliers.set([...res.data.items]);
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const batchIdsStr = params.get('batches') || params.get('batch');
      const productsParam = params.get('products') || params.get('product');

      if (batchIdsStr) {
        const batchIds = batchIdsStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (batchIds.length > 0) {
          this.loadBatchesForReturn(batchIds, productsParam);
        }
      } else if (productsParam) {
        this.searchProducts(productsParam);
      }
    });
  }

  loadBatchesForReturn(batchIds: number[], fallbackName?: string | null): void {
    this.productService.getBatches().subscribe({
      next: (res) => {
        const allBatches = res.data || [];
        const matched = allBatches.filter(b => batchIds.includes(b.batch_no));
        if (matched.length > 0) {
          const lines: ReturnCartLine[] = matched.map(b => {
            const unitCost = (b.cost_per_box && b.quantity_in_box)
              ? Math.round((b.cost_per_box / b.quantity_in_box) * 100) / 100
              : 0;
            const qty = b.total_quantity_pcs || 1;
            return {
              productNo: b.product_no,
              productName: b.product_name || (fallbackName ? decodeURIComponent(fallbackName) : `Batch #${b.batch_number}`),
              batchNo: b.batch_no,
              batchNumber: b.batch_number || 'DEFAULT',
              expiryDate: b.expiry_date || null,
              availableStock: qty,
              returnQty: qty,
              unitCost: unitCost,
              totalCost: Math.round(qty * unitCost * 100) / 100,
              reasonCode: 2, // Expired Batch
            };
          });

          this.lines.set(lines);
          this.msg.success(`Loaded ${lines.length} expiring batch(es) for supplier return.`);
        }
      }
    });
  }

  onSupplierChange(supplierNo: number): void {
    const s = this.suppliers().find(sup => sup.supplier_no === supplierNo);
    if (s && s.current_due_balance > 0) {
      this.dueAdjustmentAmount = Math.min(s.current_due_balance, this.grossTotal());
    }
  }

  searchProducts(query: string): void {
    if (!query || query.trim().length < 2) return;
    this.productService.getProducts({ search: query.trim(), pageSize: 20 }).subscribe(res => {
      if (res.data?.items) {
        this.productSearchResults.set([...res.data.items]);
      }
    });
  }

  onProductSelect(productNo: number): void {
    if (!productNo) return;
    const prod = this.productSearchResults().find(p => p.product_no === productNo);
    if (!prod) return;

    // Check if already in lines
    const existing = this.lines().find(l => l.productNo === productNo);
    if (existing) {
      existing.returnQty += 1;
      this.updateLineTotal(existing);
      this.selectedProductNo = null;
      return;
    }

    // Fetch batch details if available
    this.productService.getProductBatches(productNo).subscribe({
      next: res => {
        const batches = res.data || [];
        const batch = batches[0];
        const unitCost = prod.purchase_price_per_piece || (prod.cost_per_box / (prod.quantity_per_box || 1)) || 0;
        const availableStock = batch?.total_quantity_pcs || prod.stock_qty || 0;

        const newLine: ReturnCartLine = {
          productNo: prod.product_no,
          productName: prod.product_name,
          batchNo: batch?.batch_no || null,
          batchNumber: batch?.batch_number || 'DEFAULT',
          expiryDate: batch?.expiry_date || null,
          availableStock,
          returnQty: 1,
          unitCost,
          totalCost: unitCost,
          reasonCode: 1,
        };

        this.lines.update(arr => [...arr, newLine]);
        this.selectedProductNo = null;
      },
      error: () => {
        const unitCost = prod.purchase_price_per_piece || 0;
        const newLine: ReturnCartLine = {
          productNo: prod.product_no,
          productName: prod.product_name,
          batchNumber: 'DEFAULT',
          availableStock: prod.stock_qty || 0,
          returnQty: 1,
          unitCost,
          totalCost: unitCost,
          reasonCode: 1,
        };
        this.lines.update(arr => [...arr, newLine]);
        this.selectedProductNo = null;
      }
    });
  }

  updateLineTotal(line: ReturnCartLine): void {
    if (line.returnQty <= 0) line.returnQty = 1;
    line.totalCost = Math.round(line.returnQty * line.unitCost * 100) / 100;
  }

  removeLine(index: number): void {
    this.lines.update(arr => arr.filter((_, i) => i !== index));
  }

  submitReturn(): void {
    if (!this.selectedSupplierNo) {
      this.msg.warning('Please select a supplier.');
      return;
    }

    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one line item to return.');
      return;
    }

    this.isSubmitting.set(true);

    const payload: Partial<PurPurchaseReturn> = {
      supplier_no: this.selectedSupplierNo,
      note: this.note,
      items: this.lines().map(l => ({
        purchase_return_item_no: 0,
        pharmacy_no: 0,
        branch_no: 0,
        purchase_return_no: 0,
        product_no: l.productNo,
        batch_no: l.batchNo,
        batch_number: l.batchNumber,
        return_qty_pcs: l.returnQty,
        unit_purchase_price: l.unitCost,
        total_return_amount: l.totalCost,
        reason_code: l.reasonCode,
      })),
    };

    this.supplierService.createPurchaseReturn(payload).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        this.msg.success(res.message || 'Purchase return recorded successfully.');
        this.lines.set([]);
        this.note = '';
        this.dueAdjustmentAmount = 0;
        this.refundReceivedAmount = 0;
        this.activeTab.set('history');
        this.loadHistory();
      },
      error: err => {
        this.isSubmitting.set(false);
        this.msg.error(err.error?.message || 'Failed to record purchase return.');
      }
    });
  }

  loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.supplierService.getPurchaseReturns({ search: this.historySearch }).subscribe({
      next: res => {
        this.isLoadingHistory.set(false);
        const data = (res.data as any)?.items || res.data || [];
        this.historyReturns.set([...data]);
      },
      error: () => {
        this.isLoadingHistory.set(false);
      }
    });
  }

  viewDetails(ret: PurPurchaseReturn): void {
    this.selectedReturn.set(ret);
    this.isDetailsModalVisible = true;
  }
}
