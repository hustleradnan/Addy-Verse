import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Account() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    navigate('/')
  }

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-serif-heading font-bold text-navy-900 mb-8">
        My Account
      </h1>

      <div className="bg-white rounded-xl shadow-card p-8 mb-6">
        <h2 className="font-semibold text-navy-900 text-lg mb-4">Profile Information</h2>
        <div className="space-y-3 text-navy-700">
          <div className="flex justify-between border-b border-navy-100 pb-3">
            <span className="text-navy-500">Full Name</span>
            <span className="font-medium">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-navy-100 pb-3">
            <span className="text-navy-500">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Member Since</span>
            <span className="font-medium">{joinedDate}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-8 mb-6">
        <h2 className="font-semibold text-navy-900 text-lg mb-4">Quick Links</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/purchases"
            className="flex-1 text-center bg-navy-50 hover:bg-navy-100 text-navy-900 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            📦 My Purchases
          </Link>
          <Link
            to="/ebooks"
            className="flex-1 text-center bg-navy-50 hover:bg-navy-100 text-navy-900 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            📚 Browse eBooks
          </Link>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
      >
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  )
}
