import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

const EXPENSES = [
  { voucher: 'EXP-2026-042', date: '16-09-2026 09:00', creator: 'Admin', note: 'Monthly rent', category: 'Rent', account: 'Counter Cash', amount: '৳ 8,000', payment: 'Cash' },
  { voucher: 'EXP-2026-041', date: '15-09-2026 11:30', creator: 'Admin', note: 'Electricity bill', category: 'Utilities', account: 'Islami Bank', amount: '৳ 1,200', payment: 'Bank' },
  { voucher: 'EXP-2026-040', date: '14-09-2026 14:00', creator: 'Sumon', note: 'Staff salary — Sep', category: 'Salary', account: 'bKash Merchant', amount: '৳ 22,000', payment: 'MFS' },
]

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Expense (SCR-29)" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="space-y-4">
        <FormField label="Category" required>
          <Select><option value="">Select category</option><option>Rent</option><option>Salary</option><option>Utilities</option><option>Maintenance</option></Select>
        </FormField>
        <FormField label="Amount (৳)" required>
          <Input type="number" placeholder="0.00" />
        </FormField>
        <FormField label="Payment Type" required>
          <Select><option value="">Select account</option><option>Cash In Hand</option><option>Islami Bank</option><option>bKash Merchant</option></Select>
        </FormField>
        <FormField label="Note">
          <Textarea placeholder="Description or narration..." rows={2} />
        </FormField>
      </div>
    </Modal>
  )
}

function AddCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Expense Category (SCR-30)" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <FormField label="Category Name" required>
        <Input placeholder="e.g. Office Supplies, Maintenance" />
      </FormField>
    </Modal>
  )
}

export default function Expenses() {
  const [addOpen, setAddOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Select className="min-w-40"><option value="">All Categories</option><option>Rent</option><option>Salary</option><option>Utilities</option></Select>
          <Select className="min-w-40"><option value="">All Payment Types</option><option>Cash</option><option>Bank Transfer</option><option>MFS</option></Select>
          <Button variant="secondary" size="sm">Reset</Button>
          <Button variant="outline" size="sm">📊 Report</Button>
          <Button variant="outline" size="sm" onClick={() => setCatOpen(true)}>+ Category</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Expense (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Expense Info</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSES.map((e, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{e.voucher}</p>
                  <p className="text-xs text-slate-400">{e.date} · {e.creator}</p>
                  <p className="text-xs text-slate-500 italic">{e.note}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-800">{e.category}</p>
                  <p className="text-xs text-slate-400">{e.account}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="mono text-xs font-bold text-red-600">{e.amount}</span>
                    <Badge variant={e.payment === 'MFS' ? 'warning' : e.payment === 'Bank' ? 'info' : 'muted'}>{e.payment}</Badge>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁 View</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddCategoryModal open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  )
}
