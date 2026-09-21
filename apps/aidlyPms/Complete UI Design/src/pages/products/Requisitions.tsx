import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select, Toggle } from '../../components/ui/FormField'

const ITEMS = [
  { name: 'Napa 500mg Tablet', generic: 'Paracetamol', box: 5, minQty: 100, sale6m: 1240, qtyBox: 10, btp: '৳ 4.50', vat: '0%', btpVat: '৳ 4.50', total: '৳ 225' },
  { name: 'Seclo 20mg Capsule', generic: 'Omeprazole', box: 3, minQty: 50, sale6m: 860, qtyBox: 10, btp: '৳ 65.00', vat: '0%', btpVat: '৳ 65.00', total: '৳ 1,950' },
  { name: 'Amoxi 500mg Capsule', generic: 'Amoxicillin', box: 4, minQty: 60, sale6m: 720, qtyBox: 10, btp: '৳ 60.00', vat: '0%', btpVat: '৳ 60.00', total: '৳ 2,400' },
  { name: 'Cef-3 250mg Capsule', generic: 'Cefixime', box: 2, minQty: 30, sale6m: 520, qtyBox: 10, btp: '৳ 270.00', vat: '0%', btpVat: '৳ 270.00', total: '৳ 5,400' },
]

export default function Requisitions() {
  const [asPerSale, setAsPerSale] = useState(false)
  const [allItems, setAllItems] = useState(false)
  const [minQtyFilter, setMinQtyFilter] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="min-w-40">
            <label className="text-xs font-medium text-slate-600 block mb-1">Company</label>
            <Select><option value="">All Companies</option><option>Beximco Pharma</option></Select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs font-medium text-slate-600 block mb-1">Product Name</label>
            <Input placeholder="Search product..." />
          </div>
          <div className="min-w-36">
            <label className="text-xs font-medium text-slate-600 block mb-1">Filter</label>
            <Select><option>Fast Moving</option><option>Low Stock</option></Select>
          </div>
          <div className="flex items-center gap-3 pb-0.5">
            <Toggle checked={asPerSale} onChange={setAsPerSale} label="As Per Sale" />
            <Toggle checked={allItems} onChange={setAllItems} label="All Items" />
            <Toggle checked={minQtyFilter} onChange={setMinQtyFilter} label="MIN QTY" />
          </div>
          <Button variant="secondary" size="sm">Reset</Button>
        </div>

        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-slate-500">{ITEMS.length} items in requisition</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">+ Add Product (F2)</Button>
            <Button size="sm">🧾 Billing (F8)</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Details','Box','MIN QTY(Pcs)','Sale QTY(6Mth)','Qty/Box','BTP','VAT','BTP+VAT','Total Price','Action'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.generic}</p>
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">{r.box}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.minQty}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.sale6m}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.qtyBox}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.btp}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.vat}</td>
                  <td className="px-3 py-2.5 mono text-xs">{r.btpVat}</td>
                  <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700">{r.total}</td>
                  <td className="px-3 py-2.5">
                    <button className="px-1.5 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
