import { useLocation } from 'react-router-dom'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Product List',
  '/products/add': 'Add Product',
  '/products/companies': 'Company List',
  '/products/generics': 'Generic List',
  '/products/requisitions': 'Product Requisitions',
  '/products/requisition-record': 'Requisition Record',
  '/products/expired': 'Expired Items',
  '/supplier': 'Supplier List',
  '/supplier/add': 'Create Supplier',
  '/supplier/purchase': 'Purchase Entry',
  '/supplier/purchase-record': 'Purchase Record',
  '/customer/pos': 'Retail POS',
  '/customer/return': 'Sale Return',
  '/customer': 'Customer List',
  '/customer/add': 'Add Customer',
  '/customer/sale-record': 'Sale Record',
  '/cash': 'Cash Handover',
  '/due': 'Due Collection',
  '/accounting/accounts': 'Transaction Accounts',
  '/accounting/accounts/add': 'Create Account',
  '/accounting/expenses': 'Expenses',
  '/accounting/expenses/add': 'Add Expense',
  '/accounting/income': 'Income',
  '/accounting/additional-balance': 'Additional Balance',
  '/reconciliation': 'Reconciliation',
  '/reconciliation/add': 'Add Reconciliation',
  '/representatives': 'Representatives',
  '/representatives/add': 'Add Representative',
  '/roles': 'Roles',
  '/roles/add': 'Add Role',
  '/doctors': 'Doctor List',
  '/doctors/add': 'Add Doctor',
  '/doctors/prescription': 'Prescription Settings',
  '/settings/sale': 'Sale Config',
  '/settings/invoice': 'Invoice Config',
  '/settings/product': 'Product Config',
  '/settings/loyalty': 'Loyalty Config',
  '/settings/sms': 'SMS Config',
  '/subscription': 'Subscription Report',
  '/subscription/branch': 'Change Branch',
}

interface TopBarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function TopBar({ collapsed, onToggle }: TopBarProps) {
  const { pathname } = useLocation()
  const title = ROUTE_LABELS[pathname] || 'OS Pharmacy PMS'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
      <button
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '▶▶' : '◀◀'}
      </button>
      <h1 className="font-display font-semibold text-slate-900 text-base flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 rounded-full border border-teal-200">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className="text-xs text-teal-700 font-medium">Active</span>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 relative">
          🔔
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-900">Admin</p>
            <p className="text-xs text-slate-400">PMS Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}
