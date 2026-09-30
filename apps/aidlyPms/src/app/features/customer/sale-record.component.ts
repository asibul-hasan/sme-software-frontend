import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
import { PosSaleService } from '../../core/services/pos-sale.service';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';
import { CustomerService } from '../../core/services/customer.service';
import { PrintService } from '../../core/services/print.service';
import { Customer } from '../../core/models/customer.models';

interface SaleRecordRow {
  sale_invoice_no: number;
  inv: string;
  date: string;
  customer: string;
  salesman: string;
  subtotal: number;
  disc: number;
  total: number;
  items: number;
  payment: string;
  paid: number;
  due: number;
  lines: Array<{ name: string; qty: number; price: number; total: number }>;
}

@Component({
  selector: 'app-sale-record',
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
        title="Sales Invoices Register"
        subtitle="Track daily retail & wholesale customer transactions, receipts, and payments"
        formId="SALE_1404"
        [breadcrumbs]="[{ label: 'POS Terminal', url: '/customer/sale' }, { label: 'Sale Records' }]"
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
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Invoice #</label>
            <input
              type="text"
              nz-input
              placeholder="Search invoice..."
              [(ngModel)]="searchInvoice"
              (ngModelChange)="onSearchChange()"
              class="w-36 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Customer</label>
            <nz-select
              [(ngModel)]="filterCustomer"
              (ngModelChange)="onFilterChange()"
              nzPlaceHolder="All Customers"
              class="w-40 shrink-0"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Customers"></nz-option>
              @for (c of customers(); track c.customer_no) {
                <nz-option [nzValue]="c.name" [nzLabel]="c.name"></nz-option>
              }
            </nz-select>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Salesman</label>
            <input
              type="text"
              nz-input
              placeholder="Salesman..."
              [(ngModel)]="searchSalesman"
              (ngModelChange)="onSearchChange()"
              class="w-32 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex items-center pb-0.5">
            <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
              <span nz-icon nzType="clear"></span> Reset
            </button>
          </div>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportSalesCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <a nz-button nzType="primary" routerLink="/customer/sale" class="rounded-md">
            <span nz-icon nzType="shopping-cart"></span> Open POS Terminal
          </a>
        </div>

      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Sales Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3">Bill Info</th>
                <th class="p-3">Sale Info</th>
                <th class="p-3">Payment</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (s of filteredSales(); track s.inv) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-bold text-slate-900 text-xs font-mono mb-0.5">{{ s.inv }}</p>
                    <p class="text-xs text-slate-400 mb-0.5">{{ s.date }}</p>
                    <p class="text-xs text-slate-600 mb-0">
                      <span class="font-semibold">{{ s.customer }}</span> · {{ s.salesman }}
                    </p>
                  </td>

                  <td class="p-3 font-mono text-xs">
                    <p class="text-slate-500 mb-0.5">Sub: ৳ {{ s.subtotal.toFixed(2) }}</p>
                    <p class="text-slate-400 mb-0.5">Disc: ৳ {{ s.disc.toFixed(2) }}</p>
                    <p class="font-bold text-slate-900 mb-0">৳ {{ s.total.toFixed(2) }}</p>
                  </td>

                  <td class="p-3 text-xs">
                    <p class="text-slate-600 mb-1 font-medium">{{ s.items }} items</p>
                    <nz-tag
                      [nzColor]="s.payment === 'Due' ? 'warning' : s.payment === 'bKash' ? 'processing' : 'success'"
                      class="text-[11px]"
                    >
                      {{ s.payment }}
                    </nz-tag>
                  </td>

                  <td class="p-3 font-mono text-xs">
                    <p class="theme-total-text font-semibold mb-0.5">Paid: ৳ {{ s.paid.toFixed(2) }}</p>
                    @if (s.due > 0) {
                      <p class="text-rose-600 font-bold mb-0">Due: ৳ {{ s.due.toFixed(2) }}</p>
                    }
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewInvoiceDetails(s)"
                        nz-tooltip
                        nzTooltipTitle="View Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="printReceipt(s)"
                        nz-tooltip
                        nzTooltipTitle="Print Receipt"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="initiateReturn(s)"
                        nz-tooltip
                        nzTooltipTitle="Sale Return"
                        class="btn-tbl-action btn-tbl-warning"
                      >
                        <span nz-icon nzType="rollback"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteInvoice(s)"
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
                  <td colspan="5" class="p-8 text-center text-slate-400 text-xs">
                    No sale records found matching your filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Invoices: <strong class="text-slate-900 font-semibold font-mono">{{ filteredSales().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Sales: <strong class="theme-total-text font-mono text-sm">৳ {{ totalSalesAmount() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Total Paid: <strong class="text-emerald-700 font-mono font-semibold">৳ {{ totalPaidAmount() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Total Due: <strong class="text-rose-700 font-mono font-semibold">৳ {{ totalDueAmount() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Daily Sales Register</span>
        </div>
      </div>
    </div>

    <!-- Sale Invoice Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsOpen"
      [nzTitle]="'Sales Invoice: ' + selectedSale?.inv"
      [nzFooter]="detailsFooter"
      (nzOnCancel)="isDetailsOpen = false"
      nzWidth="600px"
    >
      <ng-container *nzModalContent>
        @if (selectedSale) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <span class="text-slate-400 block">Customer:</span>
                <span class="font-bold text-slate-800 text-sm">{{ selectedSale.customer }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Date:</span>
                <span class="font-semibold text-slate-700">{{ selectedSale.date }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Salesman:</span>
                <span class="font-medium text-slate-700">{{ selectedSale.salesman }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Payment Method:</span>
                <nz-tag [nzColor]="selectedSale.payment === 'Due' ? 'warning' : 'success'">
                  {{ selectedSale.payment }}
                </nz-tag>
              </div>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th class="p-2.5">Medicine</th>
                    <th class="p-2.5 text-center">Qty</th>
                    <th class="p-2.5 text-right">Price</th>
                    <th class="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of selectedSale.lines; track item.name) {
                    <tr>
                      <td class="p-2.5 font-medium text-slate-800">{{ item.name }}</td>
                      <td class="p-2.5 text-center font-mono">{{ item.qty }}</td>
                      <td class="p-2.5 text-right font-mono">৳ {{ item.price.toFixed(2) }}</td>
                      <td class="p-2.5 text-right font-mono font-bold theme-total-text">
                        ৳ {{ item.total.toFixed(2) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="flex justify-between items-center text-sm font-semibold pt-2 border-t border-slate-100">
              <span class="text-slate-700">Total Invoice Amount:</span>
              <span class="font-mono theme-total-text text-base">৳ {{ selectedSale.total.toFixed(2) }}</span>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #detailsFooter>
        <button nz-button nzType="default" (click)="isDetailsOpen = false">Close</button>
        <button nz-button nzType="primary" (click)="printReceipt(selectedSale!)">
          <span nz-icon nzType="printer"></span> Print Receipt
        </button>
      </ng-template>
    </nz-modal>

    <!-- Sale Receipt & Invoice Preview Modal -->
    <nz-modal
      [(nzVisible)]="isReceiptModalVisible"
      nzTitle="Sale Receipt & Tax Invoice Preview"
      [nzCentered]="true"
      [nzWidth]="480"
      [nzFooter]="receiptFooter"
      (nzOnCancel)="isReceiptModalVisible = false"
    >
      <ng-container *nzModalContent>
        @if (printingSale) {
          <div class="p-4 bg-white text-slate-800 rounded-lg border border-slate-200 shadow-xs max-w-[440px] mx-auto select-none">
            <div class="text-center pb-2.5 border-b-2 border-blue-900">
              <div class="text-base font-extrabold text-blue-700 tracking-wide uppercase">Aidly Model Pharmacy</div>
              <div class="text-[11px] text-slate-600">Main Branch (Banani), Dhaka</div>
              <div class="text-[10px] text-slate-500">Hotline: +880 1700-000000 | DL: DL-2024-DH-8841</div>
            </div>

            <div class="text-center my-2 font-bold text-xs tracking-wider text-slate-900 uppercase">
              SALE RECEIPT
            </div>

            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] space-y-1 mb-2">
              <div class="flex justify-between"><span class="text-slate-500">Bill No:</span><span class="font-bold font-mono text-slate-900">{{ printingSale.inv }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Date:</span><span class="font-mono text-slate-700">{{ printingSale.date }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Customer:</span><span class="font-medium text-slate-800">{{ printingSale.customer }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Salesman:</span><span class="font-medium text-slate-800">{{ printingSale.salesman }}</span></div>
            </div>

            <table class="w-full text-[11px] my-2 border-collapse">
              <thead>
                <tr class="bg-slate-100 text-slate-700 font-semibold border-y border-slate-300">
                  <th class="py-1 px-1.5 text-left">Item Description</th>
                  <th class="py-1 px-1 text-center w-12">Qty</th>
                  <th class="py-1 px-1 text-right w-20">Price</th>
                  <th class="py-1 px-1.5 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of printingSale.lines; track item.name) {
                  <tr>
                    <td class="py-1 px-1.5 font-medium text-slate-800">{{ item.name }}</td>
                    <td class="py-1 px-1 text-center font-mono">{{ item.qty }}</td>
                    <td class="py-1 px-1 text-right font-mono">৳ {{ item.price | number: '1.2-2' }}</td>
                    <td class="py-1 px-1.5 text-right font-mono font-bold text-slate-900">৳ {{ item.total | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="border border-slate-200 rounded-md p-2 bg-slate-50 text-[11px] space-y-1 mt-2">
              <div class="flex justify-between"><span class="text-slate-600">Subtotal:</span><span class="font-mono font-semibold">৳ {{ printingSale.subtotal | number: '1.2-2' }}</span></div>
              @if (printingSale.disc > 0) {
                <div class="flex justify-between text-emerald-700"><span>Discount:</span><span class="font-mono font-semibold">-৳ {{ printingSale.disc | number: '1.2-2' }}</span></div>
              }
              <div class="flex justify-between font-bold text-xs pt-1.5 border-t border-blue-200 text-blue-900 bg-blue-50/60 -mx-2 px-2 py-1">
                <span>Net Payable:</span>
                <span class="font-mono">৳ {{ printingSale.total | number: '1.2-2' }}</span>
              </div>
              <div class="flex justify-between"><span class="text-slate-600">Paid Amount:</span><span class="font-mono font-semibold">৳ {{ printingSale.paid | number: '1.2-2' }}</span></div>
              @if (printingSale.due > 0) {
                <div class="flex justify-between text-rose-600 font-bold"><span>Due Remaining:</span><span class="font-mono">৳ {{ printingSale.due | number: '1.2-2' }}</span></div>
              }
            </div>

            <div class="text-center pt-2.5 text-[10px] text-slate-500 border-t border-dashed border-slate-300 mt-2.5">
              <div class="font-bold text-slate-700">*** Thank You for Shopping! ***</div>
              <div class="text-[9px]">Medicines sold cannot be returned without receipt.</div>
              <div class="text-[8.5px] text-slate-400 mt-0.5">This is generated by AidlyPms no authority signature is required</div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #receiptFooter>
        <button nz-button nzType="default" (click)="isReceiptModalVisible = false">Close</button>
        <button nz-button nzType="default" (click)="triggerPrint('thermal')">
          <span nz-icon nzType="snippets"></span> 80mm Slip
        </button>
        <button nz-button nzType="primary" (click)="triggerPrint('a4')">
          <span nz-icon nzType="printer"></span> Print A4 Invoice / PDF
        </button>
      </ng-template>
    </nz-modal>
  `,

})
export class SaleRecordComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly customerService = inject(CustomerService);
  private readonly printService = inject(PrintService);
  private readonly router = inject(Router);

  sales = signal<SaleRecordRow[]>([]);
  customers = signal<Customer[]>([]);
  isLoading = signal(false);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  // Initialize with standard 1-month date range default
  defaultDates = getDefaultMonthDateRange();
  fromDate = this.defaultDates.fromDate;
  toDate = this.defaultDates.toDate;
  searchInvoice = '';
  filterCustomer = '';
  searchSalesman = '';

  filteredSales = computed(() => {
    const invQ = this.searchInvoice.trim().toLowerCase();
    const custQ = this.filterCustomer;
    const smanQ = this.searchSalesman.trim().toLowerCase();

    return this.sales().filter(s => {
      const matchInv = !invQ || s.inv.toLowerCase().includes(invQ);
      const matchCust = !custQ || s.customer === custQ;
      const matchSman = !smanQ || s.salesman.toLowerCase().includes(smanQ);
      return matchInv && matchCust && matchSman;
    });
  });

  totalSalesAmount = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.total || 0), 0));
  totalPaidAmount = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.paid || 0), 0));
  totalDueAmount = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.due || 0), 0));

  isDetailsOpen = false;
  selectedSale: SaleRecordRow | null = null;

  isReceiptModalVisible = false;
  printingSale: SaleRecordRow | null = null;

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadRecords();
    });
    this.loadCustomers();
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadCustomers(): void {
    this.customerService.getCustomers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.customers.set([...res.data.items]);
        }
      },
    });
  }

  onFilterChange(): void {
    this.loadRecords();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  loadRecords(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 50,
    };
    if (this.searchInvoice.trim()) params['search'] = this.searchInvoice.trim();
    if (this.fromDate) params['startDate'] = this.fromDate;
    if (this.toDate) params['endDate'] = this.toDate;
    if (this.filterCustomer) params['search'] = this.filterCustomer;

    this.posSaleService.getSaleRecords(params).subscribe({
      next: (res) => {
        const invoices = res.data?.items || [];
        const rows: SaleRecordRow[] = invoices.map(inv => ({
          sale_invoice_no: inv.sale_invoice_no,
          inv: inv.sales_number || `INV-${inv.sale_invoice_no}`,
          date: inv.sale_timestamp ? new Date(inv.sale_timestamp).toLocaleString('en-GB') : '',
          customer: inv.customer?.name || inv.customer_name || 'Walk-in',
          salesman: 'Admin',
          subtotal: Number(inv.gross_total_price) || 0,
          disc: Number(inv.discount_value) || 0,
          total: Number(inv.final_price) || 0,
          items: inv.total_items || 0,
          payment: inv.due_amount > 0 ? 'Due' : (inv.payment_method === 2 ? 'Card' : (inv.payment_method === 3 ? 'MFS' : 'Cash')),
          paid: (Number(inv.final_price) || 0) - (Number(inv.due_amount) || 0),
          due: Number(inv.due_amount) || 0,
          lines: (inv.items || []).map(item => ({
            name: item.product?.product_name || item.product_name || `Product #${item.product_no}`,
            qty: item.sale_qty,
            price: Number(item.unit_sale_price) || 0,
            total: Number(item.total_price) || 0,
          })),
        }));
        this.sales.set(rows);
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
    this.filterCustomer = '';
    this.searchSalesman = '';
    this.loadRecords();
  }

  printReceipt(s: SaleRecordRow): void {
    this.printingSale = s;
    this.isReceiptModalVisible = true;
  }

  triggerPrint(format: 'a4' | 'thermal' = 'a4'): void {
    if (!this.printingSale) return;
    const sale = this.printingSale;
    const [datePart, timePart] = sale.date.includes(',') ? sale.date.split(',') : [sale.date, ''];
    this.printService.printSaleInvoice({
      inv: sale.inv,
      date: datePart.trim(),
      time: timePart.trim(),
      customer: sale.customer,
      salesman: sale.salesman,
      paymentMethod: sale.payment,
      lines: sale.lines.map(line => ({
        name: line.name,
        qty: line.qty,
        price: line.price,
        total: line.total,
      })),
      subtotal: sale.subtotal,
      disc: sale.disc,
      total: sale.total,
      paid: sale.paid,
      due: sale.due,
    }, format);
  }

  viewInvoiceDetails(s: SaleRecordRow): void {
    this.selectedSale = s;
    this.isDetailsOpen = true;
  }

  initiateReturn(s: SaleRecordRow): void {
    this.router.navigate(['/customer/returns'], { queryParams: { invoice: s.inv } });
  }

  deleteInvoice(s: SaleRecordRow): void {
    this.modal.confirmAction(
      'Void Sale Invoice?',
      `Are you sure you want to void and reverse sales invoice "${s.inv}" for ${s.customer}? Sold medicines will be restored back into inventory.`,
      'Void Invoice',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.posSaleService.voidSale(s.sale_invoice_no).subscribe({
          next: (res) => {
            if (res.success) {
              this.sales.update(list => list.filter(item => item.inv !== s.inv));
              this.msg.success(`Sales invoice "${s.inv}" voided and stock restored successfully`);
              if (this.selectedSale?.inv === s.inv) {
                this.isDetailsOpen = false;
              }
            } else {
              this.msg.error(res.message || 'Failed to void invoice');
            }
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to void invoice');
          }
        });
      }
    });
  }

  exportSalesCsv(): void {
    const list = this.filteredSales();
    if (!list.length) {
      this.msg.warning('No sales records to export.');
      return;
    }
    const headers = ['Invoice No', 'Date', 'Customer', 'Salesman', 'Items Count', 'Payment Method', 'Subtotal (৳)', 'Discount (৳)', 'Net Total (৳)', 'Paid (৳)', 'Due (৳)'];
    const rows = list.map(s => [
      `"${s.inv}"`,
      `"${s.date}"`,
      `"${(s.customer || '').replace(/"/g, '""')}"`,
      `"${(s.salesman || '').replace(/"/g, '""')}"`,
      s.items,
      `"${s.payment}"`,
      s.subtotal.toFixed(2),
      s.disc.toFixed(2),
      s.total.toFixed(2),
      s.paid.toFixed(2),
      s.due.toFixed(2)
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pos_sales_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} sales records to CSV`);
  }
}

