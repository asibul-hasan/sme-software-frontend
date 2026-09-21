import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
