import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display font-semibold text-slate-900 text-base">{children}</h3>
}
