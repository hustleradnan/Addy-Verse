import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true)

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesData) {
        const withCounts = await Promise.all(
          categoriesData.map(async (cat) => {
            const { count } = await supabase
              .from('ebooks')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id)
              .eq('is_published', true)
            return { ...cat, ebook_count: count || 0 }
          })
        )
        setCategories(withCounts)
      }

      setLoading(false)
    }

    fetchCategories()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mb-3">
          Categories
        </h1>
        <p className="text-navy-500">Browse eBooks by topic</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-navy-400">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-navy-400">No categories available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/ebooks?category=${cat.id}`}
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-cardHover transition-all duration-300 flex items-center justify-between"
            >
              <div>
                <h3 className="font-serif-heading font-bold text-navy-900 text-lg mb-1">
                  {cat.name}
                </h3>
                <p className="text-sm text-navy-500">{cat.ebook_count} eBooks</p>
              </div>
              <span className="text-gold-500 text-2xl">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
