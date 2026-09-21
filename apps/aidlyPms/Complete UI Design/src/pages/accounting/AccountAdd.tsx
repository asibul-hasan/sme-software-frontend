import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select } from '../../components/ui/FormField'

export default function AccountAdd() {
  const navigate = useNavigate()
  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Create Account</h2>
      </div>
      <Card>
        <div className="space-y-4">
          <FormField label="Account Name / Holder" required>
            <Input placeholder="e.g. Counter Cash, Islami Bank Main" />
          </FormField>
          <FormField label="Phone Number" required>
            <div className="flex gap-1.5">
              <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
              <Input placeholder="1XXXXXXXXX" />
            </div>
          </FormField>
          <FormField label="Account Type" required>
            <Select>
              <option value="">Select type</option>
              <option>Cash In Hand</option><option>Bank Account</option><option>bKash Personal</option>
              <option>bKash Merchant</option><option>Nagad</option><option>Rocket</option><option>Card POS Machine</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={() => navigate('/accounting/accounts')}>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
