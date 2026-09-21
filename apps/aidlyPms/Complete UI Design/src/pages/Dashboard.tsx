import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const chartData = [
  { date: 'Sep 10', buyPrice: 18200, grossProfit: 6400 },
  { date: 'Sep 11', buyPrice: 21500, grossProfit: 7100 },
  { date: 'Sep 12', buyPrice: 16800, grossProfit: 5900 },
  { date: 'Sep 13', buyPrice: 24300, grossProfit: 8200 },
  { date: 'Sep 14', buyPrice: 19700, grossProfit: 7600 },
  { date: 'Sep 15', buyPrice: 22100, grossProfit: 8800 },
  { date: 'Sep 16', buyPrice: 17900, grossProfit: 6700 },
]

const profitData = [
  { date: 'Sep 10', netProfit: 4200, opCost: 2200 },
  { date: 'Sep 11', netProfit: 5100, opCost: 2000 },
  { date: 'Sep 12', netProfit: 3900, opCost: 2000 },
  { date: 'Sep 13', netProfit: 6200, opCost: 2000 },
  { date: 'Sep 14', netProfit: 5600, opCost: 2000 },
  { date: 'Sep 15', netProfit: 6800, opCost: 2000 },
  { date: 'Sep 16', netProfit: 4700, opCost: 2000 },
]

const topSelling = [
  { name: 'Napa 500mg Tablet', generic: 'Paracetamol', qty: 1240, total: '৳ 12,400' },
  { name: 'Seclo 20mg Capsule', generic: 'Omeprazole', qty: 860, total: '৳ 15,480' },
  { name: 'Amoxi 500mg Capsule', generic: 'Amoxicillin', qty: 720, total: '৳ 10,800' },
  { name: 'Metformin 500mg Tab', generic: 'Metformin HCl', qty: 640, total: '৳ 6,400' },
  { name: 'Cef-3 250mg Capsule', generic: 'Cefixime', qty: 520, total: '৳ 14,040' },
]

const lowSelling = [
  { name: 'Rhinocort 64mcg Inhaler', generic: 'Budesonide', qty: 12, total: '৳ 3,600' },
  { name: 'Sandimmun 25mg Cap', generic: 'Cyclosporine', qty: 8, total: '৳ 2,400' },
  { name: 'Gleevec 100mg Tab', generic: 'Imatinib', qty: 6, total: '৳ 4,200' },
  { name: 'Enbrel 25mg Injection', generic: 'Etanercept', qty: 3, total: '৳ 8,100' },
]

export default function Dashboard() {
  const [mode, setMode] = useState<'Retail' | 'Wholesale'>('Retail')

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Wednesday, 16 September 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            {(['Retail', 'Wholesale'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <select className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500">
            <option>All Branches</option>
            <option>Kazi — Cumilla</option>
            <option>Dhaka Branch</option>
          </select>
          <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 cursor-pointer hover:bg-slate-50">
            📅 10-09-2026 ~ 16-09-2026
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Cash Balance" value="৳ 84,250" icon="💵" trend={{ value: '12.4%', up: true }} />
        <StatCard label="Bank Balance" value="৳ 3,42,000" icon="🏦" accent="#3b82f6" />
        <StatCard label="MFS Balance" value="৳ 18,750" icon="📱" accent="#8b5cf6" />
        <StatCard label="Today's Sale" value="৳ 24,380" icon="📈" trend={{ value: '8.2%', up: true }} />
        <StatCard label="Today's Purchase" value="৳ 17,900" icon="🛒" accent="#f59e0b" />
        <StatCard label="Full Inventory Cost" value="৳ 12,84,600" icon="🏪" accent="#6366f1" />
        <StatCard label="Total Items (SKU)" value="1,248" icon="💊" sub="Distinct products" accent="#ec4899" />
        <StatCard label="Total Product Count" value="48,320" icon="📦" sub="Physical units" accent="#14b8a6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Buy Price vs Gross Profit</CardTitle>
            <Badge variant="muted">Last 7 days</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="buyPrice" name="Buy Price" stroke="#3b82f6" fill="url(#colorBuy)" strokeWidth={2} />
              <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#0d9488" fill="url(#colorProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gross Profit Breakdown</CardTitle>
            <Badge variant="muted">Last 7 days</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={profitData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#0d9488" radius={[3, 3, 0, 0]} />
              <Bar dataKey="opCost" name="Op Cost" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Product tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding={false}>
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <CardTitle>🔥 Top Selling Products</CardTitle>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Product</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Qty</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.map((p, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-teal-50/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.generic}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right mono text-xs text-slate-700">{p.qty}</td>
                  <td className="px-4 py-2.5 text-right mono text-xs font-medium text-teal-700">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card padding={false}>
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <CardTitle>📉 Lowest Selling Products</CardTitle>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Product</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Qty</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {lowSelling.map((p, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.generic}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right mono text-xs text-amber-600 font-medium">{p.qty}</td>
                  <td className="px-4 py-2.5 text-right mono text-xs text-slate-700">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Cashbook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Cashbook Summary</CardTitle>
            <span className="text-xs text-slate-400">10 Sep – 16 Sep</span>
          </CardHeader>
          <div className="space-y-2 text-sm">
            {[
              ['Gross Profit', '৳ 46,700', 'text-teal-700'],
              ['+ Income', '৳ 3,200', 'text-teal-700'],
              ['− Operational Cost', '৳ 14,000', 'text-red-500'],
              ['− Demurrage', '৳ 1,500', 'text-red-500'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">{k}</span>
                <span className={`mono font-medium ${c}`}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 bg-teal-50 rounded-md px-2 mt-2">
              <span className="font-semibold text-slate-900">= Net Profit</span>
              <span className="mono font-bold text-teal-700">৳ 34,400</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
              {[
                ['Cash Balance', '৳ 84,250'],
                ['Bank Balance', '৳ 3,42,000'],
                ['MFS Balance', '৳ 18,750'],
                ['Closing Balance', '৳ 4,45,000'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-md p-2">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="mono text-sm font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buy & Sale Summary</CardTitle>
            <span className="text-xs text-slate-400">10 Sep – 16 Sep</span>
          </CardHeader>
          <div className="space-y-1.5 text-sm">
            {[
              ['Total Sale', '৳ 1,24,380', 'text-teal-700 font-semibold'],
              ['Due Sales', '৳ 18,200', 'text-amber-600'],
              ['Sale Return', '৳ 3,400', 'text-red-500'],
              ['Due Payment Received', '৳ 12,600', 'text-teal-600'],
              ['Inventory Purchase', '৳ 82,700', 'text-slate-700'],
              ['Due Purchase', '৳ 14,500', 'text-amber-600'],
              ['Purchase Return', '৳ 2,100', 'text-red-500'],
              ['Due Purchase Paid', '৳ 9,800', 'text-slate-600'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600 text-xs">{k}</span>
                <span className={`mono text-xs ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
