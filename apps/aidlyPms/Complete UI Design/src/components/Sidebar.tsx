import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

interface NavItem {
  label: string
  path?: string
  children?: { label: string; path: string }[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  {
    label: 'Products',
    children: [
      { label: 'Product List', path: '/products' },
      { label: 'Add Product', path: '/products/add' },
      { label: 'Companies', path: '/products/companies' },
      { label: 'Generics', path: '/products/generics' },
      { label: 'Requisitions', path: '/products/requisitions' },
      { label: 'Requisition Record', path: '/products/requisition-record' },
      { label: 'Expired Items', path: '/products/expired' },
    ],
  },
  {
    label: 'Supplier',
    children: [
      { label: 'Supplier List', path: '/supplier' },
      { label: 'Create Supplier', path: '/supplier/add' },
      { label: 'Purchase Entry', path: '/supplier/purchase' },
      { label: 'Purchase Record', path: '/supplier/purchase-record' },
    ],
  },
  {
    label: 'Customer',
    children: [
      { label: 'Retail POS', path: '/customer/pos' },
      { label: 'Sale Return', path: '/customer/return' },
      { label: 'Customer List', path: '/customer' },
      { label: 'Add Customer', path: '/customer/add' },
      { label: 'Sale Record', path: '/customer/sale-record' },
    ],
  },
  { label: 'Cash', path: '/cash' },
  {
    label: 'Due Collect',
    children: [
      { label: 'Due Collect', path: '/due' },
    ],
  },
  {
    label: 'Accounting',
    children: [
      { label: 'Accounts', path: '/accounting/accounts' },
      { label: 'Create Account', path: '/accounting/accounts/add' },
      { label: 'Expenses', path: '/accounting/expenses' },
      { label: 'Add Expense', path: '/accounting/expenses/add' },
      { label: 'Income', path: '/accounting/income' },
      { label: 'Additional Balance', path: '/accounting/additional-balance' },
    ],
  },
  {
    label: 'Reconciliation',
    children: [
      { label: 'Reconciliation List', path: '/reconciliation' },
      { label: 'Add Reconciliation', path: '/reconciliation/add' },
    ],
  },
  {
    label: 'Representatives',
    children: [
      { label: 'Rep List', path: '/representatives' },
      { label: 'Add Rep', path: '/representatives/add' },
    ],
  },
  {
    label: 'Roles',
    children: [
      { label: 'Roles List', path: '/roles' },
      { label: 'Add Role', path: '/roles/add' },
    ],
  },
  {
    label: 'Doctors Portal',
    children: [
      { label: 'Doctor List', path: '/doctors' },
      { label: 'Add Doctor', path: '/doctors/add' },
      { label: 'Prescription Settings', path: '/doctors/prescription' },
    ],
  },
  {
    label: 'Settings',
    children: [
      { label: 'Sale Config', path: '/settings/sale' },
      { label: 'Invoice Config', path: '/settings/invoice' },
      { label: 'Product Config', path: '/settings/product' },
      { label: 'Loyalty Config', path: '/settings/loyalty' },
      { label: 'SMS Config', path: '/settings/sms' },
    ],
  },
  {
    label: 'Subscription',
    children: [
      { label: 'Subscription Report', path: '/subscription' },
      { label: 'Change Branch', path: '/subscription/branch' },
    ],
  },
]

const MODULE_ICONS: Record<string, string> = {
  Dashboard: '⬡',
  Products: '💊',
  Supplier: '🏭',
  Customer: '🛒',
  Cash: '💵',
  'Due Collect': '📋',
  Accounting: '📊',
  Reconciliation: '⇄',
  Representatives: '👤',
  Roles: '🔐',
  'Doctors Portal': '🩺',
  Settings: '⚙️',
  Subscription: '🏪',
}

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NAV.forEach(item => {
      if (item.children) {
        const active = item.children.some(c => location.pathname.startsWith(c.path))
        if (active) initial[item.label] = true
      }
    })
    return initial
  })

  const toggle = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }))

  return (
    <aside
      className="flex flex-col h-full overflow-hidden transition-all duration-300"
      style={{ width: collapsed ? 56 : 240, background: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          ℞
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm font-display leading-tight">OS Pharmacy</p>
            <p className="text-slate-400 text-xs">PMS v2.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(item => {
          if (!item.children) {
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
                    isActive
                      ? 'text-teal-400 bg-teal-500/15 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <span className="text-base shrink-0">{MODULE_ICONS[item.label] || '○'}</span>
                {!collapsed && <span className="sidebar-label truncate">{item.label}</span>}
              </NavLink>
            )
          }

          const isGroupActive = item.children.some(c => location.pathname.startsWith(c.path))
          const isOpen = openGroups[item.label]

          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
                  isGroupActive ? 'text-teal-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`}
              >
                <span className="text-base shrink-0">{MODULE_ICONS[item.label] || '○'}</span>
                {!collapsed && (
                  <>
                    <span className="sidebar-label flex-1 text-left truncate">{item.label}</span>
                    <span className={`sidebar-chevron text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                  </>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children.map(child => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `block px-2 py-1.5 rounded-md text-xs transition-all ${
                          isActive
                            ? 'text-teal-400 font-medium bg-teal-500/10'
                            : 'text-slate-500 hover:text-slate-200'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Branch */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <p className="text-xs text-slate-500">Active Branch</p>
          <p className="text-sm text-white font-medium">Kazi — Cumilla</p>
        </div>
      )}
    </aside>
  )
}
