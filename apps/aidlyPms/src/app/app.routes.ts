import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductListComponent } from './features/products/product-list.component';
import { ProductAddComponent } from './features/products/product-add.component';
import { CompanyListComponent } from './features/products/company-list.component';
import { GenericListComponent } from './features/products/generic-list.component';
import { RequisitionListComponent } from './features/products/requisition-list.component';
import { RequisitionRecordComponent } from './features/products/requisition-record.component';
import { ExpiredItemsComponent } from './features/products/expired-items.component';
import { StockReportComponent } from './features/products/stock-report.component';
import { StocktakeListComponent } from './features/products/stocktake-list.component';
import { StocktakeCreateComponent } from './features/products/stocktake-create.component';
import { StocktakeCountComponent } from './features/products/stocktake-count.component';
import { StockIntegrityComponent } from './features/products/stock-integrity.component';

import { SupplierListComponent } from './features/supplier/supplier-list.component';
import { SupplierAddComponent } from './features/supplier/supplier-add.component';
import { PurchaseEntryComponent } from './features/supplier/purchase-entry.component';
import { PurchaseRecordComponent } from './features/supplier/purchase-record.component';
import { PurchaseReturnComponent } from './features/supplier/purchase-return.component';
import { StockTransferComponent } from './features/products/stock-transfer.component';
import { InventoryReportsComponent } from './features/reports/inventory-reports.component';
import { AuditLogsComponent } from './features/settings/audit-logs.component';

import { PosTerminalComponent } from './features/customer/pos-terminal.component';
import { CustomerListComponent } from './features/customer/customer-list.component';
import { CustomerAddComponent } from './features/customer/customer-add.component';
import { SaleRecordComponent } from './features/customer/sale-record.component';
import { SaleReturnComponent } from './features/customer/sale-return.component';
import { OfflineSalesReviewComponent } from './features/customer/offline-sales-review.component';

import { CashHandoverComponent } from './features/cash/cash-handover.component';
import { DueCollectComponent } from './features/due/due-collect.component';

import { AccountsComponent } from './features/accounting/accounts.component';
import { AccountAddComponent } from './features/accounting/account-add.component';
import { ExpensesComponent } from './features/accounting/expenses.component';
import { ExpenseAddComponent } from './features/accounting/expense-add.component';
import { IncomeComponent } from './features/accounting/income.component';
import { AdditionalBalanceComponent } from './features/accounting/additional-balance.component';
import { ReconciliationListComponent } from './features/reconciliation/reconciliation-list.component';
import { ReconciliationAddComponent } from './features/reconciliation/reconciliation-add.component';

import { DoctorListComponent } from './features/doctors/doctor-list.component';
import { DoctorAddComponent } from './features/doctors/doctor-add.component';
import { PrescriptionSettingsComponent } from './features/doctors/prescription-settings.component';

import { RepListComponent } from './features/representatives/rep-list.component';
import { RepAddComponent } from './features/representatives/rep-add.component';

import { RoleListComponent } from './features/roles/role-list.component';
import { RoleMenuPermissionComponent } from './features/roles/role-menu-permission.component';

import { MenuListComponent } from './features/menus/menu-list.component';
import { MenuFormComponent } from './features/menus/menu-form.component';

import { SaleConfigComponent } from './features/settings/sale-config.component';
import { InvoiceConfigComponent } from './features/settings/invoice-config.component';
import { ProductConfigComponent } from './features/settings/product-config.component';
import { LoyaltyConfigComponent } from './features/settings/loyalty-config.component';
import { SmsConfigComponent } from './features/settings/sms-config.component';

import { SubscriptionComponent } from './features/subscription/subscription.component';
import { BranchSwitcherComponent } from './features/subscription/branch-switcher.component';

import { CashbookReportComponent } from './features/reports/cashbook-report.component';
import { AnalyticsReportComponent } from './features/reports/analytics-report.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './core/guards/auth.guard';
import { menuGuard } from './core/guards/menu.guard';

export const appRoutes: Route[] = [
  { path: 'auth/login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard & Executive Analytics
      { path: 'dashboard', component: DashboardComponent, canActivate: [menuGuard], data: { menuCode: 'DASH_2301' } },
      { path: 'dashboard/analytics', component: AnalyticsReportComponent, canActivate: [menuGuard], data: { menuCode: 'DASH_2302' } },
      { path: 'dashboard/cashbook', component: CashbookReportComponent, canActivate: [menuGuard], data: { menuCode: 'DASH_2303' } },

      // Products & Inventory
      { path: 'products', redirectTo: 'products/list', pathMatch: 'full' },
      { path: 'products/list', component: ProductListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1601' } },
      { path: 'products/add', component: ProductAddComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1602' } },
      { path: 'products/company', component: CompanyListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1603' } },
      { path: 'products/company/add', component: CompanyListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1604' } },
      { path: 'products/generic', component: GenericListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1605' } },
      { path: 'products/generic/add', component: GenericListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1606' } },
      { path: 'products/requisition', component: RequisitionListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1607' } },
      { path: 'products/requisition/add-item', redirectTo: 'products/requisition', pathMatch: 'full', data: { menuCode: 'PROD_1608' } },
      { path: 'products/requisition/records', component: RequisitionRecordComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1609' } },
      { path: 'products/expired', component: ExpiredItemsComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1610' } },
      { path: 'products/transfers', component: StockTransferComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1601' } },
      { path: 'products/transfer', redirectTo: 'products/transfers', pathMatch: 'full' },
      { path: 'inventory/transfers', redirectTo: 'products/transfers', pathMatch: 'full' },
      { path: 'products/stocktakes', component: StocktakeListComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1612' } },
      { path: 'products/stocktakes/new', component: StocktakeCreateComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1612' } },
      { path: 'products/stocktakes/:id', component: StocktakeCountComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1612' } },
      { path: 'products/integrity', component: StockIntegrityComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1613' } },
      { path: 'products/reports', component: StockReportComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1611' } },
      { path: 'inventory/reports', redirectTo: 'reports/inventory', pathMatch: 'full' },

      // Reports
      { path: 'reports/inventory', component: InventoryReportsComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1611' } },
      { path: 'reports/abc-fsn', component: InventoryReportsComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1611' } },
      { path: 'reports/margin', component: InventoryReportsComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1611' } },
      { path: 'reports/expiry', component: InventoryReportsComponent, canActivate: [menuGuard], data: { menuCode: 'PROD_1610' } },
      { path: 'reports/daily-returns', component: InventoryReportsComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1409' } },

      // Suppliers & Purchases
      { path: 'purchase', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'purchases', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'supplier', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'supplier/purchase', component: PurchaseEntryComponent, canActivate: [menuGuard], data: { menuCode: 'PUR_1503' } },
      { path: 'supplier/purchase/mode', redirectTo: 'supplier/purchase', pathMatch: 'full', data: { menuCode: 'PUR_1504' } },
      { path: 'supplier/list', component: SupplierListComponent, canActivate: [menuGuard], data: { menuCode: 'SUPP_1501' } },
      { path: 'supplier/add', component: SupplierAddComponent, canActivate: [menuGuard], data: { menuCode: 'SUPP_1502' } },
      { path: 'supplier/records', component: PurchaseRecordComponent, canActivate: [menuGuard], data: { menuCode: 'PUR_1509' } },
      { path: 'supplier/purchase-return', component: PurchaseReturnComponent, canActivate: [menuGuard], data: { menuCode: 'PUR_1509' } },
      { path: 'supplier/returns', redirectTo: 'supplier/purchase-return', pathMatch: 'full' },

      // Customer & Sales POS
      { path: 'customer/sale', component: PosTerminalComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1401' } },
      { path: 'customer/sale-wholesale', component: PosTerminalComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1402' } },
      { path: 'customer/list', component: CustomerListComponent, canActivate: [menuGuard], data: { menuCode: 'CUST_1407' } },
      { path: 'customer/add', component: CustomerAddComponent, canActivate: [menuGuard], data: { menuCode: 'CUST_1408' } },
      { path: 'customer/returns', component: SaleReturnComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1409' } },
      { path: 'customer/return', redirectTo: 'customer/returns', pathMatch: 'full' },
      { path: 'customer/sale-return', redirectTo: 'customer/returns', pathMatch: 'full' },
      { path: 'customer/sale/return', component: SaleReturnComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1403' } },
      { path: 'purchase/return', component: PurchaseReturnComponent, canActivate: [menuGuard], data: { menuCode: 'PUR_1509' } },
      { path: 'purchase-return', component: PurchaseReturnComponent, canActivate: [menuGuard], data: { menuCode: 'PUR_1509' } },
      { path: 'customer/sales', component: SaleRecordComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1410' } },
      { path: 'customer/sale-records', redirectTo: 'customer/sales', pathMatch: 'full' },
      { path: 'customer/offline-review', component: OfflineSalesReviewComponent, canActivate: [menuGuard], data: { menuCode: 'SALE_1411' } },
      { path: 'sales/offline-review', redirectTo: 'customer/offline-review', pathMatch: 'full' },

      // Cash Counter & Reconciliation
      { path: 'cash', redirectTo: 'cash/receive', pathMatch: 'full' },
      { path: 'cash/receive', component: CashHandoverComponent, canActivate: [menuGuard], data: { menuCode: 'CASH_1201' } },
      { path: 'reconciliation', component: ReconciliationListComponent, canActivate: [menuGuard], data: { menuCode: 'CASH_1203' } },
      { path: 'reconciliation/add', component: ReconciliationAddComponent, canActivate: [menuGuard], data: { menuCode: 'CASH_1204' } },

      // Due & Credit Collection
      { path: 'due-collect', component: DueCollectComponent, canActivate: [menuGuard], data: { menuCode: 'DUE_1301' } },
      { path: 'pms-due-paid-payments', component: DueCollectComponent, canActivate: [menuGuard], data: { menuCode: 'DUE_1302' } },

      // Accounting & Financials
      { path: 'accounting', redirectTo: 'accounting/transaction', pathMatch: 'full' },
      { path: 'accounting/transaction', component: AccountsComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1101' } },
      { path: 'accounting/transaction/add', component: AccountAddComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1102' } },
      { path: 'accounting/expenses', component: ExpensesComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1103' } },
      { path: 'accounting/expenses/add', component: ExpenseAddComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1104' } },
      { path: 'accounting/income', component: IncomeComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1106' } },
      { path: 'accounting/additional-balance', component: AdditionalBalanceComponent, canActivate: [menuGuard], data: { menuCode: 'ACC_1109' } },
      { path: 'accounting/reports', redirectTo: 'dashboard/cashbook', pathMatch: 'full' },
      { path: 'accounting/cashbook', redirectTo: 'dashboard/cashbook', pathMatch: 'full' },
      { path: 'accounting/analytics', redirectTo: 'dashboard/analytics', pathMatch: 'full' },

      // Doctors Portal
      { path: 'doctors-portal/list', component: DoctorListComponent, canActivate: [menuGuard], data: { menuCode: 'DOC_1701' } },
      { path: 'doctors-portal/add', component: DoctorAddComponent, canActivate: [menuGuard], data: { menuCode: 'DOC_1702' } },
      { path: 'doctors-portal/settings', component: PrescriptionSettingsComponent, canActivate: [menuGuard], data: { menuCode: 'DOC_1703' } },

      // Representatives & Staff
      { path: 'representative', component: RepListComponent, canActivate: [menuGuard], data: { menuCode: 'REP_1801' } },
      { path: 'representative/add', component: RepAddComponent, canActivate: [menuGuard], data: { menuCode: 'REP_1802' } },

      // Roles & RBAC
      { path: 'roles', component: RoleListComponent, canActivate: [menuGuard], data: { menuCode: 'ROLE_1901' } },
      { path: 'roles/add', redirectTo: 'roles', pathMatch: 'full', data: { menuCode: 'ROLE_1902' } },
      { path: 'roles/permissions', component: RoleMenuPermissionComponent, canActivate: [menuGuard], data: { menuCode: 'ROLE_1903' } },
      { path: 'roles/:id/permissions', component: RoleMenuPermissionComponent, canActivate: [menuGuard], data: { menuCode: 'ROLE_1903' } },

      // System Menus Management
      { path: 'menus', component: MenuListComponent, canActivate: [menuGuard], data: { menuCode: 'MENU_1904' } },
      { path: 'menus/add', component: MenuFormComponent, canActivate: [menuGuard], data: { menuCode: 'MENU_1905' } },
      { path: 'menus/edit/:id', component: MenuFormComponent, canActivate: [menuGuard], data: { menuCode: 'MENU_1904' } },
      { path: 'menus/permissions', redirectTo: 'roles/permissions', pathMatch: 'full' },

      // System & POS Settings
      { path: 'settings/sale-config', component: SaleConfigComponent, canActivate: [menuGuard], data: { menuCode: 'CFG_2001' } },
      { path: 'settings/invoice-config', component: InvoiceConfigComponent, canActivate: [menuGuard], data: { menuCode: 'CFG_2002' } },
      { path: 'settings/product-config', component: ProductConfigComponent, canActivate: [menuGuard], data: { menuCode: 'CFG_2003' } },
      { path: 'settings/loyalty-config', component: LoyaltyConfigComponent, canActivate: [menuGuard], data: { menuCode: 'CFG_2004' } },
      { path: 'settings/bulk-sms-config', component: SmsConfigComponent, canActivate: [menuGuard], data: { menuCode: 'CFG_2005' } },
      { path: 'settings/audit-logs', component: AuditLogsComponent, canActivate: [menuGuard], data: { menuCode: 'SETT_2006' } },
      { path: 'audit-logs', redirectTo: 'settings/audit-logs', pathMatch: 'full' },

      // Subscription & Multi-Branch
      { path: 'subscription-report', component: SubscriptionComponent, canActivate: [menuGuard], data: { menuCode: 'SUB_2101' } },
      { path: 'change-pharmacy', component: BranchSwitcherComponent, canActivate: [menuGuard], data: { menuCode: 'PHAR_2201' } },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
