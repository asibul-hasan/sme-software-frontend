import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  PAYMENT_METHOD_OPTIONS,
  CUSTOMER_TIER_OPTIONS,
  BusinessMode,
  DiscountType,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
} from '../../shared/constants/label-values.constant';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { PosSaleService } from '../../core/services/pos-sale.service';
import { PrintService } from '../../core/services/print.service';
import { AuthService } from '../../core/auth/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { SaleInvoice } from '../../core/models/customer.models';

interface CartItem {
  cart_item_id?: number;
  product_no: number;
  product_name: string;
  generic_name: string;
  manufacturer: string;
  cost_price: number;
  unit_price: number;
  qty: number; // Retail: pcs, Wholesale: box qty
  pcs_per_box: number;
  discount: number;
  discount_type: number; // 1: %, 2: Flat
  total: number;
  stock?: number;
  rak?: string;
  barcode?: string;
}

interface CatalogProduct {
  id: number;
  name: string;
  generic: string;
  manufacturer: string;
  cost: number;
  saleRetail: number;
  saleWholesale: number;
  pcsPerBox: number;
  stock: number;
  minStock: number;
  rak: string;
  barcode: string;
  strength: string;
}

interface SplitPayment {
  method: string;
  amount: number;
}

interface HeldOrder {
  id: string;
  heldAt: string;
  customerName: string;
  customerId: string;
  mode: number;
  items: CartItem[];
  total: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  customer_type: number;
  address: string;
  current_due: number;
}

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  styles: [`
    ::ng-deep .product-search-dropdown {
      min-width: 480px !important;
    }
    ::ng-deep .product-search-dropdown .cdk-virtual-scroll-viewport {
      min-height: 280px !important;
      max-height: 320px !important;
      height: 285px !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item {
      min-height: 56px !important;
      height: 56px !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      padding: 4px 10px !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-content {
      width: 100% !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-900,
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-800,
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-700,
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-600 {
      color: #ffffff !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-500,
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-slate-400 {
      color: rgba(255, 255, 255, 0.88) !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .text-indigo-600 {
      color: #ffffff !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .bg-indigo-50 {
      background-color: rgba(255, 255, 255, 0.22) !important;
      color: #ffffff !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .border-slate-100 {
      border-color: rgba(255, 255, 255, 0.15) !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .bg-emerald-100 {
      background-color: rgba(255, 255, 255, 0.95) !important;
      color: #047857 !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .bg-amber-100 {
      background-color: rgba(255, 255, 255, 0.95) !important;
      color: #b45309 !important;
    }
    ::ng-deep .product-search-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .bg-rose-100 {
      background-color: rgba(255, 255, 255, 0.95) !important;
      color: #be123c !important;
    }

    /* POS Checkout Drawer Styles from Prototype */
    .checkout-drawer {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 14px 16px;
      position: sticky;
      top: 12px;
    }
    .checkout-drawer .net {
      background: #161a23;
      color: #fff;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      margin-bottom: 12px;
    }
    .checkout-drawer .net small {
      letter-spacing: .1em;
      font-size: 12px;
      color: #a8b0be;
      text-transform: uppercase;
      font-weight: 600;
    }
    .checkout-drawer .net b {
      display: block;
      font-size: 34px;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      line-height: 1.2;
      margin-top: 2px;
    }
    .checkout-drawer .mini {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #6b7686;
      margin-bottom: 6px;
    }
    .checkout-drawer .mini b {
      color: #1f2733;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .checkout-drawer .linkbtn {
      background: none;
      border: 0;
      color: #4f46e5;
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      padding: 0;
      font-weight: 600;
    }
    .checkout-drawer .linkbtn:hover {
      text-decoration: underline;
    }
    .checkout-drawer .pay {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .checkout-drawer .pay button {
      height: 42px;
      border: 1px solid #e3e7ee;
      background: #fff;
      color: #1f2733;
      border-radius: 8px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .checkout-drawer .pay button:hover {
      background: #f1f3f7;
    }
    .checkout-drawer .pay button.on {
      border-color: #4f46e5;
      background: #eef0ff;
      color: #4f46e5;
      font-weight: 600;
    }
    .checkout-drawer .pay button .brand-svg {
      height: 23px;
      width: auto;
      max-width: 48px;
      display: block;
      pointer-events: none;
    }
    .checkout-drawer .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .checkout-drawer .notes {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .checkout-drawer .notes button {
      flex: 1;
      height: 32px;
      border: 1px solid #e3e7ee;
      background: #fff;
      color: #1f2733;
      border-radius: 8px;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .checkout-drawer .notes button:hover {
      background: #f1f3f7;
      border-color: #cbd5e1;
    }
    .checkout-drawer .sprow {
      display: grid;
      grid-template-columns: 85px 1fr;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
      font-size: 13px;
      color: #6b7686;
    }
    .checkout-drawer .sprow input {
      height: 36px;
      border: 1px solid #e3e7ee;
      border-radius: 8px;
      padding: 0 10px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      background: #fff;
      color: #1f2733;
      font-weight: 600;
    }
    .checkout-drawer .sprow input:focus {
      outline: 2px solid #4f46e5;
      outline-offset: -1px;
    }
    .checkout-drawer .result {
      margin-top: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      background: #f1f3f7;
      color: #6b7686;
    }
    .checkout-drawer .result.ok {
      background: #dcfce7;
      color: #166534;
    }
    .checkout-drawer .result.short {
      background: #fef3c7;
      color: #92400e;
    }
    .checkout-drawer .go {
      height: 50px;
      width: 100%;
      border: 0;
      border-radius: 10px;
      background: #16a34a;
      color: #fff;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .checkout-drawer .go:hover:not(:disabled) {
      background: #15803d;
    }
    .checkout-drawer .go:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
    .checkout-drawer .hint {
      font-size: 12px;
      color: #6b7686;
      text-align: center;
      margin-top: 6px;
      min-height: 18px;
    }
    .checkout-drawer .opt {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      font-size: 13px;
    }
    .checkout-drawer .opt label {
      margin: 0;
      font-weight: 500;
      color: #1f2733;
      font-size: 13px;
      display: flex;
      gap: 6px;
      align-items: center;
      cursor: pointer;
    }
    .checkout-drawer .sep {
      height: 1px;
      background: #e3e7ee;
      margin: 14px 0;
    }
    .checkout-drawer .dueinfo {
      margin-top: 8px;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
    }
    .checkout-drawer .dueinfo.has {
      background: #fef3c7;
      color: #92400e;
    }
    .checkout-drawer .dueinfo.none {
      background: #dcfce7;
      color: #166534;
    }
    .checkout-drawer .dueinfo .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .checkout-drawer .dueinfo b {
      font-variant-numeric: tabular-nums;
    }
    .checkout-drawer .chk {
      display: flex;
      gap: 6px;
      align-items: center;
      margin: 6px 0 0;
      font-weight: 500;
      font-size: 13px;
      color: inherit;
      cursor: pointer;
    }
    .checkout-drawer .tender-input {
      width: 100%;
      height: 46px;
      padding: 0 12px;
      border: 1px solid #e3e7ee;
      border-radius: 8px;
      background: #fff;
      color: #1f2733;
      font-size: 18px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    .checkout-drawer .tender-input:focus {
      outline: 2px solid #4f46e5;
      outline-offset: -1px;
    }
  `],
  templateUrl: './pos-terminal.component.html',
})
export class PosTerminalComponent implements OnInit {
  @ViewChild('addBtn', { read: ElementRef }) addBtn?: ElementRef<HTMLButtonElement>;

  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly printService = inject(PrintService);
  readonly authService = inject(AuthService);
  readonly settingsService = inject(SettingsService);

  isReceiptModalVisible = false;
  lastPrintedInvoice: SaleInvoice | null = null;
  lastPrintedItems: CartItem[] = [];

  readonly paymentMethods = PAYMENT_METHOD_OPTIONS;
  readonly customerTiers = CUSTOMER_TIER_OPTIONS;
  readonly BusinessMode = BusinessMode;
  readonly DiscountType = DiscountType;
  readonly Math = Math;

  businessMode = signal<number>(BusinessMode.Retail);
  isWholesale = computed(() => this.businessMode() === BusinessMode.Wholesale);
  quickPrint = true;

  // Catalog Products for fast search & selection
  catalogProducts = signal<CatalogProduct[]>([]);

  // Entry Form State
  selectedProductText = '';
  currentSearchTerm = '';
  selectedProductObj: CatalogProduct | null = null;
  entryQty = 1;
  entryPrice = 0;
  entryDiscountType: number = DiscountType.Percentage;
  entryDiscountValue = 0;

  // Checkout State as Signals
  selectedCustomer = signal<string>('1');
  selectedPaymentType = signal<number>(1); // 1: Cash, 6: Card, 3: MFS, 8: Split, 4: Due
  cashReceived = signal<boolean>(true);
  orderNote = '';

  // Prototype Payment & UI state
  selectedMethod = signal<'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'split' | 'due'>('cash');
  showDiscountBox = signal<boolean>(false);
  showNoteBox = signal<boolean>(false);
  collectPreviousDue = signal<boolean>(false);
  txnReference = '';
  tenderTouched = false;
  spCashTouched = false;
  showSplitOption = false; // Hidden for now per user request

  readonly methodDisplayNames: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    upay: 'Upay',
    split: 'Split',
    due: 'Due',
  };

  globalDiscountType = signal<number>(DiscountType.Percentage);
  globalDiscountValue = signal<number>(0);

  cardCommission = signal<boolean>(false);
  cardCommissionRate = signal<number>(1.5);

  tendered = signal<number>(0);
  isManualTender = signal<boolean>(false);

  // Dedicated Split Tender Channels (Card, Cash, bKash, Nagad, Other)
  splitCash = signal<number>(0);
  splitCard = signal<number>(0);
  splitMfs = signal<number>(0);
  splitBkash = signal<number>(0);
  splitNagad = signal<number>(0);
  splitOther = signal<number>(0);
  lastPrintedPayments: { method: string; amount: number }[] = [];

  readonly splitSum = computed(() => {
    return Math.round((
      (Number(this.splitCash()) || 0) +
      (Number(this.splitCard()) || 0) +
      (Number(this.splitBkash()) || 0) +
      (Number(this.splitNagad()) || 0) +
      (Number(this.splitOther()) || 0)
    ) * 100) / 100;
  });

  readonly splitTotal = computed(() => this.splitSum());

  readonly splitRemaining = computed(() => {
    const rem = this.payableTotal() - this.splitSum();
    return rem > 0 ? Math.round(rem * 100) / 100 : 0;
  });

  readonly splitOverpaid = computed(() => {
    const over = this.splitSum() - this.payableTotal();
    return over > 0 ? Math.round(over * 100) / 100 : 0;
  });

  // Legacy Split Payment List
  splitPayments = signal<SplitPayment[]>([]);

  // Held Orders State (F9)
  heldOrders = signal<HeldOrder[]>([]);
  isHeldOrdersModalVisible = false;

  customers: CustomerOption[] = [
    { id: '1', name: 'Walking Customer', phone: '', customer_type: 1, address: 'Counter', current_due: 0 },
  ];

  cart = signal<CartItem[]>([]);

  constructor() {
    // Auto-sync tender amount and split balance unless cashier explicitly modified
    effect(() => {
      const payable = this.payableTotal();
      const m = this.selectedMethod();
      const isManual = this.isManualTender();

      if (!isManual && !this.tenderTouched && m === 'cash') {
        this.tendered.set(payable);
      }
      if (m === 'split' && !this.spCashTouched) {
        const nonCash = (Number(this.splitCard()) || 0) +
                        (Number(this.splitBkash()) || 0) +
                        (Number(this.splitNagad()) || 0) +
                        (Number(this.splitOther()) || 0);
        this.splitCash.set(Math.max(0, Math.round((payable - nonCash) * 100) / 100));
      }
    }, { allowSignalWrites: true });
  }

  // Computed Values
  readonly subtotal = computed(() => {
    const sum = this.cart().reduce((acc, item) => acc + item.total, 0);
    return Math.round(sum * 100) / 100;
  });

  readonly discountAmount = computed(() => {
    const sub = this.subtotal();
    const val = Math.max(0, Number(this.globalDiscountValue()) || 0);
    if (val <= 0 || sub <= 0) return 0;
    const amt = this.globalDiscountType() === DiscountType.Percentage
      ? (sub * val) / 100
      : val;
    return Math.min(sub, Math.round(amt * 100) / 100);
  });

  readonly cardFee = computed(() => {
    if (!this.cardCommission()) return 0;
    const taxable = Math.max(0, this.subtotal() - this.discountAmount());
    const fee = (taxable * (Number(this.cardCommissionRate()) || 1.5)) / 100;
    return Math.round(fee * 100) / 100;
  });

  readonly finalPrice = computed(() => {
    const net = Math.max(0, this.subtotal() - this.discountAmount() + this.cardFee());
    return Math.round(net * 100) / 100;
  });

  readonly payableTotal = computed(() => {
    const net = this.finalPrice();
    const pc = (this.collectPreviousDue() && this.previousDue() > 0 && this.selectedMethod() !== 'due')
      ? this.previousDue()
      : 0;
    return Math.round((net + pc) * 100) / 100;
  });

  readonly totalCartPcs = computed(() => {
    const isWs = this.isWholesale();
    return this.cart().reduce((sum, item) => {
      const pcs = isWs ? Math.round(item.qty * (item.pcs_per_box || 10)) : Math.round(item.qty);
      return sum + pcs;
    }, 0);
  });

  readonly checkoutDisabledReason = computed(() => {
    if (this.cart().length === 0) return 'Add at least one item.';
    const m = this.selectedMethod();
    const payable = this.payableTotal();
    const tend = Number(this.tendered()) || 0;
    if (m === 'cash' && tend < payable) return 'Received amount is less than the total.';
    if (m === 'split') {
      const diff = Math.round((payable - this.splitSum()) * 100) / 100;
      if (diff !== 0) return 'Split amounts must add up to the total.';
    }
    if (m === 'due') {
      if (this.selectedCustomer() === '1') return 'Choose a customer for due sales.';
    }
    return '';
  });

  readonly isCheckoutDisabled = computed(() => {
    return this.checkoutDisabledReason().length > 0;
  });

  readonly resultState = computed(() => {
    if (this.cart().length === 0) {
      return { type: 'default', text: 'Add items to start a sale.' };
    }
    const m = this.selectedMethod();
    const payable = this.payableTotal();
    const tend = Number(this.tendered()) || 0;

    if (m === 'cash') {
      if (tend >= payable) {
        const ch = Math.round((tend - payable) * 100) / 100;
        return {
          type: 'ok',
          text: ch > 0 ? `Change to return: ৳ ${ch.toFixed(2)}` : 'Exact amount, no change due',
        };
      } else {
        const short = Math.round((payable - tend) * 100) / 100;
        return {
          type: 'short',
          text: `Short by ৳ ${short.toFixed(2)}`,
        };
      }
    }

    if (m === 'split') {
      const diff = Math.round((payable - this.splitSum()) * 100) / 100;
      if (diff === 0) {
        return { type: 'ok', text: `Split settled · ৳ ${payable.toFixed(2)}` };
      } else if (diff > 0) {
        return { type: 'short', text: `Remaining ৳ ${diff.toFixed(2)}` };
      } else {
        return { type: 'short', text: `Over by ৳ ${(-diff).toFixed(2)}` };
      }
    }

    if (m === 'due') {
      const newBal = Math.round((this.previousDue() + this.finalPrice()) * 100) / 100;
      return { type: 'short', text: `New due balance: ৳ ${newBal.toFixed(2)}` };
    }

    const name = this.methodDisplayNames[m] || 'Electronic';
    return { type: 'ok', text: `Collect ৳ ${payable.toFixed(2)} via ${name}` };
  });

  readonly totalPaid = computed(() => {
    if (!this.cashReceived() && this.selectedPaymentType() === 4) return 0;
    if (this.selectedPaymentType() === 8) {
      return this.splitTotal();
    }
    if (this.splitPayments().length > 0) {
      return Math.round(this.splitPayments().reduce((s, p) => s + p.amount, 0) * 100) / 100;
    }
    return Math.max(0, Number(this.tendered()) || 0);
  });

  readonly balanceDiff = computed(() => {
    return Math.round((this.totalPaid() - this.finalPrice()) * 100) / 100;
  });

  readonly isAdvance = computed(() => this.balanceDiff() >= 0);

  readonly changeDue = computed(() => (this.isAdvance() ? this.balanceDiff() : 0));

  readonly ticketDue = computed(() => (!this.isAdvance() ? Math.abs(this.balanceDiff()) : 0));

  readonly selectedCustomerObj = computed(() => {
    return this.customers.find(c => c.id === this.selectedCustomer());
  });

  readonly previousDue = computed(() => {
    return this.selectedCustomerObj()?.current_due || 0;
  });

  readonly totalCustomerDue = computed(() => {
    return Math.round((this.previousDue() + this.ticketDue()) * 100) / 100;
  });

  readonly nextRoundTender = computed(() => {
    const total = this.finalPrice();
    if (total <= 0) return 0;
    const notes = [20, 50, 100, 200, 500, 1000];
    for (const note of notes) {
      if (note >= total) return note;
    }
    return Math.ceil(total / 500) * 500;
  });

  readonly fastMovingProducts = computed(() => {
    const list = this.catalogProducts();
    const inStock = list.filter(p => p.stock > 0);
    return inStock.length > 0 ? inStock.slice(0, 8) : list.slice(0, 8);
  });

  getCartPcsForProduct(productNo: number, productName?: string): number {
    const isWs = this.isWholesale();
    return this.cart()
      .filter(i => i.product_no === productNo || (productName && i.product_name === productName))
      .reduce((sum, i) => {
        const pcs = isWs ? Math.round(i.qty * (i.pcs_per_box || 10)) : Math.round(i.qty);
        return sum + pcs;
      }, 0);
  }

  getAvailableStock(p: CatalogProduct): number {
    return Math.max(0, (p.stock ?? 0) - this.getCartPcsForProduct(p.id, p.name));
  }

  // Modals State
  isCustomerModalVisible = false;
  customerModalMode: 'create' | 'edit' = 'create';
  customerForm: CustomerOption = { id: '', name: '', phone: '', customer_type: 1, address: '', current_due: 0 };

  isProductModalVisible = false;
  quickProductForm = { brand_name: '', generic_name: '', manufacturer: '', cost_price: 0, sale_price: 0 };

  isEditItemModalVisible = false;
  editingItem: CartItem | null = null;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'F1') {
      event.preventDefault();
      const inputEl = document.querySelector('nz-select input') as HTMLElement;
      if (inputEl) inputEl.focus();
    } else if (event.key === 'F2') {
      event.preventDefault();
      this.openQuickAddProduct();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.setQuickExact();
      this.msg.info('Set exact pay amount (F4)');
    } else if (event.key === 'F9') {
      event.preventDefault();
      this.handleHoldAction();
    } else if (event.key === 'F10' || (event.ctrlKey && event.key === 'Enter')) {
      event.preventDefault();
      this.confirmCheckout();
    } else if (event.key === 'Enter') {
      const activeEl = document.activeElement;
      const isInputOrButton = activeEl && ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(activeEl.tagName);
      const isModalOpen = this.isCustomerModalVisible || this.isHeldOrdersModalVisible || 
                          this.isReceiptModalVisible || this.isProductModalVisible || 
                          this.isEditItemModalVisible || this.isQuickGenericModalVisible || 
                          this.isQuickCompanyModalVisible;
      if (!isInputOrButton && !isModalOpen && (this.selectedProductText || this.selectedProductObj)) {
        event.preventDefault();
        this.addEntryToCart();
      }
    }
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 200 }).subscribe(res => {
      if (res.data?.items?.length) {
        const mapped: CatalogProduct[] = res.data.items.map(p => ({
          id: p.product_no,
          name: p.product_name,
          generic: p.generic_name || p.generic?.name || 'General',
          manufacturer: p.company_name || p.company?.name || 'Local Pharma',
          cost: p.purchase_price_per_piece || 0,
          saleRetail: p.sale_price_per_piece || 0,
          saleWholesale: p.wholesale_price_per_piece || (p.sale_price_per_piece * 0.9),
          pcsPerBox: p.quantity_per_box || 10,
          stock: p.stock_qty ?? 0,
          minStock: p.min_stock_qty_pcs || 10,
          rak: p.rak_number || '',
          barcode: p.barcode_value || '',
          strength: p.strength || '',
        }));
        this.catalogProducts.set(mapped);
        if (this.selectedProductObj) {
          const fresh = mapped.find(p => p.id === this.selectedProductObj?.id);
          if (fresh) this.selectedProductObj = fresh;
        }
      }
    });
  }

  ngOnInit(): void {
    this.settingsService.getInvoiceConfig().subscribe({ error: () => {} });
    this.loadProducts();

    this.customerService.getCustomers({ pageSize: 100 }).subscribe(res => {
      if (res.data?.items?.length) {
        const liveCusts = res.data.items.map(c => ({
          id: String(c.customer_no),
          name: c.name,
          phone: c.phone || '',
          customer_type: c.customer_type,
          address: c.address || '',
          current_due: c.current_due || 0,
        }));
        this.customers = [
          { id: '1', name: 'Walking Customer', phone: '', customer_type: 1, address: 'Counter', current_due: 0 },
          ...liveCusts,
        ];
      }
    });

    this.productService.getCompanies().subscribe(res => {
      if (res.data?.length) {
        this.companiesList = res.data.map(c => c.name);
      }
    });

    this.productService.getGenerics().subscribe(res => {
      if (res.data?.length) {
        this.genericsList = res.data.map(g => g.name);
      }
    });
  }

  setBusinessMode(mode: number): void {
    this.businessMode.set(mode);
    if (this.selectedProductObj) {
      this.entryPrice = mode === BusinessMode.Wholesale
        ? this.selectedProductObj.saleWholesale
        : this.selectedProductObj.saleRetail;
      this.entryQty = mode === BusinessMode.Wholesale ? 1 : 1;
    }
  }

  onProductSearch(term: string): void {
    this.currentSearchTerm = term || '';
  }

  onProductEnterKey(): void {
    if (!this.selectedProductText && this.currentSearchTerm) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.catalogProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        String(p.id) === term
      );
      if (match) {
        this.selectedProductText = match.name;
        this.onProductPicked(match.name);
      } else {
        this.selectedProductText = this.currentSearchTerm.trim();
        if (this.entryPrice <= 0) {
          this.entryPrice = this.isWholesale() ? 50 : 10;
        }
      }
    }
    this.addEntryToCart();
  }

  onProductPicked(name: string): void {
    const found = this.catalogProducts().find(p => p.name === name);
    if (found) {
      this.selectedProductObj = found;
      this.entryPrice = this.isWholesale() ? found.saleWholesale : found.saleRetail;
      this.entryQty = this.isWholesale() ? 1 : 1;
    }
    this.focusAddButton();
  }

  onProductOptionSelected(product: CatalogProduct): void {
    this.selectedProductObj = product;
    this.selectedProductText = product.name;
    this.entryPrice = this.isWholesale() ? product.saleWholesale : product.saleRetail;
    this.entryQty = this.isWholesale() ? 1 : 1;
    this.focusAddButton();
  }

  focusAddButton(): void {
    const doFocus = () => {
      const btn = this.addBtn?.nativeElement || (document.getElementById('pos-add-btn') as HTMLButtonElement);
      if (btn) {
        btn.focus();
      }
    };
    setTimeout(doFocus, 50);
    setTimeout(doFocus, 150);
  }

  focusProductSearch(): void {
    setTimeout(() => {
      const inputEl = document.querySelector('nz-select input') as HTMLElement;
      if (inputEl) {
        inputEl.focus();
      }
    }, 80);
  }

  getEntryLineTotal(): number {
    const price = Number(this.entryPrice) || 0;
    const qty = Number(this.entryQty) || 0;
    if (price <= 0 || qty <= 0) return 0;
    const gross = price * qty;
    let disc = 0;
    const val = Number(this.entryDiscountValue) || 0;
    if (val > 0) {
      disc = this.entryDiscountType === DiscountType.Flat ? val : (gross * val) / 100;
    }
    return Math.round(Math.max(0, gross - disc) * 100) / 100;
  }

  quickAddProductToCart(product: CatalogProduct): void {
    this.selectedProductObj = product;
    this.selectedProductText = product.name;
    this.entryPrice = this.isWholesale() ? product.saleWholesale : product.saleRetail;
    this.entryQty = 1;
    this.entryDiscountValue = 0;
    this.addEntryToCart();
  }

  addEntryToCart(): void {
    // Fallback: If selectedProductText is empty but cashier typed in the search box
    if (!this.selectedProductText.trim() && this.currentSearchTerm.trim()) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      const match = this.catalogProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase() === term) ||
        String(p.id) === term
      );
      if (match) {
        this.selectedProductText = match.name;
        this.onProductPicked(match.name);
      } else {
        this.selectedProductText = this.currentSearchTerm.trim();
        if (this.entryPrice <= 0) {
          this.entryPrice = this.isWholesale() ? 50 : 10;
        }
      }
    }

    if (!this.selectedProductText.trim()) {
      this.msg.warning('Please select a product first.');
      return;
    }
    const product = this.selectedProductObj || this.catalogProducts().find(p =>
      p.name.toLowerCase() === this.selectedProductText.toLowerCase().trim() ||
      String(p.id) === this.selectedProductText.trim()
    );
    const targetProd = product || this.catalogProducts()[0];
    const targetProdNo = targetProd ? targetProd.id : 1;
    const name = product ? product.name : (targetProd ? targetProd.name : this.selectedProductText);
    const generic = product ? product.generic : (targetProd ? targetProd.generic : 'General');
    const manufacturer = product ? product.manufacturer : (targetProd ? targetProd.manufacturer : 'Local Pharma');
    const cost = product ? product.cost : (targetProd ? targetProd.cost : (this.entryPrice * 0.8));
    const price = Number(this.entryPrice) || (targetProd ? (this.isWholesale() ? targetProd.saleWholesale : targetProd.saleRetail) : (this.isWholesale() ? 50 : 10));
    const qty = Number(this.entryQty) || 1;
    const pcsPerBox = product ? product.pcsPerBox : (targetProd ? targetProd.pcsPerBox : 10);
    const availStock = product ? this.getAvailableStock(product) : (targetProd ? this.getAvailableStock(targetProd) : 0);
    const rakLocation = product ? product.rak : (targetProd ? targetProd.rak : '');
    const barcodeVal = product ? product.barcode : (targetProd ? targetProd.barcode : '');

    let lineDiscount = 0;
    const discountVal = Number(this.entryDiscountValue) || 0;
    if (discountVal > 0) {
      if (this.entryDiscountType === DiscountType.Flat) {
        lineDiscount = discountVal;
      } else {
        lineDiscount = (price * qty * discountVal) / 100;
      }
    }
    lineDiscount = Math.round(lineDiscount * 100) / 100;
    const lineTotal = Math.round(Math.max(0, (price * qty) - lineDiscount) * 100) / 100;

    if (availStock <= 0) {
      this.msg.warning(`Notice: ${name} is out of stock in inventory.`);
    } else if (qty > availStock) {
      this.msg.warning(`Notice: Requested ${qty} exceeds available stock (${availStock} pcs).`);
    }

    // Check if item already exists in cart with same product_no or name and same unit price
    const existingIndex = this.cart().findIndex(i => (i.product_no === targetProdNo || i.product_name === name) && i.unit_price === price);
    if (existingIndex > -1) {
      this.cart.update(items => items.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = Math.round((item.qty + qty) * 100) / 100;
          let newDisc = 0;
          if (item.discount_type === DiscountType.Flat) {
            newDisc = item.discount + lineDiscount;
          } else {
            const pct = (item.discount / (item.unit_price * item.qty)) * 100 || 0;
            newDisc = Math.round(((item.unit_price * newQty * pct) / 100) * 100) / 100;
          }
          const newTot = Math.round(Math.max(0, (item.unit_price * newQty) - newDisc) * 100) / 100;
          return {
            ...item,
            qty: newQty,
            discount: newDisc,
            total: newTot,
            stock: item.stock ?? availStock,
            rak: item.rak || rakLocation,
          };
        }
        return item;
      }));
      this.msg.success(`Updated ${name} quantity in basket`);
    } else {
      const newItem: CartItem = {
        cart_item_id: Date.now(),
        product_no: targetProdNo,
        product_name: name,
        generic_name: generic,
        manufacturer,
        cost_price: cost,
        unit_price: price,
        qty,
        pcs_per_box: pcsPerBox,
        discount: lineDiscount,
        discount_type: this.entryDiscountType,
        total: lineTotal,
        stock: availStock,
        rak: rakLocation,
        barcode: barcodeVal,
      };
      this.cart.update(list => [newItem, ...list]);
      this.msg.success(`Added ${newItem.product_name} to cart`);
    }

    this.isManualTender.set(false); // Reset to auto-tender for new cart state!
    this.selectedProductText = '';
    this.selectedProductObj = null;
    this.currentSearchTerm = '';
    this.entryQty = 1;
    this.entryPrice = 0;
    this.entryDiscountValue = 0;
    this.focusProductSearch();
  }

  updateItemQty(item: CartItem, delta: number): void {
    const step = this.isWholesale() ? 0.25 : 1;
    const currentQty = Number(item.qty) || 0;
    const newQty = Math.max(step, Math.round((currentQty + delta) * 100) / 100);
    if (item.stock && newQty > item.stock && delta > 0) {
      this.msg.warning(`Requested ${newQty} exceeds available stock (${item.stock} pcs)`);
    }
    this.applyItemQty(item, newQty);
  }

  setItemQty(item: CartItem, newQtyRaw: number | string): void {
    const val = Math.max(0.01, Number(newQtyRaw) || 0.01);
    const newQty = Math.round(val * 100) / 100;
    if (item.stock && newQty > item.stock) {
      this.msg.warning(`Requested ${newQty} exceeds available stock (${item.stock} pcs)`);
    }
    this.applyItemQty(item, newQty);
  }

  private applyItemQty(item: CartItem, newQty: number): void {
    let newDisc = item.discount;
    if (item.discount_type === DiscountType.Percentage && item.qty > 0) {
      const pct = (item.discount / (item.unit_price * item.qty)) * 100 || 0;
      newDisc = Math.round(((item.unit_price * newQty * pct) / 100) * 100) / 100;
    }
    const newTotal = Math.round(Math.max(0, (item.unit_price * newQty) - newDisc) * 100) / 100;

    this.cart.update(list => list.map(i => {
      const match = (item.cart_item_id && i.cart_item_id) ? (i.cart_item_id === item.cart_item_id) : (i.product_no === item.product_no);
      if (match) {
        return {
          ...i,
          qty: newQty,
          discount: newDisc,
          total: newTotal,
        };
      }
      return i;
    }));
  }

  removeItem(item: CartItem): void {
    this.cart.update(list => list.filter(i => {
      if (item.cart_item_id && i.cart_item_id) return i.cart_item_id !== item.cart_item_id;
      return i.product_no !== item.product_no;
    }));
  }

  openEditItemModal(item: CartItem): void {
    this.editingItem = { ...item };
    this.isEditItemModalVisible = true;
  }

  getEditingItemTotal(): number {
    if (!this.editingItem) return 0;
    const price = Number(this.editingItem.unit_price) || 0;
    const qty = Number(this.editingItem.qty) || 0;
    const disc = Number(this.editingItem.discount) || 0;
    return Math.round(Math.max(0, (price * qty) - disc) * 100) / 100;
  }

  saveEditedItem(): void {
    if (!this.editingItem) return;
    const updated = this.editingItem;
    const price = Number(updated.unit_price) || 0;
    const qty = Math.max(0.01, Number(updated.qty) || 1);
    const disc = Math.max(0, Number(updated.discount) || 0);
    updated.unit_price = price;
    updated.qty = qty;
    updated.discount = disc;
    updated.total = Math.round(Math.max(0, (price * qty) - disc) * 100) / 100;

    this.cart.update(list => list.map(i => {
      const match = (updated.cart_item_id && i.cart_item_id) ? (i.cart_item_id === updated.cart_item_id) : (i.product_no === updated.product_no);
      return match ? updated : i;
    }));
    this.isEditItemModalVisible = false;
    this.msg.success('Item updated');
  }

  // F9 Hold Order System
  handleHoldAction(): void {
    if (this.cart().length > 0) {
      const currentCust = this.customers.find(c => c.id === this.selectedCustomer());
      const held: HeldOrder = {
        id: 'HOLD-' + Date.now().toString().slice(-4),
        heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: currentCust ? currentCust.name : 'Walking Customer',
        customerId: this.selectedCustomer(),
        mode: this.businessMode(),
        items: [...this.cart()],
        total: this.finalPrice(),
      };

      this.heldOrders.update(orders => [held, ...orders]);
      this.cart.set([]);
      this.tendered.set(0);
      this.splitPayments.set([]);
      this.globalDiscountValue.set(0);
      this.msg.info(`Order held #${held.id}. Basket is ready for next customer.`);
    } else {
      if (this.heldOrders().length > 0) {
        this.isHeldOrdersModalVisible = true;
      } else {
        this.msg.warning('No items in cart to hold, and no parked orders available.');
      }
    }
  }

  recallOrder(idx: number): void {
    const order = this.heldOrders()[idx];
    if (!order) return;

    if (this.cart().length > 0) {
      this.msg.warning('Please clear or hold active basket before recalling another order.');
      return;
    }

    this.businessMode.set(order.mode);
    this.selectedCustomer.set(order.customerId);
    this.cart.set([...order.items]);
    this.heldOrders.update(orders => orders.filter((_, i) => i !== idx));
    this.isHeldOrdersModalVisible = false;
    this.msg.success(`Recalled order from ${order.customerName}`);
  }

  deleteHeldOrder(idx: number): void {
    this.heldOrders.update(orders => orders.filter((_, i) => i !== idx));
    this.msg.info('Held order discarded.');
  }

  // Split Payment Methods & Tender Operations
  setGlobalDiscountType(type: number): void {
    this.globalDiscountType.set(type);
  }

  onGlobalDiscountChange(val: number): void {
    this.globalDiscountValue.set(Math.max(0, Number(val) || 0));
  }

  onCardCommissionToggle(checked: boolean): void {
    this.cardCommission.set(checked);
  }

  setExactPayment(): void {
    this.isManualTender.set(false);
    this.tenderTouched = false;
    this.cashReceived.set(true);
    this.tendered.set(this.payableTotal());
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  setQuickExact(): void {
    this.setExactPayment();
  }

  resetTenderToExact(): void {
    this.isManualTender.set(false);
    this.tenderTouched = false;
    this.tendered.set(this.payableTotal());
  }

  setQuickCash(amount: number): void {
    this.isManualTender.set(true);
    this.tenderTouched = true;
    this.cashReceived.set(true);
    this.tendered.set(amount);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  addQuickCash(extra: number): void {
    this.isManualTender.set(true);
    this.tenderTouched = true;
    this.cashReceived.set(true);
    const curr = Number(this.tendered()) || 0;
    this.tendered.set(curr + extra);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  setMethod(m: 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'split' | 'due'): void {
    this.selectedMethod.set(m);
    this.tenderTouched = false;
    this.isManualTender.set(false);

    if (m === 'cash') {
      this.selectedPaymentType.set(1);
      this.cashReceived.set(true);
      this.cardCommission.set(false);
      this.tendered.set(this.payableTotal());
    } else if (m === 'card') {
      this.selectedPaymentType.set(6);
      this.cashReceived.set(true);
      this.cardCommission.set(true);
      this.tendered.set(this.payableTotal());
    } else if (m === 'bkash' || m === 'nagad' || m === 'rocket' || m === 'upay') {
      this.selectedPaymentType.set(3);
      this.cashReceived.set(true);
      this.cardCommission.set(false);
      this.tendered.set(this.payableTotal());
    } else if (m === 'split') {
      this.selectedPaymentType.set(8);
      this.cashReceived.set(true);
      this.cardCommission.set(false);
      this.spCashTouched = false;
      this.splitCard.set(0);
      this.splitBkash.set(0);
      this.splitNagad.set(0);
      this.splitOther.set(0);
      this.splitCash.set(this.payableTotal());
    } else if (m === 'due') {
      this.selectedPaymentType.set(4);
      this.cashReceived.set(false);
      this.cardCommission.set(false);
      this.tendered.set(0);
      this.collectPreviousDue.set(false);
    }
  }

  setPaymentMethod(type: number): void {
    const mapTypeToMethod: Record<number, 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'split' | 'due'> = {
      1: 'cash',
      6: 'card',
      2: 'card',
      3: 'bkash',
      8: 'split',
      4: 'due',
    };
    this.setMethod(mapTypeToMethod[type] || 'cash');
  }

  onSplitChannelInput(channel: 'card' | 'bkash' | 'nagad' | 'other', val: number | string): void {
    const num = Math.max(0, Number(val) || 0);
    const rounded = Math.round(num * 100) / 100;
    if (channel === 'card') this.splitCard.set(rounded);
    else if (channel === 'bkash') this.splitBkash.set(rounded);
    else if (channel === 'nagad') this.splitNagad.set(rounded);
    else if (channel === 'other') this.splitOther.set(rounded);

    if (!this.spCashTouched) {
      const nonCash = (Number(this.splitCard()) || 0) +
                      (Number(this.splitBkash()) || 0) +
                      (Number(this.splitNagad()) || 0) +
                      (Number(this.splitOther()) || 0);
      const rest = Math.max(0, Math.round((this.payableTotal() - nonCash) * 100) / 100);
      this.splitCash.set(rest);
    }
  }

  onSplitCashChange(val: number | string): void {
    this.spCashTouched = true;
    this.splitCash.set(Math.max(0, Number(val) || 0));
  }

  onCustomerChange(id: string): void {
    this.selectedCustomer.set(id);
    this.collectPreviousDue.set(false);
    this.spCashTouched = false;
    this.tenderTouched = false;
    if (!this.tenderTouched && this.selectedMethod() === 'cash') {
      this.tendered.set(this.payableTotal());
    }
  }

  toggleCollectPreviousDue(checked: boolean): void {
    this.collectPreviousDue.set(checked);
    this.spCashTouched = false;
    this.tenderTouched = false;
    if (this.selectedMethod() === 'cash') {
      this.tendered.set(this.payableTotal());
    } else if (this.selectedMethod() === 'split') {
      const nonCash = (Number(this.splitCard()) || 0) +
                      (Number(this.splitBkash()) || 0) +
                      (Number(this.splitNagad()) || 0) +
                      (Number(this.splitOther()) || 0);
      this.splitCash.set(Math.max(0, Math.round((this.payableTotal() - nonCash) * 100) / 100));
    }
  }

  onSplitChannelChange(channel: 'cash' | 'card' | 'mfs', val: number | string): void {
    const num = Math.max(0, Number(val) || 0);
    const rounded = Math.round(num * 100) / 100;
    if (channel === 'cash') this.splitCash.set(rounded);
    else if (channel === 'card') this.splitCard.set(rounded);
    else if (channel === 'mfs') this.splitMfs.set(rounded);
  }

  fillRemainingTo(channel: 'cash' | 'card' | 'mfs'): void {
    const rem = this.splitRemaining();
    if (rem <= 0) return;
    if (channel === 'cash') {
      this.splitCash.set(Math.round((this.splitCash() + rem) * 100) / 100);
    } else if (channel === 'card') {
      this.splitCard.set(Math.round((this.splitCard() + rem) * 100) / 100);
    } else if (channel === 'mfs') {
      this.splitMfs.set(Math.round((this.splitMfs() + rem) * 100) / 100);
    }
  }

  setSplitFull(channel: 'cash' | 'card' | 'mfs'): void {
    this.splitCash.set(0);
    this.splitCard.set(0);
    this.splitMfs.set(0);
    const full = this.finalPrice();
    if (channel === 'cash') this.splitCash.set(full);
    else if (channel === 'card') this.splitCard.set(full);
    else if (channel === 'mfs') this.splitMfs.set(full);
  }

  clearSplitChannel(channel: 'cash' | 'card' | 'mfs'): void {
    if (channel === 'cash') this.splitCash.set(0);
    else if (channel === 'card') this.splitCard.set(0);
    else if (channel === 'mfs') this.splitMfs.set(0);
  }

  resetAllSplit(): void {
    this.splitCash.set(0);
    this.splitCard.set(0);
    this.splitMfs.set(0);
    this.splitBkash.set(0);
    this.splitNagad.set(0);
    this.splitOther.set(0);
    this.spCashTouched = false;
  }

  splitHalfAndHalf(chan1: 'cash' | 'card', chan2: 'card' | 'mfs'): void {
    const half = Math.round((this.finalPrice() / 2) * 100) / 100;
    const remainder = Math.round((this.finalPrice() - half) * 100) / 100;
    this.resetAllSplit();
    if (chan1 === 'cash') this.splitCash.set(half);
    else if (chan1 === 'card') this.splitCard.set(half);

    if (chan2 === 'card') this.splitCard.set(remainder);
    else if (chan2 === 'mfs') this.splitMfs.set(remainder);
  }

  stepTendered(delta: number): void {
    this.isManualTender.set(true);
    this.tenderTouched = true;
    this.cashReceived.set(true);
    const curr = Number(this.tendered()) || 0;
    const next = Math.max(0, curr + delta);
    this.tendered.set(Math.round(next * 100) / 100);
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onTenderedChange(val: number | string): void {
    this.isManualTender.set(true);
    this.tenderTouched = true;
    this.cashReceived.set(true);
    this.tendered.set(Math.max(0, Number(val) || 0));
    if (this.splitPayments().length > 0) {
      this.splitPayments.set([]);
    }
  }

  onPaymentTypeChange(type: number): void {
    this.setPaymentMethod(type);
  }

  toggleCashReceived(checked: boolean): void {
    this.cashReceived.set(checked);
    if (!checked) {
      this.tendered.set(0);
      this.splitPayments.set([]);
    } else {
      this.isManualTender.set(false);
      this.tendered.set(this.finalPrice());
    }
  }

  addSplitPayment(method: string): void {
    const existingSum = this.splitPayments().reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, this.finalPrice() - existingSum);
    const amount = remaining > 0 ? remaining : (this.tendered() > 0 ? this.tendered() : 50);
    this.splitPayments.update(list => [...list, { method, amount: Math.round(amount * 100) / 100 }]);
    this.tendered.set(Math.round((existingSum + amount) * 100) / 100);
    this.cashReceived.set(true);
  }

  removeSplitPayment(idx: number): void {
    this.splitPayments.update(list => list.filter((_, i) => i !== idx));
    const newSum = this.splitPayments().reduce((s, p) => s + p.amount, 0);
    this.tendered.set(Math.round(newSum * 100) / 100);
  }

  startNewInvoice(): void {
    if (this.cart().length > 0) {
      this.modal.confirmAction('Start New Invoice?', 'Clear current basket?', 'Clear', true)
        .subscribe(confirmed => {
          if (confirmed) {
            this.cart.set([]);
            this.isManualTender.set(false);
            this.tendered.set(0);
            this.splitPayments.set([]);
            this.splitCash.set(0);
            this.splitCard.set(0);
            this.splitMfs.set(0);
            this.splitBkash.set(0);
            this.splitNagad.set(0);
            this.splitOther.set(0);
            this.spCashTouched = false;
            this.tenderTouched = false;
            this.globalDiscountValue.set(0);
            this.cardCommission.set(false);
            this.showDiscountBox.set(false);
            this.showNoteBox.set(false);
            this.collectPreviousDue.set(false);
            this.orderNote = '';
            this.txnReference = '';
          }
        });
    }
  }

  normalizePhone(phone: string): string {
    if (!phone) return '';
    let p = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (p.startsWith('+88')) p = p.substring(3);
    if (p.startsWith('88')) p = p.substring(2);
    return p;
  }

  openAddCustomerModal(initialPhone: string = ''): void {
    this.customerModalMode = 'create';
    this.customerForm = { id: crypto.randomUUID(), name: '', phone: initialPhone, customer_type: 1, address: '', current_due: 0 };
    this.isCustomerModalVisible = true;
    setTimeout(() => {
      const phoneInput = document.getElementById('customer-modal-phone-input');
      phoneInput?.focus();
    }, 150);
  }

  saveCustomer(): void {
    const rawPhone = this.customerForm.phone?.trim() || '';
    const cleanPhone = this.normalizePhone(rawPhone);

    if (!cleanPhone) {
      this.msg.warning('Customer mobile phone number is required.');
      return;
    }

    // Bangladeshi mobile number format check: 11 digits, starts with 01[3-9]
    const phonePattern = /^01[3-9]\d{8}$/;
    if (!phonePattern.test(cleanPhone)) {
      this.msg.warning('Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).');
      return;
    }

    // Check for existing customer duplicate phone
    const existing = this.customers.find(c => c.phone && this.normalizePhone(c.phone) === cleanPhone && c.id !== this.customerForm.id);
    if (existing) {
      this.msg.warning(`Customer with mobile ${cleanPhone} already exists: "${existing.name}". Selected existing customer.`);
      this.selectedCustomer.set(existing.id);
      this.isCustomerModalVisible = false;
      return;
    }

    const trimmedName = this.customerForm.name?.trim() || '';

    // If name is not provided, prompt confirmation to save mobile number as customer name
    if (!trimmedName) {
      this.modal.confirmAction(
        'Save Customer with Mobile Number?',
        `Customer name is empty. Do you want to save this customer with the mobile number "${cleanPhone}" as the customer name?`,
        'Yes, Save as Name',
        false
      ).subscribe(confirmed => {
        if (confirmed) {
          this.customerForm.name = cleanPhone;
          this.executeSaveCustomer(cleanPhone);
        } else {
          setTimeout(() => {
            const nameInput = document.getElementById('customer-modal-name-input');
            nameInput?.focus();
          }, 150);
        }
      });
      return;
    }

    this.executeSaveCustomer(cleanPhone);
  }

  private executeSaveCustomer(cleanPhone: string): void {
    const customerPayload = {
      name: this.customerForm.name.trim() || cleanPhone,
      phone: cleanPhone,
      customer_type: this.customerForm.customer_type || 1,
      address: this.customerForm.address?.trim() || '',
      current_due: this.customerForm.current_due || 0,
      has_due: (this.customerForm.current_due || 0) > 0,
    };

    this.customerService.createCustomer(customerPayload).subscribe({
      next: (res) => {
        if (res.data) {
          const newCust = {
            id: String(res.data.customer_no),
            name: res.data.name,
            phone: res.data.phone,
            customer_type: res.data.customer_type,
            address: res.data.address || '',
            current_due: res.data.current_due || 0,
          };
          this.customers = [...this.customers, newCust];
          this.selectedCustomer.set(newCust.id);
          this.isCustomerModalVisible = false;
          this.msg.success(`Customer "${newCust.name}" registered successfully!`);
        } else if (res.message) {
          this.msg.error(res.message);
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to register customer.');
      }
    });
  }

  // Sub-Modals for Quick Product
  companiesList: string[] = [...DEFAULT_COMPANIES];
  genericsList: string[] = [...DEFAULT_GENERICS];
  isQuickGenericModalVisible = false;
  newQuickGenericName = '';
  isQuickCompanyModalVisible = false;
  newQuickCompanyName = '';

  openQuickAddProduct(): void {
    this.quickProductForm = {
      brand_name: '',
      generic_name: this.genericsList[0] || 'Paracetamol',
      manufacturer: this.companiesList[0] || 'Beximco Pharmaceuticals Ltd.',
      cost_price: 0,
      sale_price: 0,
    };
    this.isProductModalVisible = true;
  }

  saveQuickGeneric(): void {
    if (!this.newQuickGenericName.trim()) {
      this.msg.warning('Please enter generic formulation');
      return;
    }
    const name = this.newQuickGenericName.trim();
    if (!this.genericsList.includes(name)) {
      this.genericsList = [...this.genericsList, name];
    }
    this.quickProductForm.generic_name = name;
    this.newQuickGenericName = '';
    this.isQuickGenericModalVisible = false;
    this.msg.success(`Generic "${name}" added!`);
  }

  saveQuickCompany(): void {
    if (!this.newQuickCompanyName.trim()) {
      this.msg.warning('Please enter company name');
      return;
    }
    const name = this.newQuickCompanyName.trim();
    if (!this.companiesList.includes(name)) {
      this.companiesList = [...this.companiesList, name];
    }
    this.quickProductForm.manufacturer = name;
    this.newQuickCompanyName = '';
    this.isQuickCompanyModalVisible = false;
    this.msg.success(`Company "${name}" added!`);
  }

  saveQuickProduct(): void {
    if (!this.quickProductForm.brand_name.trim()) {
      this.msg.error('Brand name is required');
      return;
    }
    const name = this.quickProductForm.brand_name.trim();
    const cost = Number(this.quickProductForm.cost_price) || 10;
    const sale = Number(this.quickProductForm.sale_price) || 15;

    const prodPayload = {
      product_name: name,
      brand_name: name,
      strength: 'Standard',
      volume: 'Standard',
      purchase_price_per_piece: cost,
      sale_price_per_piece: sale,
      wholesale_price_per_piece: sale * 0.9,
      cost_per_box: cost * 10,
      sale_price_per_box: sale * 10,
      wholesale_price_per_box: sale * 9,
      quantity_per_box: 10,
      medicine_type: 1,
      unit_type: 1,
      is_medicine: true,
      min_stock_qty_pcs: 20,
    };

    this.productService.createProduct(prodPayload).subscribe(res => {
      if (res.data) {
        const newProd: CatalogProduct = {
          id: res.data.product_no,
          name: res.data.product_name,
          generic: this.quickProductForm.generic_name || 'General',
          manufacturer: this.quickProductForm.manufacturer || 'Local Pharma',
          cost: res.data.purchase_price_per_piece,
          saleRetail: res.data.sale_price_per_piece,
          saleWholesale: res.data.wholesale_price_per_piece || (res.data.sale_price_per_piece * 0.9),
          pcsPerBox: res.data.quantity_per_box,
          stock: 0,
          minStock: res.data.min_stock_qty_pcs || 10,
          rak: '',
          barcode: '',
          strength: res.data.strength || '',
        };
        this.catalogProducts.update(prods => [newProd, ...prods]);
        this.selectedProductText = name;
        this.onProductPicked(name);
        this.msg.success(`Product "${name}" registered successfully!`);
        this.isProductModalVisible = false;
      }
    });
  }

  printInvoice(): void {
    if (!this.lastPrintedInvoice && this.cart().length === 0) {
      this.msg.warning('No completed sale available to print.');
      return;
    }
    this.isReceiptModalVisible = true;
  }

  triggerBrowserPrint(format: 'a4' | 'thermal' = 'a4'): void {
    const inv = this.lastPrintedInvoice;
    const items = this.lastPrintedItems;
    if (!inv && items.length === 0) {
      this.msg.warning('No sale data available to print.');
      return;
    }

    const dateStr = inv?.sale_timestamp
      ? new Date(inv.sale_timestamp).toLocaleString('en-GB')
      : new Date().toLocaleString('en-GB');
    const [datePart, timePart] = dateStr.includes(',') ? dateStr.split(',') : [dateStr, ''];

    const subtotal = Number(inv?.gross_total_price) || items.reduce((acc, it) => acc + it.total, 0);
    const disc = Number(inv?.discount_value) || 0;
    const vat = Number(inv?.vat_amount) || 0;
    const total = Number(inv?.final_price) || items.reduce((acc, it) => acc + it.total, 0);
    const due = Number(inv?.due_amount) || 0;
    const paid = total - due;
    const change = Number(inv?.change_amount) || 0;

    this.printService.printSaleInvoice({
      inv: inv?.sales_number || `POS-${Date.now().toString().slice(-6)}`,
      date: datePart?.trim() || dateStr,
      time: timePart?.trim() || '',
      customer: this.selectedCustomerObj()?.name || (inv as any)?.customer_name || 'Walk-in Customer',
      customerPhone: this.selectedCustomerObj()?.phone || '',
      salesman: 'Sales Counter 01',
      lines: items.map(item => ({
        name: item.product_name,
        qty: item.qty,
        price: item.unit_price,
        total: item.total,
      })),
      subtotal,
      disc,
      vat,
      total,
      paid,
      due,
      change,
      paymentMethod: (inv as any)?.payment_method === 2 ? 'Card' : ((inv as any)?.payment_method === 3 ? 'MFS' : 'Cash Counter'),
      payments: this.lastPrintedPayments.map(p => ({ method: p.method, amount: p.amount })),
    }, format);
  }

  confirmCheckout(): void {
    if (this.cart().length === 0) {
      this.msg.warning('Cannot checkout an empty basket.');
      return;
    }

    const currentCust = this.customers.find(c => c.id === this.selectedCustomer());
    const customerNo = currentCust ? Number(currentCust.id) || 1 : 1;

    const salePayload = {
      invoice: {
        customer_no: customerNo,
        sale_mode: this.businessMode(),
        gross_total_price: this.subtotal(),
        discount_type: this.globalDiscountType(),
        discount_value: this.discountAmount(),
        card_commission_percent: this.cardCommission() ? Number(this.cardCommissionRate()) || 1.5 : 0,
        card_commission_amount: this.cardFee(),
        net_amount: Math.max(0, this.subtotal() - this.discountAmount()),
        vat_amount: 0,
        round_off_amount: 0,
        final_price: this.finalPrice(),
        approximate_profit: Math.round((this.finalPrice() - this.cart().reduce((sum, i) => sum + (i.cost_price * i.qty), 0)) * 100) / 100,
        customer_will_pay: this.totalPaid(),
        change_amount: this.changeDue(),
        due_amount: this.ticketDue(),
        payment_method: this.selectedPaymentType(),
        cash_received_status: this.cashReceived() ? 2 : 1,
        is_quick_printed: this.quickPrint,
        remarks: (this.orderNote ? this.orderNote + ' ' : '') + (this.txnReference ? `[Ref: ${this.txnReference}]` : ''),
      },
      items: this.cart().map(item => {
        const pcsPerBox = item.pcs_per_box || 10;
        const totalPcs = this.isWholesale()
          ? Math.max(1, Math.round(item.qty * pcsPerBox))
          : Math.max(1, Math.round(item.qty));
        const boxQty = this.isWholesale()
          ? Math.max(1, Math.round(item.qty))
          : Math.floor(totalPcs / pcsPerBox);

        return {
          product_no: item.product_no,
          sale_mode: this.businessMode(),
          sale_qty: totalPcs,
          box_qty: boxQty,
          pcs_per_box: pcsPerBox,
          unit_cost_price: item.cost_price,
          unit_sale_price: item.unit_price,
          discount_amount: item.discount,
          net_amount: item.total,
          total_price: item.total,
        };
      }),
      payments: this.selectedPaymentType() === 8
        ? [
            ...(this.splitCash() > 0 ? [{ account_no: 1, payment_method: 1, amount: this.splitCash() }] : []),
            ...(this.splitCard() > 0 ? [{ account_no: 1, payment_method: 6, amount: this.splitCard() }] : []),
            ...(this.splitBkash() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitBkash() }] : []),
            ...(this.splitNagad() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitNagad() }] : []),
            ...(this.splitOther() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitOther() }] : []),
          ]
        : this.splitPayments().length > 0
        ? this.splitPayments().map(p => ({
            account_no: 1,
            payment_method: p.method === 'Cash' ? 1 : p.method === 'Card' ? 6 : 3,
            amount: p.amount,
          }))
        : [
            {
              account_no: 1,
              payment_method: this.selectedPaymentType(),
              amount: this.totalPaid(),
            },
          ],
    };

    // If split mode was selected but all amounts were 0, default to cash full
    if (this.selectedPaymentType() === 8 && salePayload.payments.length === 0) {
      salePayload.payments = [
        { account_no: 1, payment_method: 1, amount: this.finalPrice() }
      ];
    }

    this.posSaleService.createSale(salePayload).subscribe({
      next: res => {
        if (res.success && res.data) {
          const soldCart = [...this.cart()];
          const wasWholesale = this.isWholesale();
          this.lastPrintedInvoice = res.data;
          this.lastPrintedItems = soldCart;

          // Set tender breakdown for receipt
          if (this.selectedPaymentType() === 8) {
            this.lastPrintedPayments = [
              ...(this.splitCash() > 0 ? [{ method: 'Cash', amount: this.splitCash() }] : []),
              ...(this.splitCard() > 0 ? [{ method: 'Card', amount: this.splitCard() }] : []),
              ...(this.splitBkash() > 0 ? [{ method: 'bKash', amount: this.splitBkash() }] : []),
              ...(this.splitNagad() > 0 ? [{ method: 'Nagad', amount: this.splitNagad() }] : []),
              ...(this.splitOther() > 0 ? [{ method: 'Rocket/Upay', amount: this.splitOther() }] : []),
            ];
          } else {
            const methodLabel = this.selectedPaymentType() === 1 ? 'Cash'
              : this.selectedPaymentType() === 6 ? 'Card'
              : this.selectedPaymentType() === 3 ? (this.methodDisplayNames[this.selectedMethod()] || 'MFS')
              : this.selectedPaymentType() === 4 ? 'Due' : 'Cash';
            this.lastPrintedPayments = [{ method: methodLabel, amount: this.totalPaid() }];
          }

          this.msg.success(`Sale ${res.data.sales_number} completed! Total: ৳ ${this.finalPrice().toFixed(2)}`);

          if (this.quickPrint) {
            this.isReceiptModalVisible = true;
          }

          // Immediately deduct sold quantities in local catalog signal
          this.catalogProducts.update(list =>
            list.map(p => {
              const soldPcs = soldCart
                .filter(i => i.product_no === p.id || i.product_name === p.name)
                .reduce((sum, i) => sum + (wasWholesale ? Math.round(i.qty * (i.pcs_per_box || p.pcsPerBox || 10)) : Math.round(i.qty)), 0);
              return soldPcs > 0 ? { ...p, stock: Math.max(0, p.stock - soldPcs) } : p;
            })
          );

          this.cart.set([]);
          this.isManualTender.set(false);
          this.tendered.set(0);
          this.splitPayments.set([]);
          this.splitCash.set(0);
          this.splitCard.set(0);
          this.splitMfs.set(0);
          this.splitBkash.set(0);
          this.splitNagad.set(0);
          this.splitOther.set(0);
          this.spCashTouched = false;
          this.tenderTouched = false;
          this.globalDiscountValue.set(0);
          this.showDiscountBox.set(false);
          this.showNoteBox.set(false);
          this.collectPreviousDue.set(false);
          this.orderNote = '';
          this.txnReference = '';

          // Refresh authoritative product stock from backend
          this.loadProducts();
        } else {
          this.msg.error(res.message || 'Failed to complete sale');
        }
      },
      error: () => {
        this.msg.error('An error occurred during sale processing');
      },
    });
  }
}
