import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const redirectTo = location.state?.from?.pathname || '/account'

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      await sendOtp(email.trim(), fullName.trim())
      setInfo('A 6-digit code has been sent to your email.')
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit code sent to your email.')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email.trim(), otp.trim())
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await sendOtp(email.trim(), fullName.trim())
      setInfo('A new code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-navy-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-card p-8">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900 mb-2 text-center">
          {step === 'email' ? 'Login or Sign Up' : 'Enter Verification Code'}
        </h1>
        <p className="text-sm text-navy-500 text-center mb-6">
          {step === 'email'
            ? 'No password needed — we will email you a secure code.'
            : `We sent a 6-digit code to ${email}`}
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            {info}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Full Name <span className="text-navy-400">(optional, for new accounts)</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                6-Digit Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400 text-center text-2xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="flex items-center justify-between text-sm pt-2">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-navy-500 hover:text-navy-700"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-gold-600 hover:text-gold-700 font-medium"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-navy-400 text-center mt-6">
          Are you a staff member?{' '}
          <Link to="/admin/login" className="text-navy-600 hover:text-gold-600 underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
