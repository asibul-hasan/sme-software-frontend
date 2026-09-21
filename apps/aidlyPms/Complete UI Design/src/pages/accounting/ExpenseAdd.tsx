import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

export default function ExpenseAdd() {
  const navigate = useNavigate()
  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add Expense</h2>
      </div>
      <Card>
        <div className="space-y-4">
          <FormField label="Category" required>
            <Select><option value="">Select category</option><option>Rent</option><option>Salary</option><option>Utilities</option><option>Maintenance</option></Select>
          </FormField>
          <FormField label="Amount (৳)" required>
            <Input type="number" placeholder="0.00" />
          </FormField>
          <FormField label="Payment Type" required>
            <Select><option value="">Select account</option><option>Cash In Hand</option><option>Islami Bank</option><option>bKash Merchant</option></Select>
          </FormField>
          <FormField label="Note">
            <Textarea placeholder="Description or narration..." />
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={() => navigate('/accounting/expenses')}>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
