import { useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/FormField'

const TABS = ["Today's Due", "Upcoming Due", "Pending Due", "Paid List"]

const DUE_DATA = [
  { customer: 'Rafiqul Islam', phone: '+880 1711-234', inv: 'INV-2026-1010', saleDate: '10-09-2026', dueDate: '16-09-2026', amount: '৳ 2,400' },
  { customer: 'Shapna Akter', phone: '+880 1711-678', inv: 'INV-2026-1012', saleDate: '12-09-2026', dueDate: '16-09-2026', amount: '৳ 800' },
]

const PAID_DATA = [
  { customer: 'Karim Ahmed', phone: '+880 1811-345', receipt: 'PAY-2026-084', method: 'bKash', amount: '৳ 3,200', note: 'bKash ref: TRX98765' },
  { customer: 'Meena Begum', phone: '+880 1611-456', receipt: 'PAY-2026-083', method: 'Cash', amount: '৳ 1,500', note: '' },
]

export default function DueCollect() {
  const [tab, setTab] = useState(0)
  const [collectOpen, setCollectOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === i ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Input placeholder="Search customer, invoice..." className="flex-1 min-w-44" />
          <Button variant="secondary" size="sm">Reset</Button>
        </div>

        {tab < 3 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Due Date</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUE_DATA.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800">{d.customer}</p>
                    <p className="text-xs text-slate-400">{d.phone} · {d.inv} · Sale: {d.saleDate}</p>
                  </td>
                  <td className="px-3 py-2.5 mono text-xs text-center text-amber-600 font-medium">{d.dueDate}</td>
                  <td className="px-3 py-2.5 mono text-xs font-bold text-red-500 text-right">{d.amount}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setCollectOpen(true)} className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">💳 Receive</button>
                      <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">📱 SMS</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Customer</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Receipt #</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Method</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Note</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {PAID_DATA.map((p, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{p.customer}</p>
                    <p className="text-xs text-slate-400">{p.phone}</p>
                  </td>
                  <td className="px-3 py-2.5 mono text-xs text-slate-700">{p.receipt}</td>
                  <td className="px-3 py-2.5 text-center"><Badge variant={p.method === 'bKash' ? 'info' : 'success'}>{p.method}</Badge></td>
                  <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700 text-right">{p.amount}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{p.note || '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🖨 Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={collectOpen} onClose={() => setCollectOpen(false)} title="Receive Payment" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setCollectOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setCollectOpen(false)}>Confirm Payment</Button></>}>
        <div className="space-y-3">
          <div className="bg-red-50 rounded-md p-3 text-center">
            <p className="text-xs text-slate-500">Outstanding Due</p>
            <p className="mono text-xl font-bold text-red-600">৳ 2,400.00</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Amount Received (৳)</label>
            <Input type="number" defaultValue="2400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Payment Method</label>
            <select className="w-full h-9 px-3 text-sm border border-slate-300 rounded-md">
              <option>Cash</option><option>Bank</option><option>bKash</option><option>Nagad</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Note</label>
            <Input placeholder="Reference or note..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
