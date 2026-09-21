import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/FormField'

const RECORDS = [
  { ref: 'INV-2026-0842', date: '15-09-2026 14:32', supplier: 'Beximco Dist.', gross: '৳ 48,200', disc: '৳ 0', net: '৳ 48,200', items: 12, type: 'INVENTORY PURCHASED' },
  { ref: 'INV-2026-0841', date: '13-09-2026 10:15', supplier: 'ACI Dist.', gross: '৳ 31,750', disc: '৳ 500', net: '৳ 31,250', items: 8, type: 'INVENTORY PURCHASED' },
  { ref: 'OPG-2026-0010', date: '01-09-2026 09:00', supplier: 'Opening Stock', gross: '৳ 2,84,000', disc: '৳ 0', net: '৳ 2,84,000', items: 64, type: 'OPENING STOCK' },
]

export default function PurchaseRecord() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Input placeholder="Invoice number..." className="min-w-36" />
          <Select className="min-w-44"><option value="">All Suppliers</option><option>Beximco Dist.</option></Select>
          <Select className="min-w-44"><option value="">All Types</option><option>INVENTORY PURCHASED</option><option>OPENING STOCK</option></Select>
          <Button variant="secondary" size="sm">Reset</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Details','Bill Info','Inventory Info','Action'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECORDS.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{r.ref}</p>
                  <p className="text-xs text-slate-400">{r.date} · {r.supplier}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="mono text-xs text-slate-700">Gross: {r.gross}</p>
                  <p className="mono text-xs text-slate-400">Disc: {r.disc}</p>
                  <p className="mono text-xs font-semibold text-teal-700">Net: {r.net}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-xs text-slate-700">{r.items} items</p>
                  <Badge variant={r.type === 'OPENING STOCK' ? 'info' : 'success'} size="sm">{r.type}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁 View</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🖨</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">↩ Return</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
