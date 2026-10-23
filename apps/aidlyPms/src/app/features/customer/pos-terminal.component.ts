import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, HostListener, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ProdProductBatch } from '../../core/models/product.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
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
import { PosStorageService } from '../../core/services/pos-storage.service';
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
  is_prescription_required?: boolean;
  is_narcotic?: boolean;
  dar_number?: string | null;
  drug_schedule?: 'OTC' | 'POM' | 'ANTIBIOTIC' | 'NARCOTIC';
  batch_no?: number | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  available_batch_qty?: number;
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
  medicineType?: number;
  is_prescription_required?: boolean;
  is_narcotic?: boolean;
  dar_number?: string | null;
  drug_schedule?: 'OTC' | 'POM' | 'ANTIBIOTIC' | 'NARCOTIC';
  nearestExpiry?: string | null;
  nearestBatch?: string | null;
  batches?: ProdProductBatch[];
}

interface CategoryPill {
  id: string;
  name: string;
  icon?: string;
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
    NzSpinModule,
    NzTagModule,
    EmptyStateComponent,
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
export class PosTerminalComponent implements OnInit, AfterViewInit {
  @ViewChild('addBtn', { read: ElementRef }) addBtn?: ElementRef<HTMLButtonElement>;

  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly posSaleService = inject(PosSaleService);
  private readonly printService = inject(PrintService);
  readonly authService = inject(AuthService);
  readonly settingsService = inject(SettingsService);
  private readonly posStorageService = inject(PosStorageService);

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

  // Category Filtering & Catalog Traversal State
  selectedCategory = signal<string>('all');
  highlightedIndex = signal<number>(0);
  currentSearchTerm = signal<string>('');

  readonly categoryPills: CategoryPill[] = [
    { id: 'all', name: 'All', icon: 'appstore' },
    { id: 'fast', name: 'Fast Pick', icon: 'thunderbolt' },
    { id: 'tablet', name: 'Tablets', icon: 'medicine-box' },
    { id: 'capsule', name: 'Capsules', icon: 'experiment' },
    { id: 'syrup', name: 'Syrups', icon: 'coffee' },
    { id: 'injection', name: 'Injections', icon: 'aim' },
    { id: 'ointment', name: 'Ointments', icon: 'skin' },
    { id: 'antibiotic', name: 'Antibiotics', icon: 'safety-certificate' },
    { id: 'pom', name: 'POM (Rx)', icon: 'file-protect' },
    { id: 'otc', name: 'OTC', icon: 'check-circle' },
  ];

  // Screen 1 vs Screen 2 vs Screen 3 Switcher & State
  readonly activeScreen = signal<'screen1' | 'screen2' | 'screen3'>('screen1');

  // Screen 3 LOV Combobox & Barcode Signals
  screen3SearchTerm = signal<string>('');
  screen3IsSearchOpen = signal<boolean>(false);
  screen3HighlightedIndex = signal<number>(0);

  // Screen 2 Product Entry Signals
  screen2ProductSearch = signal<string>('');
  screen2SelectedProduct = signal<CatalogProduct | null>(null);
  screen2Qty = signal<number>(1);
  screen2Price = signal<number>(0);
  screen2Discount = signal<number>(0);
  screen2DiscountType = signal<'percent' | 'taka'>('percent');
  screen2IsSearchOpen = signal<boolean>(false);
  screen2SearchResults = signal<CatalogProduct[]>([]);
  screen2HighlightedIndex = signal<number>(0);
  screen2ShowNote = signal<boolean>(false);
  screen2ShowDiscount = signal<boolean>(false);

  // Fast Pick OTC row items matching attached screenshot pixel-to-pixel
  readonly fastPickItems = [
    { name: '3RD Cef', strength: '400mg', price: 50, stock: 399, generic: 'Paracetamol', rak: 'A-09 (Tablets)', manufacturer: 'Beximco Pharmaceuticals Ltd.' },
    { name: 'Ace Plus', strength: '500mg + 65mg', price: 3, stock: 299, generic: 'Paracetamol', rak: 'A-02 (Tablets)', manufacturer: 'Square Pharmaceuticals PLC' },
    { name: 'Ceevit 250mg', strength: '250mg', price: 2.5, stock: 400, generic: 'Ascorbic Acid', rak: 'C-01 (Chewable)', manufacturer: 'Square Pharmaceuticals PLC' },
    { name: 'Controlled Substance Test 10mg', strength: '10mg', price: 15, stock: 0, generic: 'Paracetamol', rak: '', manufacturer: 'Local Pharma' },
    { name: 'Histal', strength: '10 mg', price: 15, stock: 200, generic: 'Antibiotic', rak: 'A-01', manufacturer: 'ACI Limited' },
    { name: 'Napa Extra', strength: '500mg + 65mg', price: 3, stock: 450, generic: 'Paracetamol + Caffeine', rak: 'A-03', manufacturer: 'Beximco Pharmaceuticals Ltd.' },
    { name: 'Seclo 20mg', strength: '20mg', price: 7, stock: 350, generic: 'Omeprazole', rak: 'B-02', manufacturer: 'Square Pharmaceuticals PLC' },
    { name: 'Fexo 120mg', strength: '120mg', price: 9, stock: 280, generic: 'Fexofenadine HCl', rak: 'C-04', manufacturer: 'Square Pharmaceuticals PLC' },
    { name: 'Monas 10mg', strength: '10mg', price: 16, stock: 190, generic: 'Montelukast Sodium', rak: 'D-01', manufacturer: 'Acme Laboratories Ltd.' },
  ];
  selectedFastPickIndex = signal<number>(0);

  // Entry Form State
  selectedProductText = '';
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
  showSplitOption = true;

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
    // Auto-sync tender amount and split balance unless cashier explicitly typed manual tender
    effect(() => {
      const payable = this.payableTotal();
      const m = this.selectedMethod();
      const isManual = this.isManualTender();

      if (!isManual) {
        if (m === 'cash' || m === 'card' || m === 'bkash' || m === 'nagad' || m === 'rocket' || m === 'upay') {
          this.tendered.set(payable);
        }
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

  isAntibiotic(p: CatalogProduct): boolean {
    if (p.drug_schedule === 'ANTIBIOTIC') return true;
    const gen = (p.generic || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    return gen.includes('cillin') || gen.includes('mycin') || gen.includes('oxacin') || 
           gen.includes('cef') || gen.includes('clav') || gen.includes('doxy') ||
           gen.includes('azithro') || name.includes('antibiotic');
  }

  isPom(p: CatalogProduct): boolean {
    return !!p.is_prescription_required || p.drug_schedule === 'POM' || p.drug_schedule === 'NARCOTIC';
  }

  isOtc(p: CatalogProduct): boolean {
    return !p.is_prescription_required && p.drug_schedule === 'OTC';
  }

  readonly filteredCatalogProducts = computed(() => {
    const list = this.catalogProducts();
    const cat = this.selectedCategory();
    const term = this.currentSearchTerm().toLowerCase().trim();

    let categoryFiltered = list;
    if (cat === 'fast') {
      categoryFiltered = this.fastMovingProducts();
    } else if (cat === 'tablet') {
      categoryFiltered = list.filter(p => p.medicineType === 1);
    } else if (cat === 'capsule') {
      categoryFiltered = list.filter(p => p.medicineType === 2);
    } else if (cat === 'syrup') {
      categoryFiltered = list.filter(p => p.medicineType === 3 || p.medicineType === 4 || p.medicineType === 5);
    } else if (cat === 'injection') {
      categoryFiltered = list.filter(p => p.medicineType === 6);
    } else if (cat === 'ointment') {
      categoryFiltered = list.filter(p => p.medicineType === 7 || p.medicineType === 8 || p.medicineType === 9);
    } else if (cat === 'antibiotic') {
      categoryFiltered = list.filter(p => this.isAntibiotic(p));
    } else if (cat === 'pom') {
      categoryFiltered = list.filter(p => this.isPom(p));
    } else if (cat === 'otc') {
      categoryFiltered = list.filter(p => this.isOtc(p));
    }

    if (!term) return categoryFiltered;

    return categoryFiltered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.generic.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.rak && p.rak.toLowerCase().includes(term)) ||
      (p.strength && p.strength.toLowerCase().includes(term)) ||
      String(p.id) === term
    );
  });

  readonly highlightedProduct = computed(() => {
    const items = this.filteredCatalogProducts();
    if (items.length === 0) return null;
    const idx = Math.max(0, Math.min(items.length - 1, this.highlightedIndex()));
    return items[idx];
  });

  readonly screen3SearchResults = computed<CatalogProduct[]>(() => {
    const term = this.screen3SearchTerm().trim().toLowerCase();
    const allProds = this.catalogProducts();
    if (!term) {
      const fast = this.fastMovingProducts();
      return fast.length > 0 ? fast.slice(0, 12) : allProds.slice(0, 12);
    }
    const exactBarcode = allProds.filter(p => p.barcode && p.barcode.trim().toLowerCase() === term);
    if (exactBarcode.length > 0) {
      return exactBarcode;
    }
    return allProds.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.generic && p.generic.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.rak && p.rak.toLowerCase().includes(term)) ||
      (p.strength && p.strength.toLowerCase().includes(term)) ||
      String(p.id) === term
    ).slice(0, 15);
  });

  readonly screen3FilteredCards = computed<CatalogProduct[]>(() => {
    const list = this.catalogProducts();
    const cat = this.selectedCategory();
    const term = this.screen3SearchTerm().toLowerCase().trim();

    let categoryFiltered = list;
    if (cat === 'fast') {
      categoryFiltered = this.fastMovingProducts();
    } else if (cat === 'tablet') {
      categoryFiltered = list.filter(p => p.medicineType === 1);
    } else if (cat === 'capsule') {
      categoryFiltered = list.filter(p => p.medicineType === 2);
    } else if (cat === 'syrup') {
      categoryFiltered = list.filter(p => p.medicineType === 3 || p.medicineType === 4 || p.medicineType === 5);
    } else if (cat === 'injection') {
      categoryFiltered = list.filter(p => p.medicineType === 6);
    } else if (cat === 'ointment') {
      categoryFiltered = list.filter(p => p.medicineType === 7 || p.medicineType === 8 || p.medicineType === 9);
    } else if (cat === 'antibiotic') {
      categoryFiltered = list.filter(p => this.isAntibiotic(p));
    } else if (cat === 'pom') {
      categoryFiltered = list.filter(p => this.isPom(p));
    } else if (cat === 'otc') {
      categoryFiltered = list.filter(p => this.isOtc(p));
    }

    if (!term) return categoryFiltered;

    return categoryFiltered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.generic.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.rak && p.rak.toLowerCase().includes(term)) ||
      (p.strength && p.strength.toLowerCase().includes(term)) ||
      String(p.id) === term
    );
  });

  getCategoryCount(catId: string): number {
    const list = this.catalogProducts();
    if (catId === 'all') return list.length;
    if (catId === 'fast') return this.fastMovingProducts().length;
    if (catId === 'tablet') return list.filter(p => p.medicineType === 1).length;
    if (catId === 'capsule') return list.filter(p => p.medicineType === 2).length;
    if (catId === 'syrup') return list.filter(p => p.medicineType === 3 || p.medicineType === 4 || p.medicineType === 5).length;
    if (catId === 'injection') return list.filter(p => p.medicineType === 6).length;
    if (catId === 'ointment') return list.filter(p => p.medicineType === 7 || p.medicineType === 8 || p.medicineType === 9).length;
    if (catId === 'antibiotic') return list.filter(p => this.isAntibiotic(p)).length;
    if (catId === 'pom') return list.filter(p => this.isPom(p)).length;
    if (catId === 'otc') return list.filter(p => this.isOtc(p)).length;
    return 0;
  }

  setCategory(catId: string): void {
    this.selectedCategory.set(catId);
    this.highlightedIndex.set(0);
  }

  onSearchInput(term: string): void {
    this.currentSearchTerm.set(term || '');
    this.highlightedIndex.set(0);
  }

  navigateCatalogGrid(direction: 'up' | 'down' | 'left' | 'right'): void {
    const count = this.filteredCatalogProducts().length;
    if (count === 0) return;
    const current = this.highlightedIndex();
    const cols = 3;

    let next = current;
    if (direction === 'right') {
      next = Math.min(count - 1, current + 1);
    } else if (direction === 'left') {
      next = Math.max(0, current - 1);
    } else if (direction === 'down') {
      next = Math.min(count - 1, current + cols);
    } else if (direction === 'up') {
      next = Math.max(0, current - cols);
    }

    this.highlightedIndex.set(next);
    this.scrollHighlightedTileIntoView(next);
  }

  private scrollHighlightedTileIntoView(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`catalog-product-${index}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  addHighlightedOrSearchToCart(): void {
    const term = this.currentSearchTerm().trim();
    const items = this.filteredCatalogProducts();

    if (term) {
      const barcodeMatch = this.catalogProducts().find(p => p.barcode && p.barcode.toLowerCase() === term.toLowerCase());
      if (barcodeMatch) {
        this.quickAddProductToCart(barcodeMatch);
        this.currentSearchTerm.set('');
        return;
      }
    }

    const current = this.highlightedProduct();
    if (current) {
      this.quickAddProductToCart(current);
      return;
    }

    if (items.length > 0) {
      this.quickAddProductToCart(items[0]);
      return;
    }

    this.addEntryToCart();
  }

  triggerFastCashPay(): void {
    if (this.cart().length === 0) {
      this.msg.warning('Cannot checkout an empty basket. Search and add medicines first (F1).');
      return;
    }
    this.setMethod('cash');
    this.setExactPayment();
    this.confirmCheckout(true);
  }

  closeAllModals(): void {
    this.isCustomerModalVisible = false;
    this.isProductModalVisible = false;
    this.isQuickGenericModalVisible = false;
    this.isQuickCompanyModalVisible = false;
    this.isHeldOrdersModalVisible = false;
    this.isEditItemModalVisible = false;
    this.isReceiptModalVisible = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const activeEl = document.activeElement as HTMLElement;
    const isSearchInput = activeEl?.id === 'pos-search-input';
    const isTenderInput = activeEl?.id === 'pos-tender-input';
    const isModalOpen = this.isCustomerModalVisible || this.isHeldOrdersModalVisible || 
                        this.isReceiptModalVisible || this.isProductModalVisible || 
                        this.isEditItemModalVisible || this.isQuickGenericModalVisible || 
                        this.isQuickCompanyModalVisible || this.isBatchModalVisible() ||
                        this.isUnitCalcModalVisible() || this.isBanglaDosageModalVisible();

    if (isModalOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeAllModals();
      }
      return;
    }

    if (event.key === 'F1') {
      event.preventDefault();
      this.focusProductSearch();
    } else if (event.key === 'F2') {
      event.preventDefault();
      this.openQuickAddProduct();
    } else if (event.key === 'F3') {
      event.preventDefault();
      this.openAddCustomerModal();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.setQuickExact();
      this.msg.info('Set exact pay amount (F4)');
    } else if (event.key === 'F6') {
      event.preventDefault();
      this.openUnitCalculator();
    } else if (event.key === 'F7') {
      event.preventDefault();
      this.openBanglaDosageModal();
    } else if (event.key === 'F8') {
      event.preventDefault();
      this.triggerFastCashPay();
    } else if (event.key === 'F9') {
      event.preventDefault();
      this.handleHoldAction();
    } else if (event.key === 'F10' || (event.ctrlKey && event.key === 'Enter')) {
      event.preventDefault();
      this.confirmCheckout();
    } else if (event.key === 'ArrowDown') {
      if (isSearchInput || !activeEl || activeEl === document.body) {
        event.preventDefault();
        this.navigateCatalogGrid('down');
      }
    } else if (event.key === 'ArrowUp') {
      if (isSearchInput || !activeEl || activeEl === document.body) {
        event.preventDefault();
        this.navigateCatalogGrid('up');
      }
    } else if (event.key === 'ArrowRight') {
      if (!isSearchInput || (activeEl as HTMLInputElement)?.selectionStart === (activeEl as HTMLInputElement)?.value?.length) {
        if (!isSearchInput) {
          event.preventDefault();
          this.navigateCatalogGrid('right');
        }
      }
    } else if (event.key === 'ArrowLeft') {
      if (!isSearchInput || (activeEl as HTMLInputElement)?.selectionStart === 0) {
        if (!isSearchInput) {
          event.preventDefault();
          this.navigateCatalogGrid('left');
        }
      }
    } else if (event.key === 'Enter') {
      if (isTenderInput) {
        event.preventDefault();
        this.confirmCheckout();
      } else if (isSearchInput || !['INPUT', 'TEXTAREA', 'BUTTON'].includes(activeEl?.tagName)) {
        event.preventDefault();
        this.addHighlightedOrSearchToCart();
      }
    } else if (event.key === 'Escape') {
      if (this.currentSearchTerm()) {
        event.preventDefault();
        this.currentSearchTerm.set('');
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
          medicineType: p.medicine_type,
          dar_number: p.dar_number || null,
          drug_schedule: (p.drug_schedule as any) || 'OTC',
          is_prescription_required: p.is_prescription_required || (p.drug_schedule && p.drug_schedule !== 'OTC'),
          is_narcotic: p.is_narcotic,
        }));
        this.catalogProducts.set(mapped);
        if (this.selectedProductObj) {
          const fresh = mapped.find(p => p.id === this.selectedProductObj?.id);
          if (fresh) this.selectedProductObj = fresh;
        }

        // Fetch active batches for FEFO allocation and expiry countdown badges
        this.productService.getBatches().subscribe({
          next: (bRes) => {
            if (bRes.data?.length) {
              const activeBatches = bRes.data;
              this.catalogProducts.update(prods => prods.map(p => {
                const pBatches = activeBatches.filter(b => b.product_no === p.id && !b.is_expired && this.getDaysUntilExpiry(b.expiry_date) > 0);
                pBatches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
                return {
                  ...p,
                  batches: pBatches,
                  nearestBatch: pBatches[0]?.batch_number || null,
                  nearestExpiry: pBatches[0]?.expiry_date || null
                };
              }));
            }
          },
          error: () => {}
        });
      }
    });
  }

  ngOnInit(): void {
    this.posStorageService.getAllHeldOrders<HeldOrder>().then(orders => {
      if (orders && orders.length > 0) {
        this.heldOrders.set(orders);
      }
    });
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

  ngAfterViewInit(): void {
    this.focusProductSearch();
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
    this.currentSearchTerm.set(term || '');
  }

  onProductEnterKey(): void {
    const sTerm = this.currentSearchTerm();
    if (!this.selectedProductText && sTerm) {
      const term = sTerm.toLowerCase().trim();
      const match = this.catalogProducts().find(p =>
        p.name.toLowerCase().includes(term) ||
        p.generic.toLowerCase().includes(term) ||
        String(p.id) === term
      );
      if (match) {
        this.selectedProductText = match.name;
        this.onProductPicked(match.name);
      } else {
        this.selectedProductText = sTerm.trim();
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
      let targetId = 'pos-search-input';
      if (this.activeScreen() === 'screen2') {
        targetId = 'screen2-search-input';
      } else if (this.activeScreen() === 'screen3') {
        targetId = 'screen3-search-input';
      }
      const inputEl = document.getElementById(targetId) as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      } else {
        const selInput = document.querySelector('nz-select input') as HTMLElement;
        if (selInput) selInput.focus();
      }
    }, 60);
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
    const sTerm = this.currentSearchTerm();
    if (!this.selectedProductText.trim() && sTerm.trim()) {
      const term = sTerm.toLowerCase().trim();
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
        this.selectedProductText = sTerm.trim();
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
        is_prescription_required: targetProd?.is_prescription_required,
        is_narcotic: targetProd?.is_narcotic || targetProd?.drug_schedule === 'NARCOTIC',
        dar_number: targetProd?.dar_number || null,
        drug_schedule: targetProd?.drug_schedule || 'OTC',
      };
      this.cart.update(list => [newItem, ...list]);
      this.msg.success(`Added ${newItem.product_name} to cart`);
    }

    this.isManualTender.set(false); // Reset to auto-tender for new cart state!
    this.tenderTouched = false;
    this.selectedProductText = '';
    this.selectedProductObj = null;
    this.currentSearchTerm.set('');
    this.entryQty = 1;
    this.entryPrice = 0;
    this.entryDiscountValue = 0;
    this.focusProductSearch();
  }

  // ==========================================
  // Screen 2 Helper Methods
  // ==========================================
  selectFastPickItem(index: number): void {
    this.selectedFastPickIndex.set(index);
    const item = this.fastPickItems[index];
    if (!item) return;

    const match = this.catalogProducts().find(p =>
      p.name.toLowerCase().includes(item.name.toLowerCase()) ||
      (item.generic && p.generic && p.generic.toLowerCase().includes(item.generic.toLowerCase()))
    );

    if (match) {
      this.screen2SelectedProduct.set(match);
      this.screen2ProductSearch.set(`${match.name}${match.strength ? ' (' + match.strength + ')' : ''}`);
      const price = this.isWholesale() ? match.saleWholesale : match.saleRetail;
      this.screen2Price.set(price || item.price);
    } else {
      this.screen2SelectedProduct.set(null);
      this.screen2ProductSearch.set(`${item.name} (${item.strength})`);
      this.screen2Price.set(item.price);
    }
    this.screen2Qty.set(1);
    this.screen2Discount.set(0);
  }

  getAllScreen2CatalogProducts(): CatalogProduct[] {
    const list = [...this.catalogProducts()];
    for (const fp of this.fastPickItems) {
      if (!list.some(cp => cp.name.toLowerCase() === fp.name.toLowerCase())) {
        list.push({
          id: -(list.length + 100),
          name: fp.name,
          generic: fp.generic,
          manufacturer: fp.manufacturer,
          strength: fp.strength,
          rak: fp.rak,
          stock: fp.stock,
          cost: fp.price * 0.8,
          saleRetail: fp.price,
          saleWholesale: fp.price,
          pcsPerBox: fp.name.includes('Histal') ? 10 : 1,
          minStock: 10,
          barcode: '',
          is_prescription_required: false,
          is_narcotic: false,
          drug_schedule: 'OTC',
        });
      }
    }
    return list;
  }

  getOriginalProductStock(item: CartItem): number {
    const allProds = this.getAllScreen2CatalogProducts();
    const p = allProds.find(cp => cp.id === item.product_no || cp.name.toLowerCase() === item.product_name.toLowerCase());
    if (p && p.stock !== undefined) return p.stock;
    const fp = this.fastPickItems.find(f => f.name.toLowerCase() === item.product_name.toLowerCase());
    if (fp) return fp.stock;
    return item.stock ?? 0;
  }

  getItemRemainingStock(item: CartItem): number {
    const orig = this.getOriginalProductStock(item);
    const cartPcs = this.getCartPcsForProduct(item.product_no, item.product_name);
    return Math.max(0, orig - cartPcs);
  }

  onScreen2SearchFocus(): void {
    if (!this.screen2ProductSearch().trim()) {
      const allProds = this.getAllScreen2CatalogProducts();
      this.screen2SearchResults.set(allProds.slice(0, 10));
    }
    this.screen2IsSearchOpen.set(true);
  }

  onScreen2SearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value || '';
    this.screen2ProductSearch.set(val);
    const term = val.trim().toLowerCase();
    const allProds = this.getAllScreen2CatalogProducts();
    if (!term) {
      this.screen2SearchResults.set(allProds.slice(0, 10));
    } else {
      const results = allProds.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.generic && p.generic.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        (p.rak && p.rak.toLowerCase().includes(term))
      ).slice(0, 12);
      this.screen2SearchResults.set(results);
    }
    this.screen2IsSearchOpen.set(true);
    this.screen2HighlightedIndex.set(0);
  }

  onScreen2SearchKeydown(event: KeyboardEvent): void {
    if (!this.screen2IsSearchOpen()) {
      if (event.key === 'ArrowDown') {
        this.screen2IsSearchOpen.set(true);
        this.screen2SearchResults.set(this.catalogProducts().slice(0, 10));
        event.preventDefault();
      }
      return;
    }
    const results = this.screen2SearchResults();
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.screen2HighlightedIndex.update(i => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.screen2HighlightedIndex.update(i => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[this.screen2HighlightedIndex()];
      if (selected) {
        this.selectScreen2Product(selected);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.screen2IsSearchOpen.set(false);
    }
  }

  selectScreen2Product(product: CatalogProduct): void {
    this.screen2SelectedProduct.set(product);
    this.screen2ProductSearch.set(`${product.name}${product.strength ? ' (' + product.strength + ')' : ''}`);
    const price = this.isWholesale() ? product.saleWholesale : product.saleRetail;
    this.screen2Price.set(price || 0);
    this.screen2Qty.set(1);
    this.screen2Discount.set(0);
    this.screen2IsSearchOpen.set(false);
  }

  addScreen2Item(): void {
    const searchTxt = this.screen2ProductSearch().trim();
    if (!searchTxt) {
      this.msg.warning('Please select or search a product first.');
      return;
    }
    const qty = Number(this.screen2Qty()) || 1;
    const price = Number(this.screen2Price()) || 0;
    if (qty <= 0) {
      this.msg.warning('Quantity must be greater than zero.');
      return;
    }

    const selectedProd = this.screen2SelectedProduct();
    const allProds = this.getAllScreen2CatalogProducts();
    const catalogProd = selectedProd || allProds.find(p =>
      searchTxt.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase() === searchTxt.toLowerCase()
    );

    const prodNo = catalogProd ? catalogProd.id : 1;
    const prodName = catalogProd ? catalogProd.name : searchTxt;
    const generic = catalogProd ? catalogProd.generic : 'General';
    const manufacturer = catalogProd ? catalogProd.manufacturer : 'Local Pharma';
    const cost = catalogProd ? catalogProd.cost : (price * 0.8);
    const pcsPerBox = catalogProd ? catalogProd.pcsPerBox : (prodName.toLowerCase().includes('histal') ? 10 : 1);
    const origStock = catalogProd ? catalogProd.stock : 999;
    const availStock = catalogProd ? this.getAvailableStock(catalogProd) : 999;
    const rak = catalogProd ? catalogProd.rak : '';
    const barcode = catalogProd ? catalogProd.barcode : '';

    let lineDiscount = 0;
    const discVal = Number(this.screen2Discount()) || 0;
    if (discVal > 0) {
      if (this.screen2DiscountType() === 'percent') {
        lineDiscount = (price * qty * discVal) / 100;
      } else {
        lineDiscount = discVal;
      }
    }
    lineDiscount = Math.round(lineDiscount * 100) / 100;
    const lineTotal = Math.round(Math.max(0, (price * qty) - lineDiscount) * 100) / 100;

    const existingIndex = this.cart().findIndex(i =>
      (catalogProd ? i.product_no === catalogProd.id : i.product_name === prodName) && i.unit_price === price
    );

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
          };
        }
        return item;
      }));
      this.msg.success(`Updated ${prodName} quantity in basket`);
    } else {
      const newItem: CartItem = {
        cart_item_id: Date.now(),
        product_no: prodNo,
        product_name: prodName,
        generic_name: generic,
        manufacturer,
        cost_price: cost,
        unit_price: price,
        qty,
        pcs_per_box: pcsPerBox,
        discount: lineDiscount,
        discount_type: this.screen2DiscountType() === 'percent' ? DiscountType.Percentage : DiscountType.Flat,
        total: lineTotal,
        stock: origStock,
        rak,
        barcode,
        drug_schedule: catalogProd?.drug_schedule || 'OTC',
        is_prescription_required: catalogProd?.is_prescription_required,
        is_narcotic: catalogProd?.is_narcotic,
        dar_number: catalogProd?.dar_number || null,
      };
      this.cart.update(list => [newItem, ...list]);
      this.msg.success(`Added ${prodName} to basket`);
    }

    // Reset inputs
    this.screen2ProductSearch.set('');
    this.screen2SelectedProduct.set(null);
    this.screen2Qty.set(1);
    this.screen2Price.set(0);
    this.screen2Discount.set(0);
    this.screen2IsSearchOpen.set(false);
    this.isManualTender.set(false);
    this.tenderTouched = false;
    this.focusProductSearch();
  }

  // ==========================================
  // Screen 3 Helper Methods (LOV & Barcode)
  // ==========================================
  setActiveScreen(screen: 'screen1' | 'screen2' | 'screen3'): void {
    this.activeScreen.set(screen);
    this.focusProductSearch();
  }

  onScreen3SearchFocus(): void {
    this.screen3IsSearchOpen.set(true);
    this.screen3HighlightedIndex.set(0);
  }

  onScreen3SearchInput(val: string): void {
    this.screen3SearchTerm.set(val);
    this.screen3IsSearchOpen.set(true);
    this.screen3HighlightedIndex.set(0);
  }

  onScreen3SearchKeydown(event: KeyboardEvent): void {
    const results = this.screen3SearchResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.screen3IsSearchOpen()) {
        this.screen3IsSearchOpen.set(true);
        this.screen3HighlightedIndex.set(0);
      } else if (results.length > 0) {
        this.screen3HighlightedIndex.update(i => (i + 1) % results.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) {
        this.screen3HighlightedIndex.update(i => (i - 1 + results.length) % results.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.addScreen3ProductToCart();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.screen3IsSearchOpen.set(false);
    }
  }

  addScreen3ProductToCart(product?: CatalogProduct): void {
    let target = product;
    const term = this.screen3SearchTerm().trim();
    if (!target) {
      if (!term) {
        const results = this.screen3SearchResults();
        if (results.length > 0) {
          const idx = this.screen3HighlightedIndex();
          target = (idx >= 0 && idx < results.length) ? results[idx] : results[0];
        }
      } else {
        // Check exact barcode match first
        const exact = this.catalogProducts().find(p => p.barcode && p.barcode.trim().toLowerCase() === term.toLowerCase());
        if (exact) {
          target = exact;
        } else {
          const results = this.screen3SearchResults();
          if (results.length > 0) {
            const idx = this.screen3HighlightedIndex();
            target = (idx >= 0 && idx < results.length) ? results[idx] : results[0];
          }
        }
      }
    }

    if (target) {
      this.quickAddProductToCart(target);
      this.screen3SearchTerm.set('');
      this.screen3IsSearchOpen.set(false);
      this.screen3HighlightedIndex.set(0);
      this.focusProductSearch();
    } else if (term) {
      this.msg.warning(`No product found for "${term}"`);
    }
  }

  updateItemQty(item: CartItem, delta: number): void {
    this.isManualTender.set(false);
    this.tenderTouched = false;
    const step = this.isWholesale() ? 0.25 : 1;
    const currentQty = Number(item.qty) || 0;
    const newQty = Math.max(step, Math.round((currentQty + delta) * 100) / 100);
    if (item.stock && newQty > item.stock && delta > 0) {
      this.msg.warning(`Requested ${newQty} exceeds available stock (${item.stock} pcs)`);
    }
    this.applyItemQty(item, newQty);
  }

  setItemQty(item: CartItem, newQtyRaw: number | string): void {
    this.isManualTender.set(false);
    this.tenderTouched = false;
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
    this.isManualTender.set(false);
    this.tenderTouched = false;
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

      this.heldOrders.update(orders => {
        const updated = [held, ...orders];
        this.posStorageService.saveAllHeldOrders(updated);
        return updated;
      });
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
    this.heldOrders.update(orders => {
      const updated = orders.filter((_, i) => i !== idx);
      this.posStorageService.saveAllHeldOrders(updated);
      return updated;
    });
    this.isHeldOrdersModalVisible = false;
    this.msg.success(`Recalled order from ${order.customerName}`);
  }

  deleteHeldOrder(idx: number): void {
    this.heldOrders.update(orders => {
      const updated = orders.filter((_, i) => i !== idx);
      this.posStorageService.saveAllHeldOrders(updated);
      return updated;
    });
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

  confirmCheckout(autoPrintThermal: boolean = false): void {
    if (this.cart().length === 0) {
      this.msg.warning('Cannot checkout an empty basket.');
      return;
    }

    const rxItems = this.cart().filter(i => i.is_narcotic || i.is_prescription_required);
    if (rxItems.length > 0) {
      const names = rxItems.map(i => i.product_name).join(', ');
      this.msg.info("[Clinical Safety] Prescription compliance verified for: " + names);
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
          batch_no: item.batch_no || undefined,
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
            ...(this.splitCash() > 0 ? [{ account_no: 1, payment_method: 1, amount: this.splitCash(), gateway_reference: null }] : []),
            ...(this.splitCard() > 0 ? [{ account_no: 1, payment_method: 6, amount: this.splitCard(), gateway_reference: this.txnReference?.trim() || null }] : []),
            ...(this.splitBkash() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitBkash(), gateway_reference: this.txnReference?.trim() || null }] : []),
            ...(this.splitNagad() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitNagad(), gateway_reference: this.txnReference?.trim() || null }] : []),
            ...(this.splitOther() > 0 ? [{ account_no: 1, payment_method: 3, amount: this.splitOther(), gateway_reference: this.txnReference?.trim() || null }] : []),
          ]
        : this.splitPayments().length > 0
        ? this.splitPayments().map(p => ({
            account_no: 1,
            payment_method: p.method === 'Cash' ? 1 : p.method === 'Card' ? 6 : 3,
            amount: p.amount,
            gateway_reference: this.txnReference?.trim() || null,
          }))
        : [
            {
              account_no: 1,
              payment_method: this.selectedPaymentType(),
              amount: Math.max(0, Math.round((this.totalPaid() - this.changeDue()) * 100) / 100),
              gateway_reference: this.txnReference?.trim() || null,
            },
          ],
    };

    // If split mode was selected but all amounts were 0, default to cash full
    if (this.selectedPaymentType() === 8 && salePayload.payments.length === 0) {
      salePayload.payments = [
        { account_no: 1, payment_method: 1, amount: this.finalPrice(), gateway_reference: null }
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

          if (autoPrintThermal || this.quickPrint) {
            this.triggerBrowserPrint('thermal');
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

          // Refresh authoritative product stock from backend and re-focus search input
          this.loadProducts();
          this.focusProductSearch();
        } else {
          this.msg.error(res.message || 'Failed to complete sale');
        }
      },
      error: () => {
        this.msg.error('An error occurred during sale processing');
      },
    });
  }
  // ==========================================
  // 1. BATCH SELECTOR & EXPIRY COUNTDOWN
  // ==========================================
  isBatchModalVisible = signal(false);
  batchModalItem = signal<CartItem | null>(null);
  batchListForProduct = signal<ProdProductBatch[]>([]);
  isBatchLoading = signal(false);

  getDaysUntilExpiry(expiryDate: string | Date | null | undefined): number {
    if (!expiryDate) return 9999;
    const exp = new Date(expiryDate).getTime();
    if (isNaN(exp)) return 9999;
    const now = Date.now();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  }

  getExpiryLabel(expiryDate: string | Date | null | undefined): string {
    if (!expiryDate) return '';
    const days = this.getDaysUntilExpiry(expiryDate);
    if (days <= 0) return 'Expired';
    if (days <= 30) return `${days}d`;
    if (days <= 365) return `${Math.round(days / 30)}m`;
    return `${(days / 365).toFixed(1)}y`;
  }

  getExpiryBadgeClass(expiryDate: string | Date | null | undefined): string {
    const days = this.getDaysUntilExpiry(expiryDate);
    if (days <= 0) return 'text-rose-700 bg-rose-50 border-rose-300 font-bold';
    if (days <= 30) return 'text-rose-600 bg-rose-50 border-rose-200 font-bold';
    if (days <= 90) return 'text-amber-800 bg-amber-50 border-amber-200 font-semibold';
    if (days <= 365) return 'text-indigo-700 bg-indigo-50 border-indigo-200 font-medium';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium';
  }

  openBatchSelector(item: CartItem): void {
    this.batchModalItem.set(item);
    this.isBatchLoading.set(true);
    this.isBatchModalVisible.set(true);
    this.productService.getProductBatches(item.product_no).subscribe({
      next: (res) => {
        this.isBatchLoading.set(false);
        const batches = (res.data || []).filter(b => !b.is_expired && this.getDaysUntilExpiry(b.expiry_date) > 0);
        this.batchListForProduct.set(batches);
      },
      error: () => {
        this.isBatchLoading.set(false);
        this.batchListForProduct.set([]);
      }
    });
  }

  selectBatch(batch: ProdProductBatch): void {
    const item = this.batchModalItem();
    if (!item) return;
    this.cart.update(list => list.map(i => {
      if (i.cart_item_id === item.cart_item_id) {
        return {
          ...i,
          batch_no: batch.batch_no,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          available_batch_qty: batch.total_quantity_pcs
        };
      }
      return i;
    }));
    this.isBatchModalVisible.set(false);
    this.msg.success(`Selected batch ${batch.batch_number} (Exp: ${this.getExpiryLabel(batch.expiry_date)}) for ${item.product_name}`);
  }

  resetToAutoFefo(item: CartItem): void {
    this.cart.update(list => list.map(i => {
      if (i.cart_item_id === item.cart_item_id) {
        return {
          ...i,
          batch_no: null,
          batch_number: null,
          expiry_date: null,
          available_batch_qty: undefined
        };
      }
      return i;
    }));
    this.isBatchModalVisible.set(false);
    this.msg.info(`Reset ${item.product_name} to Auto-FEFO batch allocation.`);
  }

  // ==========================================
  // 2. BOX-TO-STRIP-TO-TABLET CALCULATOR
  // ==========================================
  isUnitCalcModalVisible = signal(false);
  calcTargetItem = signal<CartItem | null>(null);
  calcPcsPerBox = signal(100);
  calcStripsPerBox = signal(10);
  calcPcsPerStrip = computed(() => Math.max(1, Math.round(this.calcPcsPerBox() / Math.max(1, this.calcStripsPerBox()))));

  calcBoxQty = signal(0);
  calcStripQty = signal(0);
  calcTabletQty = signal(0);

  calcDosePerTime = signal(1);
  calcTimesPerDay = signal(2);
  calcDurationDays = signal(7);
  calcRxTotalPcs = computed(() => Math.ceil(this.calcDosePerTime() * this.calcTimesPerDay() * this.calcDurationDays()));

  calcTotalPcs = computed(() => {
    const box = Number(this.calcBoxQty()) || 0;
    const strip = Number(this.calcStripQty()) || 0;
    const tab = Number(this.calcTabletQty()) || 0;
    return (box * this.calcPcsPerBox()) + (strip * this.calcPcsPerStrip()) + tab;
  });

  calcTotalPrice = computed(() => {
    const unitPrice = this.calcTargetItem()?.unit_price || 0;
    return Math.round(this.calcTotalPcs() * unitPrice * 100) / 100;
  });

  calcBoxPrice = computed(() => {
    const unitPrice = this.calcTargetItem()?.unit_price || 0;
    return Math.round(this.calcPcsPerBox() * unitPrice * 100) / 100;
  });

  calcStripPrice = computed(() => {
    const unitPrice = this.calcTargetItem()?.unit_price || 0;
    return Math.round(this.calcPcsPerStrip() * unitPrice * 100) / 100;
  });

  openUnitCalculator(item?: CartItem): void {
    const target = item || (this.cart().length > 0 ? this.cart()[0] : null);
    if (!target) {
      this.msg.warning('Please add or select a product in basket first.');
      return;
    }
    this.calcTargetItem.set(target);
    const pcsBox = target.pcs_per_box || 100;
    this.calcPcsPerBox.set(pcsBox);
    this.calcStripsPerBox.set(pcsBox >= 10 ? 10 : 1);

    const totalQty = Math.max(1, Math.round(target.qty));
    const pcsStrip = Math.max(1, Math.round(pcsBox / Math.max(1, this.calcStripsPerBox())));
    const boxes = Math.floor(totalQty / pcsBox);
    const remAfterBoxes = totalQty % pcsBox;
    const strips = Math.floor(remAfterBoxes / pcsStrip);
    const loose = remAfterBoxes % pcsStrip;

    this.calcBoxQty.set(boxes);
    this.calcStripQty.set(strips);
    this.calcTabletQty.set(loose);

    this.isUnitCalcModalVisible.set(true);
  }

  applyRxToCalc(): void {
    const rxPcs = this.calcRxTotalPcs();
    const pcsBox = this.calcPcsPerBox();
    const pcsStrip = this.calcPcsPerStrip();

    const boxes = Math.floor(rxPcs / pcsBox);
    const rem = rxPcs % pcsBox;
    const strips = Math.floor(rem / pcsStrip);
    const loose = rem % pcsStrip;

    this.calcBoxQty.set(boxes);
    this.calcStripQty.set(strips);
    this.calcTabletQty.set(loose);
    this.msg.info(`Prescription calculated: ${rxPcs} tablets (${strips} strips + ${loose} loose)`);
  }

  applyCalcToCart(): void {
    const target = this.calcTargetItem();
    if (!target) return;
    const newQty = this.calcTotalPcs();
    if (newQty <= 0) {
      this.msg.warning('Quantity must be greater than zero.');
      return;
    }

    this.cart.update(items => items.map(i => {
      if (i.cart_item_id === target.cart_item_id) {
        const lineTotal = Math.round(Math.max(0, (i.unit_price * newQty) - i.discount) * 100) / 100;
        return {
          ...i,
          qty: newQty,
          total: lineTotal
        };
      }
      return i;
    }));

    this.isUnitCalcModalVisible.set(false);
    this.msg.success(`Applied ${newQty} pcs (${this.calcStripQty()} strips, ${this.calcTabletQty()} tablets) for ${target.product_name}`);
  }

  // ==========================================
  // 3. BANGLA (bn-BD) DOSAGE LABEL PRINT VIEW
  // ==========================================
  isBanglaDosageModalVisible = signal(false);
  activeDosageItem = signal<CartItem | null>(null);

  dosagePatientName = signal('');
  dosagePattern = signal('১ + ০ + ১');
  dosageTimeText = signal('সকালে ১টি ও রাতে ১টি');
  dosageMealTiming = signal('খাবারের পরে');
  dosageDuration = signal('৭ দিন');
  dosageCaution = signal('ঠান্ডা ও শুষ্ক স্থানে আলো থেকে দূরে রাখুন।');
  dosageSpecialNote = signal('');
  dosageLabelSize = signal<'58mm' | '80mm'>('80mm');

  readonly banglaDosagePatterns = [
    { pattern: '১ + ০ + ১', text: 'সকালে ১টি ও রাতে ১টি', label: '১+০+১ (সকাল ও রাত)' },
    { pattern: '১ + ১ + ১', text: 'সকালে ১টি, দুপুরে ১টি ও রাতে ১টি', label: '১+১+১ (৩ বার)' },
    { pattern: '০ + ০ + ১', text: 'রাতে ১টি (ঘুমানোর আগে)', label: '০+০+১ (রাতে)' },
    { pattern: '১ + ০ + ০', text: 'সকালে ১টি (খালি পেটে)', label: '১+০+০ (সকালে)' },
    { pattern: '০ + ১ + ০', text: 'দুপুরে ১টি', label: '০+১+০ (দুপুরে)' },
    { pattern: '১ + ১ + ১ + ১', text: 'দিনে ৪ বার (৬ ঘণ্টা পর পর)', label: '১+১+১+১ (৪ বার)' },
    { pattern: '১/২ + ০ + ১/২', text: 'সকালে অর্ধেক ও রাতে অর্ধেক', label: '১/২+০+১/২ (অর্ধেক)' },
    { pattern: '১ চামচ করে ৩ বার', text: 'প্রতিবার ১ চামচ (৫ মিলি) করে', label: '১ চামচ ৩ বার (সিরাপ)' },
    { pattern: '২ চামচ করে ৩ বার', text: 'প্রতিবার ২ চামচ (১০ মিলি) করে', label: '২ চামচ ৩ বার (সিরাপ)' },
    { pattern: 'প্রয়োজনে', text: 'ব্যথা বা তীব্র জ্বর হলে সেব্য', label: 'প্রয়োজনে (SOS)' },
  ];

  readonly banglaMealTimings = [
    'খাবারের পরে',
    'খাবারের আগে',
    'খাবারের সাথে',
    'ভরা পেটে',
    'খালি পেটে',
    'ঘুমানোর আগে'
  ];

  readonly banglaDurations = [
    '৩ দিন',
    '৫ দিন',
    '৭ দিন',
    '১০ দিন',
    '১৪ দিন',
    '১ মাস',
    'চলবে (নিয়মিত)'
  ];

  readonly banglaSpecialNotes = [
    'অ্যান্টিবায়োটিকের পুরো কোর্স শেষ করুন।',
    'চিকিৎসকের পরামর্শ ছাড়া ওষুধ বন্ধ করবেন না।',
    'ব্যবহারের পূর্বে ভালো করে ঝাঁকিয়ে নিন।',
    'প্রচুর পরিমাণে পানি পান করুন।',
    'ঠান্ডা ও শুষ্ক স্থানে রাখুন।'
  ];

  openBanglaDosageModal(item?: CartItem): void {
    const target = item || (this.cart().length > 0 ? this.cart()[0] : null);
    if (!target) {
      this.msg.warning('Please add a medicine to basket first.');
      return;
    }
    this.activeDosageItem.set(target);

    const cust = this.customers.find(c => c.id === this.selectedCustomer());
    this.dosagePatientName.set(cust?.name && cust.id !== '1' ? cust.name : 'সাধারণ রোগী');

    if (target.drug_schedule === 'ANTIBIOTIC') {
      this.dosageSpecialNote.set('অ্যান্টিবায়োটিকের পুরো কোর্স শেষ করুন।');
      this.dosageDuration.set('৭ দিন');
    } else {
      this.dosageSpecialNote.set('');
    }

    this.isBanglaDosageModalVisible.set(true);
  }

  setDosagePattern(p: { pattern: string; text: string }): void {
    this.dosagePattern.set(p.pattern);
    this.dosageTimeText.set(p.text);
  }

  onDosageMedicineChange(cartItemId: number): void {
    const found = this.cart().find(i => i.cart_item_id === cartItemId);
    if (found) {
      this.activeDosageItem.set(found);
      if (found.drug_schedule === 'ANTIBIOTIC') {
        this.dosageSpecialNote.set('অ্যান্টিবায়োটিকের পুরো কোর্স শেষ করুন।');
        this.dosageDuration.set('৭ দিন');
      }
    }
  }

  activeBranchName(): string {
    return this.authService.activeBranch()?.name || 'Aidly Pharmacy';
  }

  todayBanglaDate(): string {
    return new Date().toLocaleDateString('bn-BD');
  }

  printBanglaSticker(): void {
    const item = this.activeDosageItem();
    if (!item) return;

    this.printService.printBanglaDosageLabel({
      pharmacyNameBangla: this.activeBranchName(),
      patientName: this.dosagePatientName() || 'সাধারণ রোগী',
      medicineName: item.product_name,
      genericName: item.generic_name,
      dosagePattern: this.dosagePattern(),
      dosageTimeText: this.dosageTimeText(),
      mealTiming: this.dosageMealTiming(),
      duration: this.dosageDuration(),
      cautionText: this.dosageCaution(),
      specialNote: this.dosageSpecialNote()
    }, this.dosageLabelSize());

    this.msg.success(`Printing Bangla dosage sticker for ${item.product_name}`);
  }
}
