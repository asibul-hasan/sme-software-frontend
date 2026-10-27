/**
 * Menu Route Registry
 * Maps system menu codes (sys_menus.menu_code) to Angular route paths.
 * All screen titles, icons, orders, and permissions are DB-driven and retrieved
 * dynamically from the login menu tree (AuthService / AuthStore).
 */
export const MENU_ROUTE_REGISTRY: Record<string, string> = {
  // Dashboard & Executive Analytics
  DASH_2301: '/dashboard',
  DASH_2302: '/dashboard/analytics',
  DASH_2303: '/dashboard/cashbook',

  // Sales & POS
  SALE_1401: '/customer/sale',
  SALE_1402: '/customer/sale-wholesale',
  SALE_1403: '/customer/sale/return',
  SALE_1409: '/customer/returns',
  SALE_1410: '/customer/sales',
  SALE_1411: '/customer/offline-review',
  CUST_1407: '/customer/list',
  CUST_1408: '/customer/add',

  // Purchases & Suppliers
  SUPP_1501: '/supplier/list',
  SUPP_1502: '/supplier/add',
  PUR_1503: '/supplier/purchase',
  PUR_1504: '/supplier/purchase',
  PUR_1509: '/supplier/records',

  // Medicines & Products
  PROD_1601: '/products/list',
  PROD_1602: '/products/add',
  PROD_1603: '/products/company',
  PROD_1604: '/products/company/add',
  PROD_1605: '/products/generic',
  PROD_1606: '/products/generic/add',
  PROD_1607: '/products/requisition',
  PROD_1608: '/products/requisition',
  PROD_1609: '/products/requisition/records',
  PROD_1610: '/products/expired',
  PROD_1611: '/products/reports',
  PROD_1612: '/products/stocktakes',
  PROD_1613: '/products/integrity',

  // Accounts & Cash
  CASH_1201: '/cash/receive',
  CASH_1203: '/reconciliation',
  CASH_1204: '/reconciliation/add',
  DUE_1301: '/due-collect',
  DUE_1302: '/pms-due-paid-payments',
  ACC_1101: '/accounting/transaction',
  ACC_1102: '/accounting/transaction/add',
  ACC_1103: '/accounting/expenses',
  ACC_1104: '/accounting/expenses/add',
  ACC_1106: '/accounting/income',
  ACC_1109: '/accounting/additional-balance',

  // Doctors & Representatives
  DOC_1701: '/doctors-portal/list',
  DOC_1702: '/doctors-portal/add',
  DOC_1703: '/doctors-portal/settings',
  REP_1801: '/representative',
  REP_1802: '/representative/add',

  // Roles & Security
  ROLE_1901: '/roles',
  ROLE_1902: '/roles',
  ROLE_1903: '/roles/permissions',
  MENU_1904: '/menus',
  MENU_1905: '/menus/add',

  // Settings & System
  CFG_2001: '/settings/sale-config',
  CFG_2002: '/settings/invoice-config',
  CFG_2003: '/settings/product-config',
  CFG_2004: '/settings/loyalty-config',
  CFG_2005: '/settings/bulk-sms-config',
  SETT_2006: '/settings/audit-logs',
  SUB_2101: '/subscription-report',
  PHAR_2201: '/change-pharmacy',
};

export function getRouteByMenuCode(menuCode: string): string | undefined {
  return MENU_ROUTE_REGISTRY[menuCode];
}
