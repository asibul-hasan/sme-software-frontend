import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Toggle } from '../../components/ui/FormField'

interface CartItem {
  name: string; generic: string; qty: number; price: number; discount: number
}

const INIT_CART: CartItem[] = [
  { name: 'Napa 500mg Tablet', generic: 'Paracetamol', qty: 10, price: 1.00, discount: 0 },
  { name: 'Seclo 20mg Capsule', generic: 'Omeprazole', qty: 2, price: 18.00, discount: 0 },
  { name: 'Amoxi 500mg Cap', generic: 'Amoxicillin', qty: 6, price: 15.00, discount: 0 },
]

export default function RetailPOS() {
  const [mode, setMode] = useState<'Retail' | 'Wholesale'>('Retail')
  const [quickPrint, setQuickPrint] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(INIT_CART)
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountVal, setDiscountVal] = useState('0')
  const [discountPct, setDiscountPct] = useState(false)
  const [cardCommission, setCardCommission] = useState(false)
  const [tendered, setTendered] = useState(50)

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price - item.discount, 0)
  const discountAmount = discountEnabled ? (discountPct ? subtotal * parseFloat(discountVal || '0') / 100 : parseFloat(discountVal || '0')) : 0
  const cardFee = cardCommission ? subtotal * 0.015 : 0
  const final = subtotal - discountAmount + cardFee
  const change = tendered - final

  const removeItem = (i: number) => setCart(c => c.filter((_, j) => j !== i))

  const isWholesale = mode === 'Wholesale'

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Mode bar */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: isWholesale ? '#ef4444' : '#0d9488' }}>
          {(['Retail', 'Wholesale'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-5 py-1.5 text-sm font-medium transition-colors ${mode === m ? (isWholesale ? 'bg-red-500 text-white' : 'bg-teal-600 text-white') : 'text-slate-600 hover:bg-slate-50'}`}>
              {m}
            </button>
          ))}
        </div>
        <Toggle checked={quickPrint} onChange={setQuickPrint} label="Quick Print" />
        {isWholesale && <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">⚠ WHOLESALE MODE</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Left: Entry + Cart */}
        <div className="xl:col-span-2 space-y-4 overflow-y-auto">
          <Card>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="text-xs font-medium text-slate-600 block mb-1">Product / Barcode</label>
                <Select>
                  <option value="">Search product or scan barcode...</option>
                  <option>Napa 500mg Tablet</option>
                  <option>Seclo 20mg Capsule</option>
                  <option>Amoxi 500mg Capsule</option>
                </Select>
              </div>
              <div className="w-24">
                <label className="text-xs font-medium text-slate-600 block mb-1">{isWholesale ? 'Box Qty' : 'Sale QTY'}</label>
                <Input type="number" defaultValue="1" />
              </div>
              <div className="w-28">
                <label className="text-xs font-medium text-slate-600 block mb-1">Sale Price (৳)</label>
                <Input type="number" defaultValue="0.00" />
              </div>
              <div className="flex items-center gap-1.5 pb-0.5">
                <Toggle checked={false} onChange={() => {}} label="Discount" />
              </div>
              <Button size="sm">Add (Enter)</Button>
              <Button variant="outline" size="sm">+ Product (F2)</Button>
            </div>
          </Card>

          <Card padding={false}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Cart — {cart.length} items</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">↩ Return</Button>
                <Button variant="ghost" size="sm">🖨 Print</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Details</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">{isWholesale ? 'Box Qty' : 'Sale QTY'}</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Pcs/Box</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">{isWholesale ? 'Price/Box' : 'Price/Piece'} (৳)</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Discount</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Price (৳)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800 text-xs">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.generic}</p>
                      </td>
                      <td className="px-3 py-2.5 mono text-xs text-center">{item.qty}</td>
                      <td className="px-3 py-2.5 mono text-xs text-center">10</td>
                      <td className="px-3 py-2.5 mono text-xs text-right">৳ {item.price.toFixed(2)}</td>
                      <td className="px-3 py-2.5 mono text-xs text-right text-slate-400">—</td>
                      <td className="px-3 py-2.5 mono text-xs text-right font-semibold text-slate-800">৳ {(item.qty * item.price).toFixed(2)}</td>
                      <td className="px-3 py-2.5"><button onClick={() => removeItem(i)} className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors text-xs">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Checkout */}
        <div>
          <Card className="sticky top-0">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-4">Checkout</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Items</span>
                <span className="mono font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-600">Total Price</span>
                <span className="mono font-semibold">৳ {subtotal.toFixed(2)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600">Discount</span>
                  <Toggle checked={discountEnabled} onChange={setDiscountEnabled} />
                </div>
                {discountEnabled && (
                  <div className="flex gap-1.5">
                    <button onClick={() => setDiscountPct(false)} className={`px-2 py-1 text-xs rounded transition-colors ${!discountPct ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>৳ Flat</button>
                    <button onClick={() => setDiscountPct(true)} className={`px-2 py-1 text-xs rounded transition-colors ${discountPct ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>% Pct</button>
                    <Input type="number" value={discountVal} onChange={e => setDiscountVal(e.target.value)} className="flex-1" placeholder="0" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Card Commission (1.5%)</span>
                <input type="checkbox" checked={cardCommission} onChange={e => setCardCommission(e.target.checked)} className="accent-teal-600" />
              </div>

              <div className="py-3 px-3 rounded-lg text-center" style={{ background: isWholesale ? '#fef2f2' : '#f0fdfa' }}>
                <p className="text-xs text-slate-500">Final Price</p>
                <p className="text-2xl font-bold mono mt-0.5" style={{ color: isWholesale ? '#dc2626' : '#0d9488' }}>৳ {final.toFixed(2)}</p>
                {discountAmount > 0 && <p className="text-xs text-slate-400">You save ৳ {discountAmount.toFixed(2)}</p>}
              </div>

              <div className="bg-teal-50 rounded-md px-3 py-2 flex justify-between">
                <span className="text-xs text-slate-600">Approx. Profit</span>
                <span className="mono text-xs font-semibold text-teal-700">৳ {(final * 0.22).toFixed(2)}</span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Customer Will Pay (৳)</label>
                <div className="flex gap-1.5">
                  <button onClick={() => setTendered(t => Math.max(0, t - 10))} className="w-9 h-9 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-sm">−</button>
                  <Input type="number" value={tendered} onChange={e => setTendered(parseFloat(e.target.value) || 0)} className="flex-1 text-center font-semibold" />
                  <button onClick={() => setTendered(t => t + 10)} className="w-9 h-9 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-sm">+</button>
                </div>
              </div>

              <div className={`flex justify-between py-2 px-3 rounded-md ${change >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <span className="text-sm font-semibold">{change >= 0 ? 'Change' : 'Due'}</span>
                <span className={`mono font-bold ${change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>৳ {Math.abs(change).toFixed(2)}</span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Customer</label>
                <Select>
                  <option value="">Walk-in / Cash Customer</option>
                  <option>Rafiqul Islam (+880 1711-234)</option>
                  <option>Karim Ahmed (+880 1811-456)</option>
                </Select>
              </div>

              <Button className="w-full justify-center" size="lg">✓ Create Sale</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
