import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Account() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    navigate('/')
  }

  function startEditing() {
    setNameInput(profile?.full_name || '')
    setSaveError('')
    setSaveSuccess(false)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setSaveError('')
  }

  async function handleSaveName(e) {
    e.preventDefault()
    setSaveError('')

    if (!nameInput.trim()) {
      setSaveError('Naam khaali nahi ho sakta.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nameInput.trim() })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setSaveError('Save karne mein error: ' + error.message)
      return
    }

    setEditing(false)
    setSaveSuccess(true)
    window.location.reload()
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

        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {saveError}
          </div>
        )}

        <div className="space-y-3 text-navy-700">
          <div className="flex justify-between items-center border-b border-navy-100 pb-3">
            <span className="text-navy-500">Full Name</span>
            {editing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Apna naam likhein"
                  className="px-3 py-1.5 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs bg-navy-900 hover:bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-xs text-navy-400 hover:text-navy-600 px-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <span className="font-medium flex items-center gap-3">
                {profile?.full_name || '—'}
                <button
                  onClick={startEditing}
                  className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                >
                  Edit
                </button>
              </span>
            )}
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
