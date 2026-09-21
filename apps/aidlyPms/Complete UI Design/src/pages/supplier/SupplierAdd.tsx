import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Textarea, Toggle } from '../../components/ui/FormField'

export default function SupplierAdd() {
  const navigate = useNavigate()
  const [dueEnabled, setDueEnabled] = useState(false)

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Create Supplier</h2>
      </div>
      <Card>
        <div className="space-y-4">
          <FormField label="Supplier Name" required>
            <Input placeholder="Enter supplier/vendor name" />
          </FormField>
          <FormField label="Phone Number" required hint="Format: +880 1XXXXXXXXX">
            <div className="flex gap-1.5">
              <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
              <Input placeholder="1XXXXXXXXX" />
            </div>
          </FormField>
          <FormField label="Note">
            <Textarea placeholder="Additional notes about this supplier..." />
          </FormField>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
            <span className="text-sm text-slate-700">Has Opening Due Balance?</span>
            <Toggle checked={dueEnabled} onChange={setDueEnabled} />
          </div>
          {dueEnabled && (
            <FormField label="Opening Due Amount (৳)">
              <Input type="number" placeholder="0.00" />
            </FormField>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={() => navigate('/supplier')}>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
