import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Textarea, Toggle } from '../../components/ui/FormField'

export default function CustomerAdd() {
  const navigate = useNavigate()
  const [dueEnabled, setDueEnabled] = useState(false)
  const [loyalty, setLoyalty] = useState(false)

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add Customer</h2>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer Name" required>
            <Input placeholder="Full name" />
          </FormField>
          <FormField label="Phone Number" required>
            <div className="flex gap-1.5">
              <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
              <Input placeholder="1XXXXXXXXX" />
            </div>
          </FormField>
          <FormField label="Gender" required>
            <Select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
          </FormField>
          <FormField label="Customer Type" required>
            <Select>
              <option value="">Select type</option>
              <option>Regular</option><option>Wholesale Client</option><option>VIP</option><option>Staff</option><option>Doctor Referral</option>
            </Select>
          </FormField>
          <FormField label="Discount %" hint="Default line discount percentage">
            <Input type="number" placeholder="0" min="0" max="100" />
          </FormField>
          <FormField label="Email">
            <Input type="email" placeholder="email@example.com" />
          </FormField>
          <div className="col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-md">
            <span className="text-sm text-slate-700">Has Opening Due Balance?</span>
            <Toggle checked={dueEnabled} onChange={setDueEnabled} />
          </div>
          {dueEnabled && <>
            <FormField label="Due Amount (৳)"><Input type="number" placeholder="0.00" /></FormField>
            <FormField label="Payment Date"><Input type="date" /></FormField>
          </>}
          <div className="col-span-2">
            <FormField label="Address">
              <Textarea placeholder="Street address, area, city..." rows={2} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Note">
              <Textarea placeholder="Additional notes..." rows={2} />
            </FormField>
          </div>
          <div className="col-span-2 flex items-center justify-between p-3 bg-teal-50 rounded-md border border-teal-100">
            <div>
              <p className="text-sm font-medium text-teal-900">Loyalty Member</p>
              <p className="text-xs text-teal-600">Enroll in the points reward program</p>
            </div>
            <Toggle checked={loyalty} onChange={setLoyalty} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={() => navigate('/customer')}>Submit</Button>
        </div>
      </Card>
    </div>
  )
}
