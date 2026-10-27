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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PosSaleService } from '../../core/services/pos-sale.service';
import { CustomerService } from '../../core/services/customer.service';
import { PrintService } from '../../core/services/print.service';
import { getDefaultMonthDates, formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { Customer, SaleReturn, SaleReturnItem } from '../../core/models/customer.models';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

export interface SaleReturnRow {
  sale_return_no: number;
  return_invoice_no: string;
  original_invoice_no: string;
  customer_no: number;
  customer_name: string;
  customer_phone: string;
  total_items: number;
  gross_refund_price: number;
  discount_deduction: number;
  final_refund_price: number;
  cash_paid_refund: number;
  refund_method: number;
  return_status: number;
  return_date: string;
  items?: readonly SaleReturnItem[];
}

@Component({
  selector: 'app-sale-return-list',
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
    NzDatePickerModule,
    NzPaginationModule,
    PageHeaderComponent,
    EmptyStateComponent,
    MenuActionDirective,
  ],
  templateUrl: './sale-return-list.component.html',
})
export class SaleReturnListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly customerService = inject(CustomerService);
  private readonly printService = inject(PrintService);
  private readonly router = inject(Router);

  returns = signal<SaleReturnRow[]>([]);
  customers = signal<Customer[]>([]);
  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');

  // Search & Filter State
  searchQuery = '';
  filterCustomer: number | null = null;
  defaultDates = getDefaultMonthDates();
  fromDate: Date | null = this.defaultDates.from;
  toDate: Date | null = this.defaultDates.to;

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  // Pagination State
  pageIndex = signal<number>(1);
  pageSize = signal<number>(15);
  pageSizeOptions = [10, 15, 25, 50, 100];
  totalRecords = signal<number>(0);

  // Modal State for Return Details
  isDetailsModalOpen = false;
  selectedReturn: SaleReturn | null = null;
  isLoadingDetails = false;

  hasActiveFilters = computed(() => {
    return !!(this.searchQuery.trim() || this.filterCustomer);
  });

  totalGrossRefund = computed(() => {
    return this.returns().reduce((sum, r) => sum + (r.gross_refund_price || 0), 0);
  });

  totalDiscountDeduction = computed(() => {
    return this.returns().reduce((sum, r) => sum + (r.discount_deduction || 0), 0);
  });

  totalRefundPaid = computed(() => {
    return this.returns().reduce((sum, r) => sum + (r.final_refund_price || 0), 0);
  });

  totalItemsReturned = computed(() => {
    return this.returns().reduce((sum, r) => sum + (r.total_items || 0), 0);
  });

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadReturns();
    });
    this.loadCustomers();
    this.loadReturns();
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

  onSearchChange(): void {
    this.pageIndex.set(1);
    this.searchSubject.next();
  }

  onFilterChange(): void {
    this.pageIndex.set(1);
    this.loadReturns();
  }

  resetFilters(): void {
    const def = getDefaultMonthDates();
    this.fromDate = def.from;
    this.toDate = def.to;
    this.searchQuery = '';
    this.filterCustomer = null;
    this.pageIndex.set(1);
    this.loadReturns();
  }

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadReturns();
    } else if (this.hasActiveFilters()) {
      this.resetFilters();
    }
  }

  loadReturns(): void {
    this.hasError.set(false);
    this.isLoading.set(true);

    const params: Record<string, unknown> = {
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    };

    if (this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }
    if (this.filterCustomer) {
      params['customerNo'] = this.filterCustomer;
    }
    if (this.fromDate) {
      params['startDate'] = formatDateToDdMmYyyy(this.fromDate);
    }
    if (this.toDate) {
      params['endDate'] = formatDateToDdMmYyyy(this.toDate);
    }

    this.posSaleService.getSaleReturns(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res.data;
        const items = data?.items || [];
        this.totalRecords.set(data?.total ?? items.length);

        const rows: SaleReturnRow[] = items.map((r: SaleReturn) => ({
          sale_return_no: r.sale_return_no,
          return_invoice_no: r.return_invoice_no,
          original_invoice_no: r.original_invoice_no,
          customer_no: r.customer_no,
          customer_name: r.customer_name || (r.customer ? r.customer.name : 'Walk-in Customer'),
          customer_phone: r.customer_phone || (r.customer ? r.customer.phone || '' : ''),
          total_items: Number(r.total_items) || 0,
          gross_refund_price: Number(r.gross_refund_price) || 0,
          discount_deduction: Number(r.discount_deduction) || 0,
          final_refund_price: Number(r.final_refund_price) || 0,
          cash_paid_refund: Number(r.cash_paid_refund) || 0,
          refund_method: r.refund_method ?? 1,
          return_status: r.return_status ?? 2,
          return_date: r.return_date ? new Date(r.return_date).toLocaleString('en-GB') : '',
          items: r.items,
        }));

        this.returns.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to retrieve return invoices register.');
      },
    });
  }

  onPageIndexChange(page: number): void {
    this.pageIndex.set(page);
    this.loadReturns();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadReturns();
  }

  viewDetails(row: SaleReturnRow): void {
    this.isLoadingDetails = true;
    this.isDetailsModalOpen = true;
    this.selectedReturn = null;

    this.posSaleService.getSaleReturnById(row.sale_return_no).subscribe({
      next: (res) => {
        this.isLoadingDetails = false;
        this.selectedReturn = res.data ?? null;
      },
      error: (err) => {
        this.isLoadingDetails = false;
        this.msg.error(err?.error?.message || 'Failed to load return items details');
      },
    });
  }

  printReturnReceipt(row: SaleReturnRow | SaleReturn): void {
    const returnNo = row.return_invoice_no;
    const origNo = row.original_invoice_no;
    const custName = row.customer_name || 'Walk-in';
    const custPhone = row.customer_phone || '';
    const dateStr = row.return_date ? new Date(row.return_date).toLocaleDateString('en-GB') : '';
    const timeStr = row.return_date ? new Date(row.return_date).toLocaleTimeString('en-GB') : '';

    const lines = (row.items || []).map(i => ({
      name: i.product_name || (i.product ? i.product.product_name : `Product #${i.product_no}`),
      qty: Number(i.total_qty_pcs) || 1,
      price: Number(i.sale_price) || 0,
      total: Number(i.total_price) || 0,
      batch: i.batch_number || '',
    }));

    this.printService.printSaleInvoice({
      inv: `${returnNo} (Orig: ${origNo})`,
      date: dateStr,
      time: timeStr,
      customer: custName,
      customerPhone: custPhone,
      salesman: 'Admin Cashier',
      paymentMethod: row.refund_method === 2 ? 'Store Credit' : (row.refund_method === 3 ? 'Original Gateway' : 'Cash Drawer Refund'),
      lines: lines.length > 0 ? lines : [{ name: 'Returned Medicines', qty: Number(row.total_items) || 1, price: Number(row.final_refund_price) || 0, total: Number(row.final_refund_price) || 0 }],
      subtotal: Number(row.gross_refund_price) || 0,
      disc: Number(row.discount_deduction) || 0,
      total: Number(row.final_refund_price) || 0,
      paid: Number(row.cash_paid_refund) || Number(row.final_refund_price) || 0,
      due: 0,
    });
  }

  getRefundMethodLabel(method?: number): string {
    switch (method) {
      case 2: return 'Store Credit';
      case 3: return 'Original Gateway';
      default: return 'Cash Drawer';
    }
  }

  getRefundMethodTagColor(method?: number): string {
    switch (method) {
      case 2: return 'blue';
      case 3: return 'purple';
      default: return 'green';
    }
  }

  exportCsv(): void {
    const list = this.returns();
    if (!list.length) {
      this.msg.warning('No return records to export.');
      return;
    }
    const headers = ['Return Invoice No', 'Date', 'Original Invoice No', 'Customer', 'Phone', 'Items Count', 'Gross Refund (৳)', 'Discount Deducted (৳)', 'Final Refund (৳)', 'Refund Method'];
    const rows = list.map(r => [
      `"${r.return_invoice_no}"`,
      `"${r.return_date}"`,
      `"${r.original_invoice_no}"`,
      `"${(r.customer_name || '').replace(/"/g, '""')}"`,
      `"${r.customer_phone || ''}"`,
      r.total_items,
      r.gross_refund_price.toFixed(2),
      r.discount_deduction.toFixed(2),
      r.final_refund_price.toFixed(2),
      `"${this.getRefundMethodLabel(r.refund_method)}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_returns_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} return records to CSV`);
  }
}
