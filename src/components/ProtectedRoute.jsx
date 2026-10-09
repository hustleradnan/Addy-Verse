import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// For customer-only pages like /account, /purchases
export function ProtectedCustomerRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-navy-600 font-medium">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// For admin panel pages, with optional role requirement
export function ProtectedStaffRoute({ children, requireRole }) {
  const { user, role, loading, isStaff, isAdminOrSuper, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-gold-400 font-medium">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (requireRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (requireRole === 'admin_or_super' && !isAdminOrSuper) {
    return <Navigate to="/admin" replace />
  }

  if (!requireRole && !isStaff) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
