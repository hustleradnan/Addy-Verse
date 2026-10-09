import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null)
      setRole(null)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error loading profile:', profileError.message)
      setProfile(null)
      setRole(null)
      return
    }

    setProfile(profileData)
    setRole(profileData?.roles?.name || null)
  }

  async function refreshProfile() {
    if (user?.id) {
      await loadProfile(user.id)
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user || null)
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setRole(null)
      }
    })

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  // Customer OTP flow: Step 1 - send a 6-digit code to email
  async function sendOtp(email, fullName) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: fullName ? { full_name: fullName } : undefined,
      },
    })
    if (error) throw error
    return true
  }

  // Customer OTP flow: Step 2 - verify the 6-digit code
  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }

  // Staff login: email + password
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setRole(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return true
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return true
  }

  const isStaff = role === 'super_admin' || role === 'admin' || role === 'editor'
  const isAdminOrSuper = role === 'super_admin' || role === 'admin'
  const isSuperAdmin = role === 'super_admin'

  const value = {
    user,
    profile,
    role,
    loading,
    sendOtp,
    verifyOtp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isStaff,
    isAdminOrSuper,
    isSuperAdmin,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
