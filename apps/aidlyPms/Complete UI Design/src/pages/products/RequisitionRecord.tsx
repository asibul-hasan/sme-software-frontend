import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/FormField'

const RECORDS = [
  { date: '15-09-2026 14:32', total: '৳ 48,200', req: 'REQ-2026-042', supplier: 'Beximco Dist.', items: 12 },
  { date: '13-09-2026 10:15', total: '৳ 31,750', req: 'REQ-2026-041', supplier: 'ACI Dist.', items: 8 },
  { date: '10-09-2026 09:00', total: '৳ 62,400', req: 'REQ-2026-040', supplier: 'Square Dist.', items: 18 },
]

export default function RequisitionRecord() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="From: DD-MM-YYYY HH:mm" className="min-w-44" />
          <Input placeholder="To: DD-MM-YYYY HH:mm" className="min-w-44" />
          <Select className="min-w-40"><option value="">All Suppliers</option><option>Beximco Dist.</option></Select>
          <Input placeholder="REQ-2026-..." className="min-w-36" />
          <Input placeholder="Created by..." className="min-w-36" />
          <Button variant="secondary" size="sm">Reset</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Date</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Total Bill</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Requisition Info</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {RECORDS.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 mono text-xs text-slate-600">{r.date}</td>
                <td className="px-3 py-2.5 mono text-xs font-semibold text-teal-700 text-right">{r.total}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{r.req}</p>
                  <p className="text-xs text-slate-400">{r.supplier} · {r.items} items</p>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">👁 View</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">🖨 Print</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">✕ Cancel</button>
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
