import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FormField, { Textarea } from '../../components/ui/FormField'

export default function PrescriptionSettings() {
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="font-display font-semibold text-slate-900">Prescription Settings</h2>
      <Card>
        <div className="space-y-5">
          <FormField label="Upload Pharmacy Logo" hint="PNG or JPG, max 2MB">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer">
              <p className="text-sm text-slate-500">🖼 Click to upload logo</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
            </div>
          </FormField>
          <FormField label="Prescription Bottom Text" hint="Legal disclaimer, clinic hours, hotline">
            <Textarea rows={4} defaultValue="Working Hours: Sat–Thu 8am–10pm, Fri 4pm–10pm&#10;Hotline: +880 1711-234567&#10;Drugs once sold cannot be refunded. Prescription required for scheduled drugs." />
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
