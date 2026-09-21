import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select } from '../../components/ui/FormField'

const REPS = [
  { name: 'Mohammad Admin', phone: '+880 1711-234567', role: 'PMS Manager', email: 'admin@kazi.pharmacy' },
  { name: 'Sumon Hossain', phone: '+880 1811-345678', role: 'PMS Salesman', email: 'sumon@kazi.pharmacy' },
  { name: 'Kohinoor Akter', phone: '+880 1611-456789', role: 'PMS Cashier', email: 'kohinoor@kazi.pharmacy' },
]

function AddRepModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Representative (SCR-37)" size="lg"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required><Input placeholder="First name" /></FormField>
        <FormField label="Last Name" required><Input placeholder="Last name" /></FormField>
        <FormField label="Phone Number" required>
          <div className="flex gap-1.5">
            <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
            <Input placeholder="1XXXXXXXXX" />
          </div>
        </FormField>
        <FormField label="Gender">
          <Select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
        </FormField>
        <FormField label="Email">
          <Input type="email" placeholder="name@pharmacy.com" />
        </FormField>
        <FormField label="Role" required>
          <Select><option value="">Select role</option><option>PMS Manager</option><option>PMS Salesman</option><option>PMS Cashier</option></Select>
        </FormField>
        <FormField label="Password" required hint="Minimum 6 characters">
          <Input type="password" placeholder="••••••" />
        </FormField>
        <FormField label="Confirm Password" required>
          <Input type="password" placeholder="••••••" />
        </FormField>
      </div>
    </Modal>
  )
}

export default function RepList() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <div className="flex gap-3 mb-4">
          <Input placeholder="Search by name..." className="flex-1" />
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Rep (F2)</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Name</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Phone</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Role</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {REPS.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{r.name[0]}</div>
                    <div>
                      <p className="font-medium text-slate-800 text-xs">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 mono text-xs text-slate-600">{r.phone}</td>
                <td className="px-3 py-2.5"><Badge variant="info">{r.role}</Badge></td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️ Edit</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🔑 Pass</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddRepModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
