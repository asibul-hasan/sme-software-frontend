import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Toggle, Input } from '../../components/ui/FormField'

const TOGGLES: { label: string; desc: string; key: string; default: boolean }[] = [
  { label: 'Cash Received', desc: 'Prompt cash drawer on sale', key: 'cashReceived', default: true },
  { label: 'Out of Stock Sale', desc: 'Allow sales when inventory is negative', key: 'outOfStock', default: false },
  { label: 'Allow Loss Sale', desc: 'Permit selling below purchase cost', key: 'allowLoss', default: false },
  { label: 'Product Purchase Cost', desc: 'Show cost price to counter staff', key: 'showCost', default: false },
  { label: 'Stock QTY', desc: 'Show available stock in POS search', key: 'showStock', default: true },
  { label: 'Company Name', desc: 'Display manufacturer in POS line', key: 'showCompany', default: true },
  { label: 'Profit Margin', desc: 'Show live approximate profit in POS', key: 'showProfit', default: true },
  { label: 'Rak Number', desc: 'Display shelf/rack number in POS', key: 'showRak', default: false },
]

export default function SaleConfig() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLES.map(t => [t.key, t.default]))
  )
  const [mode, setMode] = useState<'Retail' | 'Wholesale'>('Retail')

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Sale Config</h2>
      <Card>
        <div className="space-y-4">
          {TOGGLES.map(t => (
            <div key={t.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{t.label}</p>
                <p className="text-xs text-slate-400">{t.desc}</p>
              </div>
              <Toggle checked={settings[t.key]} onChange={v => setSettings(p => ({ ...p, [t.key]: v }))} />
            </div>
          ))}

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-800">Business Type</p>
              <p className="text-xs text-slate-400">Default checkout mode</p>
            </div>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden">
              {(['Retail', 'Wholesale'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 text-xs font-medium transition-colors ${mode === m ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-800">Opening Stock Markup %</p>
              <p className="text-xs text-slate-400">Default markup on opening stock items</p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="10" className="w-20 text-center" />
              <span className="text-xs text-slate-500">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Maximum Sale Discount</p>
              <p className="text-xs text-slate-400">Cap on counter discount</p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="10" className="w-20 text-center" />
              <span className="text-xs text-slate-500">%</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button>Save</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
