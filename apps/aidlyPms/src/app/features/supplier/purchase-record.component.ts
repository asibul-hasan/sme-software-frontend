import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { SupplierService } from '../../core/services/supplier.service';
import { SuppSupplier } from '../../core/models/supplier.models';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface PurchaseRecordRow {
  id: string;
  ref: string;
  date: string;
  supplier: string;
  gross: number;
  disc: number;
  net: number;
  itemsCount: number;
  type: string;
  lines: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
}

@Component({
  selector: 'app-purchase-record',
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
    NzTagModule,
    NzSpinModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Purchase Records (Invoices History)"
        subtitle="Review past supplier purchase orders, challans, and goods received notes"
        formId="PUR_1504"
        [breadcrumbs]="[{ label: 'Suppliers', url: '/supplier/list' }, { label: 'Purchase Records' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-nowrap py-1">
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">From Date</label>
            <input
              type="date"
              nz-input
              [(ngModel)]="fromDate"
              (ngModelChange)="onFilterChange()"
              class="w-32 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">To Date</label>
            <input
              type="date"
              nz-input
              [(ngModel)]="toDate"
              (ngModelChange)="onFilterChange()"
              class="w-32 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Invoice / Challan #</label>
            <input
              type="text"
              nz-input
              placeholder="Search invoice #..."
              [(ngModel)]="searchInvoice"
              (ngModelChange)="onSearchChange()"
              class="w-36 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Supplier</label>
            <nz-select
              [(ngModel)]="filterSupplier"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Suppliers"
              class="w-40 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Suppliers"></nz-option>
              @for (s of suppliers(); track s.supplier_no) {
                <nz-option [nzValue]="s.name" [nzLabel]="s.name"></nz-option>
              }
            </nz-select>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Purchase Type</label>
            <nz-select
              [(ngModel)]="filterType"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Types"
              class="w-44 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Types"></nz-option>
              <nz-option nzValue="INVENTORY PURCHASED" nzLabel="INVENTORY PURCHASED"></nz-option>
              <nz-option nzValue="OPENING STOCK" nzLabel="OPENING STOCK"></nz-option>
            </nz-select>
          </div>
          <div class="flex items-center pb-0.5">
            <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
              <span nz-icon nzType="clear"></span> Reset
            </button>
          </div>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="primary" routerLink="/supplier/purchase" class="rounded-md">
            <span nz-icon nzType="plus"></span> New Purchase Entry
          </a>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Records Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3">Bill Info</th>
                <th class="p-3">Inventory Info</th>
                <th class="p-3 text-center w-40">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredRecords(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ r.ref }}</p>
                    <p class="text-xs text-slate-400 mb-0">
                      {{ r.date }} · <span class="text-slate-600 font-medium">{{ r.supplier }}</span>
                    </p>
                  </td>

                  <td class="p-3 font-mono text-xs">
                    <p class="text-slate-700 mb-0.5">Gross: ৳ {{ r.gross.toLocaleString() }}</p>
                    <p class="text-slate-400 mb-0.5">Disc: ৳ {{ r.disc.toLocaleString() }}</p>
                    <p class="font-bold theme-total-text mb-0">Net: ৳ {{ r.net.toLocaleString() }}</p>
                  </td>

                  <td class="p-3 text-xs">
                    <p class="text-slate-700 font-medium mb-1">{{ r.itemsCount }} items</p>
                    <nz-tag [nzColor]="r.type === 'OPENING STOCK' ? 'blue' : 'green'" class="text-[11px] font-semibold">
                      {{ r.type }}
                    </nz-tag>
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewInvoiceDetails(r)"
                        nz-tooltip
                        nzTooltipTitle="View Invoice Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="printInvoice(r)"
                        nz-tooltip
                        nzTooltipTitle="Print Voucher"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="initiateReturn(r)"
                        nz-tooltip
                        nzTooltipTitle="Supplier Return"
                        class="btn-tbl-action btn-tbl-warning"
                      >
                        <span nz-icon nzType="rollback"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteInvoice(r)"
                        nz-tooltip
                        nzTooltipTitle="Delete Invoice"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No purchase records match your search criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Total Invoices: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRecords().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Gross: <strong class="text-slate-900 font-semibold font-mono">৳ {{ totalPurchaseGross() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Disc: <strong class="text-slate-900 font-semibold font-mono">৳ {{ totalPurchaseDisc() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Net: <strong class="theme-total-text font-mono text-sm">৳ {{ totalPurchaseNet() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Audit History Log</span>
        </div>
      </div>
    </div>

    <!-- Invoice Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsOpen"
      [nzTitle]="'Purchase Invoice Details: ' + selectedRecord?.ref"
      [nzFooter]="detailsFooter"
      (nzOnCancel)="isDetailsOpen = false"
      nzWidth="680px"
    >
      <ng-container *nzModalContent>
        @if (selectedRecord) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <span class="text-slate-400 block">Supplier:</span>
                <span class="font-bold text-slate-800 text-sm">{{ selectedRecord.supplier }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Date & Time:</span>
                <span class="font-semibold text-slate-700">{{ selectedRecord.date }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Inventory Type:</span>
                <nz-tag [nzColor]="selectedRecord.type === 'OPENING STOCK' ? 'blue' : 'green'">
                  {{ selectedRecord.type }}
                </nz-tag>
              </div>
              <div>
                <span class="text-slate-400 block">Total Net Amount:</span>
                <span class="font-mono font-bold theme-total-text text-sm">
                  ৳ {{ selectedRecord.net.toLocaleString() }}
                </span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th class="p-2.5">Item</th>
                    <th class="p-2.5 text-center">Qty</th>
                    <th class="p-2.5 text-right">Unit Price</th>
                    <th class="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of selectedRecord.lines; track item.name) {
                    <tr>
                      <td class="p-2.5 font-medium text-slate-800">{{ item.name }}</td>
                      <td class="p-2.5 text-center font-mono">{{ item.qty }}</td>
                      <td class="p-2.5 text-right font-mono">৳ {{ item.unitPrice.toFixed(2) }}</td>
                      <td class="p-2.5 text-right font-mono font-bold theme-total-text">
                        ৳ {{ item.total.toLocaleString() }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #detailsFooter>
        <button nz-button nzType="default" (click)="isDetailsOpen = false">Close</button>
        <button nz-button nzType="primary" (click)="printInvoice(selectedRecord!)">
          <span nz-icon nzType="printer"></span> Print Invoice
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class PurchaseRecordComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  records = signal<PurchaseRecordRow[]>([]);
  suppliers = signal<SuppSupplier[]>([]);

  private readonly supplierService = inject(SupplierService);
  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  isLoading = signal(false);

  // Initialize with standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  searchInvoice = '';
  filterSupplier = '';
  filterType = '';

  filteredRecords = computed(() => {
    const inv = this.searchInvoice.trim().toLowerCase();
    const sup = this.filterSupplier;
    const type = this.filterType;

    return this.records().filter(r => {
      const matchInv = !inv || r.ref.toLowerCase().includes(inv);
      const matchSup = !sup || r.supplier === sup;
      const matchType = !type || r.type === type;
      return matchInv && matchSup && matchType;
    });
  });

  totalPurchaseGross = computed(() => this.filteredRecords().reduce((sum, r) => sum + (r.gross || 0), 0));
  totalPurchaseDisc = computed(() => this.filteredRecords().reduce((sum, r) => sum + (r.disc || 0), 0));
  totalPurchaseNet = computed(() => this.filteredRecords().reduce((sum, r) => sum + (r.net || 0), 0));

  // Details Modal
  isDetailsOpen = false;
  selectedRecord: PurchaseRecordRow | null = null;

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadPurchases();
    });
    this.loadSuppliers();
    this.loadPurchases();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.suppliers.set([...res.data.items]);
        }
      },
    });
  }

  onFilterChange(): void {
    this.loadPurchases();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  loadPurchases(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 50,
    };
    if (this.fromDate) params['fromDate'] = this.fromDate;
    if (this.toDate) params['toDate'] = this.toDate;
    if (this.searchInvoice.trim()) params['search'] = this.searchInvoice.trim();
    if (this.filterSupplier) params['search'] = this.filterSupplier;
    if (this.filterType) params['inventoryType'] = this.filterType === 'OPENING STOCK' ? 2 : 1;

    this.supplierService.getPurchases(params).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.records.set(items.map(inv => ({
          id: inv.purchase_invoice_no.toString(),
          ref: inv.inventory_number || inv.supplier_invoice_no || `PUR-${inv.purchase_invoice_no}`,
          date: inv.purchase_date ? new Date(inv.purchase_date).toLocaleString('en-GB') : '',
          supplier: inv.supplier?.name || 'Supplier',
          gross: Number(inv.gross_total_price) || 0,
          disc: Number(inv.discount_value) || 0,
          net: Number(inv.final_price) || 0,
          itemsCount: inv.total_items || 0,
          type: inv.inventory_type === 2 ? 'OPENING STOCK' : 'INVENTORY PURCHASED',
          lines: (inv.items || []).map(i => ({
            name: i.product?.product_name || `Product #${i.product_no}`,
            qty: i.total_qty_pcs || i.box_qty,
            unitPrice: Number(i.unit_cost) || Number(i.btp) || 0,
            total: Number(i.total_price) || 0,
          })),
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  resetFilters(): void {
    const def = getDefaultMonthDateRange();
    this.fromDate = def.fromDate;
    this.toDate = def.toDate;
    this.searchInvoice = '';
    this.filterSupplier = '';
    this.filterType = '';
    this.loadPurchases();
  }

  viewInvoiceDetails(r: PurchaseRecordRow): void {
    this.selectedRecord = r;
    this.isDetailsOpen = true;
  }

  printInvoice(r: PurchaseRecordRow): void {
    this.msg.success(`Printing purchase invoice voucher: ${r.ref}`);
  }

  initiateReturn(r: PurchaseRecordRow): void {
    this.msg.info(`Initiating supplier return for ${r.ref} (${r.supplier})`);
  }

  deleteInvoice(r: PurchaseRecordRow): void {
    this.modal.confirmAction(
      'Void Purchase Invoice?',
      `Are you sure you want to void purchase invoice "${r.ref}" from ${r.supplier}? Reverse ledger postings will be generated.`,
      'Void Invoice',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.records.update(list => list.filter(item => item.id !== r.id));
        this.msg.success(`Invoice "${r.ref}" voided successfully`);
      }
    });
  }
}
