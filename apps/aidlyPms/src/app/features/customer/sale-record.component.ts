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
import { PosSaleService } from '../../core/services/pos-sale.service';
import { getDefaultMonthDateRange } from '../../shared/utils/date-range.util';

interface SaleRecordRow {
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
              <nz-option nzValue="Rafiqul Islam" nzLabel="Rafiqul Islam"></nz-option>
              <nz-option nzValue="Walk-in" nzLabel="Walk-in"></nz-option>
              <nz-option nzValue="Meena Begum" nzLabel="Meena Begum"></nz-option>
              <nz-option nzValue="Al-Amin Hossain" nzLabel="Al-Amin Hossain"></nz-option>
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
  `,
})
export class SaleRecordComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  sales = signal<SaleRecordRow[]>([
    {
      inv: 'INV-2026-1029',
      date: '16-09-2026 11:42',
      customer: 'Rafiqul Islam',
      salesman: 'Admin',
      subtotal: 46.0,
      disc: 0,
      total: 46.0,
      items: 3,
      payment: 'Cash',
      paid: 50.0,
      due: 0,
      lines: [
        { name: 'Napa 500mg Tablet', qty: 20, price: 1.2, total: 24.0 },
        { name: 'Ceevit 250mg Chewable', qty: 10, price: 2.2, total: 22.0 },
      ],
    },
    {
      inv: 'INV-2026-1028',
      date: '16-09-2026 10:15',
      customer: 'Walk-in',
      salesman: 'Admin',
      subtotal: 120.0,
      disc: 5.0,
      total: 115.0,
      items: 5,
      payment: 'bKash',
      paid: 115.0,
      due: 0,
      lines: [
        { name: 'Seclo 20mg Capsule', qty: 10, price: 7.0, total: 70.0 },
        { name: 'Ace 500mg Tablet', qty: 25, price: 2.0, total: 50.0 },
      ],
    },
    {
      inv: 'INV-2026-1027',
      date: '15-09-2026 18:30',
      customer: 'Meena Begum',
      salesman: 'Sumon',
      subtotal: 840.0,
      disc: 40.0,
      total: 800.0,
      items: 8,
      payment: 'Due',
      paid: 0,
      due: 800.0,
      lines: [
        { name: 'Maxpro 20mg Capsule', qty: 50, price: 9.0, total: 450.0 },
        { name: 'Monas 10mg Tablet', qty: 25, price: 15.6, total: 390.0 },
      ],
    },
    {
      inv: 'INV-2026-1026',
      date: '15-09-2026 16:05',
      customer: 'Al-Amin Hossain',
      salesman: 'Admin',
      subtotal: 2400.0,
      disc: 100.0,
      total: 2300.0,
      items: 12,
      payment: 'Cash',
      paid: 2300.0,
      due: 0,
      lines: [
        { name: 'Sergel 20mg Capsule (Box)', qty: 3, price: 800.0, total: 2400.0 },
      ],
    },
  ]);

  private readonly posSaleService = inject(PosSaleService);
  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  isLoading = signal(false);

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

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadRecords();
    });
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onFilterChange(): void {
    this.loadRecords();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  loadRecords(): void {
    this.isLoading.set(true);
    const params = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      search: this.searchInvoice.trim(),
      customer: this.filterCustomer,
      salesman: this.searchSalesman.trim(),
    };
    this.posSaleService.getSaleRecords(params).subscribe({
      next: () => {
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
    this.msg.success(`Printing POS sales receipt for ${s.inv}`);
  }

  viewInvoiceDetails(s: SaleRecordRow): void {
    this.selectedSale = s;
    this.isDetailsOpen = true;
  }

  initiateReturn(s: SaleRecordRow): void {
    this.msg.info(`Redirecting to Return Entry for invoice ${s.inv}`);
  }

  deleteInvoice(s: SaleRecordRow): void {
    this.modal.confirmAction(
      'Void Sale Invoice?',
      `Are you sure you want to void and reverse sales invoice "${s.inv}" for ${s.customer}? Compensating double-entry ledger reversal will be recorded.`,
      'Void Invoice',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.sales.update(list => list.filter(item => item.inv !== s.inv));
        this.msg.success(`Sales invoice "${s.inv}" voided successfully`);
      }
    });
  }
}
