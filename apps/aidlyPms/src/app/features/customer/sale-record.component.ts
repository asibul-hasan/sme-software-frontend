import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
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
import {
  DataTableComponent,
  TableColumn,
  TableGroupByOption,
  TableExportContext,
} from '../../shared/components/data-table/data-table.component';
import { TableExportService } from '../../core/services/table-export.service';
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
  sale_type: string;
  subtotal: number;
  disc: number;
  total: number;
  items: number;
  payment: string;
  paid: number;
  due: number;
  is_returned: boolean;
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
    DataTableComponent,
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
  private readonly tableExportService = inject(TableExportService);

  sales = signal<SaleRecordRow[]>([]);
  customers = signal<Customer[]>([]);
  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');

  hasActiveFilters = computed(() => {
    return !!(this.searchInvoice.trim() || this.filterCustomer || this.searchSalesman.trim());
  });

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadRecords();
    } else if (this.hasActiveFilters()) {
      this.resetFilters();
    } else {
      this.router.navigate(['/customer/pos']);
    }
  }

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

  // Natural descending order by latest sale invoice
  sortedSales = computed(() => {
    const list = [...this.filteredSales()];
    return list.sort((a, b) => (b.sale_invoice_no || 0) - (a.sale_invoice_no || 0));
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

  // Template References for Standard ERP Data Table
  @ViewChild('invIdTpl', { static: true }) invIdTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('salesmanTpl', { static: true }) salesmanTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('saleTypeTpl', { static: true }) saleTypeTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('totalTpl', { static: true }) totalTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('discTpl', { static: true }) discTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('paidTpl', { static: true }) paidTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('dueTpl', { static: true }) dueTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;

  // Optional Columns in Customizer
  @ViewChild('customerTpl', { static: true }) customerTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('subtotalTpl', { static: true }) subtotalTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('itemsTpl', { static: true }) itemsTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;
  @ViewChild('paymentTpl', { static: true }) paymentTpl!: TemplateRef<{ $implicit: SaleRecordRow }>;

  tableColumns: TableColumn<SaleRecordRow>[] = [];

  readonly saleGroupByOptions: TableGroupByOption[] = [
    {
      key: 'customer',
      label: 'Customer',
      groupValueFn: (s: SaleRecordRow) => s.customer || 'Walk-in',
      summaryFn: (items: SaleRecordRow[]) => {
        const total = items.reduce((sum, s) => sum + (s.total || 0), 0);
        const paid = items.reduce((sum, s) => sum + (s.paid || 0), 0);
        const due = items.reduce((sum, s) => sum + (s.due || 0), 0);
        return `Count: ${items.length} | Sales: ৳ ${total.toFixed(2)} | Paid: ৳ ${paid.toFixed(2)} | Due: ৳ ${due.toFixed(2)}`;
      },
    },
    {
      key: 'sale_type',
      label: 'Sale Type',
      groupValueFn: (s: SaleRecordRow) => s.sale_type || 'Retail',
      summaryFn: (items: SaleRecordRow[]) => {
        const total = items.reduce((sum, s) => sum + (s.total || 0), 0);
        const paid = items.reduce((sum, s) => sum + (s.paid || 0), 0);
        const due = items.reduce((sum, s) => sum + (s.due || 0), 0);
        return `Count: ${items.length} | Sales: ৳ ${total.toFixed(2)} | Paid: ৳ ${paid.toFixed(2)} | Due: ৳ ${due.toFixed(2)}`;
      },
    },
    {
      key: 'payment',
      label: 'Payment Method',
      groupValueFn: (s: SaleRecordRow) => s.payment || 'Cash',
      summaryFn: (items: SaleRecordRow[]) => {
        const total = items.reduce((sum, s) => sum + (s.total || 0), 0);
        const paid = items.reduce((sum, s) => sum + (s.paid || 0), 0);
        const due = items.reduce((sum, s) => sum + (s.due || 0), 0);
        return `Count: ${items.length} | Sales: ৳ ${total.toFixed(2)} | Paid: ৳ ${paid.toFixed(2)} | Due: ৳ ${due.toFixed(2)}`;
      },
    },
    {
      key: 'salesman',
      label: 'Salesman',
      groupValueFn: (s: SaleRecordRow) => s.salesman || 'Admin',
      summaryFn: (items: SaleRecordRow[]) => {
        const total = items.reduce((sum, s) => sum + (s.total || 0), 0);
        return `Count: ${items.length} | Total: ৳ ${total.toFixed(2)}`;
      },
    },
    {
      key: 'date',
      label: 'Date',
      groupValueFn: (s: SaleRecordRow) => (s.date ? s.date.split(',')[0].trim() : 'N/A'),
      summaryFn: (items: SaleRecordRow[]) => {
        const total = items.reduce((sum, s) => sum + (s.total || 0), 0);
        return `Count: ${items.length} | Sales: ৳ ${total.toFixed(2)}`;
      },
    },
  ];

  initColumns(): void {
    this.tableColumns = [
      {
        title: 'Invoice ID',
        key: 'inv',
        sortable: true,
        width: '140px',
        align: 'left',
        template: this.invIdTpl,
      },
      {
        title: 'Date',
        key: 'date',
        sortable: true,
        width: '150px',
        align: 'center',
        template: this.dateTpl,
      },
      {
        title: 'Customer',
        key: 'customer',
        sortable: true,
        align: 'left',
        width: '160px',
        template: this.customerTpl,
      },
      {
        title: 'Salesman',
        key: 'salesman',
        sortable: true,
        width: '120px',
        align: 'left',
        template: this.salesmanTpl,
      },
      {
        title: 'Sale Type',
        key: 'sale_type',
        sortable: true,
        width: '110px',
        align: 'center',
        template: this.saleTypeTpl,
      },
      {
        title: 'Items',
        key: 'items',
        sortable: true,
        align: 'center',
        width: '90px',
        template: this.itemsTpl,
      },
      {
        title: 'Payment Method',
        key: 'payment',
        sortable: true,
        align: 'center',
        width: '130px',
        template: this.paymentTpl,
      },
      {
        title: 'Subtotal',
        key: 'subtotal',
        sortable: true,
        align: 'right',
        width: '120px',
        template: this.subtotalTpl,
      },
      {
        title: 'Discount',
        key: 'disc',
        sortable: true,
        align: 'right',
        width: '110px',
        template: this.discTpl,
      },
      {
        title: 'Total',
        key: 'total',
        sortable: true,
        align: 'right',
        width: '120px',
        template: this.totalTpl,
      },
      {
        title: 'Paid',
        key: 'paid',
        sortable: true,
        align: 'right',
        width: '120px',
        template: this.paidTpl,
      },
      {
        title: 'Due',
        key: 'due',
        sortable: true,
        align: 'right',
        width: '120px',
        template: this.dueTpl,
      },
      {
        title: 'Action',
        align: 'center',
        width: '170px',
        right: '0px',
        canHide: false,
        template: this.actionTpl,
      },
    ];
  }

  ngOnInit(): void {
    this.initColumns();
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
    this.hasError.set(false);
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
          sale_type: inv.sale_mode === 2 ? 'Wholesale' : 'Retail',
          subtotal: Number(inv.gross_total_price) || 0,
          disc: Number(inv.discount_value) || 0,
          total: Number(inv.final_price) || 0,
          items: inv.total_items || 0,
          payment: inv.due_amount > 0 ? 'Due' : (inv.payment_method === 2 ? 'Card' : (inv.payment_method === 3 ? 'MFS' : 'Cash')),
          paid: (Number(inv.final_price) || 0) - (Number(inv.due_amount) || 0),
          due: Number(inv.due_amount) || 0,
          is_returned: !!inv.is_returned,
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
        this.hasError.set(true);
        this.errorMessage.set('Failed to retrieve sales records.');
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
    this.router.navigate(['/customer/sale/return'], {
      queryParams: {
        invoiceId: s.inv,
        invoice: s.inv,
        saleInvoiceNo: s.sale_invoice_no,
      },
    });
  }

  async onExport(ctx: TableExportContext<SaleRecordRow>): Promise<void> {
    const visibleCols = ctx.columns.filter((c) => c.title !== 'Action');
    if (!visibleCols.length) {
      this.msg.warning('No visible columns to export.');
      return;
    }

    const dateSubtitle =
      this.fromDate && this.toDate
        ? `Period: ${formatDateToDdMmYyyy(this.fromDate)} to ${formatDateToDdMmYyyy(this.toDate)}`
        : `Generated: ${new Date().toLocaleString('en-GB')}`;

    const exportColumns = visibleCols.map((c) => ({
      key: c.key,
      title: c.title,
      align: c.align,
      width: c.width,
    }));

    const summaryTotals = [
      { label: 'Invoices', value: ctx.data.length },
      { label: 'Total Sales', value: this.totalSalesAmount() },
      { label: 'Total Paid', value: this.totalPaidAmount() },
      { label: 'Total Due', value: this.totalDueAmount() },
    ];

    const options = {
      fileName: `sales_invoices_register_${new Date().toISOString().slice(0, 10)}`,
      title: 'Sales Invoices Register',
      subtitle: dateSubtitle,
      columns: exportColumns,
      data: ctx.data,
      isGrouped: ctx.isGrouped,
      groupedRows: ctx.groupedRows,
      activeGroupByLabel: ctx.activeGroupByLabel,
      summaryTotals,
    };

    try {
      if (ctx.format === 'excel') {
        await this.tableExportService.exportToExcel(options);
        this.msg.success(`Exported ${ctx.data.length} sales invoices to Excel`);
      } else {
        await this.tableExportService.exportToPdf(options);
        this.msg.success(`Exported ${ctx.data.length} sales invoices to PDF`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      this.msg.error('Failed to export sales register.');
    }
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

