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

