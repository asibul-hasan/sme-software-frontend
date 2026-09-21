interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  size?: 'sm' | 'md'
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const colors: Record<string, string> = {
    default: 'bg-teal-100 text-teal-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    muted: 'bg-slate-100 text-slate-600',
  }
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' }
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
