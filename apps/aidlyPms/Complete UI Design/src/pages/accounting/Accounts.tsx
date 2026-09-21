import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField, { Input, Select } from '../../components/ui/FormField'

const ACCOUNTS = [
  { name: 'Counter Cash', provider: 'Cash In Hand', number: '—', balance: '৳ 84,250', type: 'Cash' },
  { name: 'Islami Bank', provider: 'Bank Account', number: 'IBBL-4012-XXXX-5678', balance: '৳ 2,42,000', type: 'Bank' },
  { name: 'Modhumoti Bank', provider: 'Bank Account', number: 'MDB-2298-XXXX-4321', balance: '৳ 1,00,000', type: 'Bank' },
  { name: 'Admin bKash', provider: 'bKash Personal', number: '+880 1711-234567', balance: '৳ 12,450', type: 'MFS' },
  { name: 'Pharmacy bKash', provider: 'bKash Merchant', number: '+880 1811-345678', balance: '৳ 6,300', type: 'MFS' },
]

function CreateAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Create Account (SCR-27)" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={onClose}>Submit</Button></>}>
      <div className="space-y-4">
        <FormField label="Account Name / Holder" required>
          <Input placeholder="e.g. Counter Cash, Islami Bank Main" />
        </FormField>
        <FormField label="Phone Number" required>
          <div className="flex gap-1.5">
            <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600 shrink-0">+880</div>
            <Input placeholder="1XXXXXXXXX" />
          </div>
        </FormField>
        <FormField label="Account Type" required>
          <Select>
            <option value="">Select type</option>
            <option>Cash In Hand</option><option>Bank Account</option><option>bKash Personal</option>
            <option>bKash Merchant</option><option>Nagad</option><option>Rocket</option><option>Card POS Machine</option>
          </Select>
        </FormField>
      </div>
    </Modal>
  )
}

export default function Accounts() {
  const [filter, setFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = ACCOUNTS.filter(a => filter === '' || a.type === filter)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Account Type</label>
            <Select className="w-48" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Types</option><option value="Cash">Cash</option><option value="Bank">Bank</option><option value="MFS">MFS</option>
            </Select>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setFilter('')}>Reset</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Create Account (F2)</Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Details</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Balance</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{a.name}</p>
                    <Badge variant={a.type === 'Cash' ? 'success' : a.type === 'Bank' ? 'info' : 'warning'}>{a.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{a.provider} · {a.number}</p>
                </td>
                <td className="px-3 py-2.5 mono text-sm font-semibold text-teal-700 text-right">{a.balance}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100">📒 Statement</button>
                    <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️</button>
                    <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded hover:bg-slate-100">⇄ Transfer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateAccountModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
