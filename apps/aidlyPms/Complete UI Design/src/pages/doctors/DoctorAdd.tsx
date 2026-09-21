import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

export default function DoctorAdd() {
  const navigate = useNavigate()
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add New Doctor</h2>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name (English)" required><Input placeholder="First name" /></FormField>
          <FormField label="Last Name (English)"><Input placeholder="Last name" /></FormField>
          <FormField label="প্রথম নাম (বাংলা)"><Input placeholder="প্রথম নাম" className="bengali" /></FormField>
          <FormField label="শেষ নাম (বাংলা)"><Input placeholder="শেষ নাম" className="bengali" /></FormField>
          <div className="col-span-2">
            <FormField label="Description (English)">
              <Textarea placeholder="MBBS, FCPS (Medicine) — Qualifications & designation" rows={2} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="বিবরণ (বাংলা)">
              <Textarea placeholder="এমবিবিএস, এফসিপিএস — যোগ্যতা ও পদবি" rows={2} className="bengali" />
            </FormField>
          </div>
          <FormField label="Phone Number" required>
            <div className="flex gap-1.5">
              <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
              <Input placeholder="1XXXXXXXXX" />
            </div>
          </FormField>
          <FormField label="Gender">
            <Select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
          </FormField>
          <FormField label="Password" required hint="Min 6 characters"><Input type="password" placeholder="••••••" /></FormField>
          <FormField label="Confirm Password" required><Input type="password" placeholder="••••••" /></FormField>
          <div className="col-span-2">
            <FormField label="Upload Signature" hint="PNG or JPG, max 2MB">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                <p className="text-sm text-slate-500">📎 Click to upload signature</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={() => navigate('/doctors')}>Submit</Button>
        </div>
      </Card>
    </div>
  )
}
