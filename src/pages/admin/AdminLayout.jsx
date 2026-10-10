import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import AdminSidebar from '../../components/admin/AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-navy-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-navy-100 px-6 sm:px-8 py-3 flex items-center justify-between">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-navy-600 hover:text-gold-600 transition-colors flex items-center gap-1"
          >
            ← Website Dekhein (Back to Website)
          </Link>
        </div>
        <div className="p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
