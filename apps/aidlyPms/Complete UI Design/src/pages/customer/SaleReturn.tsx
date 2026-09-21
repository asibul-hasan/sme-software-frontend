import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Toggle } from '../../components/ui/FormField'

export default function SaleReturn() {
  const [lines, setLines] = useState<{ name: string; box: string; salePrice: string; total: string }[]>([])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-4">
        <Card>
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">Return Item Entry</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Product *</label>
              <Select><option value="">Search product to return...</option><option>Napa 500mg</option><option>Seclo 20mg</option></Select>
            </div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Box</label><Input type="number" placeholder="0" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Sale Price (৳)</label><Input type="number" placeholder="0.00" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">QTY/Box</label><Input type="number" placeholder="10" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Total QTY</label><Input type="number" placeholder="0" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Expiry Date</label><Input type="date" /></div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">MIN QTY</label><Input type="number" placeholder="0" /></div>
          </div>
          <Button size="sm" className="mt-3">+ Add (Enter)</Button>
        </Card>

        <Card padding={false}>
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Return Lines</h3>
          </div>
          <div className="px-4 py-8 text-center text-slate-400 text-sm">No return items added yet.</div>
        </Card>
      </div>

      <div>
        <Card className="sticky top-0">
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-4">Return Summary</h3>
          <div className="space-y-3">
            {[['Total Items','0'],['Total Price','৳ 0.00']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">{k}</span>
                <span className="mono font-medium">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Discount</span>
              <Toggle checked={false} onChange={() => {}} />
            </div>
            <div className="py-2 px-3 bg-slate-50 rounded-md flex justify-between">
              <span className="text-sm font-semibold">Final Price</span>
              <span className="mono font-bold text-slate-800">৳ 0.00</span>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Paid (Cash Refunded ৳)</label>
              <Input type="number" defaultValue="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Inventory Type</label>
              <Select><option>CUSTOMER RETURNED</option></Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Invoice Number *</label>
              <Input placeholder="Original invoice # e.g. INV-2026-0984" />
            </div>
            <Button className="w-full justify-center" variant="danger">↩ Process Return</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
