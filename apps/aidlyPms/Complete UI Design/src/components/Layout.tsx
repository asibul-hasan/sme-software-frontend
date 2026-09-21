import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
        <main className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
