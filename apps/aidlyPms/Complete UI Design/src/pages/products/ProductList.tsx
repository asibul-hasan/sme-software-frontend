import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select, Textarea, Toggle } from '../../components/ui/FormField'

const PRODUCTS = [
  { name: 'Napa 500mg Tablet', form: 'Tablet', strength: '500mg', company: 'Beximco Pharma', avgCost: '৳ 0.44', cost: '৳ 0.45', salePrice: '৳ 1.00' },
  { name: 'Seclo 20mg Capsule', form: 'Capsule', strength: '20mg', company: 'Square Pharma', avgCost: '৳ 6.20', cost: '৳ 6.50', salePrice: '৳ 18.00' },
  { name: 'Amoxi 500mg Capsule', form: 'Capsule', strength: '500mg', company: 'ACI Pharma', avgCost: '৳ 5.80', cost: '৳ 6.00', salePrice: '৳ 15.00' },
  { name: 'Metformin 500mg Tablet', form: 'Tablet', strength: '500mg', company: 'Incepta Pharma', avgCost: '৳ 3.80', cost: '৳ 4.00', salePrice: '৳ 10.00' },
  { name: 'Cef-3 250mg Capsule', form: 'Capsule', strength: '250mg', company: 'Renata Pharma', avgCost: '৳ 26.00', cost: '৳ 27.00', salePrice: '৳ 45.00' },
  { name: 'Losectil 20mg Capsule', form: 'Capsule', strength: '20mg', company: 'Eskayef Pharma', avgCost: '৳ 9.20', cost: '৳ 9.50', salePrice: '৳ 22.00' },
  { name: 'Azimex 250mg Tablet', form: 'Tablet', strength: '250mg', company: 'Beximco Pharma', avgCost: '৳ 24.50', cost: '৳ 25.00', salePrice: '৳ 60.00' },
  { name: 'Atorva 10mg Tablet', form: 'Tablet', strength: '10mg', company: 'Square Pharma', avgCost: '৳ 10.50', cost: '৳ 11.00', salePrice: '৳ 25.00' },
]

function AddProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', strength: '', volume: '', medicineType: '', unitType: 'PIECE',
    qtyBox: '', costBox: '', salePriceBox: '', company: '', generic: '',
    country: '', barcode: '', isMedicine: true,
  })
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [addGenericOpen, setAddGenericOpen] = useState(false)
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <Modal open={open} onClose={onClose} title="Add New Product (SCR-03)" size="lg"
        footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Add Product</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Product Name" required>
            <Input placeholder="e.g. Napa 500mg Tablet" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>
          <FormField label="Strength">
            <Input placeholder="e.g. 500mg" value={form.strength} onChange={e => set('strength', e.target.value)} />
          </FormField>
          <FormField label="Volume">
            <Input placeholder="e.g. 100ml" value={form.volume} onChange={e => set('volume', e.target.value)} />
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
                <option>Beximco Pharma</option><option>Square Pharma</option><option>ACI Pharma</option><option>Incepta Pharma</option>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setAddCompanyOpen(true)}>+</Button>
            </div>
          </FormField>
          <FormField label="Generic Name">
            <div className="flex gap-1.5">
              <Select className="flex-1" value={form.generic} onChange={e => set('generic', e.target.value)}>
                <option value="">Select generic</option>
                <option>Paracetamol</option><option>Amoxicillin</option><option>Omeprazole</option>
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
          <div className="col-span-2">
            <Toggle checked={form.isMedicine} onChange={v => set('isMedicine', v)} label="Mark as Medicine" />
          </div>
        </div>
      </Modal>
      <Modal open={addCompanyOpen} onClose={() => setAddCompanyOpen(false)} title="Add Company" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setAddCompanyOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setAddCompanyOpen(false)}>Submit</Button></>}>
        <FormField label="Company Name" required><Input placeholder="Enter company name" /></FormField>
      </Modal>
      <Modal open={addGenericOpen} onClose={() => setAddGenericOpen(false)} title="Add Generic" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setAddGenericOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setAddGenericOpen(false)}>Submit</Button></>}>
        <FormField label="Generic Name" required><Input placeholder="Enter generic name" /></FormField>
      </Modal>
    </>
  )
}

export default function ProductList() {
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('')
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (company === '' || p.company.includes(company))
  )

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-36">
            <label className="text-xs font-medium text-slate-600 block mb-1">Product Name</label>
            <Input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="min-w-40">
            <label className="text-xs font-medium text-slate-600 block mb-1">Company</label>
            <Select value={company} onChange={e => setCompany(e.target.value)}>
              <option value="">All Companies</option>
              <option>Beximco Pharma</option><option>Square Pharma</option><option>ACI Pharma</option><option>Incepta Pharma</option>
            </Select>
          </div>
          <div className="min-w-36">
            <label className="text-xs font-medium text-slate-600 block mb-1">Form</label>
            <Input placeholder="Tablet, Capsule..." />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setCompany('') }}>Reset</Button>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">{filtered.length} products</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">📥 Download Stock</Button>
            <Button onClick={() => setAddCompanyOpen(true)} variant="outline" size="sm">+ Add Company</Button>
            <Button onClick={() => setAddProductOpen(true)} size="sm">+ Add Product (F2)</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Avg. Purchase/Pc</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Purchase/Pc</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Sale Price/Pc</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.form} · {p.strength} · {p.company}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right mono text-xs text-slate-600">{p.avgCost}</td>
                  <td className="px-3 py-2.5 text-right mono text-xs text-slate-600">{p.cost}</td>
                  <td className="px-3 py-2.5 text-right mono text-xs font-semibold text-teal-700">{p.salePrice}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100 transition-colors">📋 Adj</button>
                      <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100 transition-colors">👁</button>
                      <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddProductModal open={addProductOpen} onClose={() => setAddProductOpen(false)} />

      <Modal open={addCompanyOpen} onClose={() => setAddCompanyOpen(false)} title="Add Company" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setAddCompanyOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setAddCompanyOpen(false)}>Submit</Button></>}>
        <FormField label="Company Name" required><Input placeholder="Enter company name" /></FormField>
      </Modal>
    </div>
  )
}
