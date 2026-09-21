import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Textarea, Toggle } from '../../components/ui/FormField'

const SUPPLIERS = [
  { name: 'Beximco Distribution Ltd.', phone: '+880 1711-234567', address: 'Dhaka, Dhaka-1000', balance: '৳ 24,500' },
  { name: 'ACI Pharma Distributors', phone: '+880 1811-345678', address: 'Cumilla, Chattagram-3500', balance: '৳ 0' },
  { name: 'Square Dist. Network', phone: '+880 1911-456789', address: 'Narayanganj, Dhaka-1400', balance: '৳ 8,200' },
  { name: 'Incepta Healthcare Dist.', phone: '+880 1611-567890', address: 'Gazipur, Dhaka-1700', balance: '৳ 0' },
  { name: 'Renata Trade Partner', phone: '+880 1711-678901', address: 'Cumilla, Chattagram-3500', balance: '৳ 14,700' },
]

function AddSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dueEnabled, setDueEnabled] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Create Supplier (SCR-12)" size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="space-y-4">
        <FormField label="Supplier Name" required>
          <Input placeholder="Enter supplier / vendor name" />
        </FormField>
        <FormField label="Phone Number" required hint="Format: +880 1XXXXXXXXX">
          <div className="flex gap-1.5">
            <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
            <Input placeholder="1XXXXXXXXX" />
          </div>
        </FormField>
        <FormField label="Note">
          <Textarea placeholder="Additional notes about this supplier..." rows={2} />
        </FormField>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
          <span className="text-sm text-slate-700">Has Opening Due Balance?</span>
          <Toggle checked={dueEnabled} onChange={setDueEnabled} />
        </div>
        {dueEnabled && (
          <FormField label="Opening Due Amount (৳)">
            <Input type="number" placeholder="0.00" />
          </FormField>
        )}
      </div>
    </Modal>
  )
}

export default function SupplierList() {
  const [search, setSearch] = useState('')
  const [phone, setPhone] = useState('')
  const [dueOnly, setDueOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = SUPPLIERS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) &&
    s.phone.includes(phone) &&
    (!dueOnly || s.balance !== '৳ 0')
  )

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-44">
            <label className="text-xs font-medium text-slate-600 block mb-1">Supplier Name</label>
            <Input placeholder="Search supplier..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="min-w-44">
            <label className="text-xs font-medium text-slate-600 block mb-1">Phone</label>
            <Input placeholder="+880..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-0.5">
            <input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)} className="accent-teal-600" />
            <span className="text-sm text-slate-600">Due Suppliers (F9)</span>
          </label>
          <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setPhone(''); setDueOnly(false) }}>Reset</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Supplier (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Balance</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.phone} · {s.address}</p>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`mono text-xs font-semibold ${s.balance !== '৳ 0' ? 'text-red-500' : 'text-emerald-600'}`}>{s.balance}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">📒 Ledger</button>
                    {s.balance !== '৳ 0' && <button className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100">💳 Pay</button>}
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddSupplierModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
