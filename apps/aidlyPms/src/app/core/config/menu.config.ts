/**
 * Unified System Menu Configuration
 * Parsed and structured directly from `apps/aidlyPms/database/menu.json` & `menu.md`.
 * Covers all 13 modules, Series Numbers (1100–2300), and 64 Form IDs.
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
}

export interface SystemModule {
  readonly module: string;
  readonly module_code: string;
  readonly series: number;
  readonly icon: string;
  readonly default_route: string;
  readonly screens: readonly SystemScreen[];
}

export const SYSTEM_MENU_CONFIG: readonly SystemModule[] = [
  {
    module: 'Dashboard & Executive Analytics',
    module_code: 'DASH',
    series: 2300,
    icon: 'dashboard',
    default_route: '/dashboard',
    screens: [
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
        title: 'Cashbook & Buy/Sale Audit',
        type: 'Sub-Screen',
        route: '/dashboard/cashbook',
        permission_code: 'PMS-Report-Module',
        description: 'Consolidated cash inflow/outflow audit log for daily reconciling.',
        is_in_sidebar: true,
      },
    ],
  },
  {
    module: 'Products & Inventory Stock',
    module_code: 'PROD',
    series: 1600,
    icon: 'medicine-box',
    default_route: '/products/list',
    screens: [
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
        title: 'Requisitions Audit History',
        type: 'Main Screen',
        route: '/products/requisition/records',
        permission_code: 'PMS-Requisition-Module',
        description: 'Historical archive of submitted stock requisition orders.',
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
    ],
  },
  {
    module: 'Suppliers & Purchase Invoicing',
    module_code: 'PUR',
    series: 1500,
    icon: 'shop',
    default_route: '/supplier/purchase',
    screens: [
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
        title: 'Purchase Invoices Audit',
        type: 'Main Screen',
        route: '/supplier/records',
        permission_code: 'PMS-Vendor-Module',
        description: 'Historical archive of supplier purchase vouchers and payment details.',
        is_in_sidebar: true,
      },
    ],
  },
  {
    module: 'Customer & Point of Sale (POS)',
    module_code: 'SALE',
    series: 1400,
    icon: 'shopping-cart',
    default_route: '/customer/sale',
    screens: [
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
        description: 'Audit log of returned invoices and refund payments.',
        is_in_sidebar: true,
      },
      {
        form_id: 'SALE_1410',
        title: 'Sales Invoices Audit Log',
        type: 'Main Screen',
        route: '/customer/sales',
        permission_code: 'PMS-Sale-Module',
        description: 'Historical archive of retail/wholesale receipts with reprint.',
        is_in_sidebar: true,
      },
    ],
  },
  {
    module: 'Cash Counter & Reconciliation',
    module_code: 'CASH',
    series: 1200,
    icon: 'dollar',
    default_route: '/cash/receive',
    screens: [
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
    ],
  },
  {
    module: 'Due & Credit Collection',
    module_code: 'DUE',
    series: 1300,
    icon: 'file-text',
    default_route: '/due-collect',
    screens: [
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
        title: 'Due Paid Collections Audit',
        type: 'Sub-Screen',
        route: '/pms-due-paid-payments',
        permission_code: 'PMS-Customer-Module',
        description: 'Audit log of historical due payment collections.',
        is_in_sidebar: true,
      },
    ],
  },
  {
    module: 'Accounting & Financials',
    module_code: 'ACC',
    series: 1100,
    icon: 'account-book',
    default_route: '/accounting/transaction',
    screens: [
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
    ],
  },
  {
    module: 'Doctors Portal & Prescriptions',
    module_code: 'DOC',
    series: 1700,
    icon: 'user',
    default_route: '/doctors-portal/list',
    screens: [
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
      },
    ],
  },
  {
    module: 'Representatives & Staff Users',
    module_code: 'REP',
    series: 1800,
    icon: 'team',
    default_route: '/representative',
    screens: [
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
    ],
  },
  {
    module: 'Roles & Permissions (RBAC)',
    module_code: 'ROLE',
    series: 1900,
    icon: 'safety-certificate',
    default_route: '/roles',
    screens: [
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
    ],
  },
  {
    module: 'System & POS Configuration',
    module_code: 'CFG',
    series: 2000,
    icon: 'setting',
    default_route: '/settings/sale-config',
    screens: [
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
      },
      {
        form_id: 'CFG_2005',
        title: 'Bulk SMS Packages & Gateway',
        type: 'Main Screen',
        route: '/settings/bulk-sms-config',
        permission_code: 'Pharmacy-Module',
        description: 'SMS notification templates for sales receipts and overdue dues.',
        is_in_sidebar: true,
      },
    ],
  },
  {
    module: 'SaaS Subscription & Billing',
    module_code: 'SUB',
    series: 2100,
    icon: 'bank',
    default_route: '/subscription-report',
    screens: [
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
    ],
  },
] as const;

/**
 * Lookup helper: finds screen definition by route URL
 */
export function getScreenByRoute(route: string): SystemScreen | undefined {
  const cleanRoute = route.split('?')[0];
  for (const mod of SYSTEM_MENU_CONFIG) {
    for (const screen of mod.screens) {
      if (screen.route.split('?')[0] === cleanRoute) {
        return screen;
      }
    }
  }
  return undefined;
}

/**
 * Lookup helper: finds screen definition by Form ID (e.g. 'ACC_1101')
 */
export function getScreenByFormId(formId: string): SystemScreen | undefined {
  for (const mod of SYSTEM_MENU_CONFIG) {
    for (const screen of mod.screens) {
      if (screen.form_id === formId) {
        return screen;
      }
    }
  }
  return undefined;
}
