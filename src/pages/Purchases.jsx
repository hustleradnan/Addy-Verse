import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Purchases() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchPurchases() {
      if (!user) return
      setLoading(true)

      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total_amount, order_items(id, ebook_id, price, ebooks(title, slug, cover_image, author))')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching purchases:', error.message)
        setItems([])
        setLoading(false)
        return
      }

      const flatItems = []
      ;(data || []).forEach((order) => {
        ;(order.order_items || []).forEach((item) => {
          flatItems.push({
            id: item.id,
            ebookId: item.ebook_id,
            ebook: item.ebooks,
            purchasedAt: order.created_at,
          })
        })
      })

      setItems(flatItems)
      setLoading(false)
    }

    fetchPurchases()
  }, [user])

  async function handleDownload(ebookId, itemId) {
    setErrorMessage('')
    setDownloadingId(itemId)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        setErrorMessage('Session expire ho gayi hai. Dobara login karein.')
        setDownloadingId(null)
        return
      }

      const res = await fetch('/api/get-download-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebook_id: ebookId }),
      })

      const result = await res.json()

      if (!res.ok) {
        setErrorMessage(result.error || 'Download link generate nahi ho paya.')
      } else {
        window.open(result.url, '_blank')
      }
    } catch (err) {
      setErrorMessage('Server error: ' + err.message)
    }

    setDownloadingId(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-serif-heading font-bold text-navy-900 mb-8">
        My Purchases
      </h1>

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-navy-400">Loading your purchases...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-navy-900 mb-2">No Purchases Yet</h2>
          <p className="text-navy-500 mb-6">
            You haven't purchased any eBooks yet. Browse our collection to get started.
          </p>
          <Link
            to="/ebooks"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Browse eBooks
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              <div className="w-20 h-28 bg-navy-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.ebook?.cover_image ? (
                  <img
                    src={item.ebook.cover_image}
                    alt={item.ebook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400 text-2xl">
                    📖
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-navy-900">{item.ebook?.title}</h3>
                <p className="text-sm text-navy-500">by {item.ebook?.author}</p>
                <p className="text-sm text-navy-400 mt-1">
                  Purchased on{' '}
                  {new Date(item.purchasedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDownload(item.ebookId, item.id)}
                disabled={downloadingId === item.id}
                className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {downloadingId === item.id ? 'Preparing...' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
