import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function getVisitorId() {
  let id = localStorage.getItem('visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('visitor_id', id)
  }
  return id
}

export default function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    const visitorId = getVisitorId()
    supabase
      .from('page_views')
      .insert({ path: location.pathname, visitor_id: visitorId })
      .then(() => {})
      .catch(() => {})
  }, [location.pathname])

  return null
}
