import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import ProductAdd from './pages/products/ProductAdd'
import CompanyList from './pages/products/CompanyList'
import GenericList from './pages/products/GenericList'
import Requisitions from './pages/products/Requisitions'
import RequisitionRecord from './pages/products/RequisitionRecord'
import ExpiredItems from './pages/products/ExpiredItems'
import SupplierList from './pages/supplier/SupplierList'
import SupplierAdd from './pages/supplier/SupplierAdd'
import PurchaseEntry from './pages/supplier/PurchaseEntry'
import PurchaseRecord from './pages/supplier/PurchaseRecord'
import RetailPOS from './pages/customer/RetailPOS'
import SaleReturn from './pages/customer/SaleReturn'
import CustomerList from './pages/customer/CustomerList'
import CustomerAdd from './pages/customer/CustomerAdd'
import SaleRecord from './pages/customer/SaleRecord'
import CashHandover from './pages/cash/CashHandover'
import DueCollect from './pages/due/DueCollect'
import Accounts from './pages/accounting/Accounts'
import AccountAdd from './pages/accounting/AccountAdd'
import Expenses from './pages/accounting/Expenses'
import ExpenseAdd from './pages/accounting/ExpenseAdd'
import Income from './pages/accounting/Income'
import AdditionalBalance from './pages/accounting/AdditionalBalance'
import ReconciliationList from './pages/reconciliation/ReconciliationList'
import ReconciliationAdd from './pages/reconciliation/ReconciliationAdd'
import RepList from './pages/representatives/RepList'
import RepAdd from './pages/representatives/RepAdd'
import RoleList from './pages/roles/RoleList'
import RoleAdd from './pages/roles/RoleAdd'
import DoctorList from './pages/doctors/DoctorList'
import DoctorAdd from './pages/doctors/DoctorAdd'
import PrescriptionSettings from './pages/doctors/PrescriptionSettings'
import SaleConfig from './pages/settings/SaleConfig'
import InvoiceConfig from './pages/settings/InvoiceConfig'
import ProductConfig from './pages/settings/ProductConfig'
import LoyaltyConfig from './pages/settings/LoyaltyConfig'
import SMSConfig from './pages/settings/SMSConfig'
import Subscription from './pages/subscription/Subscription'
import BranchSwitcher from './pages/subscription/BranchSwitcher'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'products', element: <ProductList /> },
      { path: 'products/add', element: <ProductAdd /> },
      { path: 'products/companies', element: <CompanyList /> },
      { path: 'products/generics', element: <GenericList /> },
      { path: 'products/requisitions', element: <Requisitions /> },
      { path: 'products/requisition-record', element: <RequisitionRecord /> },
      { path: 'products/expired', element: <ExpiredItems /> },
      { path: 'supplier', element: <SupplierList /> },
      { path: 'supplier/add', element: <SupplierAdd /> },
      { path: 'supplier/purchase', element: <PurchaseEntry /> },
      { path: 'supplier/purchase-record', element: <PurchaseRecord /> },
      { path: 'customer/pos', element: <RetailPOS /> },
      { path: 'customer/return', element: <SaleReturn /> },
      { path: 'customer', element: <CustomerList /> },
      { path: 'customer/add', element: <CustomerAdd /> },
      { path: 'customer/sale-record', element: <SaleRecord /> },
      { path: 'cash', element: <CashHandover /> },
      { path: 'due', element: <DueCollect /> },
      { path: 'accounting/accounts', element: <Accounts /> },
      { path: 'accounting/accounts/add', element: <AccountAdd /> },
      { path: 'accounting/expenses', element: <Expenses /> },
      { path: 'accounting/expenses/add', element: <ExpenseAdd /> },
      { path: 'accounting/income', element: <Income /> },
      { path: 'accounting/additional-balance', element: <AdditionalBalance /> },
      { path: 'reconciliation', element: <ReconciliationList /> },
      { path: 'reconciliation/add', element: <ReconciliationAdd /> },
      { path: 'representatives', element: <RepList /> },
      { path: 'representatives/add', element: <RepAdd /> },
      { path: 'roles', element: <RoleList /> },
      { path: 'roles/add', element: <RoleAdd /> },
      { path: 'doctors', element: <DoctorList /> },
      { path: 'doctors/add', element: <DoctorAdd /> },
      { path: 'doctors/prescription', element: <PrescriptionSettings /> },
      { path: 'settings/sale', element: <SaleConfig /> },
      { path: 'settings/invoice', element: <InvoiceConfig /> },
      { path: 'settings/product', element: <ProductConfig /> },
      { path: 'settings/loyalty', element: <LoyaltyConfig /> },
      { path: 'settings/sms', element: <SMSConfig /> },
      { path: 'subscription', element: <Subscription /> },
      { path: 'subscription/branch', element: <BranchSwitcher /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
