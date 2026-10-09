import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function EbookDetail() {
  const { slug } = useParams()
  const [ebook, setEbook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchEbook() {
      setLoading(true)
      setNotFound(false)

      const { data, error } = await supabase
        .from('ebooks')
        .select('*, categories(name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error || !data) {
        setNotFound(true)
        setEbook(null)
      } else {
        setEbook({ ...data, category_name: data.categories?.name })
      }

      setLoading(false)
    }

    fetchEbook()
  }, [slug])

  if (loading) {
    return <div className="text-center py-24 text-navy-400">Loading...</div>
  }

  if (notFound || !ebook) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900 mb-3">
          eBook Not Found
        </h1>
        <p className="text-navy-500 mb-6">
          This eBook doesn't exist or is no longer available.
        </p>
        <Link to="/ebooks" className="text-gold-600 font-semibold hover:text-gold-700">
          ← Back to eBooks
        </Link>
      </div>
    )
  }

  const hasDiscount = ebook.discount_price && ebook.discount_price < ebook.price
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: ebook.title, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="aspect-[3/4] bg-navy-100 rounded-xl overflow-hidden shadow-card">
            {ebook.cover_image_url ? (
              <img
                src={ebook.cover_image_url}
                alt={ebook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-navy-400 text-5xl">
                📖
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {ebook.category_name && (
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
              {ebook.category_name}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mt-2 mb-3">
            {ebook.title}
          </h1>
          {ebook.author && (
            <p className="text-navy-500 mb-4">by {ebook.author}</p>
          )}

          <div className="flex items-center gap-3 mb-6">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-navy-900">₹{ebook.discount_price}</span>
                <span className="text-lg text-navy-400 line-through">₹{ebook.price}</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-navy-900">₹{ebook.price}</span>
            )}
          </div>

          {ebook.page_count && (
            <p className="text-sm text-navy-500 mb-6">📄 {ebook.page_count} pages</p>
          )}

          <div className="prose max-w-none text-navy-700 mb-8 whitespace-pre-line">
            {ebook.description}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              disabled
              title="Payments coming soon"
              className="bg-navy-300 text-navy-600 font-semibold px-8 py-3 rounded-lg cursor-not-allowed"
            >
              Buy Now — Coming Soon
            </button>
            <button
              onClick={handleShare}
              className="border border-navy-300 hover:border-gold-400 text-navy-700 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
