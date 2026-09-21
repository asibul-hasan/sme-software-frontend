import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField, { Input } from '../../components/ui/FormField'

const GENERICS = [
  { id: 1, name: 'Paracetamol' },
  { id: 2, name: 'Amoxicillin Trihydrate' },
  { id: 3, name: 'Omeprazole' },
  { id: 4, name: 'Metformin Hydrochloride' },
  { id: 5, name: 'Cefixime' },
  { id: 6, name: 'Azithromycin' },
  { id: 7, name: 'Atorvastatin Calcium' },
  { id: 8, name: 'Losartan Potassium' },
  { id: 9, name: 'Ciprofloxacin' },
  { id: 10, name: 'Esomeprazole' },
]

export default function GenericList() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = GENERICS.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <div className="flex gap-3 mb-4">
          <Input placeholder="Search generic name..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
          <Button variant="secondary" size="sm" onClick={() => setSearch('')}>Reset</Button>
          <Button size="sm" onClick={() => setOpen(true)}>+ Add Generic</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">ID</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Generic Name (INN)</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 mono text-xs text-slate-500">{g.id}</td>
                <td className="px-3 py-2.5 font-medium text-slate-800">{g.name}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️ Edit</button>
                    <button className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Generic" size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setOpen(false)}>Submit</Button></>}>
        <FormField label="Generic Name" required>
          <Input placeholder="Enter generic / INN name" />
        </FormField>
      </Modal>
    </div>
  )
}
