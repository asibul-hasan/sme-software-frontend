import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input } from '../../components/ui/FormField'

export default function SMSConfig() {
  const [qty, setQty] = useState(1)
  const [payModal, setPayModal] = useState(false)
  const [coupon, setCoupon] = useState('')
  const total = qty * 50

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Bulk SMS Config</h2>
      <Card>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700 font-medium">Current SMS Credits</span>
            <span className="mono text-xl font-bold text-teal-700">0</span>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-800 mb-2">Buy Bulk SMS</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-lg">−</button>
              <div className="text-center">
                <p className="mono text-xl font-bold text-slate-900">{qty} × 100</p>
                <p className="text-xs text-slate-400">= {qty * 100} SMS</p>
              </div>
              <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-lg">+</button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-slate-100">
            <span className="text-sm text-slate-600">Rate</span>
            <span className="mono text-sm text-slate-700">100 SMS = ৳ 50.00</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-100 bg-teal-50 rounded-md px-3">
            <span className="text-sm font-semibold text-slate-900">Total Price</span>
            <span className="mono text-xl font-bold text-teal-700">৳ {total}.00</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setPayModal(true)}>Buy Now via bKash</Button>
          </div>
        </div>
      </Card>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="bKash Payment Gateway" size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPayModal(false)}>Close</Button>
            <Button size="sm" style={{ background: '#e2136e' }} className="hover:opacity-90">Submit via bKash</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-md p-3 flex justify-between">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="mono font-semibold">৳ {total}.00</span>
          </div>
          <details className="group">
            <summary className="text-sm text-teal-600 cursor-pointer list-none hover:text-teal-800">Have a discount code?</summary>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Enter promo code" value={coupon} onChange={e => setCoupon(e.target.value)} />
              <Button variant="outline" size="sm">Apply</Button>
            </div>
          </details>
          <div className="text-xs text-slate-400 bg-pink-50 border border-pink-100 rounded-md p-3">
            You will be redirected to bKash to complete payment. Enter your bKash number, OTP, and PIN to confirm.
          </div>
        </div>
      </Modal>
    </div>
  )
}
