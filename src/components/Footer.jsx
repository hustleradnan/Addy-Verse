import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Footer() {
  const year = new Date().getFullYear()
  const [siteName, setSiteName] = useState('BookVault')
  const [logoEmoji, setLogoEmoji] = useState('📚')
  const [tagline, setTagline] = useState('Premium eBooks & Articles')

  useEffect(() => {
    async function fetchSiteSettings() {
      const { data } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_key', 'general')
        .single()

      if (data?.content) {
        if (data.content.site_name) setSiteName(data.content.site_name)
        if (data.content.logo_emoji) setLogoEmoji(data.content.logo_emoji)
        if (data.content.tagline) setTagline(data.content.tagline)
      }
    }
    fetchSiteSettings()
  }, [])

  return (
    <footer className="bg-navy-950 text-navy-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif-heading font-bold text-gold-400 mb-3">
              {logoEmoji} {siteName}
            </h3>
            <p className="text-sm text-navy-300">
              {tagline}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-navy-100 uppercase tracking-wide mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ebooks" className="hover:text-gold-300">eBooks</Link></li>
              <li><Link to="/articles" className="hover:text-gold-300">Articles</Link></li>
              <li><Link to="/categories" className="hover:text-gold-300">Categories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-navy-100 uppercase tracking-wide mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-gold-300">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold-300">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-navy-100 uppercase tracking-wide mb-4">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-gold-300">Login / Register</Link></li>
              <li><Link to="/purchases" className="hover:text-gold-300">My Purchases</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-10 pt-6 text-center text-sm text-navy-400">
          © {year} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
