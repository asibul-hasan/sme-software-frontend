import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CustomerService } from '../../core/services/customer.service';
import { PosSaleService, CreateSaleReturnPayload } from '../../core/services/pos-sale.service';
import { Customer, SaleInvoice } from '../../core/models/customer.models';

export interface ReturnLine {
  id: string;
  saleInvoiceItemNo?: number | null;
  productNo: number;
  name: string;
  batchNumber: string;
  soldQty: number;
  returnQty: number;
  salePrice: number;
  total: number;
  selected: boolean;
}

@Component({
  selector: 'app-sale-return',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    NzSpinModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  templateUrl: './sale-return.component.html',
})
export class SaleReturnComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly customerService = inject(CustomerService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  customers = signal<Customer[]>([]);
  lines = signal<ReturnLine[]>([]);
  isLoadingInvoice = signal(false);
  isSubmitting = signal(false);

  // Invoice information
  originalInvoice = '';
  saleInvoiceNo: number | null = null;
  invoiceDetails: SaleInvoice | null = null;
  selectedCustomer: number | null = null;
  customerName = '';
  customerPhone = '';
  invoiceDate = '';
  invoiceTotal = 0;

  // Return options & refunds
  discountEnabled = false;
  discountAmount = 0;
  paidRefund = 0;
  refundMethod = 'Cash';
  inventoryType = 'CUSTOMER RETURNED';
  returnReason = 'Customer Return';

  // Customer modal for quick add if needed
  isCustomerModalOpen = false;
  newCustomerName = '';
  newCustomerPhone = '';
  newCustomerAddress = '';

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.loadCustomers();

    // Listen to query params for incoming return requests from Sales Invoices Register
    this.routeSub = this.route.queryParamMap.subscribe((params) => {
      const inv = params.get('invoice');
      const saleInvoiceNo = params.get('saleInvoiceNo');
      const identifier = inv || saleInvoiceNo;
      if (identifier) {
        this.originalInvoice = inv || identifier;
        this.loadInvoice(identifier);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
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

  loadInvoice(identifier?: string): void {
    const query = (identifier || this.originalInvoice || '').trim();
    if (!query) {
      this.msg.warning('Please enter a sales invoice number to load items');
      return;
    }

    this.isLoadingInvoice.set(true);
    this.posSaleService.getSale(query).subscribe({
      next: (res) => {
        this.isLoadingInvoice.set(false);
        const inv = res.data;
        if (!inv) {
          this.msg.error('Invoice details not found');
          return;
        }

        this.invoiceDetails = inv;
        this.originalInvoice = inv.sales_number || `INV-${inv.sale_invoice_no}`;
        this.saleInvoiceNo = inv.sale_invoice_no;
        this.selectedCustomer = inv.customer_no || null;
        this.customerName = inv.customer_name || (inv.customer ? inv.customer.name : 'Walk-in Customer');
        this.customerPhone = inv.customer_phone || (inv.customer ? inv.customer.phone || '' : '');
        this.invoiceDate = inv.sale_timestamp ? new Date(inv.sale_timestamp).toLocaleString('en-GB') : '';
        this.invoiceTotal = Number(inv.final_price) || 0;

        const items = inv.items || [];
        if (items.length === 0) {
          this.msg.warning(`Invoice ${this.originalInvoice} has no items`);
          this.lines.set([]);
          return;
        }

        const returnLines: ReturnLine[] = items.map((item, index) => {
          const unitPrice = Number(item.unit_sale_price) || 0;
          const soldQty = Number(item.sale_qty) || 1;
          return {
            id: String(item.sale_invoice_item_no || `${item.product_no}_${index}`),
            saleInvoiceItemNo: item.sale_invoice_item_no || null,
            productNo: item.product_no,
            name: item.product_name || (item.product ? item.product.product_name : `Product #${item.product_no}`),
            batchNumber: item.batch_number || '',
            soldQty: soldQty,
            returnQty: soldQty,
            salePrice: unitPrice,
            total: Math.round(soldQty * unitPrice * 100) / 100,
            selected: true,
          };
        });

        this.lines.set(returnLines);
        this.paidRefund = this.finalRefund();
        this.msg.success(`Loaded ${returnLines.length} item(s) from invoice ${this.originalInvoice}`);
      },
      error: (err) => {
        this.isLoadingInvoice.set(false);
        this.msg.error(err?.error?.message || `Could not find sales invoice "${query}"`);
      },
    });
  }

  clearLoadedInvoice(): void {
    this.invoiceDetails = null;
    this.originalInvoice = '';
    this.saleInvoiceNo = null;
    this.customerName = '';
    this.customerPhone = '';
    this.invoiceDate = '';
    this.invoiceTotal = 0;
    this.lines.set([]);
    this.paidRefund = 0;
    this.discountAmount = 0;
    this.discountEnabled = false;
    // Clear URL query parameters
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  onLineQtyChange(l: ReturnLine): void {
    if (l.returnQty > l.soldQty) {
      l.returnQty = l.soldQty;
      this.msg.warning(`Maximum returnable quantity for "${l.name}" is ${l.soldQty} pcs.`);
    } else if (l.returnQty < 0 || isNaN(l.returnQty)) {
      l.returnQty = 0;
    }
    l.total = Math.round((Number(l.returnQty) || 0) * (Number(l.salePrice) || 0) * 100) / 100;
    this.lines.update(items => [...items]);
    this.paidRefund = this.finalRefund();
  }

  toggleLineSelect(l: ReturnLine): void {
    l.selected = !l.selected;
    this.lines.update(items => [...items]);
    this.paidRefund = this.finalRefund();
  }

  toggleAll(checked: boolean): void {
    this.lines.update(items => items.map(l => ({ ...l, selected: checked })));
    this.paidRefund = this.finalRefund();
  }

  resetAllToSold(): void {
    this.lines.update(items => items.map(l => ({
      ...l,
      selected: true,
      returnQty: l.soldQty,
      total: Math.round(l.soldQty * l.salePrice * 100) / 100,
    })));
    this.paidRefund = this.finalRefund();
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
    this.paidRefund = this.finalRefund();
  }

  selectedLines = computed(() => this.lines().filter(l => l.selected && l.returnQty > 0));

  totalReturnItems = computed(() => this.selectedLines().length);

  totalReturnPcs = computed(() => this.selectedLines().reduce((acc, curr) => acc + (Number(curr.returnQty) || 0), 0));

  grossTotal = computed(() => {
    return this.selectedLines().reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  });

  finalRefund = computed(() => {
    const gross = this.grossTotal();
    if (!this.discountEnabled) return gross;
    return Math.max(0, gross - (Number(this.discountAmount) || 0));
  });

  onDiscountToggle(): void {
    this.paidRefund = this.finalRefund();
  }

  onDiscountChange(): void {
    this.paidRefund = this.finalRefund();
  }

  processReturn(): void {
    if (!this.originalInvoice.trim()) {
      this.msg.warning('Please specify an original invoice to return');
      return;
    }

    const activeLines = this.selectedLines();
    if (activeLines.length === 0) {
      this.msg.warning('Please select at least one item with return quantity > 0');
      return;
    }

    this.isSubmitting.set(true);
    const dispositionCode = this.inventoryType === 'DAMAGED / EXPIRED' ? 3 : 1;

    const payload: CreateSaleReturnPayload = {
      original_invoice_no: this.originalInvoice.trim(),
      sale_invoice_no: this.saleInvoiceNo || undefined,
      customer_no: this.selectedCustomer || 1,
      return_amount: this.finalRefund(),
      refund_method: this.refundMethod || 'Cash',
      reason: this.returnReason || 'Customer Return',
      items: activeLines.map(l => ({
        product_no: l.productNo,
        return_qty: l.returnQty,
        unit_price: l.salePrice,
        total_price: l.total,
        batch_number: l.batchNumber || undefined,
        sale_invoice_item_no: l.saleInvoiceItemNo || undefined,
        disposition: dispositionCode,
      })),
    };

    this.posSaleService.createSaleReturn(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const refundAmt = this.finalRefund().toFixed(2);
        this.msg.success(
          `Return for invoice ${this.originalInvoice} processed successfully! Refund of ৳ ${refundAmt} recorded.`
        );
        this.clearLoadedInvoice();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.msg.error(err?.error?.message || 'Failed to process sale return');
      },
    });
  }

  saveCustomer(): void {
    if (!this.newCustomerName.trim()) {
      this.msg.warning('Please enter customer name');
      return;
    }
    this.customerService.createCustomer({
      name: this.newCustomerName.trim(),
      phone: this.newCustomerPhone.trim(),
      address: this.newCustomerAddress.trim(),
    }).subscribe({
      next: (res) => {
        const createdCustomer = res.data;
        if (createdCustomer) {
          this.customers.update(list => [createdCustomer, ...list]);
          this.selectedCustomer = createdCustomer.customer_no;
          this.customerName = createdCustomer.name;
          this.customerPhone = createdCustomer.phone || '';
          this.msg.success(`Customer "${createdCustomer.name}" registered and selected!`);
        }
        this.newCustomerName = '';
        this.newCustomerPhone = '';
        this.newCustomerAddress = '';
        this.isCustomerModalOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create customer');
      },
    });
  }
}
