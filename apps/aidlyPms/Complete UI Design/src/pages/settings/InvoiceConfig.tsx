import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Toggle, Textarea, Select } from '../../components/ui/FormField'

const TOGGLES = [
  { label: 'Served By Row', key: 'servedBy' },
  { label: 'Discount / Less Row', key: 'discountRow' },
  { label: 'Card Fee Row', key: 'cardFee' },
  { label: 'Customer Name', key: 'custName' },
  { label: 'Customer Phone', key: 'custPhone' },
  { label: 'Simple Print (compact)', key: 'simplePrint' },
  { label: 'Customer | Vendor Balance', key: 'balance' },
  { label: 'Shop Logo', key: 'shopLogo' },
]

export default function InvoiceConfig() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLES.map(t => [t.key, true]))
  )

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Invoice Config (80mm Thermal)</h2>
      <Card>
        <div className="space-y-4">
          <FormField label="Paper Type">
            <Select className="w-40"><option>80mm Thermal Roll</option><option>57mm Thermal Roll</option></Select>
          </FormField>
          <FormField label="Top Row Text" required>
            <Textarea rows={4} defaultValue="Kazi Pharmacy&#10;Cumilla Sadar, Cumilla-3500&#10;Drug License: DL-01-0012345&#10;Hotline: +880 1711-234567" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            {TOGGLES.map(t => (
              <div key={t.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-700">{t.label}</span>
                <Toggle checked={settings[t.key]} onChange={v => setSettings(p => ({ ...p, [t.key]: v }))} />
              </div>
            ))}
          </div>

          {settings.shopLogo && (
            <FormField label="Upload Shop Logo" hint="Monochrome, PNG or JPG">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-teal-400">
                <p className="text-sm text-slate-500">🖼 Click to upload logo</p>
              </div>
            </FormField>
          )}

          <FormField label="Bottom Row Text">
            <Textarea rows={3} defaultValue="Item purchased can be exchanged within 7 days with receipt.&#10;Item purchased cannot be refunded for cash." />
          </FormField>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
