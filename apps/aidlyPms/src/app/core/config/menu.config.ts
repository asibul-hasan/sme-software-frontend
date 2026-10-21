/**
 * Unified System Menu Configuration
 * Structured around 5 core business modules:
 * - SAL: Sales & Customers (বিক্রয় ও কাস্টমার)
 * - PUR: Purchase & Suppliers (ক্রয় ও সাপ্লায়ার)
 * - INV: Medicines & Stock (ঔষধ ও স্টক)
 * - ACC: Accounts & Cash (হিসাব ও ক্যাশ)
 * - SYS: Settings & Admin (সেটিংস ও অ্যাডমিন)
 *
 * Dashboard (DASH_2301) lives as a standalone Home link.
 */

export interface SystemScreen {
  readonly form_id: string;
  readonly title: string;
  readonly type:
    | 'Main Screen'
    | 'Modal Dialog'
    | 'Action Modal'
    | 'Drawer View'
    | 'Sub-Screen'
    | 'Global Modal'
    | 'Header Modal'
    | 'Control Drawer';
  readonly route: string;
  readonly permission_code: string;
  readonly description: string;
  readonly is_in_sidebar?: boolean;
  readonly badge?: string;
}

// One clickable group inside a module (e.g. "Customers" under Sales)
export interface SystemSubModule {
  readonly key: string;            // stable id, used for expand/collapse state
  readonly name: string;           // English label
  readonly name_bn: string;        // Bengali label for BD shop owners
  readonly icon: string;           // sidebar icon
  readonly legacy_series?: number; // old series number, kept for traceability
  readonly form_ids: readonly string[]; // references into SYSTEM_SCREENS, no duplicated data
}

// Top-level module, now only 5 of them
export interface SystemModule {
  readonly module: string;
  readonly module_bn: string;
  readonly module_code: 'SAL' | 'PUR' | 'INV' | 'ACC' | 'SYS'; // closed union catches typos
  readonly icon: string;
  readonly default_route: string;  // where clicking the module lands
  readonly sub_modules: readonly SystemSubModule[];
}

export const SYSTEM_SCREENS: readonly SystemScreen[] = [
  // Dashboard & Executive Analytics
  {
    form_id: 'DASH_2301',
    title: 'Executive Financial Dashboard',
    type: 'Main Screen',
    route: '/dashboard',
    permission_code: 'PMS-Report-Module',
    description: 'High-level KPI metrics, real-time revenue, gross profit, and stock alerts.',
    is_in_sidebar: true,
  },
  {
    form_id: 'DASH_2302',
    title: 'Sales Performance & Fast Movers',
    type: 'Sub-Screen',
    route: '/dashboard/analytics',
    permission_code: 'PMS-Report-Module',
    description: 'Top fast-moving products, slow-movers, profit margins, and peak hours.',
    is_in_sidebar: true,
  },
  {
    form_id: 'DASH_2303',
    title: 'Cashbook & Buy/Sale Register',
    type: 'Sub-Screen',
    route: '/dashboard/cashbook',
    permission_code: 'PMS-Report-Module',
    description: 'Consolidated cash inflow/outflow register for daily reconciling.',
    is_in_sidebar: true,
  },

  // Products & Inventory Stock
  {
    form_id: 'PROD_1601',
    title: 'Master Medicine Catalog',
    type: 'Main Screen',
    route: '/products/list',
    permission_code: 'PMS-Product-Module',
    description: 'Comprehensive inventory list with stock level, pricing, and filters.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1602',
    title: 'Add Medicine Master',
    type: 'Main Screen',
    route: '/products/add',
    permission_code: 'PMS-Product-Module',
    description: 'Register medicine with generic formulation, unit type, and pricing.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1603',
    title: 'Pharmaceutical Manufacturers',
    type: 'Main Screen',
    route: '/products/company',
    permission_code: 'POS-Shop-Company-Module',
    description: 'Manage pharma manufacturing companies, status, and directory.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1604',
    title: 'Add Pharmaceutical Company',
    type: 'Modal Dialog',
    route: '/products/company/add',
    permission_code: 'POS-Shop-Company-Module',
    description: 'Quick-create pharma manufacturer entity.',
    is_in_sidebar: false,
  },
  {
    form_id: 'PROD_1605',
    title: 'Generic Drug Formulations',
    type: 'Main Screen',
    route: '/products/generic',
    permission_code: 'POS-Shop-Generic-Module',
    description: 'Generic medicine formulations directory and active status.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1606',
    title: 'Add Generic Formulation',
    type: 'Modal Dialog',
    route: '/products/generic/add',
    permission_code: 'POS-Shop-Generic-Module',
    description: 'Register chemical generic formulation title.',
    is_in_sidebar: false,
  },
  {
    form_id: 'PROD_1607',
    title: 'Inventory Requisition Planner',
    type: 'Main Screen',
    route: '/products/requisition',
    permission_code: 'PMS-Requisition-Module',
    description: 'Low-stock automated demand replenishment generator.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1608',
    title: 'Requisition Item Selector',
    type: 'Modal Dialog',
    route: '/products/requisition/add-item',
    permission_code: 'PMS-Requisition-Module',
    description: 'Batch-select stock shortfall items into current requisition draft.',
    is_in_sidebar: false,
  },
  {
    form_id: 'PROD_1609',
    title: 'Requisitions Register',
    type: 'Main Screen',
    route: '/products/requisition/records',
    permission_code: 'PMS-Requisition-Module',
    description: 'Historical register of submitted stock requisition orders.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1610',
    title: 'Expired & Near-Expiry Alerts',
    type: 'Main Screen',
    route: '/products/expired',
    permission_code: 'PMS-Product-Module',
    description: 'Batches reaching expiry within 30, 60, or 90 days, and expired batches.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PROD_1611',
    title: 'Stock Valuation & Inventory Report',
    type: 'Main Screen',
    route: '/products/reports',
    permission_code: 'PMS-Product-Module',
    description: 'Current stock levels, stock valuation at cost and MRP, and stock shortage alerts.',
    is_in_sidebar: true,
  },

  // Suppliers & Purchase Invoicing
  {
    form_id: 'PUR_1503',
    title: 'Purchase (Invoice Entry)',
    type: 'Main Screen',
    route: '/supplier/purchase',
    permission_code: 'PMS-Vendor-Module',
    description: 'Receive stock goods received note with TP, VAT, batch, and expiry.',
    is_in_sidebar: true,
  },
  {
    form_id: 'SUPP_1501',
    title: 'Supplier Directory & Ledger',
    type: 'Main Screen',
    route: '/supplier/list',
    permission_code: 'PMS-Vendor-Module',
    description: 'Supplier contacts, company affiliations, phone numbers, and balances.',
    is_in_sidebar: true,
  },
  {
    form_id: 'SUPP_1502',
    title: 'Add / Edit Supplier',
    type: 'Modal Dialog',
    route: '/supplier/add',
    permission_code: 'PMS-Vendor-Module',
    description: 'Create supplier master with ledger balance and contact details.',
    is_in_sidebar: false,
  },
  {
    form_id: 'PUR_1504',
    title: 'Purchase Calculation Selector',
    type: 'Control Drawer',
    route: '/supplier/purchase/mode',
    permission_code: 'PMS-Vendor-Module',
    description: 'Toggle calculation mode (Default, Unit TP/VAT, Net Value, Opening Stock).',
    is_in_sidebar: false,
  },
  {
    form_id: 'PUR_1509',
    title: 'Purchase Invoices Register',
    type: 'Main Screen',
    route: '/supplier/records',
    permission_code: 'PMS-Vendor-Module',
    description: 'Historical register of supplier purchase vouchers and payment details.',
    is_in_sidebar: true,
  },

  // Customer & Point of Sale (POS)
  {
    form_id: 'SALE_1401',
    title: 'Point of Sale (POS Terminal)',
    type: 'Main Screen',
    route: '/customer/sale',
    permission_code: 'PMS-Sale-Module',
    description: 'High-speed retail & wholesale sales terminal with instant mode toggle, barcode, batch select, and change.',
    is_in_sidebar: true,
  },
  {
    form_id: 'SALE_1402',
    title: 'Wholesale POS Counter',
    type: 'Main Screen',
    route: '/customer/sale-wholesale',
    permission_code: 'PMS-Sale-Module',
    description: 'B2B Wholesale invoicing terminal with box/strip pricing and credit.',
    is_in_sidebar: false,
  },
  {
    form_id: 'SALE_1403',
    title: 'POS Sales Return & Refund',
    type: 'Drawer View',
    route: '/customer/sale/return',
    permission_code: 'PMS-Sale-Module',
    description: 'Process returns, restock inventory, and refund from cash drawer.',
    is_in_sidebar: false,
  },
  {
    form_id: 'CUST_1407',
    title: 'Customer Directory & Ledger',
    type: 'Main Screen',
    route: '/customer/list',
    permission_code: 'PMS-Customer-Module',
    description: 'Customer profiles, tiers, loyalty points, and outstanding dues.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CUST_1408',
    title: 'Add / Edit Customer Profile',
    type: 'Modal Dialog',
    route: '/customer/add',
    permission_code: 'PMS-Customer-Module',
    description: 'Create customer profile with tier, phone, and opening balance.',
    is_in_sidebar: false,
  },
  {
    form_id: 'SALE_1409',
    title: 'Customer Return Invoices',
    type: 'Main Screen',
    route: '/customer/returns',
    permission_code: 'PMS-Sale-Module',
    description: 'Register of returned invoices and refund payments.',
    is_in_sidebar: true,
  },
  {
    form_id: 'SALE_1410',
    title: 'Sales Invoices Register',
    type: 'Main Screen',
    route: '/customer/sales',
    permission_code: 'PMS-Sale-Module',
    description: 'Historical register of retail/wholesale receipts with reprint.',
    is_in_sidebar: true,
  },

  // Cash Counter & Reconciliation
  {
    form_id: 'CASH_1201',
    title: 'Received Cash Register',
    type: 'Main Screen',
    route: '/cash/receive',
    permission_code: 'PMS-Sale-Module',
    description: 'Cash handover log from active salesperson counters to store manager.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CASH_1203',
    title: 'Inter-Account Fund Transfers',
    type: 'Main Screen',
    route: '/reconciliation',
    permission_code: 'PMS-Reconciliation-Module',
    description: 'Transfer funds between cash drawer, banks, and bKash/Nagad accounts.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CASH_1204',
    title: 'Add Fund Transfer',
    type: 'Modal Dialog',
    route: '/reconciliation/add',
    permission_code: 'PMS-Reconciliation-Module',
    description: 'Transfer cash between source and destination accounts with fees.',
    is_in_sidebar: false,
  },

  // Due & Credit Collection
  {
    form_id: 'DUE_1301',
    title: 'Due Collection Workbench',
    type: 'Main Screen',
    route: '/due-collect',
    permission_code: 'PMS-Customer-Module',
    description: 'Outstanding customer dues, payment collection, and SMS reminders.',
    is_in_sidebar: true,
  },
  {
    form_id: 'DUE_1302',
    title: 'Due Paid Collections Register',
    type: 'Sub-Screen',
    route: '/pms-due-paid-payments',
    permission_code: 'PMS-Customer-Module',
    description: 'Register of historical due payment collections.',
    is_in_sidebar: true,
  },

  // Accounting & Financials
  {
    form_id: 'ACC_1101',
    title: 'Chart of Accounts Register',
    type: 'Main Screen',
    route: '/accounting/transaction',
    permission_code: 'PMS-Chart-Of-Accounting-Module',
    description: 'View ledger accounts, cash drawers, banks, and MFS balances.',
    is_in_sidebar: true,
  },
  {
    form_id: 'ACC_1102',
    title: 'Create Transaction Account',
    type: 'Modal Dialog',
    route: '/accounting/transaction/add',
    permission_code: 'PMS-Chart-Of-Accounting-Module',
    description: 'Add Bank, Cash-in-hand, or MFS account with initial balance.',
    is_in_sidebar: false,
  },
  {
    form_id: 'ACC_1103',
    title: 'Expense Vouchers Register',
    type: 'Main Screen',
    route: '/accounting/expenses',
    permission_code: 'PMS-Expense-Module',
    description: 'View categorized expenses, date filters, and daily totals.',
    is_in_sidebar: true,
  },
  {
    form_id: 'ACC_1104',
    title: 'Add Expense Voucher',
    type: 'Modal Dialog',
    route: '/accounting/expenses/add',
    permission_code: 'PMS-Expense-Module',
    description: 'Entry of operational expense, category selection, and account debit.',
    is_in_sidebar: false,
  },
  {
    form_id: 'ACC_1106',
    title: 'Miscellaneous Income Register',
    type: 'Main Screen',
    route: '/accounting/income',
    permission_code: 'PMS-Income-Module',
    description: 'View non-sales income receipts, scraps, rebates, and incentives.',
    is_in_sidebar: true,
  },
  {
    form_id: 'ACC_1109',
    title: 'Capital / Equity Balance Log',
    type: 'Main Screen',
    route: '/accounting/additional-balance',
    permission_code: 'Account-Module',
    description: 'Track owner capital injections and equity reserve accounts.',
    is_in_sidebar: true,
  },

  // Doctors Portal & Prescriptions
  {
    form_id: 'DOC_1701',
    title: 'Medical Practitioners Directory',
    type: 'Main Screen',
    route: '/doctors-portal/list',
    permission_code: 'Pharmacy-Module',
    description: 'Registered prescribing physicians, hospital affiliations, and contacts.',
    is_in_sidebar: true,
  },
  {
    form_id: 'DOC_1702',
    title: 'Add / Edit Doctor',
    type: 'Main Screen',
    route: '/doctors-portal/add',
    permission_code: 'Pharmacy-Module',
    description: 'Doctor profile with qualifications, BMDC number, and bilingual names.',
    is_in_sidebar: true,
  },
  {
    form_id: 'DOC_1703',
    title: 'Prescription Pad Settings',
    type: 'Main Screen',
    route: '/doctors-portal/settings',
    permission_code: 'Pharmacy-Module',
    description: 'Header/footer branding layout for printed prescription pads.',
    is_in_sidebar: true,
    badge: 'Coming Soon',
  },

  // Representatives & Staff Users
  {
    form_id: 'REP_1801',
    title: 'Representative User List',
    type: 'Main Screen',
    route: '/representative',
    permission_code: 'Role-Module',
    description: 'Field medical representatives, company affiliations, and phones.',
    is_in_sidebar: true,
  },
  {
    form_id: 'REP_1802',
    title: 'Add / Edit Representative',
    type: 'Main Screen',
    route: '/representative/add',
    permission_code: 'Role-Module',
    description: 'Create medical representative record with assigned company.',
    is_in_sidebar: true,
  },

  // Roles & Permissions (RBAC)
  {
    form_id: 'ROLE_1901',
    title: 'Role Authorization Matrix',
    type: 'Main Screen',
    route: '/roles',
    permission_code: 'Role-Module',
    description: 'System roles (Admin, Pharmacist, Salesperson, Accountant) & ACL matrix.',
    is_in_sidebar: true,
  },
  {
    form_id: 'ROLE_1902',
    title: 'Add / Edit Role & ACL',
    type: 'Main Screen',
    route: '/roles/add',
    permission_code: 'Role-Module',
    description: 'Create role with granular checklist across 20 permission nodes.',
    is_in_sidebar: true,
  },
  {
    form_id: 'ROLE_1903',
    title: 'Role Menu Permissions Matrix',
    type: 'Main Screen',
    route: '/roles/permissions',
    permission_code: 'Role-Module',
    description: 'Assign granular permissions (View, Create, Edit, Delete) per menu for each role.',
    is_in_sidebar: true,
  },
  {
    form_id: 'MENU_1904',
    title: 'Menu Management',
    type: 'Main Screen',
    route: '/menus',
    permission_code: 'Role-Module',
    description: 'Manage system navigation routes, icons, parent hierarchy, and availability.',
    is_in_sidebar: true,
  },
  {
    form_id: 'MENU_1905',
    title: 'Create System Menu',
    type: 'Main Screen',
    route: '/menus/add',
    permission_code: 'Role-Module',
    description: 'Add new system route, navigation icon, and hierarchical parent.',
    is_in_sidebar: false,
  },

  // System & POS Configuration
  {
    form_id: 'CFG_2001',
    title: 'Sale Business Rules Config',
    type: 'Main Screen',
    route: '/settings/sale-config',
    permission_code: 'Pharmacy-Module',
    description: 'Negative stock sales, customer auto-complete, and receipt options.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CFG_2002',
    title: 'Thermal Receipt / POS Invoice',
    type: 'Main Screen',
    route: '/settings/invoice-config',
    permission_code: 'Pharmacy-Module',
    description: 'Thermal receipt layout, 80mm/58mm/A4 paper size, and custom notes.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CFG_2003',
    title: 'Product Alert Thresholds',
    type: 'Main Screen',
    route: '/settings/product-config',
    permission_code: 'Pharmacy-Module',
    description: 'Low-stock warnings, near-expiry alert horizons (days), and tax rules.',
    is_in_sidebar: true,
  },
  {
    form_id: 'CFG_2004',
    title: 'Customer Loyalty Rules',
    type: 'Main Screen',
    route: '/settings/loyalty-config',
    permission_code: 'Pharmacy-Module',
    description: 'Loyalty earn rate per BDT 100 spent and redemption discounts.',
    is_in_sidebar: true,
    badge: 'Coming Soon',
  },
  {
    form_id: 'CFG_2005',
    title: 'Bulk SMS Packages & Gateway',
    type: 'Main Screen',
    route: '/settings/bulk-sms-config',
    permission_code: 'Pharmacy-Module',
    description: 'SMS notification templates for sales receipts and overdue dues.',
    is_in_sidebar: true,
    badge: 'Coming Soon',
  },

  // SaaS Subscription & Billing
  {
    form_id: 'SUB_2101',
    title: 'Subscription Status & History',
    type: 'Main Screen',
    route: '/subscription-report',
    permission_code: 'Pharmacy-Module',
    description: 'SaaS plan (Monthly/Yearly), renewal countdown, and invoice history.',
    is_in_sidebar: true,
  },
  {
    form_id: 'PHAR_2201',
    title: 'Store / Branch Switcher',
    type: 'Header Modal',
    route: '/change-pharmacy',
    permission_code: 'Pharmacy-Module',
    description: 'Switch active pharmacy store branch across user authorizations.',
    is_in_sidebar: true,
  },
] as const;

// Home screen lives outside the module tree
export const HOME_FORM_ID = 'DASH_2301';

export const SYSTEM_MENU_CONFIG: readonly SystemModule[] = [
  {
    module: 'Sales & Customers',
    module_bn: 'বিক্রয় ও কাস্টমার',
    module_code: 'SAL',
    icon: 'shopping-cart',
    default_route: '/customer/sale', // opens POS directly, the most-used screen
    sub_modules: [
      {
        key: 'pos',
        name: 'Point of Sale',
        name_bn: 'বিক্রয় কাউন্টার',
        icon: 'shopping-cart',
        legacy_series: 1400,
        form_ids: ['SALE_1401', 'SALE_1402', 'SALE_1403'],
      },
      {
        key: 'sales-history',
        name: 'Sales History',
        name_bn: 'বিক্রয়ের হিসাব',
        icon: 'file-search',
        legacy_series: 1400,
        form_ids: ['SALE_1410', 'SALE_1409'],
      },
      {
        key: 'customers',
        name: 'Customers',
        name_bn: 'কাস্টমার',
        icon: 'team',
        legacy_series: 1400,
        form_ids: ['CUST_1407', 'CUST_1408'],
      },
      {
        key: 'due',
        name: 'Due Collection',
        name_bn: 'বাকি আদায়',
        icon: 'file-text',
        legacy_series: 1300,
        form_ids: ['DUE_1301', 'DUE_1302'],
      },
      {
        key: 'doctors',
        name: 'Doctors & Prescriptions',
        name_bn: 'ডাক্তার ও প্রেসক্রিপশন',
        icon: 'user',
        legacy_series: 1700,
        form_ids: ['DOC_1701', 'DOC_1702'],
      },
    ],
  },
  {
    module: 'Purchase & Suppliers',
    module_bn: 'ক্রয় ও সাপ্লায়ার',
    module_code: 'PUR',
    icon: 'shop',
    default_route: '/supplier/purchase',
    sub_modules: [
      {
        key: 'purchase-entry',
        name: 'Purchase Entry',
        name_bn: 'ক্রয় এন্ট্রি',
        icon: 'shop',
        legacy_series: 1500,
        form_ids: ['PUR_1503', 'PUR_1504'],
      },
      {
        key: 'purchase-history',
        name: 'Purchase History',
        name_bn: 'ক্রয়ের হিসাব',
        icon: 'file-search',
        legacy_series: 1500,
        form_ids: ['PUR_1509'],
      },
      {
        key: 'suppliers',
        name: 'Suppliers',
        name_bn: 'সাপ্লায়ার',
        icon: 'contacts',
        legacy_series: 1500,
        form_ids: ['SUPP_1501', 'SUPP_1502'],
      },
      {
        key: 'company-reps',
        name: 'Company Representatives',
        name_bn: 'কোম্পানি প্রতিনিধি',
        icon: 'team',
        legacy_series: 1800,
        form_ids: ['REP_1801', 'REP_1802'],
      },
    ],
  },
  {
    module: 'Medicines & Stock',
    module_bn: 'ঔষধ ও স্টক',
    module_code: 'INV',
    icon: 'medicine-box',
    default_route: '/products/list',
    sub_modules: [
      {
        key: 'medicines',
        name: 'Medicine List',
        name_bn: 'ঔষধের তালিকা',
        icon: 'medicine-box',
        legacy_series: 1600,
        form_ids: ['PROD_1601', 'PROD_1602'],
      },
      {
        key: 'companies',
        name: 'Companies',
        name_bn: 'কোম্পানি',
        icon: 'bank',
        legacy_series: 1600,
        form_ids: ['PROD_1603', 'PROD_1604'],
      },
      {
        key: 'generics',
        name: 'Generic Names',
        name_bn: 'জেনেরিক নাম',
        icon: 'experiment',
        legacy_series: 1600,
        form_ids: ['PROD_1605', 'PROD_1606'],
      },
      {
        key: 'reorder',
        name: 'Reorder List',
        name_bn: 'অর্ডার তালিকা',
        icon: 'unordered-list',
        legacy_series: 1600,
        form_ids: ['PROD_1607', 'PROD_1608', 'PROD_1609'],
      },
      {
        key: 'expiry',
        name: 'Expiry Alerts',
        name_bn: 'মেয়াদ সতর্কতা',
        icon: 'alert',
        legacy_series: 1600,
        form_ids: ['PROD_1610'],
      },
      {
        key: 'stock-reports',
        name: 'Stock Reports',
        name_bn: 'স্টক রিপোর্ট',
        icon: 'bar-chart',
        legacy_series: 1600,
        form_ids: ['PROD_1611'],
      },
    ],

  },
  {
    module: 'Accounts & Cash',
    module_bn: 'হিসাব ও ক্যাশ',
    module_code: 'ACC',
    icon: 'account-book',
    default_route: '/accounting/expenses',
    sub_modules: [
      {
        key: 'cash-counter',
        name: 'Cash Counter',
        name_bn: 'ক্যাশ কাউন্টার',
        icon: 'dollar',
        legacy_series: 1200,
        form_ids: ['CASH_1201'],
      },
      {
        key: 'accounts',
        name: 'Accounts & Transfers',
        name_bn: 'অ্যাকাউন্ট ও ট্রান্সফার',
        icon: 'bank',
        legacy_series: 1100,
        form_ids: ['ACC_1101', 'ACC_1102', 'CASH_1203', 'CASH_1204'],
      },
      {
        key: 'expenses',
        name: 'Expenses',
        name_bn: 'খরচ',
        icon: 'wallet',
        legacy_series: 1100,
        form_ids: ['ACC_1103', 'ACC_1104'],
      },
      {
        key: 'income',
        name: 'Other Income',
        name_bn: 'অন্যান্য আয়',
        icon: 'rise',
        legacy_series: 1100,
        form_ids: ['ACC_1106'],
      },
      {
        key: 'capital',
        name: 'Owner Capital',
        name_bn: 'মূলধন',
        icon: 'safety',
        legacy_series: 1100,
        form_ids: ['ACC_1109'],
      },
      {
        key: 'reports',
        name: 'Reports',
        name_bn: 'রিপোর্ট',
        icon: 'bar-chart',
        legacy_series: 2300,
        form_ids: ['DASH_2302', 'DASH_2303'],
      },
    ],
  },
  {
    module: 'Settings & Admin',
    module_bn: 'সেটিংস ও অ্যাডমিন',
    module_code: 'SYS',
    icon: 'setting',
    default_route: '/settings/sale-config',
    sub_modules: [
      {
        key: 'access',
        name: 'Users & Roles',
        name_bn: 'ইউজার ও রোল',
        icon: 'safety-certificate',
        legacy_series: 1900,
        form_ids: ['ROLE_1901', 'ROLE_1902', 'ROLE_1903', 'MENU_1904', 'MENU_1905'],
      },
      {
        key: 'shop-rules',
        name: 'Shop Rules',
        name_bn: 'দোকানের নিয়ম',
        icon: 'setting',
        legacy_series: 2000,
        form_ids: ['CFG_2001', 'CFG_2003', 'CFG_2004'],
      },
      {
        key: 'print-sms',
        name: 'Printing & SMS',
        name_bn: 'প্রিন্ট ও এসএমএস',
        icon: 'printer',
        legacy_series: 2000,
        form_ids: ['CFG_2002', 'DOC_1703', 'CFG_2005'],
      },
      {
        key: 'plan-branch',
        name: 'Plan & Branch',
        name_bn: 'প্ল্যান ও শাখা',
        icon: 'cluster',
        legacy_series: 2100,
        form_ids: ['SUB_2101', 'PHAR_2201'],
      },
    ],
  },
] as const;

// Build lookup maps once at load time, so each lookup is O(1) instead of a triple loop
const SCREEN_BY_ID = new Map<string, SystemScreen>(SYSTEM_SCREENS.map((s) => [s.form_id, s]));
const SCREEN_BY_ROUTE = new Map<string, SystemScreen>(SYSTEM_SCREENS.map((s) => [s.route, s]));

// Reverse index: form_id -> where it lives in the tree (used for breadcrumbs and active-menu highlight)
const LOCATION_BY_FORM_ID = new Map<string, { module: SystemModule; sub: SystemSubModule }>();
for (const module of SYSTEM_MENU_CONFIG) {
  for (const sub of module.sub_modules) {
    for (const id of sub.form_ids) LOCATION_BY_FORM_ID.set(id, { module, sub });
  }
}

export function getScreenByFormId(formId: string): SystemScreen | undefined {
  return SCREEN_BY_ID.get(formId);
}

export function getScreenByRoute(route: string): SystemScreen | undefined {
  return SCREEN_BY_ROUTE.get(route.split('?')[0]); // strip query string before lookup
}

// Returns module > submodule > screen for the current URL
export function getBreadcrumb(route: string): { module: SystemModule; sub: SystemSubModule; screen: SystemScreen } | undefined {
  const screen = getScreenByRoute(route);
  if (!screen) return undefined;
  const loc = LOCATION_BY_FORM_ID.get(screen.form_id);
  return loc ? { module: loc.module, sub: loc.sub, screen } : undefined;
}

export interface SidebarSubModule extends Omit<SystemSubModule, 'form_ids'> {
  readonly screens: readonly SystemScreen[];
}

export interface SidebarModule extends Omit<SystemModule, 'sub_modules'> {
  readonly sub_modules: readonly SidebarSubModule[];
}

// Sidebar data: hides modals and drawers, drops submodules that end up empty
export function getSidebarTree(): readonly SidebarModule[] {
  return SYSTEM_MENU_CONFIG.map((m) => ({
    ...m,
    sub_modules: m.sub_modules
      .map((sub) => ({
        ...sub,
        screens: sub.form_ids
          .map((id) => SCREEN_BY_ID.get(id))
          .filter((s): s is SystemScreen => !!s && s.is_in_sidebar === true),
      }))
      .filter((sub) => sub.screens.length > 0),
  }));
}

// Dev-time guard: every screen must be in the tree exactly once, and every reference must exist
export function assertMenuIntegrity(): void {
  const seen = new Set<string>();
  for (const { sub } of LOCATION_BY_FORM_ID.values()) void sub;
  for (const module of SYSTEM_MENU_CONFIG) {
    for (const sub of module.sub_modules) {
      for (const id of sub.form_ids) {
        if (!SCREEN_BY_ID.has(id)) throw new Error(`Unknown form_id in menu: ${id}`);
        if (seen.has(id)) throw new Error(`Duplicate form_id in menu: ${id}`);
        seen.add(id);
      }
    }
  }
  const home = HOME_FORM_ID;
  const orphans = SYSTEM_SCREENS.filter((s) => !seen.has(s.form_id) && s.form_id !== home);
  if (orphans.length) throw new Error(`Screens not in any module: ${orphans.map((o) => o.form_id).join(', ')}`);
}

// Run integrity check on module load to guarantee zero duplicate or missing screens
assertMenuIntegrity();
