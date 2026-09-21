import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input } from '../../components/ui/FormField'

const ROLES = [
  { id: 1, alias: 'PMS Manager', perms: 20 },
  { id: 2, alias: 'PMS Salesman', perms: 8 },
  { id: 3, alias: 'PMS Cashier', perms: 6 },
  { id: 4, alias: 'Accountant', perms: 12 },
]

const MODULES = [
  'Account-Module', 'Global-Account-Module', 'PMS-Barcode-Module', 'PMS-Chart-Of-Accounting-Module',
  'PMS-Customer-Module', 'PMS-Expense-Category-Module', 'PMS-Expense-Module', 'PMS-Income-Category-Module',
  'PMS-Income-Module', 'PMS-Product-Module', 'PMS-Reconciliation-Module', 'PMS-Report-Module',
  'PMS-Requisition-Module', 'PMS-Sale-Module', 'PMS-Vendor-Module', 'POS-Shop-Company-Module',
  'POS-Shop-Generic-Module', 'Permission-Module', 'Pharmacy-Module', 'Role-Module',
]
const OPS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE']

function RoleModal({ open, onClose, editAlias }: { open: boolean; onClose: () => void; editAlias?: string }) {
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(MODULES.map(m => [m, Object.fromEntries(OPS.map(op => [op, false]))]))
  )
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggle = (mod: string, op: string) => setPerms(p => ({ ...p, [mod]: { ...p[mod], [op]: !p[mod][op] } }))
  const toggleAll = (mod: string) => {
    const allOn = OPS.every(op => perms[mod][op])
    setPerms(p => ({ ...p, [mod]: Object.fromEntries(OPS.map(op => [op, !allOn])) }))
  }

  return (
    <Modal open={open} onClose={onClose} title={editAlias ? `Edit Role — ${editAlias}` : 'Add Role (SCR-39)'} size="xl"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Discard</Button><Button size="sm" onClick={onClose}>Submit Role</Button></>}>
      <div className="space-y-4">
        <FormField label="Role Alias" required>
          <Input placeholder="e.g. PMS Manager" defaultValue={editAlias} className="max-w-sm" />
        </FormField>

        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Permissions Matrix</p>
        <div className="space-y-1.5">
          {MODULES.map(mod => {
            const isOpen = openGroups[mod]
            const allOn = OPS.every(op => perms[mod][op])
            const someOn = OPS.some(op => perms[mod][op])
            return (
              <div key={mod} className="border border-slate-200 rounded-lg overflow-hidden">
                <div
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${someOn ? 'bg-teal-50' : 'bg-slate-50'} hover:bg-slate-100`}
                  onClick={() => setOpenGroups(p => ({ ...p, [mod]: !p[mod] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${allOn ? 'bg-teal-500' : someOn ? 'bg-amber-400' : 'bg-slate-300'}`} />
                    <span className="text-xs font-medium text-slate-700 font-mono">{mod}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); toggleAll(mod) }} className="text-xs text-teal-600 hover:text-teal-800">{allOn ? 'None' : 'All'}</button>
                    <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 py-2.5 bg-white grid grid-cols-4 gap-3">
                    {OPS.map(op => (
                      <label key={op} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={perms[mod][op]} onChange={() => toggle(mod, op)} className="accent-teal-600" />
                        <span className="text-xs text-slate-700">{op}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default function RoleList() {
  const [addOpen, setAddOpen] = useState(false)
  const [editRole, setEditRole] = useState<string | undefined>()

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => { setEditRole(undefined); setAddOpen(true) }}>+ Add Role</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">ID</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Role Alias</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Permissions</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 mono text-xs text-slate-500">{r.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-800">{r.alias}</td>
                <td className="px-3 py-2.5 text-center mono text-xs text-slate-600">{r.perms} modules</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => { setEditRole(r.alias); setAddOpen(true) }} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️ Edit</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">⎘ Clone</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <RoleModal open={addOpen} onClose={() => setAddOpen(false)} editAlias={editRole} />
    </div>
  )
}
