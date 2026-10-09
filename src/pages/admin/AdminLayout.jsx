import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../../components/admin/AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-navy-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
