import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input } from '../../components/ui/FormField'

const MODULES = [
  'Account-Module', 'Global-Account-Module', 'PMS-Barcode-Module', 'PMS-Chart-Of-Accounting-Module',
  'PMS-Customer-Module', 'PMS-Expense-Category-Module', 'PMS-Expense-Module', 'PMS-Income-Category-Module',
  'PMS-Income-Module', 'PMS-Product-Module', 'PMS-Reconciliation-Module', 'PMS-Report-Module',
  'PMS-Requisition-Module', 'PMS-Sale-Module', 'PMS-Vendor-Module', 'POS-Shop-Company-Module',
  'POS-Shop-Generic-Module', 'Permission-Module', 'Pharmacy-Module', 'Role-Module',
]

const OPS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE']

export default function RoleAdd() {
  const navigate = useNavigate()
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {}
    MODULES.forEach(m => { init[m] = { VIEW: false, CREATE: false, UPDATE: false, DELETE: false } })
    return init
  })
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggle = (mod: string, op: string) => {
    setPerms(p => ({ ...p, [mod]: { ...p[mod], [op]: !p[mod][op] } }))
  }
  const toggleAll = (mod: string) => {
    const allOn = OPS.every(op => perms[mod][op])
    setPerms(p => ({ ...p, [mod]: Object.fromEntries(OPS.map(op => [op, !allOn])) }))
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add / Edit Role</h2>
      </div>
      <Card>
        <div className="mb-5">
          <FormField label="Role Alias" required>
            <Input placeholder="e.g. PMS Manager" className="max-w-sm" />
          </FormField>
        </div>

        <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">Permissions Matrix</h3>
        <div className="space-y-2">
          {MODULES.map(mod => {
            const open = openGroups[mod]
            const allOn = OPS.every(op => perms[mod][op])
            const someOn = OPS.some(op => perms[mod][op])
            return (
              <div key={mod} className="border border-slate-200 rounded-lg overflow-hidden">
                <div
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${someOn ? 'bg-teal-50' : 'bg-slate-50'} hover:bg-slate-100`}
                  onClick={() => setOpenGroups(p => ({ ...p, [mod]: !p[mod] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${allOn ? 'bg-teal-500' : someOn ? 'bg-amber-400' : 'bg-slate-300'}`} />
                    <span className="text-xs font-medium text-slate-700 font-mono">{mod}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); toggleAll(mod) }} className="text-xs text-teal-600 hover:text-teal-800">
                      {allOn ? 'None' : 'All'}
                    </button>
                    <span className="text-xs text-slate-400">{open ? '▲' : '▼'}</span>
                  </div>
                </div>
                {open && (
                  <div className="px-4 py-3 bg-white grid grid-cols-4 gap-3">
                    {OPS.map(op => (
                      <label key={op} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perms[mod][op]}
                          onChange={() => toggle(mod, op)}
                          className="accent-teal-600"
                        />
                        <span className="text-xs text-slate-700">{op}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(-1)}>Discard</Button>
          <Button onClick={() => navigate('/roles')}>Submit Role</Button>
        </div>
      </Card>
    </div>
  )
}
