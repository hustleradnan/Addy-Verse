import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function About() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      const { data } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_key', 'about')
        .single()

      setContent(data?.content || null)
      setLoading(false)
    }

    fetchContent()
  }, [])

  if (loading) {
    return <div className="text-center py-24 text-navy-400">Loading...</div>
  }

  if (!content) {
    return (
      <div className="text-center py-24 text-navy-400">
        About page content is not available right now.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mb-6 text-center">
        {content.heading}
      </h1>

      <div className="prose max-w-none text-navy-700 space-y-6 leading-relaxed">
        {content.intro && <p>{content.intro}</p>}
        {content.mission && <p>{content.mission}</p>}

        {content.why_choose_us && content.why_choose_us.length > 0 && (
          <>
            <h2 className="text-2xl font-serif-heading font-bold text-navy-900 mt-10 mb-4">
              Why Choose Us?
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {content.why_choose_us.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {content.our_story && (
          <>
            <h2 className="text-2xl font-serif-heading font-bold text-navy-900 mt-10 mb-4">
              Our Story
            </h2>
            <p>{content.our_story}</p>
          </>
        )}
      </div>
    </div>
  )
}
