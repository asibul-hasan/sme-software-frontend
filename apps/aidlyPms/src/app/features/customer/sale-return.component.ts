import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { PosSaleService, CreateSaleReturnPayload } from '../../core/services/pos-sale.service';
import { Customer } from '../../core/models/customer.models';
import { Product } from '../../core/models/product.models';

interface ReturnLine {
  id: string;
  productNo: number;
  name: string;
  box: number;
  qtyBox: number;
  totalQty: number;
  salePrice: number;
  expiryDate: string;
  minQty: number;
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
    PageHeaderComponent,
  ],
  templateUrl: './sale-return.component.html',
})
export class SaleReturnComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly route = inject(ActivatedRoute);

  customers = signal<Customer[]>([]);
  availableProducts = signal<Product[]>([]);
  selectedCustomer: number | null = null;
  selectedProductNo: number | null = null;

  // Customer modal
  isCustomerModalOpen = false;
  newCustomerName = '';
  newCustomerPhone = '';
  newCustomerAddress = '';

  // Product modal
  isProductModalOpen = false;
  newProductName = '';
  newProductGeneric = '';
  newProductPrice = 0;

  lines = signal<ReturnLine[]>([]);

  currentLine = {
    productNo: 0,
    name: '',
    box: 1,
    qtyBox: 10,
    totalQty: 10,
    salePrice: 0,
    expiryDate: '',
    minQty: 0,
  };

  discountEnabled = false;
  discountAmount = 0;
  paidRefund = 0;
  inventoryType = 'CUSTOMER RETURNED';
  originalInvoice = '';
  isSubmitting = signal(false);

  ngOnInit(): void {
    const invParam = this.route.snapshot.queryParamMap.get('invoice');
    if (invParam) {
      this.originalInvoice = invParam;
    }
    this.loadCustomers();
    this.loadProducts();
  }


  loadCustomers(): void {
    this.customerService.getCustomers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.customers.set([...res.data.items]);
          if (res.data.items.length > 0 && !this.selectedCustomer) {
            this.selectedCustomer = res.data.items[0].customer_no;
          }
        }
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 150 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.availableProducts.set([...res.data.items]);
        }
      },
    });
  }

  onProductSelect(productNo: number): void {
    const prod = this.availableProducts().find(p => p.product_no === productNo);
    if (prod) {
      this.currentLine.productNo = prod.product_no;
      this.currentLine.name = prod.product_name;
      this.currentLine.salePrice = Number(prod.sale_price_per_piece) || Number(prod.purchase_price_per_piece) || 0;
      this.currentLine.qtyBox = prod.quantity_per_box || 10;
      this.currentLine.totalQty = (this.currentLine.box || 1) * this.currentLine.qtyBox;
    }
  }

  grossTotal = computed(() => {
    return this.lines().reduce((acc, curr) => acc + curr.total, 0);
  });

  finalRefund = computed(() => {
    const gross = this.grossTotal();
    if (!this.discountEnabled) return gross;
    return Math.max(0, gross - (Number(this.discountAmount) || 0));
  });

  addLine(): void {
    if (!this.currentLine.name || !this.currentLine.productNo) {
      this.msg.warning('Please select a product to return');
      return;
    }
    const qty = Number(this.currentLine.totalQty) || (Number(this.currentLine.box) * Number(this.currentLine.qtyBox)) || 1;
    const price = Number(this.currentLine.salePrice) || 0;
    const lineTotal = qty * price;

    const newLine: ReturnLine = {
      id: Date.now().toString(),
      productNo: this.currentLine.productNo,
      name: this.currentLine.name,
      box: Number(this.currentLine.box) || 1,
      qtyBox: Number(this.currentLine.qtyBox) || 10,
      totalQty: qty,
      salePrice: price,
      expiryDate: this.currentLine.expiryDate,
      minQty: Number(this.currentLine.minQty) || 0,
      total: lineTotal,
    };

    this.lines.update(items => [...items, newLine]);
    this.paidRefund = this.finalRefund();
    this.msg.success(`Added return line for ${newLine.name}`);

    // reset
    this.selectedProductNo = null;
    this.currentLine = {
      productNo: 0,
      name: '',
      box: 1,
      qtyBox: 10,
      totalQty: 10,
      salePrice: 0,
      expiryDate: '',
      minQty: 0,
    };
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
    this.paidRefund = this.finalRefund();
  }

  processReturn(): void {
    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one item to return');
      return;
    }
    if (!this.originalInvoice.trim()) {
      this.msg.warning('Please provide the original invoice reference');
      return;
    }

    this.isSubmitting.set(true);
    const payload: CreateSaleReturnPayload = {
      original_invoice_no: this.originalInvoice.trim(),
      customer_no: this.selectedCustomer || 1,
      return_amount: this.finalRefund(),
      refund_method: 'Cash',
      items: this.lines().map(l => ({
        product_no: l.productNo,
        return_qty: l.totalQty,
        unit_price: l.salePrice,
        total_price: l.total,
      })),
    };

    this.posSaleService.createSaleReturn(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.msg.success(
          `Return for ${this.originalInvoice} processed successfully! Refund of ৳ ${this.finalRefund().toFixed(2)} recorded.`
        );
        this.lines.set([]);
        this.originalInvoice = '';
        this.paidRefund = 0;
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

  saveProduct(): void {
    if (!this.newProductName.trim()) {
      this.msg.warning('Please enter brand name');
      return;
    }
    this.productService.createProduct({
      product_name: this.newProductName.trim(),
      sale_price_per_piece: this.newProductPrice || 0,
      purchase_price_per_piece: this.newProductPrice ? this.newProductPrice * 0.85 : 0,
    }).subscribe({
      next: (res) => {
        const createdProduct = res.data;
        if (createdProduct) {
          this.availableProducts.update(list => [createdProduct, ...list]);
          this.selectedProductNo = createdProduct.product_no;
          this.onProductSelect(createdProduct.product_no);
          this.msg.success(`Product "${createdProduct.product_name}" added and selected!`);
        }
        this.newProductName = '';
        this.newProductGeneric = '';
        this.newProductPrice = 0;
        this.isProductModalOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to quick-add product');
      },
    });
  }
}
