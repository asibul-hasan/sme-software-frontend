import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea, Toggle } from '../../components/ui/FormField'

const CUSTOMERS = [
  { name: 'Rafiqul Islam', phone: '+880 1711-234567', type: 'Regular', address: 'Cumilla Sadar', balance: '৳ 2,400', points: 48, dueDate: '30-09-2026' },
  { name: 'Dr. Karim Ahmed', phone: '+880 1811-345678', type: 'Doctor Referral', address: 'Dhaka, Gulshan', balance: '৳ 0', points: 120, dueDate: '—' },
  { name: 'Meena Begum', phone: '+880 1611-456789', type: 'VIP', address: 'Cumilla, Muradnagar', balance: '৳ 5,800', points: 210, dueDate: '15-10-2026' },
  { name: 'Al-Amin Hossain', phone: '+880 1511-567890', type: 'Wholesale Client', address: 'Cumilla, Chandina', balance: '৳ 0', points: 0, dueDate: '—' },
  { name: 'Shapna Akter', phone: '+880 1711-678901', type: 'Regular', address: 'Cumilla Sadar', balance: '৳ 800', points: 22, dueDate: '20-09-2026' },
]

function AddCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dueEnabled, setDueEnabled] = useState(false)
  const [loyalty, setLoyalty] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Add Customer (SCR-20)" size="lg"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Customer Name" required>
          <Input placeholder="Full name" />
        </FormField>
        <FormField label="Phone Number" required>
          <div className="flex gap-1.5">
            <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
            <Input placeholder="1XXXXXXXXX" />
          </div>
        </FormField>
        <FormField label="Gender" required>
          <Select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
        </FormField>
        <FormField label="Customer Type" required>
          <Select>
            <option value="">Select type</option>
            <option>Regular</option><option>Wholesale Client</option><option>VIP</option><option>Staff</option><option>Doctor Referral</option>
          </Select>
        </FormField>
        <FormField label="Discount %" hint="Default line discount">
          <Input type="number" placeholder="0" min="0" max="100" />
        </FormField>
        <FormField label="Email">
          <Input type="email" placeholder="email@example.com" />
        </FormField>
        <div className="col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-md">
          <span className="text-sm text-slate-700">Has Opening Due Balance?</span>
          <Toggle checked={dueEnabled} onChange={setDueEnabled} />
        </div>
        {dueEnabled && <>
          <FormField label="Due Amount (৳)"><Input type="number" placeholder="0.00" /></FormField>
          <FormField label="Payment Date"><Input type="date" /></FormField>
        </>}
        <div className="col-span-2">
          <FormField label="Address"><Textarea placeholder="Street address, area, city..." rows={2} /></FormField>
        </div>
        <div className="col-span-2">
          <FormField label="Note"><Textarea placeholder="Additional notes..." rows={2} /></FormField>
        </div>
        <div className="col-span-2 flex items-center justify-between p-3 bg-teal-50 rounded-md border border-teal-100">
          <div>
            <p className="text-sm font-medium text-teal-900">Loyalty Member</p>
            <p className="text-xs text-teal-600">Enroll in the points reward program</p>
          </div>
          <Toggle checked={loyalty} onChange={setLoyalty} />
        </div>
      </div>
    </Modal>
  )
}

export default function CustomerList() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [dueOnly, setDueOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(name.toLowerCase()) &&
    c.phone.includes(phone) &&
    (!dueOnly || c.balance !== '৳ 0')
  )

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-44">
            <label className="text-xs font-medium text-slate-600 block mb-1">Customer Name</label>
            <Input placeholder="Search name..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="min-w-44">
            <label className="text-xs font-medium text-slate-600 block mb-1">Phone</label>
            <Input placeholder="+880..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-0.5">
            <input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)} className="accent-teal-600" />
            <span className="text-sm text-slate-600">With Dues (F9)</span>
          </label>
          <Button variant="secondary" size="sm" onClick={() => { setName(''); setPhone(''); setDueOnly(false) }}>Reset</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Customer (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Balance</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Points</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Due Date</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{c.phone}</span>
                    <Badge variant="muted">{c.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{c.address}</p>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`mono text-xs font-semibold ${c.balance !== '৳ 0' ? 'text-red-500' : 'text-emerald-600'}`}>{c.balance}</span>
                </td>
                <td className="px-3 py-2.5 text-right mono text-xs text-teal-700">{c.points}</td>
                <td className="px-3 py-2.5 text-center mono text-xs text-slate-600">{c.dueDate}</td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-center gap-1">
                    {c.balance !== '৳ 0' && <button className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100">💳 Collect</button>}
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">📒</button>
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
