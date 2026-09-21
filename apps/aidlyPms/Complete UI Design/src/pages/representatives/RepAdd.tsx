import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select } from '../../components/ui/FormField'

export default function RepAdd() {
  const navigate = useNavigate()
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add Representative</h2>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required><Input placeholder="First name" /></FormField>
          <FormField label="Last Name" required><Input placeholder="Last name" /></FormField>
          <FormField label="Phone Number" required>
            <div className="flex gap-1.5">
              <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
              <Input placeholder="1XXXXXXXXX" />
            </div>
          </FormField>
          <FormField label="Gender">
            <Select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
          </FormField>
          <FormField label="Email" error="">
            <Input type="email" placeholder="name@pharmacy.com" />
          </FormField>
          <FormField label="Role" required>
            <Select><option value="">Select role</option><option>PMS Manager</option><option>PMS Salesman</option><option>PMS Cashier</option></Select>
          </FormField>
          <FormField label="Password" required hint="Minimum 6 characters">
            <Input type="password" placeholder="••••••" />
          </FormField>
          <FormField label="Confirm Password" required>
            <Input type="password" placeholder="••••••" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={() => navigate('/representatives')}>Submit</Button>
        </div>
      </Card>
    </div>
  )
}
