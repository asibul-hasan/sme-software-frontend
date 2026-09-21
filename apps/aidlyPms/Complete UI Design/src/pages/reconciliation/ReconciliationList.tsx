import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

const RECORDS = [
  { voucher: 'REC-2026-012', date: '15-09-2026 10:00', by: 'Admin', from: 'Counter Cash', to: 'Islami Bank', amount: '৳ 30,000', note: 'Bank deposit' },
  { voucher: 'REC-2026-011', date: '14-09-2026 11:30', by: 'Admin', from: 'bKash Merchant', to: 'Counter Cash', amount: '৳ 5,000', note: '' },
]

function AddReconciliationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Reconciliation (SCR-35)" size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit Transfer</Button></>}>
      <div className="space-y-4">
        <FormField label="Payment From" required>
          <Select><option value="">Source account</option><option>Counter Cash (৳ 84,250)</option><option>Islami Bank (৳ 2,42,000)</option><option>bKash Merchant (৳ 6,300)</option></Select>
        </FormField>
        <FormField label="Payment To" required>
          <Select><option value="">Destination account</option><option>Counter Cash</option><option>Islami Bank</option><option>bKash Merchant</option></Select>
        </FormField>
        <FormField label="Amount (৳)" required hint="Must not exceed source balance">
          <Input type="number" placeholder="0.00" />
        </FormField>
        <FormField label="Note">
          <Textarea placeholder="Bank deposit slip number or remarks..." rows={2} />
        </FormField>
      </div>
    </Modal>
  )
}

export default function ReconciliationList() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Select className="min-w-40"><option value="">Payment From</option><option>Counter Cash</option></Select>
          <Select className="min-w-40"><option value="">Payment To</option><option>Islami Bank</option></Select>
          <Button variant="secondary" size="sm">Reset</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Reconciliation (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Transfer Info</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Note</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {RECORDS.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{r.voucher}</p>
                  <p className="text-xs text-slate-400">{r.date} · {r.by}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-xs text-slate-700">{r.from} → {r.to}</p>
                  <p className="mono text-xs font-bold text-teal-700">{r.amount}</p>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400 italic">{r.note || '—'}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🖨</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddReconciliationModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
