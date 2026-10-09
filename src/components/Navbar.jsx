import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, profile, signOut, isStaff } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/ebooks', label: 'eBooks' },
    { to: '/articles', label: 'Articles' },
    { to: '/categories', label: 'Categories' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="bg-navy-950 sticky top-0 z-50 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-serif-heading font-bold text-gold-400">
            📚 BookVault
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-gold-400' : 'text-navy-100 hover:text-gold-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isStaff && (
              <Link
                to="/admin"
                className="text-sm font-medium text-gold-400 hover:text-gold-300"
              >
                Admin Panel
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/account"
                  className="text-sm font-medium text-navy-100 hover:text-gold-300"
                >
                  {profile?.full_name || 'My Account'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium bg-gold-500 hover:bg-gold-600 text-navy-950 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium bg-gold-500 hover:bg-gold-600 text-navy-950 px-4 py-2 rounded-lg transition-colors"
              >
                Login / Register
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-navy-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-medium px-2 py-1 ${
                    isActive ? 'text-gold-400' : 'text-navy-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gold-400 px-2 py-1"
              >
                Admin Panel
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-navy-100 px-2 py-1"
                >
                  {profile?.full_name || 'My Account'}
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  className="text-sm font-medium bg-gold-500 text-navy-950 px-4 py-2 rounded-lg mx-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium bg-gold-500 text-navy-950 px-4 py-2 rounded-lg mx-2 text-center"
              >
                Login / Register
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
