import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Purchases() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPurchases() {
      if (!user) return
      setLoading(true)

      // Phase 1/2: no payments yet, so this will simply be empty.
      // Structure is ready for Phase 3/4 to populate real purchase data.
      const { data } = await supabase
        .from('order_items')
        .select('*, orders(status, created_at, total_amount), ebooks(title, slug, cover_image_url, author)')
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'paid')

      setOrders(data || [])
      setLoading(false)
    }

    fetchPurchases()
  }, [user])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-serif-heading font-bold text-navy-900 mb-8">
        My Purchases
      </h1>

      {loading ? (
        <div className="text-center py-16 text-navy-400">Loading your purchases...</div>
      ) : orders.length === 0 ? (
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
          {orders.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              <div className="w-20 h-28 bg-navy-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.ebooks?.cover_image_url ? (
                  <img
                    src={item.ebooks.cover_image_url}
                    alt={item.ebooks.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-400 text-2xl">
                    📖
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-navy-900">{item.ebooks?.title}</h3>
                <p className="text-sm text-navy-500">by {item.ebooks?.author}</p>
                <p className="text-sm text-navy-400 mt-1">
                  Purchased on{' '}
                  {new Date(item.orders?.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                disabled
                title="Download will be available soon"
                className="bg-navy-200 text-navy-500 font-medium px-5 py-2.5 rounded-lg cursor-not-allowed"
              >
                Download — Coming Soon
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
