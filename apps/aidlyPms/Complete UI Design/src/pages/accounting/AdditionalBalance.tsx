import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Textarea } from '../../components/ui/FormField'

const BALANCES = [
  { ref: 'ADD-2026-004', user: 'Admin', amount: '৳ 50,000', note: 'Owner capital injection — September', date: '01-09-2026' },
  { ref: 'ADD-2026-003', user: 'Admin', amount: '৳ 1,00,000', note: 'Business expansion capital', date: '01-08-2026' },
]

export default function AdditionalBalance() {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Button size="sm" onClick={() => setOpen(true)}>+ Add Balance</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Note</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {BALANCES.map((b, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{b.ref}</p>
                  <p className="text-xs text-slate-400">{b.date} · {b.user}</p>
                </td>
                <td className="px-3 py-2.5 mono text-sm font-bold text-teal-700 text-right">{b.amount}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500 italic">{b.note}</td>
                <td className="px-3 py-2.5 text-center"><button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁 View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Additional Balance" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setOpen(false)}>Confirm</Button></>}>
        <div className="space-y-3">
          <FormField label="Date" required><Input type="date" /></FormField>
          <FormField label="Amount (৳)" required><Input type="number" placeholder="0.00" /></FormField>
          <FormField label="Note"><Textarea placeholder="Source or remarks..." rows={2} /></FormField>
        </div>
      </Modal>
    </div>
  )
}
