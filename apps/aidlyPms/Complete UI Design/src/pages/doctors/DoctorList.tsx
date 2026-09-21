import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea } from '../../components/ui/FormField'

const DOCTORS = [
  { name: 'Dr. Mohammad Ali', nameBn: 'ডা. মোহাম্মদ আলী', phone: '+880 1711-234567', gender: 'Male', desc: 'MBBS, FCPS (Medicine)', descBn: 'এমবিবিএস, এফসিপিএস (মেডিসিন)' },
  { name: 'Dr. Fatema Khanam', nameBn: 'ডা. ফাতেমা খানম', phone: '+880 1811-345678', gender: 'Female', desc: 'MBBS, MS (Gynaecology)', descBn: 'এমবিবিএস, এমএস (গাইনোকোলজি)' },
  { name: 'Dr. Karim Ahmed', nameBn: 'ডা. করিম আহমেদ', phone: '+880 1611-456789', gender: 'Male', desc: 'BDS (Dental)', descBn: 'বিডিএস (ডেন্টাল)' },
]

function AddDoctorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add New Doctor (SCR-41)" size="lg"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
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
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-teal-400 transition-colors cursor-pointer">
              <p className="text-sm text-slate-500">📎 Click to upload signature</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
            </div>
          </FormField>
        </div>
      </div>
    </Modal>
  )
}

export default function DoctorList() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="Search doctor name..." className="flex-1 min-w-44" />
          <Input placeholder="Phone number..." className="min-w-44" />
          <Button variant="secondary" size="sm">Reset</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Doctor (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Doctor (English)</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Doctor (বাংলা)</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Phone</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Gender</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Qualifications</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {DOCTORS.map((d, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800">{d.name}</td>
                <td className="px-3 py-2.5 bengali text-slate-700">{d.nameBn}</td>
                <td className="px-3 py-2.5 mono text-xs text-slate-600">{d.phone}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{d.gender}</td>
                <td className="px-3 py-2.5">
                  <p className="text-xs text-slate-700">{d.desc}</p>
                  <p className="text-xs text-slate-400 bengali">{d.descBn}</p>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">📋 Rx</button>
                    <button onClick={() => setAddOpen(true)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AddDoctorModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
