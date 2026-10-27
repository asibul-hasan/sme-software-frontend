import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  PURCHASE_CALC_MODE_OPTIONS,
  INVENTORY_TYPE_OPTIONS,
  DiscountType,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
} from '../../shared/constants/label-values.constant';
import { ProductService } from '../../core/services/product.service';
import { SupplierService, CreatePurchasePayload } from '../../core/services/supplier.service';
import { ModalService } from '../../core/services/modal.service';
import { PrintService } from '../../core/services/print.service';
import { formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

interface SavedPurchaseSummary {
  invoiceNo: string;
  supplierName: string;
  supplierPhone?: string;
  purchaseDate: string;
  lines: PurchaseLine[];
  grossTotal: number;
  discountAmount: number;
  finalPrice: number;
  paidAmount: number;
  balanceDue: number;
  totalQtyPcs: number;
  paymentMethod: string;
}

interface PurchaseLine {
  id: string;
  product_no: number;
  product: string;
  barcode?: string;
  box: number;
  qtyBox: number;
  totalQtyPcs: number;
  btpVat: number;
  salePrice: number;
  freeQty: number;
  expiryDate: string;
  total: number;
}

interface SupplierOption {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

interface ProductOption {
  product_no: number;
  name: string;
  generic: string;
  btp: number;
  sale: number;
  qtyBox: number;
  barcode?: string;
}

@Component({
  selector: 'app-purchase-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    NzDatePickerModule,
    PageHeaderComponent,
    MenuActionDirective,
  ],
  templateUrl: './purchase-entry.component.html',
})
export class PurchaseEntryComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly modal = inject(ModalService);
  private readonly printService = inject(PrintService);
  private readonly route = inject(ActivatedRoute);
  readonly Math = Math;
  readonly DiscountType = DiscountType;

  calcModeOptions = PURCHASE_CALC_MODE_OPTIONS;
  inventoryTypeOptions = INVENTORY_TYPE_OPTIONS;

  calcMode = 1; // Default
  inventoryType = 1; // INVENTORY PURCHASED
  selectedSupplierId: number | null = null;
  invoiceNumber = '';
  purchaseDate: Date | null = new Date();
  generatedPurchaseId = '';

  approvedRequisitions = signal<any[]>([]);
  selectedRequisitionNo: number | null = null;
  isLoadingRequisition = false;

  suppliers = signal<SupplierOption[]>([]);
  availableProducts = signal<ProductOption[]>([]);
  lines = signal<PurchaseLine[]>([]);

  currentLine = {
    product_no: 0,
    product: '',
    barcode: '',
    box: 1,
    qtyBox: 10,
    totalQtyPcs: 10,
    btpVat: 0,
    salePrice: 0,
    freeQty: 0,
    expiryDate: '',
  };

  discountType = signal<number>(DiscountType.Flat);
  discountValue = signal<number>(0);
  paidAmount = signal<number>(0);

  isSavedSuccessOpen = signal<boolean>(false);
  savedInvoiceSummary = signal<SavedPurchaseSummary | null>(null);

  grossTotal = computed(() => {
    return this.lines().reduce((sum, item) => sum + item.total, 0);
  });

  totalQuantityPcs = computed(() => {
    return this.lines().reduce((sum, item) => sum + (item.totalQtyPcs || 0), 0);
  });

  discountAmount = computed(() => {
    const gross = this.grossTotal();
    const val = Number(this.discountValue()) || 0;
    if (val <= 0) return 0;
    if (this.discountType() === DiscountType.Flat) {
      return Math.min(gross, val);
    } else {
      return Math.round((gross * val) / 100 * 100) / 100;
    }
  });

  finalPrice = computed(() => {
    const gross = this.grossTotal();
    return Math.max(0, gross - this.discountAmount());
  });

  balanceDue = computed(() => {
    return this.finalPrice() - (Number(this.paidAmount()) || 0);
  });

  // Quick Product Modal
  isQuickProductOpen = false;
  quickProductName = '';
  quickProductGeneric = '';
  quickProductCompany = '';
  quickProductQtyBox = 10;
  quickProductBtp = 0;

  // Quick Supplier Modal
  isQuickSupplierOpen = false;
  quickSupplierName = '';
  quickSupplierPhone = '';
  quickSupplierAddress = '';

  currentSearchTerm = '';

  // Sub-Modals for Quick Product
  companiesList: string[] = [...DEFAULT_COMPANIES];
  genericsList: string[] = [...DEFAULT_GENERICS];
  isQuickGenericOpen = false;
  newQuickGeneric = '';
  isQuickCompanyOpen = false;
  newQuickCompany = '';

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      this.openNewProductModal();
    }
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();
    this.loadCompaniesAndGenerics();
    this.loadApprovedRequisitions();

    this.route.queryParamMap.subscribe(params => {
      const reqNoStr = params.get('requisitionNo') || params.get('requisitionId') || params.get('requisition_no');
      if (reqNoStr) {
        const reqNo = Number(reqNoStr);
        if (!isNaN(reqNo) && reqNo > 0) {
          this.onRequisitionSelected(reqNo);
        }
      }
    });
  }

  loadApprovedRequisitions(): void {
    this.productService.getApprovedRequisitions().subscribe({
      next: (res) => {
        if (res.data) {
          this.approvedRequisitions.set(res.data);
        }
      },
      error: () => {},
    });
  }

  onRequisitionSelected(reqNo: number | null): void {
    if (!reqNo) {
      this.selectedRequisitionNo = null;
      return;
    }
    this.selectedRequisitionNo = reqNo;
    this.isLoadingRequisition = true;

    this.productService.getRequisitionById(reqNo).subscribe({
      next: (res) => {
        this.isLoadingRequisition = false;
        if (res.data) {
          const req = res.data;
          if (req.supplier_no) {
            this.selectedSupplierId = req.supplier_no;
          }

          if (req.items && req.items.length > 0) {
            const defaultExp = new Date();
            defaultExp.setFullYear(defaultExp.getFullYear() + 2);
            const expStr = defaultExp.toISOString().slice(0, 10);

            const converted: PurchaseLine[] = req.items.map((it: any) => {
              const box = it.box_qty || 1;
              const qtyBox = it.quantity_in_box || 10;
              const totalPcs = it.requested_pcs_qty || (box * qtyBox);
              const btp = Number(it.btp_vat) || Number(it.btp) || 0;
              const lineTotal = Number(it.total_price) || (box * btp);

              return {
                id: crypto.randomUUID(),
                product_no: it.product_no,
                product: it.product_name || `Product #${it.product_no}`,
                barcode: it.batch_number || '', // Manual entry from vendor packaging is standard
                box: box,
                qtyBox: qtyBox,
                totalQtyPcs: totalPcs,
                btpVat: btp,
                salePrice: 0,
                freeQty: 0,
                expiryDate: expStr,
                total: Math.round(lineTotal * 100) / 100,
              };
            });

            this.lines.set(converted);
            this.msg.success(`Loaded ${converted.length} item(s) from Requisition ${req.requisition_code}`);
          }
        }
      },
      error: (err) => {
        this.isLoadingRequisition = false;
        this.msg.error(err?.error?.message || 'Failed to load requisition items');
      },
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          const sups: SupplierOption[] = res.data.items.map(s => ({
            id: s.supplier_no,
            name: s.name,
            phone: s.phone,
            address: '',
          }));
          this.suppliers.set(sups);
          if (sups.length > 0 && !this.selectedSupplierId) {
            this.selectedSupplierId = sups[0].id;
          }
        }
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.data?.items) {
          const prods: ProductOption[] = res.data.items.map(p => ({
            product_no: p.product_no,
            name: p.product_name,
            generic: p.generic_name || 'General',
            btp: Number(p.purchase_price_per_piece) || 10,
            sale: Number(p.sale_price_per_piece) || 15,
            qtyBox: p.quantity_per_box || 10,
            barcode: p.barcode_value || '',
          }));
          this.availableProducts.set(prods);
        }
      },
    });
  }

  loadCompaniesAndGenerics(): void {
    this.productService.getCompanies().subscribe({
      next: (res) => {
        if (res.data) {
          this.companiesList = res.data.map(c => c.name);
        }
      },
    });
    this.productService.getGenerics().subscribe({
      next: (res) => {
        if (res.data) {
          this.genericsList = res.data.map(g => g.name);
        }
      },
    });
  }

  onProductSearch(term: string): void {
    this.currentSearchTerm = term || '';
  }

  onProductEnterKey(): void {
    if (!this.currentLine.product && this.currentSearchTerm) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.availableProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase() === term)
      );
      if (match) {
        this.currentLine.product = match.name;
        this.onProductSelected(match.name);
      } else {
        this.currentLine.product = this.currentSearchTerm.trim();
      }
    }
    this.addLine();
  }

  onProductSelected(name: string): void {
    const p = this.availableProducts().find(item => item.name === name);
    if (p) {
      this.currentLine.product_no = p.product_no;
      this.currentLine.btpVat = p.btp;
      this.currentLine.salePrice = p.sale;
      this.currentLine.qtyBox = p.qtyBox;
      this.currentLine.barcode = p.barcode || '';
      this.onBoxOrQtyChange();
    }
  }

  onBoxOrQtyChange(): void {
    const box = Number(this.currentLine.box) || 0;
    const qtyBox = Number(this.currentLine.qtyBox) || 0;
    this.currentLine.totalQtyPcs = box * qtyBox;
  }

  addLine(): void {
    if (!this.currentLine.product && this.currentSearchTerm.trim()) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.availableProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase() === term)
      );
      if (match) {
        this.currentLine.product = match.name;
        this.onProductSelected(match.name);
      } else {
        this.currentLine.product = this.currentSearchTerm.trim();
      }
    }

    if (!this.currentLine.product) {
      this.msg.warning('Please select a product first');
      return;
    }
    const box = Number(this.currentLine.box) || 1;
    const btp = Number(this.currentLine.btpVat) || 0;
    const lineTotal = box * (btp > 0 ? btp : 10);

    const newLine: PurchaseLine = {
      id: Date.now().toString(),
      product_no: this.currentLine.product_no,
      product: this.currentLine.product,
      barcode: this.currentLine.barcode,
      box,
      qtyBox: Number(this.currentLine.qtyBox) || 10,
      totalQtyPcs: Number(this.currentLine.totalQtyPcs) || (box * 10),
      btpVat: btp,
      salePrice: Number(this.currentLine.salePrice) || 0,
      freeQty: Number(this.currentLine.freeQty) || 0,
      expiryDate: this.currentLine.expiryDate,
      total: lineTotal,
    };

    this.lines.update(items => [...items, newLine]);
    this.msg.success(`Added ${newLine.product} (${newLine.box} boxes)`);

    // Reset line form
    this.currentLine = {
      product_no: 0,
      product: '',
      barcode: '',
      box: 1,
      qtyBox: 10,
      totalQtyPcs: 10,
      btpVat: 0,
      salePrice: 0,
      freeQty: 0,
      expiryDate: '',
    };
    this.currentSearchTerm = '';
  }

  removeLine(idx: number): void {
    this.lines.update(items => items.filter((_, i) => i !== idx));
  }

  updateLine(line: PurchaseLine): void {
    const box = Math.max(1, Number(line.box) || 1);
    const qtyBox = Math.max(1, Number(line.qtyBox) || 1);
    const btp = Math.max(0, Number(line.btpVat) || 0);

    line.box = box;
    line.qtyBox = qtyBox;
    line.totalQtyPcs = box * qtyBox;
    line.total = Math.round(box * btp * 100) / 100;

    this.lines.update(items => [...items]);
  }

  openNewProductModal(): void {
    this.quickProductName = '';
    this.quickProductGeneric = this.genericsList[0] || 'Paracetamol';
    this.quickProductCompany = this.companiesList[0] || 'Beximco Pharmaceuticals Ltd.';
    this.quickProductQtyBox = 10;
    this.quickProductBtp = 0;
    this.isQuickProductOpen = true;
  }

  saveQuickGeneric(): void {
    if (!this.newQuickGeneric.trim()) {
      this.msg.warning('Please enter generic formulation');
      return;
    }
    const name = this.newQuickGeneric.trim();
    this.productService.createGeneric({ name }).subscribe({
      next: () => {
        if (!this.genericsList.includes(name)) {
          this.genericsList = [...this.genericsList, name];
        }
        this.quickProductGeneric = name;
        this.newQuickGeneric = '';
        this.isQuickGenericOpen = false;
        this.msg.success(`Generic "${name}" added!`);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to add generic');
      },
    });
  }

  saveQuickCompany(): void {
    if (!this.newQuickCompany.trim()) {
      this.msg.warning('Please enter company name');
      return;
    }
    const name = this.newQuickCompany.trim();
    this.productService.createCompany({ name }).subscribe({
      next: () => {
        if (!this.companiesList.includes(name)) {
          this.companiesList = [...this.companiesList, name];
        }
        this.quickProductCompany = name;
        this.newQuickCompany = '';
        this.isQuickCompanyOpen = false;
        this.msg.success(`Company "${name}" added!`);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to add company');
      },
    });
  }

  saveQuickProduct(): void {
    const name = this.quickProductName.trim();
    if (!name) {
      this.msg.error('Please enter product name');
      return;
    }
    const btp = Number(this.quickProductBtp) || 10;
    const sale = btp * 1.25;
    const qtyBox = Number(this.quickProductQtyBox) || 10;

    this.productService.createProduct({
      product_name: name,
      purchase_price_per_piece: btp,
      sale_price_per_piece: sale,
      quantity_per_box: qtyBox,
    }).subscribe({
      next: (res) => {
        if (res.data) {
          const newProd: ProductOption = {
            product_no: res.data.product_no,
            name: res.data.product_name,
            generic: this.quickProductGeneric || 'General',
            btp,
            sale,
            qtyBox,
            barcode: res.data.barcode_value || Date.now().toString().slice(-8),
          };
          this.availableProducts.update(list => [newProd, ...list]);
          this.currentLine.product = name;
          this.onProductSelected(name);
          this.msg.success(`Product "${name}" added to list!`);
        }
        this.isQuickProductOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to add product');
      },
    });
  }

  openQuickAddSupplier(): void {
    this.quickSupplierName = '';
    this.quickSupplierPhone = '';
    this.quickSupplierAddress = '';
    this.isQuickSupplierOpen = true;
  }

  saveQuickSupplier(): void {
    const name = this.quickSupplierName.trim();
    if (!name) {
      this.msg.error('Please enter supplier name');
      return;
    }
    this.supplierService.createSupplier({
      name,
      phone: this.quickSupplierPhone.trim() ? `+880 ${this.quickSupplierPhone.trim()}` : undefined,
    }).subscribe({
      next: (res) => {
        if (res.data) {
          const newSup: SupplierOption = {
            id: res.data.supplier_no,
            name: res.data.name,
            phone: res.data.phone,
            address: '',
          };
          this.suppliers.update(list => [newSup, ...list]);
          this.selectedSupplierId = res.data.supplier_no;
          this.msg.success(`Supplier "${name}" registered successfully!`);
        }
        this.isQuickSupplierOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to save supplier');
      },
    });
  }

  completePurchase(): void {
    if (this.lines().length === 0) {
      this.msg.warning('Please add at least one product line before purchasing.');
      return;
    }
    if (!this.selectedSupplierId) {
      this.msg.warning('Please select a supplier.');
      return;
    }

    const supplierObj = this.suppliers().find(s => s.id === this.selectedSupplierId);
    const supplierName = supplierObj ? supplierObj.name : 'Selected Supplier';

    this.modal.confirmAction(
      'Confirm Purchase Receiving?',
      `Receive ${this.lines().length} item(s) from "${supplierName}" totaling ৳ ${this.finalPrice().toLocaleString()} into stock?`,
      'Receive Inventory',
      false
    ).subscribe(confirmed => {
      if (!confirmed) return;

      const payload: CreatePurchasePayload = {
        requisition_no: this.selectedRequisitionNo || undefined,
        invoice: {
          supplier_no: this.selectedSupplierId!,
          supplier_invoice_no: this.invoiceNumber.trim() || undefined,
          purchase_date: this.purchaseDate ? formatDateToDdMmYyyy(this.purchaseDate) : undefined,
          calculation_mode: this.calcMode,
          inventory_type: this.inventoryType,
          gross_total_price: this.grossTotal(),
          discount_type: this.discountType(),
          discount_value: Number(this.discountValue()) || 0,
          paid_amount: Number(this.paidAmount()) || 0,
          due_amount: this.balanceDue() > 0 ? this.balanceDue() : 0,
        },
        items: this.lines().map((l, idx) => {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const fallbackBatch = `RCV-${dateStr}-${String(idx + 1).padStart(3, '0')}`;
          return {
            product_no: l.product_no,
            batch_number: l.barcode?.trim() || fallbackBatch,
            box_qty: l.box,
            qty_in_box: l.qtyBox,
            total_qty_pcs: l.totalQtyPcs,
            btp: l.btpVat,
            sale_price: l.salePrice,
            vat_percent: 0,
            expiry_date: l.expiryDate ? new Date(l.expiryDate).toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          };
        }),
        batches: [],
        payments: [
          {
            account_no: 1,
            payment_method: 1,
            amount: Number(this.paidAmount()) || 0,
          }
        ],
      };

      this.supplierService.createPurchaseInvoice(payload).subscribe({
        next: (res) => {
          const invId = res.data?.inventory_number || (res.data?.purchase_invoice_no ? `PUR-${res.data.purchase_invoice_no}` : '');
          this.generatedPurchaseId = invId || `PUR-${Date.now().toString().slice(-4)}`;
          const sup = this.suppliers().find(s => s.id === this.selectedSupplierId);

          const summary: SavedPurchaseSummary = {
            invoiceNo: this.invoiceNumber?.trim() || this.generatedPurchaseId,
            supplierName: sup?.name || 'Registered Supplier',
            supplierPhone: sup?.phone || '',
            purchaseDate: this.purchaseDate ? formatDateToDdMmYyyy(this.purchaseDate) : formatDateToDdMmYyyy(new Date()),
            lines: [...this.lines()],
            grossTotal: this.grossTotal(),
            discountAmount: this.discountAmount(),
            finalPrice: this.finalPrice(),
            paidAmount: Number(this.paidAmount()) || 0,
            balanceDue: this.balanceDue(),
            totalQtyPcs: this.totalQuantityPcs(),
            paymentMethod: (Number(this.paidAmount()) || 0) >= this.finalPrice() ? 'Cash / Full Paid' : 'Credit / Partial',
          };

          this.savedInvoiceSummary.set(summary);
          this.isSavedSuccessOpen.set(true);

          this.msg.success(
            `Purchase Invoice ${summary.invoiceNo} of ৳ ${summary.finalPrice.toLocaleString()} received and stock updated successfully!`
          );

          this.lines.set([]);
          this.invoiceNumber = '';
          this.paidAmount.set(0);
          this.discountValue.set(0);
          this.selectedRequisitionNo = null;
          this.loadApprovedRequisitions();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to complete purchase');
        },
      });
    });
  }

  generateBatchForLine(line: PurchaseLine, idx: number): void {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    line.barcode = `RCV-${dateStr}-${String(idx + 1).padStart(3, '0')}`;
    this.lines.update(items => [...items]);
  }

  generateBatchForCurrentLine(): void {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = this.lines().length + 1;
    this.currentLine.barcode = `RCV-${dateStr}-${String(seq).padStart(3, '0')}`;
  }

  printSavedVoucher(): void {
    const summary = this.savedInvoiceSummary();
    if (!summary) return;

    this.printService.printPurchaseVoucher({
      ref: summary.invoiceNo,
      date: summary.purchaseDate,
      supplier: summary.supplierName,
      supplierPhone: summary.supplierPhone,
      type: 'Commercial Medicine Stock',
      lines: summary.lines.map(l => ({
        name: l.product,
        qty: l.totalQtyPcs,
        unitPrice: l.btpVat,
        total: l.total,
        batch: l.barcode,
        exp: l.expiryDate,
      })),
      gross: summary.grossTotal,
      disc: summary.discountAmount,
      net: summary.finalPrice,
      paid: summary.paidAmount,
      due: summary.balanceDue,
      paymentMode: summary.paymentMethod,
    });
  }

  closeSuccessModal(): void {
    this.isSavedSuccessOpen.set(false);
  }

  startNewPurchase(): void {
    this.isSavedSuccessOpen.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.lines.set([]);
    this.invoiceNumber = '';
    this.paidAmount.set(0);
    this.discountValue.set(0);
    this.selectedRequisitionNo = null;
    this.selectedSupplierId = null;
    this.generatedPurchaseId = '';
    this.savedInvoiceSummary.set(null);
  }
}
