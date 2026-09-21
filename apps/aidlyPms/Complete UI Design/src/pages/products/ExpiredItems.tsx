import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/FormField'

const EXPIRED = [
  { name: 'Cef-3 250mg Capsule', form: 'Capsule', strength: '250mg', company: 'Renata', expiry: '30-09-2026', qty: 120, daysLeft: 14 },
  { name: 'Azimex 250mg Tablet', form: 'Tablet', strength: '250mg', company: 'Beximco', expiry: '15-10-2026', qty: 48, daysLeft: 29 },
  { name: 'Rhinocort 64mcg Inhaler', form: 'Inhaler', strength: '64mcg', company: 'ACI', expiry: '01-11-2026', qty: 6, daysLeft: 46 },
  { name: 'Amoxil 250mg Syrup', form: 'Syrup', strength: '250mg/5ml', company: 'Square', expiry: '20-11-2026', qty: 24, daysLeft: 65 },
]

export default function ExpiredItems() {
  const [days, setDays] = useState('90')

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Expiring Within (days)</label>
            <Input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-28" />
          </div>
          <div className="flex-1 min-w-44">
            <label className="text-xs font-medium text-slate-600 block mb-1">Product Name</label>
            <Select><option value="">All Products</option><option>Napa 500mg</option></Select>
          </div>
          <div className="min-w-40">
            <label className="text-xs font-medium text-slate-600 block mb-1">Company</label>
            <Select><option value="">All Companies</option><option>Beximco Pharma</option></Select>
          </div>
          <Button size="sm">🔍 Search</Button>
          <Button variant="secondary" size="sm">Reset</Button>
          <Button variant="outline" size="sm">📊 Report</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Expiry Date</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Available Qty</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {EXPIRED.map((e, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800 text-xs">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.form} · {e.strength} · {e.company}</p>
                </td>
                <td className="px-3 py-2.5 mono text-xs text-center text-slate-700">{e.expiry}</td>
                <td className="px-3 py-2.5 mono text-xs text-right font-semibold">{e.qty}</td>
                <td className="px-3 py-2.5 text-center">
                  <Badge variant={e.daysLeft <= 14 ? 'danger' : e.daysLeft <= 30 ? 'warning' : 'info'}>
                    {e.daysLeft}d
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
