import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ModalService } from '../../core/services/modal.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PrintService } from '../../core/services/print.service';
import { SuppSupplier } from '../../core/models/supplier.models';
import { getDefaultMonthDates, formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

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
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzTooltipModule,
    NzDatePickerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    MenuActionDirective,
  ],
  templateUrl: './purchase-record.component.html',
})
export class PurchaseRecordComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  records = signal<PurchaseRecordRow[]>([]);
  suppliers = signal<SuppSupplier[]>([]);
  hasError = signal(false);
  errorMessage = signal('');

  hasActiveFilters = computed(() => {
    return !!(this.searchInvoice.trim() || this.filterSupplier || this.filterType);
  });

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadPurchases();
    } else if (this.hasActiveFilters()) {
      this.resetFilters();
    } else {
      this.router.navigate(['/supplier/purchase']);
    }
  }

  private readonly supplierService = inject(SupplierService);
  private readonly printService = inject(PrintService);
  private readonly router = inject(Router);
  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  isLoading = signal(false);

  // Initialize with standard 1-month date range default
  defaultDates = getDefaultMonthDates();
  fromDate: Date | null = this.defaultDates.from;
  toDate: Date | null = this.defaultDates.to;
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

  // Print Voucher Modal
  isPrintModalVisible = false;
  printingRecord: PurchaseRecordRow | null = null;

  // Return Modal
  isReturnModalVisible = false;
  returnRecord: PurchaseRecordRow | null = null;
  returnReason = 'Damaged / Expired Batch';
  returnNote = '';
  returnQtyMap: Record<string, number> = {};

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
    this.hasError.set(false);
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 50,
    };
    if (this.fromDate) params['fromDate'] = formatDateToDdMmYyyy(this.fromDate);
    if (this.toDate) params['toDate'] = formatDateToDdMmYyyy(this.toDate);
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
        this.hasError.set(true);
        this.errorMessage.set('Failed to retrieve purchase records.');
      },
    });
  }

  resetFilters(): void {
    const def = getDefaultMonthDates();
    this.fromDate = def.from;
    this.toDate = def.to;
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
    this.printingRecord = r;
    this.isPrintModalVisible = true;
  }

  triggerPrint(): void {
    if (!this.printingRecord) return;
    this.printService.printPurchaseVoucher({
      ref: this.printingRecord.ref,
      date: this.printingRecord.date,
      supplier: this.printingRecord.supplier,
      type: this.printingRecord.type,
      gross: this.printingRecord.gross,
      disc: this.printingRecord.disc,
      net: this.printingRecord.net,
      lines: this.printingRecord.lines.map(line => ({
        name: line.name,
        qty: line.qty,
        unitPrice: line.unitPrice,
        total: line.total,
      })),
    });
  }

  initiateReturn(r: PurchaseRecordRow): void {
    this.router.navigate(['/supplier/purchase-return'], {
      queryParams: {
        invoice: r.ref,
        invoiceNo: r.id,
      },
    });
  }

  submitSupplierReturn(): void {
    if (!this.returnRecord) return;
    const r = this.returnRecord;
    this.isReturnModalVisible = false;
    this.initiateReturn(r);
  }

  exportPurchasesCsv(): void {
    const list = this.filteredRecords();
    if (!list.length) {
      this.msg.warning('No purchase records to export.');
      return;
    }
    const headers = ['Voucher Ref', 'Date', 'Supplier', 'Type', 'Gross Amount (৳)', 'Discount (৳)', 'Net Total (৳)'];
    const rows = list.map(r => [
      `"${r.ref}"`,
      `"${r.date}"`,
      `"${(r.supplier || '').replace(/"/g, '""')}"`,
      `"${r.type}"`,
      r.gross.toFixed(2),
      r.disc.toFixed(2),
      r.net.toFixed(2)
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} purchase vouchers to CSV`);
  }

  deleteInvoice(r: PurchaseRecordRow): void {
    this.modal.confirmAction(
      'Purchase Return Required',
      `Posted purchase invoice "${r.ref}" has updated inventory stock and financial ledgers. To reverse or adjust this invoice, please initiate a Purchase Return. Do you want to proceed to Purchase Return?`,
      'Initiate Return',
      false
    ).subscribe(confirmed => {
      if (confirmed) {
        this.initiateReturn(r);
      }
    });
  }
}
