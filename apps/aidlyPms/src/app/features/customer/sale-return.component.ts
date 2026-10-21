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
import { PosSaleService } from '../../core/services/pos-sale.service';
import { ProductService } from '../../core/services/product.service';
import { Customer, SaleInvoice, ReturnReq, ExchangeReq, ExchangeResult } from '../../core/models/customer.models';
import { ProdProduct } from '../../core/models/product.models';

export interface ReturnLine {
  id: string;
  saleInvoiceItemNo: number;
  productNo: number;
  name: string;
  batchNumber: string;
  soldQty: number;
  alreadyReturnedQty: number;
  returnableQty: number;
  returnQty: number;
  salePrice: number;
  netAmount: number;
  vatAmount: number;
  estimatedRefundTotal: number;
  reasonCode: number;
  disposition: number;
  selected: boolean;
}

export interface ExchangeCartLine {
  productNo: number;
  productName: string;
  salePrice: number;
  qtyPcs: number;
  total: number;
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
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Workflow Mode: 'return' (standard refund) or 'exchange' (return + new sale in one transaction)
  activeMode = signal<'return' | 'exchange'>('return');

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

  // Invoice financial breakdown
  originalGrossTotal = 0;
  originalDiscountAmount = 0;
  originalDiscountPercent = 0;
  originalPaidAmount = 0;
  originalDueAmount = 0;

  get displayDiscountPercent(): string {
    const pct = this.originalDiscountPercent;
    if (!pct || pct <= 0) return '0.00';
    return pct.toFixed(2);
  }

  // Return options & reason definitions
  readonly reasonOptions = [
    { label: 'Customer Changed Mind', value: 2 },
    { label: 'Expired / Damaged Medicine', value: 1 },
    { label: 'Dispensing / Wrong Medicine Error', value: 3 },
    { label: 'Adverse Drug Reaction', value: 4 },
    { label: 'Manufacturer Batch Recall', value: 5 },
    { label: 'Other Miscellaneous Reason', value: 6 },
  ];

  readonly dispositionOptions = [
    { label: 'Restock to Inventory (Sellable)', value: 1 },
    { label: 'Quarantine / Damaged (Do Not Restock)', value: 2 },
  ];

  readonly settlementMethods = [
    { label: 'Cash Drawer (M-1)', value: 1 },
    { label: 'Bank Account (M-2)', value: 2 },
    { label: 'bKash MFS (M-3)', value: 3 },
    { label: 'Nagad MFS (M-4)', value: 4 },
    { label: 'Rocket MFS (M-5)', value: 5 },
    { label: 'Credit/Debit Card (M-6)', value: 6 },
  ];

  refundMethod = 1; // 1: Cash, 2: StoreCredit, 3: OriginalChannel
  globalReturnReason = 'Customer Return';

  // Exchange Cart State
  newItems = signal<ExchangeCartLine[]>([]);
  catalogProducts = signal<ProdProduct[]>([]);
  isSearchingProducts = signal(false);
  selectedNewProductNo: number | null = null;
  newProductQty = 1;
  settlementPaymentMethod = 1; // 1: Cash

  // Exchange Success Modal
  isSuccessModalVisible = false;
  exchangeSuccessData: ExchangeResult | null = null;

  // Customer modal for quick add if needed
  isCustomerModalOpen = false;
  newCustomerName = '';
  newCustomerPhone = '';
  newCustomerAddress = '';

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.loadCustomers();
    this.loadCatalogProducts();

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

  loadCatalogProducts(search?: string): void {
    this.isSearchingProducts.set(true);
    this.productService.getProducts({ search, pageSize: 50 }).subscribe({
      next: (res) => {
        this.isSearchingProducts.set(false);
        if (res.data?.items) {
          this.catalogProducts.set(res.data.items);
        }
      },
      error: () => this.isSearchingProducts.set(false),
    });
  }

  onProductSearch(searchTerm: string): void {
    if (searchTerm && searchTerm.trim().length >= 2) {
      this.loadCatalogProducts(searchTerm.trim());
    }
  }

  addNewExchangeItem(): void {
    if (!this.selectedNewProductNo) {
      this.msg.warning('Please select a product from the catalog');
      return;
    }
    const product = this.catalogProducts().find(p => p.product_no === this.selectedNewProductNo);
    if (!product) return;

    const qty = Math.max(1, Number(this.newProductQty) || 1);
    const price = Number(product.sale_price_per_piece) || 0;

    const existingIdx = this.newItems().findIndex(i => i.productNo === product.product_no);
    if (existingIdx >= 0) {
      this.newItems.update(items => {
        const copy = [...items];
        copy[existingIdx].qtyPcs += qty;
        copy[existingIdx].total = Math.round(copy[existingIdx].qtyPcs * copy[existingIdx].salePrice * 100) / 100;
        return copy;
      });
    } else {
      this.newItems.update(items => [
        ...items,
        {
          productNo: product.product_no,
          productName: product.product_name,
          salePrice: price,
          qtyPcs: qty,
          total: Math.round(qty * price * 100) / 100,
        },
      ]);
    }

    this.selectedNewProductNo = null;
    this.newProductQty = 1;
    this.msg.success(`Added ${product.product_name} to exchange cart`);
  }

  removeExchangeItem(index: number): void {
    this.newItems.update(items => items.filter((_, i) => i !== index));
  }

  updateExchangeItemQty(item: ExchangeCartLine, newQty: number): void {
    const qty = Math.max(1, Number(newQty) || 1);
    item.qtyPcs = qty;
    item.total = Math.round(qty * item.salePrice * 100) / 100;
    this.newItems.update(items => [...items]);
  }

  newItemsGrossTotal = computed(() => {
    return this.newItems().reduce((acc, curr) => acc + curr.total, 0);
  });

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

        if (inv.document_status === 3) {
          this.msg.error(`Invoice ${inv.sales_number} is voided and cannot be returned.`);
          return;
        }

        this.invoiceDetails = inv;
        this.originalInvoice = inv.sales_number || `INV-${inv.sale_invoice_no}`;
        this.saleInvoiceNo = inv.sale_invoice_no;
        this.selectedCustomer = inv.customer_no || null;
        this.customerName = inv.customer_name || (inv.customer ? inv.customer.name : 'Walk-in Customer');
        this.customerPhone = inv.customer_phone || (inv.customer ? inv.customer.phone || '' : '');
        this.invoiceDate = inv.sale_timestamp ? new Date(inv.sale_timestamp).toLocaleString('en-GB') : '';
        const finalPrice = Number(inv.final_price) || 0;
        this.invoiceTotal = finalPrice;
        this.originalGrossTotal = Number(inv.gross_total_price) || 0;
        this.originalDueAmount = Number(inv.due_amount) || 0;
        this.originalPaidAmount = Math.max(0, finalPrice - this.originalDueAmount);

        let disc = Number(inv.discount_value) || 0;
        if (disc <= 0 && this.originalGrossTotal > finalPrice) {
          disc = Math.max(0, this.originalGrossTotal - finalPrice);
        }
        this.originalDiscountAmount = disc;

        if (this.originalGrossTotal > 0 && disc > 0) {
          this.originalDiscountPercent = Number(((disc / this.originalGrossTotal) * 100).toFixed(4));
        } else {
          this.originalDiscountPercent = 0;
        }

        const items = inv.items || [];
        if (items.length === 0) {
          this.msg.warning(`Invoice ${this.originalInvoice} has no items`);
          this.lines.set([]);
          return;
        }

        const discountRatio = this.originalGrossTotal > 0 ? (disc / this.originalGrossTotal) : 0;

        const returnLines: ReturnLine[] = items.map((item, index) => {
          const unitPrice = Number(item.unit_sale_price) || 0;
          const soldQty = Number(item.sale_qty) || 1;
          const alreadyReturned = Number(item.already_returned_qty) || 0;
          const returnable = Math.max(0, soldQty - alreadyReturned);

          const net = Number(item.net_amount) || (soldQty * unitPrice);
          const vat = Number(item.vat_amount) || 0;

          // Server pricing estimation: net/soldQty * returnable * (1 - discountRatio) + vat/soldQty * returnable
          const estimatedLineRefund = soldQty > 0
            ? Math.round(((net / soldQty * returnable * (1 - discountRatio)) + (vat / soldQty * returnable)) * 100) / 100
            : 0;

          return {
            id: String(item.sale_invoice_item_no || `${item.product_no}_${index}`),
            saleInvoiceItemNo: item.sale_invoice_item_no || 0,
            productNo: item.product_no,
            name: item.product_name || (item.product ? item.product.product_name : `Product #${item.product_no}`),
            batchNumber: item.batch_number || '',
            soldQty: soldQty,
            alreadyReturnedQty: alreadyReturned,
            returnableQty: returnable,
            returnQty: returnable,
            salePrice: unitPrice,
            netAmount: net,
            vatAmount: vat,
            estimatedRefundTotal: estimatedLineRefund,
            reasonCode: 2, // Customer Changed Mind
            disposition: 1, // Restock
            selected: returnable > 0,
          };
        });

        this.lines.set(returnLines);
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
    this.originalGrossTotal = 0;
    this.originalDiscountAmount = 0;
    this.originalDiscountPercent = 0;
    this.originalPaidAmount = 0;
    this.originalDueAmount = 0;
    this.lines.set([]);
    this.newItems.set([]);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  onLineQtyChange(l: ReturnLine): void {
    if (l.returnQty > l.returnableQty) {
      l.returnQty = l.returnableQty;
      this.msg.warning(`Maximum returnable quantity for "${l.name}" is ${l.returnableQty} pcs.`);
    } else if (l.returnQty < 0 || isNaN(l.returnQty)) {
      l.returnQty = 0;
    }

    const discountRatio = this.originalGrossTotal > 0 ? (this.originalDiscountAmount / this.originalGrossTotal) : 0;
    const est = l.soldQty > 0
      ? Math.round(((l.netAmount / l.soldQty * l.returnQty * (1 - discountRatio)) + (l.vatAmount / l.soldQty * l.returnQty)) * 100) / 100
      : 0;
    l.estimatedRefundTotal = est;

    this.lines.update(items => [...items]);
  }

  toggleLineSelect(l: ReturnLine): void {
    if (l.returnableQty <= 0) {
      l.selected = false;
      this.msg.info(`All purchased units for "${l.name}" have already been returned.`);
      return;
    }
    l.selected = !l.selected;
    this.lines.update(items => [...items]);
  }

  toggleAll(checked: boolean): void {
    this.lines.update(items => items.map(l => ({
      ...l,
      selected: checked && l.returnableQty > 0,
    })));
  }

  resetAllToSold(): void {
    this.lines.update(items => items.map(l => ({
      ...l,
      selected: l.returnableQty > 0,
      returnQty: l.returnableQty,
    })));
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
  }

  selectedLines = computed(() => this.lines().filter(l => l.selected && l.returnQty > 0));

  totalReturnItems = computed(() => this.selectedLines().length);

  totalReturnPcs = computed(() => this.selectedLines().reduce((acc, curr) => acc + (Number(curr.returnQty) || 0), 0));

  grossTotal = computed(() => {
    return this.selectedLines().reduce((acc, curr) => acc + (curr.returnQty * curr.salePrice), 0);
  });

  calculatedDiscountDeduction = computed(() => {
    if (this.originalDiscountPercent <= 0) return 0;
    const gross = this.grossTotal();
    return Math.round(gross * (this.originalDiscountPercent / 100) * 100) / 100;
  });

  netRefund = computed(() => {
    return this.selectedLines().reduce((acc, curr) => acc + curr.estimatedRefundTotal, 0);
  });

  cashRefund = computed(() => {
    const net = this.netRefund();
    if (this.originalDueAmount > 0) {
      return Math.min(net, this.originalPaidAmount);
    }
    return net;
  });

  dueAdjustment = computed(() => {
    const net = this.netRefund();
    const cash = this.cashRefund();
    return Math.max(0, Math.round((net - cash) * 100) / 100);
  });

  // Exchange difference: Positive means customer pays extra; Negative means pharmacy refunds remainder
  exchangeDifference = computed(() => {
    const newTotal = this.newItemsGrossTotal();
    const returnCredit = this.cashRefund();
    return Math.round((newTotal - returnCredit) * 100) / 100;
  });

  processReturn(): void {
    if (!this.saleInvoiceNo) {
      this.msg.warning('Please specify an original invoice to return');
      return;
    }

    const activeLines = this.selectedLines();
    if (activeLines.length === 0) {
      this.msg.warning('Please select at least one item with return quantity > 0');
      return;
    }

    this.isSubmitting.set(true);

    // Client sends ONLY choices, never money amounts:
    const payload: ReturnReq = {
      sale_invoice_no: this.saleInvoiceNo,
      lines: activeLines.map(l => ({
        sale_invoice_item_no: l.saleInvoiceItemNo,
        qty_pcs: l.returnQty,
        reason_code: l.reasonCode,
        disposition: l.disposition,
      })),
      refund_method: this.refundMethod,
      idempotency_key: crypto.randomUUID(),
      note: this.globalReturnReason || 'Customer Return',
    };

    this.posSaleService.createSaleReturn(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const record = res.data;
        this.msg.success(
          `Return #${record?.return_invoice_no || ''} processed successfully! Refund amount: ৳ ${Number(record?.return_amount || 0).toFixed(2)}`
        );
        this.clearLoadedInvoice();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.msg.error(err?.error?.message || 'Failed to process sale return');
      },
    });
  }

  processExchange(): void {
    if (!this.saleInvoiceNo) {
      this.msg.warning('Please specify an original invoice to exchange against');
      return;
    }

    const activeReturnLines = this.selectedLines();
    if (activeReturnLines.length === 0) {
      this.msg.warning('Please select at least one item to return');
      return;
    }

    const newCart = this.newItems();
    if (newCart.length === 0) {
      this.msg.warning('Please add at least one new product to the exchange cart');
      return;
    }

    this.isSubmitting.set(true);

    const payload: ExchangeReq = {
      return_req: {
        sale_invoice_no: this.saleInvoiceNo,
        lines: activeReturnLines.map(l => ({
          sale_invoice_item_no: l.saleInvoiceItemNo,
          qty_pcs: l.returnQty,
          reason_code: l.reasonCode,
          disposition: l.disposition,
        })),
        refund_method: 1, // Cash drawer clearing
        idempotency_key: crypto.randomUUID(),
        note: `Exchange against ${this.originalInvoice}`,
      },
      new_items: newCart.map(i => ({
        product_no: i.productNo,
        quantity: i.qtyPcs,
        unit_type: 1,
      })),
      settlement_payment_method: this.settlementPaymentMethod,
    };

    this.posSaleService.processExchange(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.exchangeSuccessData = res.data;
        this.isSuccessModalVisible = true;
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.msg.error(err?.error?.message || 'Failed to process exchange');
      },
    });
  }

  closeSuccessModal(): void {
    this.isSuccessModalVisible = false;
    this.exchangeSuccessData = null;
    this.clearLoadedInvoice();
  }

  printVouchers(): void {
    window.print();
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
