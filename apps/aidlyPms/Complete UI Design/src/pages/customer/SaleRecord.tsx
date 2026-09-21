import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/FormField'

const SALES = [
  { inv: 'INV-2026-1029', date: '16-09-2026 11:42', customer: 'Rafiqul Islam', salesman: 'Admin', subtotal: '৳ 46.00', disc: '৳ 0', total: '৳ 46.00', items: 3, payment: 'Cash', paid: '৳ 50.00', due: '৳ 0' },
  { inv: 'INV-2026-1028', date: '16-09-2026 10:15', customer: 'Walk-in', salesman: 'Admin', subtotal: '৳ 120.00', disc: '৳ 5', total: '৳ 115.00', items: 5, payment: 'bKash', paid: '৳ 115.00', due: '৳ 0' },
  { inv: 'INV-2026-1027', date: '15-09-2026 18:30', customer: 'Meena Begum', salesman: 'Sumon', subtotal: '৳ 840.00', disc: '৳ 40', total: '৳ 800.00', items: 8, payment: 'Due', paid: '৳ 0', due: '৳ 800.00' },
  { inv: 'INV-2026-1026', date: '15-09-2026 16:05', customer: 'Al-Amin Hossain', salesman: 'Admin', subtotal: '৳ 2,400', disc: '৳ 100', total: '৳ 2,300', items: 12, payment: 'Cash', paid: '৳ 2,300', due: '৳ 0' },
]

export default function SaleRecord() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From date..." className="min-w-44" />
          <Input placeholder="To date..." className="min-w-44" />
          <Input placeholder="INV-2026-..." className="min-w-36" />
          <Select className="min-w-44"><option value="">All Customers</option><option>Rafiqul Islam</option></Select>
          <Input placeholder="Salesman..." className="min-w-36" />
          <Button variant="secondary" size="sm">Reset</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Details','Bill Info','Sale Info','Payment','Action'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SALES.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{s.inv}</p>
                  <p className="text-xs text-slate-400">{s.date}</p>
                  <p className="text-xs text-slate-600">{s.customer} · {s.salesman}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="mono text-xs text-slate-500">Sub: {s.subtotal}</p>
                  <p className="mono text-xs text-slate-400">Disc: {s.disc}</p>
                  <p className="mono text-xs font-semibold text-slate-800">{s.total}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-xs text-slate-600">{s.items} items</p>
                  <Badge variant={s.payment === 'Due' ? 'warning' : s.payment === 'bKash' ? 'info' : 'success'}>{s.payment}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <p className="mono text-xs text-teal-700">Paid: {s.paid}</p>
                  {s.due !== '৳ 0' && <p className="mono text-xs text-red-500">Due: {s.due}</p>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🖨</button>
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">↩</button>
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
