import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

const INCOMES = [
  { receipt: 'INC-2026-018', date: '16-09-2026 10:00', from: 'Investment return', category: 'Capital', account: 'Islami Bank', amount: '৳ 5,000', payment: 'Bank' },
  { receipt: 'INC-2026-017', date: '14-09-2026 16:00', from: 'Equipment rent revenue', category: 'Rent Income', account: 'Counter Cash', amount: '৳ 2,000', payment: 'Cash' },
]

function AddIncomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Income" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="space-y-4">
        <FormField label="Category" required>
          <Select><option value="">Select category</option><option>Capital</option><option>Rent Income</option><option>Other</option></Select>
        </FormField>
        <FormField label="Amount (৳)" required><Input type="number" placeholder="0.00" /></FormField>
        <FormField label="Payment Account" required>
          <Select><option value="">Select account</option><option>Counter Cash</option><option>Islami Bank</option><option>bKash Merchant</option></Select>
        </FormField>
        <FormField label="Received From"><Input placeholder="Source of income" /></FormField>
        <FormField label="Note"><Textarea placeholder="Remarks..." rows={2} /></FormField>
      </div>
    </Modal>
  )
}

function AddIncomeCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Income Category" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <FormField label="Category Name" required><Input placeholder="e.g. Rental Income, Consulting" /></FormField>
    </Modal>
  )
}

export default function Income() {
  const [addOpen, setAddOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Select className="min-w-40"><option value="">All Categories</option></Select>
          <Select className="min-w-40"><option value="">All Payment Types</option></Select>
          <Button variant="secondary" size="sm">Reset</Button>
          <Button variant="outline" size="sm">📊 Report</Button>
          <Button variant="outline" size="sm" onClick={() => setCatOpen(true)}>+ Category</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Income (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Income Info</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {INCOMES.map((inc, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{inc.receipt}</p>
                  <p className="text-xs text-slate-400">{inc.date} · {inc.from}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-800">{inc.category} · {inc.account}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="mono text-xs font-bold text-teal-700">{inc.amount}</span>
                    <Badge variant={inc.payment === 'Bank' ? 'info' : 'success'}>{inc.payment}</Badge>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁 View</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">Void</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddIncomeModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddIncomeCategoryModal open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  )
}
