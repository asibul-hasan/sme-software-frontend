import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PrintService } from '../../core/services/print.service';
import { ProdProductRequisitionItem } from '../../core/models/product.models';

interface RequisitionRecord {
  id: string;
  date: string;
  total: number;
  reqCode: string;
  supplier: string;
  itemsCount: number;
  createdBy: string;
  status: 'Approved' | 'Pending' | 'Cancelled';
}

@Component({
  selector: 'app-requisition-record',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzDatePickerModule,
    NzTooltipModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Requisition History & Records"
        subtitle="Audit archived and active purchase requisitions"
        formId="PROD_1606"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Requisition Records' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-date-picker class="w-32 shrink-0" [(ngModel)]="fromDate" nzPlaceHolder="From Date" nzFormat="dd-MM-yyyy"></nz-date-picker>
          <nz-date-picker class="w-32 shrink-0" [(ngModel)]="toDate" nzPlaceHolder="To Date" nzFormat="dd-MM-yyyy"></nz-date-picker>
          <nz-select class="w-36 shrink-0" [(ngModel)]="selectedSupplier" nzPlaceHolder="Supplier">
            <nz-option nzValue="" nzLabel="All Suppliers"></nz-option>
            @for (s of suppliers(); track s) {
              <nz-option [nzValue]="s" [nzLabel]="s"></nz-option>
            }
          </nz-select>
          <input
            type="text"
            nz-input
            placeholder="Created by..."
            [(ngModel)]="createdBy"
            class="w-32 shrink-0 rounded-md"
          />
          <input
            type="text"
            nz-input
            placeholder="Requisition Code..."
            [(ngModel)]="searchCode"
            class="w-40 shrink-0 rounded-md"
          />
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a routerLink="/products/requisition" nz-button nzType="primary" class="rounded-md font-semibold">
            <span nz-icon nzType="plus"></span> New Requisition Planner
          </a>
          <button nz-button nzType="default" class="rounded-md" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Export Register
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Container -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Date</th>
                <th class="p-3 text-right">Total Bill</th>
                <th class="p-3">Requisition Info</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-center w-40">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredRecords(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 font-mono text-xs text-slate-600">{{ r.date }}</td>
                  <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ r.total | number: '1.2-2' }}
                  </td>
                  <td class="p-3">
                    <a
                      [routerLink]="['/products/requisition']"
                      [queryParams]="{ requisitionNo: r.id }"
                      class="font-bold text-indigo-600 hover:text-indigo-900 hover:underline m-0 text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      nz-tooltip
                      nzTooltipTitle="Edit in Inventory Requisition Planner"
                    >
                      <span>{{ r.reqCode }}</span>
                      <span nz-icon nzType="form" class="text-[11px] opacity-75"></span>
                    </a>
                    <p class="text-slate-400 m-0 text-[11px] mt-0.5">{{ r.supplier }} · {{ r.itemsCount }} items · By {{ r.createdBy }}</p>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200': r.status === 'Approved',
                        'bg-amber-50 text-amber-700 border border-amber-200': r.status === 'Pending',
                        'bg-rose-50 text-rose-700 border border-rose-200': r.status === 'Cancelled'
                      }"
                    >
                      {{ r.status }}
                    </span>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewDetails(r)"
                        nz-tooltip
                        nzTooltipTitle="View Requisition Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <a
                        [routerLink]="['/products/requisition']"
                        [queryParams]="{ requisitionNo: r.id }"
                        nz-tooltip
                        nzTooltipTitle="Edit in Planner"
                        class="btn-tbl-action text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200"
                      >
                        <span nz-icon nzType="edit"></span>
                      </a>
                      @if (r.status !== 'Approved' && r.status !== 'Cancelled') {
                        <button
                          type="button"
                          (click)="approveRecord(r)"
                          nz-tooltip
                          nzTooltipTitle="Approve Requisition"
                          class="btn-tbl-action text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                        >
                          <span nz-icon nzType="check"></span>
                        </button>
                      }
                      <button
                        type="button"
                        (click)="printRequisition(r)"
                        nz-tooltip
                        nzTooltipTitle="Print Requisition"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="cancelRecord(r)"
                        nz-tooltip
                        nzTooltipTitle="Cancel Requisition"
                        class="btn-tbl-action btn-tbl-delete"
                        [disabled]="r.status === 'Cancelled'"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-slate-400 text-xs">
                    No requisition history records match the selected filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Requisition Records: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRecords().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Purchase Value: <strong class="theme-total-text font-mono text-sm">৳ {{ totalBill() | number: '1.2-2' }}</strong></span>
          </div>
          <button nz-button nzType="default" nzSize="small" class="rounded" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Export Register
          </button>
        </div>
      </div>
    </div>

    <!-- Requisition Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsVisible"
      [nzTitle]="'Requisition Details: ' + (activeRecord?.reqCode || '')"
      [nzFooter]="detailsFooter"
      (nzOnCancel)="isDetailsVisible = false"
      nzWidth="750px"
    >
      <ng-container *nzModalContent>
        @if (activeRecord) {
          <div class="space-y-3 py-1 text-xs">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span class="text-slate-400">Supplier:</span>
                <p class="font-bold text-slate-800 m-0">{{ activeRecord.supplier }}</p>
              </div>
              <div>
                <span class="text-slate-400">Order Date:</span>
                <p class="font-bold text-slate-800 m-0">{{ activeRecord.date }}</p>
              </div>
              <div>
                <span class="text-slate-400">Total Cost:</span>
                <p class="font-bold theme-total-text m-0">৳ {{ activeRecord.total | number: '1.2-2' }}</p>
              </div>
              <div>
                <span class="text-slate-400">Status:</span>
                <p class="font-bold m-0" [ngClass]="{
                  'text-emerald-700': activeRecord.status === 'Approved',
                  'text-amber-700': activeRecord.status === 'Pending',
                  'text-rose-700': activeRecord.status === 'Cancelled'
                }">{{ activeRecord.status }}</p>
              </div>
            </div>

            <!-- Detail Line Items Table -->
            <div class="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th class="p-2">#</th>
                    <th class="p-2">Product Name</th>
                    <th class="p-2 text-center">Box Qty</th>
                    <th class="p-2 text-center">Pcs/Box</th>
                    <th class="p-2 text-right">BTP (৳)</th>
                    <th class="p-2 text-right">Line Total (৳)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of detailItems(); track item.requisition_item_no; let i = $index) {
                    <tr>
                      <td class="p-2 font-mono text-slate-400">{{ i + 1 }}</td>
                      <td class="p-2 font-bold text-slate-800">{{ item.product_name || 'Product #' + item.product_no }}</td>
                      <td class="p-2 text-center font-mono font-semibold">{{ item.box_qty }}</td>
                      <td class="p-2 text-center font-mono text-slate-600">{{ item.quantity_in_box }}</td>
                      <td class="p-2 text-right font-mono text-slate-600">৳ {{ item.btp | number: '1.2-2' }}</td>
                      <td class="p-2 text-right font-mono font-bold theme-total-text">৳ {{ item.total_price | number: '1.2-2' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-4 text-center text-slate-400">Loading line items...</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #detailsFooter>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            @if (activeRecord && activeRecord.status !== 'Approved' && activeRecord.status !== 'Cancelled') {
              <button
                nz-button
                nzType="primary"
                class="bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white font-semibold"
                (click)="approveRecord(activeRecord)"
              >
                <span nz-icon nzType="check-circle"></span> Approve Requisition
              </button>
            }
            @if (activeRecord) {
              <a
                nz-button
                nzType="default"
                [routerLink]="['/products/requisition']"
                [queryParams]="{ requisitionNo: activeRecord.id }"
                (click)="isDetailsVisible = false"
                class="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <span nz-icon nzType="edit"></span> Edit in Planner
              </a>
            }
          </div>
          <div class="flex items-center gap-2">
            @if (activeRecord) {
              <button nz-button nzType="default" (click)="isDetailsVisible = false; printRequisition(activeRecord)">
                <span nz-icon nzType="printer"></span> Print
              </button>
            }
            <button nz-button nzType="default" (click)="isDetailsVisible = false">Close</button>
          </div>
        </div>
      </ng-template>
    </nz-modal>

    <!-- Printable Requisition Modal -->
    <nz-modal
      [(nzVisible)]="isPrintModalVisible"
      [nzTitle]="'Purchase Requisition Order: ' + (printingRecord?.reqCode || '')"
      [nzCentered]="true"
      [nzWidth]="680"
      [nzFooter]="printFooter"
      (nzOnCancel)="isPrintModalVisible = false"
    >
      <ng-container *nzModalContent>
        @if (printingRecord) {
          <div id="requisition-order" class="p-5 bg-white text-black text-xs border border-slate-300 rounded shadow-xs max-w-[620px] mx-auto select-none font-sans">
            <div class="flex justify-between items-start pb-3 border-b-2 border-slate-800">
              <div>
                <div class="text-base font-black uppercase text-slate-900 tracking-wider">Aidly Model Pharmacy</div>
                <div class="text-[11px] text-slate-600">Central Inventory & Supply Chain Department</div>
                <div class="text-[11px] text-slate-600">Commercial Purchase Requisition Order</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold font-mono text-slate-900">{{ printingRecord.reqCode }}</div>
                <div class="text-[11px] text-slate-500">{{ printingRecord.date }}</div>
                <nz-tag [nzColor]="printingRecord.status === 'Approved' ? 'success' : (printingRecord.status === 'Cancelled' ? 'error' : 'processing')">
                  {{ printingRecord.status }}
                </nz-tag>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
              <div>
                <span class="text-slate-500 block text-[11px]">Assigned Supplier:</span>
                <span class="font-bold text-slate-800 text-sm">{{ printingRecord.supplier }}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-500 block text-[11px]">Originator / Pharmacist:</span>
                <span class="font-semibold text-slate-700">{{ printingRecord.createdBy }}</span>
              </div>
            </div>

            <table class="w-full text-xs my-3 border-collapse">
              <thead>
                <tr class="border-b border-slate-400 bg-slate-100 text-slate-700 font-semibold text-left">
                  <th class="p-2">#</th>
                  <th class="p-2">Formulation</th>
                  <th class="p-2 text-center">Req Box</th>
                  <th class="p-2 text-right">Unit BTP (৳)</th>
                  <th class="p-2 text-right">Subtotal (৳)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                @for (item of detailItems(); track item.requisition_item_no; let i = $index) {
                  <tr>
                    <td class="p-2 font-mono text-slate-400">{{ i + 1 }}</td>
                    <td class="p-2 font-medium text-slate-900">{{ item.product_name || 'Product #' + item.product_no }}</td>
                    <td class="p-2 text-center font-mono font-bold">{{ item.box_qty }}</td>
                    <td class="p-2 text-right font-mono">৳ {{ item.btp | number:'1.2-2' }}</td>
                    <td class="p-2 text-right font-mono font-bold text-slate-900">৳ {{ item.total_price | number:'1.2-2' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-4 text-center text-slate-400">Loading line items...</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="border-t-2 border-slate-800 pt-2 space-y-1 text-xs">
              <div class="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>Estimated Procurement Total:</span>
                <span>৳ {{ printingRecord.total | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 pt-10 text-[11px] text-slate-500 text-center">
              <div class="border-t border-dashed border-slate-400 pt-1">Procurement In-Charge</div>
              <div class="border-t border-dashed border-slate-400 pt-1">Managing Pharmacist Sign</div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #printFooter>
        <button nz-button nzType="default" (click)="isPrintModalVisible = false">Close</button>
        <button nz-button nzType="primary" (click)="triggerPrint()">
          <span nz-icon nzType="printer"></span> Print Order
        </button>
      </ng-template>
    </nz-modal>
  `,

})
export class RequisitionRecordComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly printService = inject(PrintService);

  searchCode = '';
  selectedSupplier = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  createdBy = '';

  suppliers = signal<string[]>([]);
  records = signal<RequisitionRecord[]>([]);

  filteredRecords = computed(() => {
    const q = this.searchCode.trim().toLowerCase();
    const sup = this.selectedSupplier;
    const cb = this.createdBy.trim().toLowerCase();
    return this.records().filter(r => {
      const matchCode = !q || r.reqCode.toLowerCase().includes(q);
      const matchSup = !sup || r.supplier === sup;
      const matchCb = !cb || r.createdBy.toLowerCase().includes(cb);
      return matchCode && matchSup && matchCb;
    });
  });

  totalBill = computed(() => {
    return this.filteredRecords().reduce((sum, r) => sum + r.total, 0);
  });

  isDetailsVisible = false;
  activeRecord: RequisitionRecord | null = null;
  detailItems = signal<any[]>([]);

  isPrintModalVisible = false;
  printingRecord: RequisitionRecord | null = null;

  ngOnInit(): void {
    this.loadRecords();
    this.loadSuppliers();
  }

  loadRecords(): void {
    this.productService.getRequisitions({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list: RequisitionRecord[] = (res.data.items || []).map((r: any) => ({
            id: String(r.requisition_no),
            date: r.requisition_date ? new Date(r.requisition_date).toISOString().slice(0, 16).replace('T', ' ') : '',
            total: r.total_cost || r.total_amount || 0,
            reqCode: r.requisition_code || r.requisition_number || `REQ-${r.requisition_no}`,
            supplier: r.supplier_name || 'General Supplier',
            itemsCount: r.total_selected_items || r.total_items || 0,
            createdBy: 'System Staff',
            status: (r.requisition_status === 2 || r.status === 'Approved' ? 'Approved' : (r.requisition_status === 3 || r.status === 'Cancelled' ? 'Cancelled' : 'Pending')) as any,
          }));
          this.records.set(list);
        }
      },
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const names = res.data.items.map(s => s.name).filter(Boolean);
          this.suppliers.set(names);
        }
      },
    });
  }

  resetFilters(): void {
    this.searchCode = '';
    this.selectedSupplier = '';
    this.fromDate = null;
    this.toDate = null;
    this.createdBy = '';
    this.loadRecords();
  }

  viewDetails(r: RequisitionRecord): void {
    this.activeRecord = r;
    this.detailItems.set([]);
    this.isDetailsVisible = true;

    this.productService.getRequisitionById(Number(r.id)).subscribe({
      next: res => {
        if (res.success && res.data && res.data.items) {
          this.detailItems.set([...res.data.items]);
        }
      },
      error: () => {
        this.msg.error('Failed to load requisition line items.');
      },
    });
  }

  printRequisition(r: RequisitionRecord): void {
    this.printingRecord = r;
    this.detailItems.set([]);
    this.isPrintModalVisible = true;
    this.productService.getRequisitionById(Number(r.id)).subscribe({
      next: res => {
        if (res.success && res.data && res.data.items) {
          this.detailItems.set([...res.data.items]);
        }
      },
      error: () => {
        this.msg.error('Failed to load requisition items for printing.');
      },
    });
  }

  triggerPrint(): void {
    if (!this.printingRecord) return;
    this.printService.printRequisitionOrder({
      reqCode: this.printingRecord.reqCode,
      date: this.printingRecord.date,
      supplier: this.printingRecord.supplier,
      createdBy: this.printingRecord.createdBy,
      status: this.printingRecord.status,
      lines: this.detailItems().map(item => ({
        name: item.product_name,
        boxQty: Number(item.box_qty) || 0,
        btp: Number(item.box_trade_price) || 0,
        totalPrice: Number(item.total_price) || 0,
      })),
      totalEstimated: this.printingRecord.total || this.detailItems().reduce((sum, item) => sum + (Number(item.total_price) || 0), 0),
    });
  }

  approveRecord(r: RequisitionRecord): void {
    this.modal
      .confirmAction(
        `Approve Requisition ${r.reqCode}?`,
        'Approving this requisition confirms procurement of these inventory items.',
        'Approve Requisition',
        false
      )
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.updateRequisitionStatus(Number(r.id), 'Approved').subscribe({
            next: res => {
              if (res.success) {
                this.records.update(list =>
                  list.map(rec => (rec.id === r.id ? { ...rec, status: 'Approved' as const } : rec))
                );
                if (this.activeRecord && this.activeRecord.id === r.id) {
                  this.activeRecord = { ...this.activeRecord, status: 'Approved' };
                }
                this.msg.success(`Requisition ${r.reqCode} approved successfully.`);
              } else {
                this.msg.error(res.message || 'Failed to approve requisition.');
              }
            },
            error: err => {
              this.msg.error(err?.error?.message || 'Failed to approve requisition.');
            },
          });
        }
      });
  }

  cancelRecord(r: RequisitionRecord): void {
    this.modal
      .confirmAction(`Cancel Requisition ${r.reqCode}?`, 'Cancelling will invalidate this procurement record.', 'Cancel Requisition', true)
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.updateRequisitionStatus(Number(r.id), 'Cancelled').subscribe({
            next: res => {
              if (res.success) {
                this.records.update(list =>
                  list.map(rec => (rec.id === r.id ? { ...rec, status: 'Cancelled' as const } : rec))
                );
                this.msg.success(`Requisition ${r.reqCode} has been marked cancelled.`);
              } else {
                this.msg.error(res.message || 'Failed to cancel requisition.');
              }
            },
            error: err => {
              this.msg.error(err?.error?.message || 'Failed to cancel requisition.');
            },
          });
        }
      });
  }

  exportReport(): void {
    const records = this.filteredRecords();
    if (!records.length) {
      this.msg.warning('No requisition records to export.');
      return;
    }
    const headers = ['SL', 'Requisition Code', 'Date', 'Supplier', 'Items Count', 'Total (BDT)', 'Status', 'Created By'];
    const rows = records.map((r, i) => [
      i + 1,
      `"${r.reqCode}"`,
      `"${r.date}"`,
      `"${r.supplier}"`,
      r.itemsCount,
      r.total.toFixed(2),
      `"${r.status}"`,
      `"${r.createdBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitions_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${records.length} requisition records.`);
  }
}
