import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const BRANCHES = [
  { name: 'Kazi Pharmacy', address: 'Cumilla Sadar, Chattagram, Cumilla-3500', active: true },
  { name: 'Kazi Pharmacy — Muradnagar', address: 'Muradnagar, Chattagram, Cumilla-3520', active: false },
  { name: 'Kazi Medical Hall — Chandina', address: 'Chandina, Chattagram, Cumilla-3530', active: false },
]

export default function BranchSwitcher() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-slate-900">Change Pharmacy Branch</h2>
        <Button variant="danger" size="sm">🚪 Logout</Button>
      </div>
      <div className="space-y-3">
        {BRANCHES.map((b, i) => (
          <div key={i} className={`p-4 border-2 rounded-xl flex items-center justify-between transition-all ${b.active ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${b.active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>🏪</div>
              <div>
                <p className="font-semibold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">{b.address}</p>
              </div>
            </div>
            {b.active ? (
              <span className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">✓ Active</span>
            ) : (
              <Button size="sm">Select</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
