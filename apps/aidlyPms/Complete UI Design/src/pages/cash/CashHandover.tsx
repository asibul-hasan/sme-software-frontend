import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const ITEMS = [
  { inv: 'INV-2026-1029', date: '16-09-2026 11:42', salesman: 'Admin', paid: '৳ 50.00', total: '৳ 46.00' },
  { inv: 'INV-2026-1028', date: '16-09-2026 10:15', salesman: 'Admin', paid: '৳ 115.00', total: '৳ 115.00' },
  { inv: 'INV-2026-1025', date: '15-09-2026 17:20', salesman: 'Sumon', paid: '৳ 200.00', total: '৳ 198.00' },
]

export default function CashHandover() {
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">{ITEMS.length} pending transactions</p>
          <Button size="sm" onClick={() => setConfirm(true)}>✓ Check All (F9)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Paid Amount</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Total Price</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((t, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{t.inv}</p>
                  <p className="text-xs text-slate-400">{t.date} · {t.salesman}</p>
                </td>
                <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700 text-right">{t.paid}</td>
                <td className="px-3 py-2.5 mono text-xs text-right">{t.total}</td>
                <td className="px-3 py-2.5 text-center">
                  <button className="px-2.5 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">✓ Receive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Bulk Reconcile Confirmation" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button><Button size="sm" onClick={() => setConfirm(false)}>OK — Confirm All</Button></>}>
        <p className="text-sm text-slate-700">Confirm receipt of all {ITEMS.length} pending counter cash transactions? This will deposit the total amount into the master cash account.</p>
        <div className="mt-3 bg-teal-50 rounded-md p-3 text-center">
          <p className="text-xs text-slate-500">Total Amount</p>
          <p className="mono text-lg font-bold text-teal-700">৳ 365.00</p>
        </div>
      </Modal>
    </div>
  )
}
