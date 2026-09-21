import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

export default function FormField({ label, required, error, children, hint }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-700 font-display">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputBase = 'w-full h-9 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all'
const selectBase = `${inputBase} cursor-pointer`
const textareaBase = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${props.className || ''}`} {...props} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${selectBase} ${props.className || ''}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${textareaBase} ${props.className || ''}`} rows={3} {...props} />
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
}
