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

import { SupplierListComponent } from './features/supplier/supplier-list.component';
import { SupplierAddComponent } from './features/supplier/supplier-add.component';
import { PurchaseEntryComponent } from './features/supplier/purchase-entry.component';
import { PurchaseRecordComponent } from './features/supplier/purchase-record.component';

import { PosTerminalComponent } from './features/customer/pos-terminal.component';
import { CustomerListComponent } from './features/customer/customer-list.component';
import { CustomerAddComponent } from './features/customer/customer-add.component';
import { SaleRecordComponent } from './features/customer/sale-record.component';
import { SaleReturnComponent } from './features/customer/sale-return.component';

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
import { RoleAddComponent } from './features/roles/role-add.component';

import { SaleConfigComponent } from './features/settings/sale-config.component';
import { InvoiceConfigComponent } from './features/settings/invoice-config.component';
import { ProductConfigComponent } from './features/settings/product-config.component';
import { LoyaltyConfigComponent } from './features/settings/loyalty-config.component';
import { SmsConfigComponent } from './features/settings/sms-config.component';

import { SubscriptionComponent } from './features/subscription/subscription.component';
import { BranchSwitcherComponent } from './features/subscription/branch-switcher.component';

import { ModuleScreenViewComponent } from './features/common/module-screen-view.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard & Executive Analytics (DASH_2301 - DASH_2303)
      { path: 'dashboard', component: DashboardComponent },
      { path: 'dashboard/analytics', component: ModuleScreenViewComponent },
      { path: 'dashboard/cashbook', component: ModuleScreenViewComponent },

      // Products & Inventory (PROD_1601 - PROD_1610)
      { path: 'products', redirectTo: 'products/list', pathMatch: 'full' },
      { path: 'products/list', component: ProductListComponent },
      { path: 'products/add', component: ProductAddComponent },
      { path: 'products/company', component: CompanyListComponent },
      { path: 'products/company/add', component: CompanyListComponent },
      { path: 'products/generic', component: GenericListComponent },
      { path: 'products/generic/add', component: GenericListComponent },
      { path: 'products/requisition', component: RequisitionListComponent },
      { path: 'products/requisition/records', component: RequisitionRecordComponent },
      { path: 'products/expired', component: ExpiredItemsComponent },

      // Suppliers & Purchases (PUR_1501 - PUR_1509)
      { path: 'purchase', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'purchases', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'supplier', redirectTo: 'supplier/purchase', pathMatch: 'full' },
      { path: 'supplier/purchase', component: PurchaseEntryComponent },
      { path: 'supplier/list', component: SupplierListComponent },
      { path: 'supplier/add', component: SupplierAddComponent },
      { path: 'supplier/records', component: PurchaseRecordComponent },

      // Customer & Sales POS (SALE_1401 - SALE_1410)
      { path: 'customer/sale', component: PosTerminalComponent },
      { path: 'customer/sale-wholesale', redirectTo: 'customer/sale', pathMatch: 'full' },
      { path: 'customer/list', component: CustomerListComponent },
      { path: 'customer/add', component: CustomerAddComponent },
      { path: 'customer/returns', component: SaleReturnComponent },
      { path: 'customer/sales', component: SaleRecordComponent },

      // Cash Counter & Reconciliation (CASH_1201 - CASH_1205)
      { path: 'cash', redirectTo: 'cash/receive', pathMatch: 'full' },
      { path: 'cash/receive', component: CashHandoverComponent },
      { path: 'reconciliation', component: ReconciliationListComponent },
      { path: 'reconciliation/add', component: ReconciliationAddComponent },

      // Due & Credit Collection (DUE_1301 - DUE_1302)
      { path: 'due-collect', component: DueCollectComponent },
      { path: 'pms-due-paid-payments', component: DueCollectComponent },

      // Accounting & Financials (ACC_1101 - ACC_1110)
      { path: 'accounting', redirectTo: 'accounting/transaction', pathMatch: 'full' },
      { path: 'accounting/transaction', component: AccountsComponent },
      { path: 'accounting/transaction/add', component: AccountAddComponent },
      { path: 'accounting/expenses', component: ExpensesComponent },
      { path: 'accounting/expenses/add', component: ExpenseAddComponent },
      { path: 'accounting/income', component: IncomeComponent },
      { path: 'accounting/additional-balance', component: AdditionalBalanceComponent },

      // Doctors Portal (DOC_1701 - DOC_1703)
      { path: 'doctors-portal/list', component: DoctorListComponent },
      { path: 'doctors-portal/add', component: DoctorAddComponent },
      { path: 'doctors-portal/settings', component: PrescriptionSettingsComponent },

      // Representatives & Staff (REP_1801 - REP_1802)
      { path: 'representative', component: RepListComponent },
      { path: 'representative/add', component: RepAddComponent },

      // Roles & RBAC (ROLE_1901 - ROLE_1902)
      { path: 'roles', component: RoleListComponent },
      { path: 'roles/add', component: RoleAddComponent },

      // System & POS Settings (CFG_2001 - CFG_2005)
      { path: 'settings/sale-config', component: SaleConfigComponent },
      { path: 'settings/invoice-config', component: InvoiceConfigComponent },
      { path: 'settings/product-config', component: ProductConfigComponent },
      { path: 'settings/loyalty-config', component: LoyaltyConfigComponent },
      { path: 'settings/bulk-sms-config', component: SmsConfigComponent },

      // Subscription & Multi-Branch (SUB_2101 - PHAR_2201)
      { path: 'subscription-report', component: SubscriptionComponent },
      { path: 'change-pharmacy', component: BranchSwitcherComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
