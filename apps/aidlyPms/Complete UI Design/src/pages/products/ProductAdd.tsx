import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input, Select, Textarea, Toggle } from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'

export default function ProductAdd() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', strength: '', volume: '', medicineType: '', unitType: 'PIECE',
    qtyBox: '', costBox: '', salePriceBox: '', company: '', generic: '',
    country: '', barcode: '', isMedicine: true,
  })
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [addGenericOpen, setAddGenericOpen] = useState(false)

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="font-display font-semibold text-slate-900">Add New Product</h2>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Product Name" required>
            <Input placeholder="e.g. Napa 500mg Tablet" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>
          <FormField label="Strength">
            <Input placeholder="e.g. 500mg, 10mg/5ml" value={form.strength} onChange={e => set('strength', e.target.value)} />
          </FormField>
          <FormField label="Volume">
            <Input placeholder="e.g. 100ml, 15g" value={form.volume} onChange={e => set('volume', e.target.value)} />
          </FormField>
          <FormField label="Medicine Type" required>
            <Select value={form.medicineType} onChange={e => set('medicineType', e.target.value)}>
              <option value="">Select type</option>
              {['Tablet','Capsule','Syrup','Suspension','Drop','Injection','Ointment','Gel','Cream','Inhaler','Suppository','Powder','Other'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Unit Type" required>
            <Select value={form.unitType} onChange={e => set('unitType', e.target.value)}>
              {['PIECE','STRIP','BOX','BOTTLE','TUBE','VIAL','AMPOULE'].map(u => <option key={u}>{u}</option>)}
            </Select>
          </FormField>
          <FormField label="Quantity / Box" required>
            <Input type="number" placeholder="e.g. 10" value={form.qtyBox} onChange={e => set('qtyBox', e.target.value)} />
          </FormField>
          <FormField label="Cost / Box (৳)" required>
            <Input type="number" placeholder="0.00" value={form.costBox} onChange={e => set('costBox', e.target.value)} />
          </FormField>
          <FormField label="Sale Price / Box (৳)" required>
            <Input type="number" placeholder="0.00" value={form.salePriceBox} onChange={e => set('salePriceBox', e.target.value)} />
          </FormField>

          <FormField label="Company" required>
            <div className="flex gap-1.5">
              <Select className="flex-1" value={form.company} onChange={e => set('company', e.target.value)}>
                <option value="">Select company</option>
                <option>Beximco Pharma</option>
                <option>Square Pharma</option>
                <option>ACI Pharma</option>
                <option>Incepta Pharma</option>
                <option>Renata Pharma</option>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setAddCompanyOpen(true)}>+</Button>
            </div>
          </FormField>

          <FormField label="Generic Name">
            <div className="flex gap-1.5">
              <Select className="flex-1" value={form.generic} onChange={e => set('generic', e.target.value)}>
                <option value="">Select generic</option>
                <option>Paracetamol</option>
                <option>Amoxicillin</option>
                <option>Omeprazole</option>
                <option>Metformin HCl</option>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setAddGenericOpen(true)}>+</Button>
            </div>
          </FormField>

          <FormField label="Country of Origin">
            <Input placeholder="e.g. Bangladesh" value={form.country} onChange={e => set('country', e.target.value)} />
          </FormField>
          <FormField label="Barcode Value">
            <Input placeholder="EAN / UPC barcode" value={form.barcode} onChange={e => set('barcode', e.target.value)} />
          </FormField>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={form.isMedicine} onChange={v => set('isMedicine', v)} label="Mark as Medicine" />
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={() => navigate('/products')}>Add Product</Button>
        </div>
      </Card>

      <Modal open={addCompanyOpen} onClose={() => setAddCompanyOpen(false)} title="Add Company" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setAddCompanyOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setAddCompanyOpen(false)}>Submit</Button></>}>
        <FormField label="Company Name" required><Input placeholder="Enter company name" /></FormField>
      </Modal>

      <Modal open={addGenericOpen} onClose={() => setAddGenericOpen(false)} title="Add Generic" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setAddGenericOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setAddGenericOpen(false)}>Submit</Button></>}>
        <FormField label="Generic Name" required><Input placeholder="Enter generic name" /></FormField>
      </Modal>
    </div>
  )
}
