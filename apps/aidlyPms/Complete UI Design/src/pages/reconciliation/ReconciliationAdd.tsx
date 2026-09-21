import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

export default function ReconciliationAdd() {
  const navigate = useNavigate()
  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add Reconciliation</h2>
      </div>
      <Card>
        <div className="space-y-4">
          <FormField label="Payment From" required>
            <Select><option value="">Source account</option><option>Counter Cash (৳ 84,250)</option><option>Islami Bank (৳ 2,42,000)</option><option>bKash Merchant (৳ 6,300)</option></Select>
          </FormField>
          <FormField label="Payment To" required>
            <Select><option value="">Destination account</option><option>Counter Cash</option><option>Islami Bank</option><option>bKash Merchant</option></Select>
          </FormField>
          <FormField label="Amount (৳)" required hint="Must not exceed source balance">
            <Input type="number" placeholder="0.00" />
          </FormField>
          <FormField label="Note">
            <Textarea placeholder="Bank deposit slip number or remarks..." rows={2} />
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={() => navigate('/reconciliation')}>Submit Transfer</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
