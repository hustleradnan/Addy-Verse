import React from 'react'
import { Navigate } from 'react-router-dom'

export default function Register() {
  // Registration is now merged into the OTP-based Login flow.
  return <Navigate to="/login" replace />
}
