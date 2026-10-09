import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

export default function AdminSidebar() {
  const { profile, role, signOut, isAdminOrSuper, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gold-500 text-navy-950'
        : 'text-navy-200 hover:bg-navy-800 hover:text-gold-300'
    }`

  return (
    <aside className="w-64 bg-navy-950 min-h-screen flex flex-col border-r border-navy-800">
      <div className="p-6 border-b border-navy-800">
        <h2 className="text-lg font-serif-heading font-bold text-gold-400">
          📚 Admin Panel
        </h2>
        <p className="text-xs text-navy-400 mt-1">
          {profile?.full_name || 'Staff'} · <span className="capitalize">{role?.replace('_', ' ')}</span>
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/admin" end className={linkClass}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/admin/ebooks" className={linkClass}>
          📖 eBooks
        </NavLink>
        <NavLink to="/admin/articles" className={linkClass}>
          📰 Articles
        </NavLink>
        <NavLink to="/admin/categories" className={linkClass}>
          🏷️ Categories
        </NavLink>

        {isAdminOrSuper && (
          <>
            <NavLink to="/admin/orders" className={linkClass}>
              🧾 Orders
            </NavLink>
            <NavLink to="/admin/customers" className={linkClass}>
              👥 Customers
            </NavLink>
          </>
        )}

        {isSuperAdmin && (
          <>
            <NavLink to="/admin/admin-users" className={linkClass}>
              🛡️ Admin Users
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              ⚙️ Settings
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-navy-800 space-y-2">
        <NavLink to="/" className="block text-xs text-navy-400 hover:text-gold-400 text-center">
          ← Back to Website
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full bg-navy-800 hover:bg-navy-700 text-navy-200 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
