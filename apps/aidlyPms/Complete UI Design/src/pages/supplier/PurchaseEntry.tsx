import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Toggle } from '../../components/ui/FormField'

const INIT_LINE = { product: '', box: '', btpVat: '', salePrice: '', qtyBox: '', free: '', minQty: '', expiry: '', barcode: '' }

interface Line { product: string; box: string; btpVat: string; salePrice: string; qtyBox: string; total: string }

const MOCK_LINES: Line[] = [
  { product: 'Napa 500mg Tablet', box: '10', btpVat: '৳ 4.50', salePrice: '৳ 10.00', qtyBox: '10', total: '৳ 450' },
  { product: 'Seclo 20mg Capsule', box: '5', btpVat: '৳ 65.00', salePrice: '৳ 180.00', qtyBox: '10', total: '৳ 3,250' },
]

export default function PurchaseEntry() {
  const [lines, setLines] = useState<Line[]>(MOCK_LINES)
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [paid, setPaid] = useState('4000')
  const total = 3700
  const final = discountEnabled ? total - 200 : total
  const balance = final - parseInt(paid || '0')

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap mb-2">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Calculation Mode</label>
          <Select className="w-40"><option>Default</option><option>Unit TP/VAT</option><option>Net Value</option><option>Opening Stock</option></Select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Line entry + cart */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">Add Product Line</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">Product *</label>
                <Select><option value="">Search product...</option><option>Napa 500mg Tablet</option><option>Seclo 20mg Capsule</option></Select>
              </div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Box</label><Input type="number" placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">BTP + VAT (৳)</label><Input type="number" placeholder="0.00" /></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Sale Price (৳)</label><Input type="number" placeholder="0.00" /></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">QTY/Box</label><Input type="number" placeholder="10" /></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Free Units</label><Input type="number" placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Expiry Date</label><Input type="date" /></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm">+ Add (Enter)</Button>
              <Button variant="outline" size="sm">+ New Product (F2)</Button>
            </div>
          </Card>

          <Card padding={false}>
            <div className="px-4 pt-4 pb-3 border-b border-slate-100">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Purchase Lines</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Details','Box','QTY/Box','BTP+VAT','Sale Price','Total','Action'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-800 text-xs">{l.product}</td>
                      <td className="px-3 py-2.5 mono text-xs">{l.box}</td>
                      <td className="px-3 py-2.5 mono text-xs">{l.qtyBox}</td>
                      <td className="px-3 py-2.5 mono text-xs">{l.btpVat}</td>
                      <td className="px-3 py-2.5 mono text-xs">{l.salePrice}</td>
                      <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700">{l.total}</td>
                      <td className="px-3 py-2.5"><button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="px-1.5 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Checkout drawer */}
        <div>
          <Card className="sticky top-0">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-4">Purchase Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Items</span>
                <span className="mono font-medium">{lines.length}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-600">Total Price</span>
                <span className="mono font-semibold text-slate-900">৳ {total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Discount</span>
                <Toggle checked={discountEnabled} onChange={setDiscountEnabled} />
              </div>
              {discountEnabled && <Input type="number" placeholder="Discount amount" defaultValue="200" />}
              <div className="flex justify-between py-2 bg-teal-50 rounded-md px-3">
                <span className="text-sm font-semibold text-slate-900">Final Price</span>
                <span className="mono font-bold text-teal-700">৳ {final.toLocaleString()}</span>
              </div>
              <FormField label="Paid (৳)">
                <Input type="number" value={paid} onChange={e => setPaid(e.target.value)} />
              </FormField>
              <div className={`flex justify-between py-2 rounded-md px-3 ${balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <span className="text-sm font-semibold text-slate-800">{balance > 0 ? 'Balance Due' : 'Change'}</span>
                <span className={`mono font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>৳ {Math.abs(balance).toLocaleString()}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Supplier *</label>
                <Select><option value="">Select supplier</option><option>Beximco Distribution</option></Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Inventory Type</label>
                <Select><option>INVENTORY PURCHASED</option><option>OPENING STOCK</option><option>TRANSFER IN</option></Select>
              </div>
              <FormField label="Invoice Number">
                <Input placeholder="Vendor invoice / challan #" />
              </FormField>
              <Button className="w-full justify-center">Purchase</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
