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
import { ModalService } from '../../core/services/modal.service';
import { PosSaleService } from '../../core/services/pos-sale.service';
import { getDefaultMonthDates, formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
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
    NzDatePickerModule,
    NzPaginationModule,
    PageHeaderComponent,
  ],
  templateUrl: './sale-record.component.html',
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
  defaultDates = getDefaultMonthDates();
  fromDate: Date | null = this.defaultDates.from;
  toDate: Date | null = this.defaultDates.to;
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

  // Sorting State
  sortColumn = signal<keyof SaleRecordRow | ''>('sale_invoice_no');
  sortDirection = signal<'asc' | 'desc'>('desc');

  onSort(col: keyof SaleRecordRow): void {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set(col === 'customer' || col === 'salesman' ? 'asc' : 'desc');
    }
    this.pageIndex.set(1);
  }

  sortedSales = computed(() => {
    const list = [...this.filteredSales()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return list;
    return list.sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (va == null && vb == null) return 0;
      if (va == null) return dir === 'asc' ? -1 : 1;
      if (vb == null) return dir === 'asc' ? 1 : -1;
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  // Pagination State
  pageIndex = signal<number>(1);
  pageSize = signal<number>(15);
  pageSizeOptions = [10, 15, 25, 50, 100];

  paginatedSales = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    return this.sortedSales().slice(start, start + this.pageSize());
  });

  onPageIndexChange(page: number): void {
    this.pageIndex.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }

  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }

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
    this.pageIndex.set(1);
    this.loadRecords();
  }

  onSearchChange(): void {
    this.pageIndex.set(1);
    this.searchSubject.next();
  }

  loadRecords(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 200,
    };
    if (this.searchInvoice.trim()) params['search'] = this.searchInvoice.trim();
    if (this.fromDate) params['startDate'] = formatDateToDdMmYyyy(this.fromDate);
    if (this.toDate) params['endDate'] = formatDateToDdMmYyyy(this.toDate);
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
    const def = getDefaultMonthDates();
    this.fromDate = def.from;
    this.toDate = def.to;
    this.searchInvoice = '';
    this.filterCustomer = '';
    this.searchSalesman = '';
    this.pageIndex.set(1);
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
    this.router.navigate(['/customer/returns'], {
      queryParams: {
        invoice: s.inv,
        saleInvoiceNo: s.sale_invoice_no,
      },
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

