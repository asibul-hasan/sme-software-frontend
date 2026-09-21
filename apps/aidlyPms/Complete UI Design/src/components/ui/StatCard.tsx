interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: string
  trend?: { value: string; up: boolean }
  accent?: string
}

export default function StatCard({ label, value, sub, icon, trend, accent = '#0d9488' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${accent}1a`, color: accent }}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend.up ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-semibold text-slate-900 mono mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
