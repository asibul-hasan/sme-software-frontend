import React from 'react'

interface Column<T> {
  header: string
  key?: keyof T
  render?: (row: T, i: number) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyText?: string
}

export default function DataTable<T extends Record<string, unknown>>({ columns, data, emptyText = 'No records found.' }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col, i) => (
              <th key={i} className={`text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-slate-400 text-sm">{emptyText}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-3 py-2.5 text-slate-700 ${col.className || ''}`}>
                    {col.render ? col.render(row, i) : col.key ? String(row[col.key] ?? '') : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
