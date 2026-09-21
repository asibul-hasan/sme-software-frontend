import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Input } from '../../components/ui/FormField'

export default function ProductConfig() {
  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Product Config</h2>
      <Card>
        <div className="space-y-4">
          <FormField label="Expired Notification Days" required hint="Alert threshold before expiry (default: 90 days)">
            <Input type="number" defaultValue="90" className="w-32" />
          </FormField>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
