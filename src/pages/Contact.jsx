import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Contact() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitStatus, setSubmitStatus] = useState(null)

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      const { data } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_key', 'contact')
        .single()

      setContent(data?.content || null)
      setLoading(false)
    }

    fetchContent()
  }, [])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Phase 1: no backend form processing yet.
    // This can be connected to a Cloudflare Function + email service in a future phase.
    setSubmitStatus('success')
    setFormData({ name: '', email: '', message: '' })
  }

  if (loading) {
    return <div className="text-center py-24 text-navy-400">Loading...</div>
  }

  if (!content) {
    return (
      <div className="text-center py-24 text-navy-400">
        Contact page content is not available right now.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mb-3">
          {content.heading}
        </h1>
        {content.intro && <p className="text-navy-500 max-w-xl mx-auto">{content.intro}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="font-serif-heading font-bold text-navy-900 text-lg mb-6">
            Get in Touch
          </h2>
          <ul className="space-y-4 text-navy-700">
            {content.email && (
              <li className="flex items-center gap-3">
                <span className="text-gold-500">✉️</span>
                <a href={`mailto:${content.email}`} className="hover:text-gold-600">
                  {content.email}
                </a>
              </li>
            )}
            {content.phone && (
              <li className="flex items-center gap-3">
                <span className="text-gold-500">📞</span>
                <span>{content.phone}</span>
              </li>
            )}
            {content.address && (
              <li className="flex items-center gap-3">
                <span className="text-gold-500">📍</span>
                <span>{content.address}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="font-serif-heading font-bold text-navy-900 text-lg mb-6">
            Send a Message
          </h2>

          {submitStatus === 'success' && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              Thank you! Your message has been noted.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
            <button
              type="submit"
              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
