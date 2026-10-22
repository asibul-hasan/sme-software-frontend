import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { InventoryService, CreateStockTransferPayload } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { InvTransfer, InvTransferItem } from '../../core/models/inventory.models';
import { ProdProduct, ProdProductBatch } from '../../core/models/product.models';

interface TransferCartLine {
  productNo: number;
  productName: string;
  batchNo?: number | null;
  batchNumber: string;
  expiryDate?: string | null;
  availableStock: number;
  qtyPcs: number;
  unitCost: number;
  totalCost: number;
}

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzModalModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Inter-Branch Stock Transfers"
        subtitle="Dispatch stock to other branches and receive incoming inventory shipments"
        formId="PROD_1609"
        [breadcrumbs]="[
          { label: 'Products', url: '/products/list' },
          { label: 'Stock Transfers' }
        ]"
      >
        <div actions class="flex items-center gap-2">
          <div class="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5">
            <button
              type="button"
              (click)="activeTab.set('list'); loadTransfers()"
              [class]="activeTab() === 'list' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5"
            >
              <i nz-icon nzType="unordered-list" nzTheme="outline"></i>
              Transfer Shipments
            </button>
            <button
              type="button"
              (click)="activeTab.set('create')"
              [class]="activeTab() === 'create' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5"
            >
              <i nz-icon nzType="send" nzTheme="outline"></i>
              Initiate New Transfer
            </button>
          </div>
        </div>
      </app-page-header>

      <!-- Tab 1: Transfers List -->
      <div *ngIf="activeTab() === 'list'" class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-64">
              <nz-input-group [nzPrefix]="prefixIcon">
                <input
                  type="text"
                  nz-input
                  placeholder="Search transfer # or note..."
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="loadTransfers()"
                />
              </nz-input-group>
              <ng-template #prefixIcon><i nz-icon nzType="search"></i></ng-template>
            </div>
            <div class="w-48">
              <nz-select
                [(ngModel)]="statusFilter"
                (ngModelChange)="loadTransfers()"
                class="w-full"
                nzPlaceHolder="Filter status"
              >
                <nz-option [nzValue]="null" nzLabel="All Statuses"></nz-option>
                <nz-option [nzValue]="1" nzLabel="In-Transit / Pending"></nz-option>
                <nz-option [nzValue]="2" nzLabel="Received"></nz-option>
              </nz-select>
            </div>
          </div>
          <button nz-button (click)="loadTransfers()">
            <i nz-icon nzType="reload"></i> Refresh
          </button>
        </div>

        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2">Transfer Number</th>
                <th class="p-2">Dispatched Date</th>
                <th class="p-2">From Branch</th>
                <th class="p-2">To Branch</th>
                <th class="p-2 text-right">Items</th>
                <th class="p-2 text-right">Total Cost</th>
                <th class="p-2">Status</th>
                <th class="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let t of transfers()" class="hover:bg-slate-50">
                <td class="p-2 font-mono font-bold text-indigo-700">{{ t.transfer_number }}</td>
                <td class="p-2 text-slate-600">{{ t.sent_at | date:'dd MMM yyyy, hh:mm a' }}</td>
                <td class="p-2 font-medium text-slate-700">
                  <span class="inline-flex items-center gap-1">
                    <i nz-icon nzType="export" class="text-slate-400"></i>
                    {{ t.from_branch_name || 'Branch #' + t.from_branch_no }}
                  </span>
                </td>
                <td class="p-2 font-medium text-slate-800">
                  <span class="inline-flex items-center gap-1">
                    <i nz-icon nzType="import" class="text-indigo-500"></i>
                    {{ t.to_branch_name || 'Branch #' + t.to_branch_no }}
                  </span>
                </td>
                <td class="p-2 text-right font-mono">{{ t.total_items }}</td>
                <td class="p-2 text-right font-mono font-bold text-slate-900">৳{{ t.total_cost_amount | number:'1.2-2' }}</td>
                <td class="p-2">
                  <nz-tag *ngIf="t.transfer_status === 1" nzColor="orange">In-Transit</nz-tag>
                  <nz-tag *ngIf="t.transfer_status === 2" nzColor="green">Received</nz-tag>
                </td>
                <td class="p-2 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Receive Button: Enabled ONLY if this user is at the destination branch -->
                    <button
                      *ngIf="t.transfer_status === 1 && canReceive(t)"
                      nz-button
                      nzSize="small"
                      nzType="primary"
                      (click)="confirmReceive(t)"
                      class="bg-emerald-600 hover:bg-emerald-700 border-none font-semibold text-xs"
                    >
                      <i nz-icon nzType="download"></i> Receive Stock
                    </button>

                    <span
                      *ngIf="t.transfer_status === 1 && !canReceive(t)"
                      class="text-[11px] text-amber-600 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                    >
                      Awaiting Destination
                    </span>

                    <button
                      nz-button
                      nzSize="small"
                      nzType="default"
                      (click)="viewDetails(t)"
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="transfers().length === 0 && !isLoading()">
                <td colspan="8" class="p-8 text-center text-slate-400">
                  No stock transfer shipments found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Create Stock Transfer -->
      <div *ngIf="activeTab() === 'create'" class="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        <div class="col-span-8 flex flex-col bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div class="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div class="w-1/3">
              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Destination Branch *</label>
              <nz-select
                [(ngModel)]="toBranchNo"
                nzPlaceHolder="Select destination branch..."
                class="w-full"
              >
                <nz-option
                  *ngFor="let b of availableDestBranches()"
                  [nzValue]="b.branch_no"
                  [nzLabel]="b.name"
                ></nz-option>
              </nz-select>
            </div>

            <div class="flex-1">
              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Product to Transfer</label>
              <nz-select
                [(ngModel)]="selectedProductNo"
                (ngModelChange)="onProductSelect($event)"
                nzPlaceHolder="Type medicine name or barcode..."
                class="w-full"
                nzShowSearch
                [nzServerSearch]="true"
                (nzOnSearch)="searchProducts($event)"
              >
                <nz-option
                  *ngFor="let p of productSearchResults()"
                  [nzValue]="p.product_no"
                  [nzLabel]="p.product_name + ' | Available: ' + (p.stock_qty || 0) + ' pcs'"
                ></nz-option>
              </nz-select>
            </div>
          </div>

          <div class="flex-1 overflow-auto p-3">
            <table class="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th class="p-2">#</th>
                  <th class="p-2">Product</th>
                  <th class="p-2">Batch #</th>
                  <th class="p-2 text-right">Available Stock</th>
                  <th class="p-2 text-center w-24">Transfer Qty</th>
                  <th class="p-2 text-right">Unit Cost</th>
                  <th class="p-2 text-right">Total Cost</th>
                  <th class="p-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let line of lines(); let idx = index" class="hover:bg-slate-50">
                  <td class="p-2 text-slate-400">{{ idx + 1 }}</td>
                  <td class="p-2 font-medium text-slate-800">{{ line.productName }}</td>
                  <td class="p-2 font-mono text-slate-600">{{ line.batchNumber || 'N/A' }}</td>
                  <td class="p-2 text-right font-mono text-slate-600">{{ line.availableStock }} pcs</td>
                  <td class="p-2 text-center">
                    <input
                      type="number"
                      min="1"
                      [max]="line.availableStock"
                      [(ngModel)]="line.qtyPcs"
                      (ngModelChange)="updateLineTotal(line)"
                      class="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded focus:outline-indigo-500"
                    />
                  </td>
                  <td class="p-2 text-right font-mono">৳{{ line.unitCost | number:'1.2-2' }}</td>
                  <td class="p-2 text-right font-mono font-bold text-indigo-700">৳{{ line.totalCost | number:'1.2-2' }}</td>
                  <td class="p-2 text-center">
                    <button
                      type="button"
                      (click)="removeLine(idx)"
                      class="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <i nz-icon nzType="delete"></i>
                    </button>
                  </td>
                </tr>

                <tr *ngIf="lines().length === 0">
                  <td colspan="8" class="p-8 text-center text-slate-400">
                    No products added to transfer cart. Search products above to add items.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-span-4 flex flex-col bg-white border border-slate-200 rounded-lg shadow-xs p-4 justify-between">
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Transfer Shipment Summary</h3>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Origin Branch:</span>
                <span class="font-bold text-slate-800">{{ currentBranchName() }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Destination Branch:</span>
                <span class="font-bold text-indigo-700">{{ selectedDestBranchName() || 'Not Selected' }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Line Items:</span>
                <span class="font-bold text-slate-800">{{ lines().length }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total Units:</span>
                <span class="font-bold text-slate-800">{{ totalUnits() }} pcs</span>
              </div>
              <div class="flex justify-between text-slate-600 border-t border-slate-100 pt-2 text-sm">
                <span class="font-bold text-slate-700">Total Shipment Valuation:</span>
                <span class="font-extrabold text-indigo-700 text-base">৳{{ totalCost() | number:'1.2-2' }}</span>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Transfer Note / Instructions</label>
              <textarea
                [(ngModel)]="note"
                rows="3"
                placeholder="Reason or courier details for this transfer shipment..."
                class="w-full text-xs p-2 border border-slate-300 rounded focus:outline-indigo-500"
              ></textarea>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200">
            <button
              nz-button
              nzType="primary"
              nzBlock
              [nzLoading]="isSubmitting()"
              [disabled]="lines().length === 0 || !toBranchNo"
              (click)="submitTransfer()"
              class="h-10 text-sm font-bold bg-indigo-600 hover:bg-indigo-700"
            >
              <i nz-icon nzType="send"></i>
              Dispatch Transfer Shipment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsModalVisible"
      [nzTitle]="'Stock Transfer Shipment: ' + selectedTransfer()?.transfer_number"
      (nzOnCancel)="isDetailsModalVisible = false"
      [nzFooter]="null"
      nzWidth="700px"
    >
      <ng-container *nzModalContent>
        <div *ngIf="selectedTransfer()" class="space-y-4 text-xs">
          <div class="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded border border-slate-100">
            <div>
              <span class="text-slate-500">From Branch:</span>
              <p class="font-bold text-slate-800">{{ selectedTransfer()?.from_branch_name || 'Branch #' + selectedTransfer()?.from_branch_no }}</p>
            </div>
            <div>
              <span class="text-slate-500">To Branch:</span>
              <p class="font-bold text-slate-800">{{ selectedTransfer()?.to_branch_name || 'Branch #' + selectedTransfer()?.to_branch_no }}</p>
            </div>
            <div>
              <span class="text-slate-500">Total Valuation:</span>
              <p class="font-bold text-indigo-700 text-sm">৳{{ selectedTransfer()?.total_cost_amount | number:'1.2-2' }}</p>
            </div>
          </div>

          <table class="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th class="p-2">Product Name</th>
                <th class="p-2">Batch</th>
                <th class="p-2 text-right">Transfer Qty</th>
                <th class="p-2 text-right">Unit Cost</th>
                <th class="p-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of selectedTransfer()?.items">
                <td class="p-2 font-medium">{{ item.product_name || 'Product #' + item.product_no }}</td>
                <td class="p-2 font-mono">{{ item.batch_number || 'N/A' }}</td>
                <td class="p-2 text-right font-mono">{{ item.qty_pcs }}</td>
                <td class="p-2 text-right font-mono">৳{{ item.unit_cost | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono font-bold">৳{{ item.total_cost | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class StockTransferComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalModule);
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  activeTab = signal<'list' | 'create'>('list');
  transfers = signal<InvTransfer[]>([]);
  branches = signal<any[]>([]);
  productSearchResults = signal<ProdProduct[]>([]);
  lines = signal<TransferCartLine[]>([]);

  isLoading = signal(false);
  isSubmitting = signal(false);
  searchQuery = '';
  statusFilter: number | null = null;

  toBranchNo: number | null = null;
  selectedProductNo: number | null = null;
  note = '';

  isDetailsModalVisible = false;
  selectedTransfer = signal<InvTransfer | null>(null);

  currentBranchNo = computed(() => {
    return this.authService.activeBranch()?.branch_no || this.authService.currentUser()?.branch_no || 1;
  });

  currentBranchName = computed(() => {
    return this.authService.activeBranch()?.name || 'Current Branch';
  });

  availableDestBranches = computed(() => {
    const cur = this.currentBranchNo();
    return this.branches().filter(b => b.branch_no !== cur);
  });

  selectedDestBranchName = computed(() => {
    const b = this.branches().find(br => br.branch_no === this.toBranchNo);
    return b?.name || '';
  });

  totalUnits = computed(() => {
    return this.lines().reduce((sum, l) => sum + (l.qtyPcs || 0), 0);
  });

  totalCost = computed(() => {
    return this.lines().reduce((sum, l) => sum + (l.totalCost || 0), 0);
  });

  ngOnInit(): void {
    this.dashboardService.getBranches().subscribe(res => {
      if (res.data) {
        this.branches.set(res.data);
      }
    });
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {};
    if (this.searchQuery) params['search'] = this.searchQuery;
    if (this.statusFilter !== null) params['status'] = this.statusFilter;

    this.inventoryService.getTransfers(params).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.transfers.set([...(res.data?.items || [])]);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  canReceive(transfer: InvTransfer): boolean {
    return transfer.to_branch_no === this.currentBranchNo();
  }

  confirmReceive(transfer: InvTransfer): void {
    if (!this.canReceive(transfer)) {
      this.msg.error('Only the destination branch can receive this transfer.');
      return;
    }

    this.inventoryService.receiveTransfer(transfer.transfer_no).subscribe({
      next: res => {
        this.msg.success(res.message || 'Stock transfer received and added to inventory.');
        this.loadTransfers();
      },
      error: err => {
        this.msg.error(err.error?.message || 'Failed to receive stock transfer.');
      }
    });
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

    this.productService.getProductBatches(productNo).subscribe({
      next: res => {
        const batches = res.data || [];
        const batch = batches[0];
        const unitCost = prod.purchase_price_per_piece || (prod.cost_per_box / (prod.quantity_per_box || 1)) || 0;
        const availableStock = batch?.total_quantity_pcs || prod.stock_qty || 0;

        const newLine: TransferCartLine = {
          productNo: prod.product_no,
          productName: prod.product_name,
          batchNo: batch?.batch_no || null,
          batchNumber: batch?.batch_number || 'DEFAULT',
          expiryDate: batch?.expiry_date || null,
          availableStock,
          qtyPcs: 1,
          unitCost,
          totalCost: unitCost,
        };

        this.lines.update(arr => [...arr, newLine]);
        this.selectedProductNo = null;
      },
      error: () => {
        const unitCost = prod.purchase_price_per_piece || 0;
        const newLine: TransferCartLine = {
          productNo: prod.product_no,
          productName: prod.product_name,
          batchNumber: 'DEFAULT',
          availableStock: prod.stock_qty || 0,
          qtyPcs: 1,
          unitCost,
          totalCost: unitCost,
        };
        this.lines.update(arr => [...arr, newLine]);
        this.selectedProductNo = null;
      }
    });
  }

  updateLineTotal(line: TransferCartLine): void {
    if (line.qtyPcs <= 0) line.qtyPcs = 1;
    if (line.availableStock > 0 && line.qtyPcs > line.availableStock) {
      line.qtyPcs = line.availableStock;
      this.msg.warning(`Transfer quantity capped at available stock (${line.availableStock} pcs).`);
    }
    line.totalCost = Math.round(line.qtyPcs * line.unitCost * 100) / 100;
  }

  removeLine(index: number): void {
    this.lines.update(arr => arr.filter((_, i) => i !== index));
  }

  submitTransfer(): void {
    if (!this.toBranchNo) {
      this.msg.warning('Please select destination branch.');
      return;
    }

    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one product line to transfer.');
      return;
    }

    this.isSubmitting.set(true);

    const payload: CreateStockTransferPayload = {
      toBranchNo: this.toBranchNo,
      note: this.note,
      items: this.lines().map(l => ({
        productNo: l.productNo,
        batchNo: l.batchNo,
        batchNumber: l.batchNumber,
        qtyPcs: l.qtyPcs,
        unitCost: l.unitCost,
        expiryDate: l.expiryDate || undefined,
      })),
    };

    this.inventoryService.createTransfer(payload).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        this.msg.success(res.message || 'Stock transfer dispatched successfully.');
        this.lines.set([]);
        this.note = '';
        this.toBranchNo = null;
        this.activeTab.set('list');
        this.loadTransfers();
      },
      error: err => {
        this.isSubmitting.set(false);
        this.msg.error(err.error?.message || 'Failed to dispatch stock transfer.');
      }
    });
  }

  viewDetails(t: InvTransfer): void {
    this.selectedTransfer.set(t);
    this.isDetailsModalVisible = true;
  }
}
