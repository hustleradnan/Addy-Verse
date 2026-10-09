import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthContext'

export default function Dashboard() {
  const { profile, isAdminOrSuper } = useAuth()
  const [stats, setStats] = useState({
    ebooks: 0,
    articles: 0,
    customers: 0,
    orders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)

      const [ebooksRes, articlesRes, customersRes, ordersRes] = await Promise.all([
        supabase.from('ebooks').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        isAdminOrSuper
          ? supabase.from('profiles').select('*', { count: 'exact', head: true })
          : Promise.resolve({ count: 0 }),
        isAdminOrSuper
          ? supabase.from('orders').select('*', { count: 'exact', head: true })
          : Promise.resolve({ count: 0 }),
      ])

      setStats({
        ebooks: ebooksRes.count || 0,
        articles: articlesRes.count || 0,
        customers: customersRes.count || 0,
        orders: ordersRes.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [isAdminOrSuper])

  const statCards = [
    { label: 'Total eBooks', value: stats.ebooks, icon: '📖', to: '/admin/ebooks', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Articles', value: stats.articles, icon: '📰', to: '/admin/articles', color: 'bg-purple-50 text-purple-700' },
  ]

  if (isAdminOrSuper) {
    statCards.push(
      { label: 'Total Customers', value: stats.customers, icon: '👥', to: '/admin/customers', color: 'bg-green-50 text-green-700' },
      { label: 'Total Orders', value: stats.orders, icon: '🧾', to: '/admin/orders', color: 'bg-amber-50 text-amber-700' }
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900">
          Welcome back, {profile?.full_name || 'there'} 👋
        </h1>
        <p className="text-navy-500 mt-1">Here's what's happening with your website.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="bg-white rounded-xl shadow-card hover:shadow-cardHover transition-all p-6"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-navy-900">{card.value}</p>
              <p className="text-sm text-navy-500 mt-1">{card.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="font-semibold text-navy-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/ebooks/new"
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            + Add New eBook
          </Link>
          <Link
            to="/admin/articles/new"
            className="bg-navy-100 hover:bg-navy-200 text-navy-900 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            + Add New Article
          </Link>
          <Link
            to="/admin/categories"
            className="bg-navy-100 hover:bg-navy-200 text-navy-900 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  )
}
