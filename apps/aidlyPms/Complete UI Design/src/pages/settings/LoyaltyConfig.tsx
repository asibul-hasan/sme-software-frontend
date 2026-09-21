import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Toggle } from '../../components/ui/FormField'

export default function LoyaltyConfig() {
  const [enabled, setEnabled] = useState(true)
  return (
    <div className="max-w-lg space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Loyalty Config</h2>
      <Card>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-100">
            <div>
              <p className="text-sm font-semibold text-teal-900">Loyalty Program</p>
              <p className="text-xs text-teal-600">Enable customer reward points tracking</p>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>
          {enabled && (
            <div className="space-y-4">
              <FormField label="Earning Rule" hint="Spend amount (৳) to earn 1 point">
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="100" className="w-28" />
                  <span className="text-sm text-slate-600">৳ = 1 point</span>
                </div>
              </FormField>
              <FormField label="Redemption Rule" hint="Points equivalent to 1 Taka">
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="10" className="w-28" />
                  <span className="text-sm text-slate-600">points = ৳ 1</span>
                </div>
              </FormField>
              <FormField label="Minimum Redeem Points" hint="Minimum balance required to redeem">
                <Input type="number" defaultValue="100" className="w-28" />
              </FormField>
              <FormField label="Max Redeem per Transaction" hint="Ceiling cap on points redeemed per sale">
                <Input type="number" defaultValue="500" className="w-28" />
              </FormField>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
