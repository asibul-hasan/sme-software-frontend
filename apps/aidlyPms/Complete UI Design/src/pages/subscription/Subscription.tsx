import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input } from '../../components/ui/FormField'

const HISTORY = [
  { product: 'PMS Pro Monthly', ref: 'bKash-TRX-9984512', date: '14-09-2026', start: '14-09-2026', end: '14-10-2026', amount: '৳ 500.00', status: 'Paid' },
  { product: 'PMS Pro Monthly', ref: 'bKash-TRX-8821345', date: '14-08-2026', start: '14-08-2026', end: '14-09-2026', amount: '৳ 500.00', status: 'Paid' },
  { product: 'PMS Pro Monthly', ref: 'bKash-TRX-7712890', date: '14-07-2026', start: '14-07-2026', end: '14-08-2026', amount: '৳ 500.00', status: 'Paid' },
]

export default function Subscription() {
  const [billing, setBilling] = useState<'Monthly' | 'Yearly'>('Monthly')
  const [payOpen, setPayOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-500">Billing Cycle</p>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden mt-2">
            {(['Monthly', 'Yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${billing === b ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{b}</button>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Next Payment</p>
          <p className="mono font-bold text-slate-900 mt-1">14 Oct 2026</p>
          <p className="text-xs text-amber-600 mt-0.5">28 days remaining</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Payable</p>
          <p className="mono font-bold text-teal-700 text-lg mt-1">৳ {billing === 'Monthly' ? '500.00' : '5,000.00'}</p>
          <p className="text-xs text-slate-400">per {billing.toLowerCase()}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Status</p>
          <div className="mt-2">
            <Badge variant="success" size="md">● Active</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">PMS Pro Plan</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-900 text-base">Billing History</h3>
          <Button size="sm" onClick={() => setPayOpen(true)}>💳 Pay Now</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Product','Reference','Date','Start Date','End Date','Amount','Status',''].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800 text-xs">{h.product}</td>
                <td className="px-3 py-2.5 mono text-xs text-slate-500">{h.ref}</td>
                <td className="px-3 py-2.5 mono text-xs">{h.date}</td>
                <td className="px-3 py-2.5 mono text-xs">{h.start}</td>
                <td className="px-3 py-2.5 mono text-xs">{h.end}</td>
                <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700">{h.amount}</td>
                <td className="px-3 py-2.5"><Badge variant="success">{h.status}</Badge></td>
                <td className="px-3 py-2.5"><button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">📄</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Subscription Payment — bKash" size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPayOpen(false)}>Close</Button>
            <Button size="sm" style={{ background: '#e2136e' }} className="hover:opacity-90">Submit via bKash</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-md p-3 flex justify-between">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="mono font-bold text-teal-700">৳ 500.00</span>
          </div>
          <details className="group">
            <summary className="text-sm text-teal-600 cursor-pointer list-none hover:text-teal-800">Have a discount code?</summary>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Promo code" />
              <Button variant="outline" size="sm">Apply</Button>
            </div>
          </details>
        </div>
      </Modal>
    </div>
  )
}
