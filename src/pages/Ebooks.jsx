import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EbookCard from '../components/EbookCard'

export default function Ebooks() {
  const [ebooks, setEbooks] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchEbooks() {
      setLoading(true)
      let query = supabase
        .from('ebooks')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data } = await query

      let results = (data || []).map((e) => ({ ...e, category_name: e.categories?.name }))

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        results = results.filter(
          (e) =>
            e.title.toLowerCase().includes(term) ||
            (e.author && e.author.toLowerCase().includes(term))
        )
      }

      setEbooks(results)
      setLoading(false)
    }

    fetchEbooks()
  }, [selectedCategory, searchTerm])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mb-3">
          Browse eBooks
        </h1>
        <p className="text-navy-500">Discover our full collection of premium eBooks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-navy-400">Loading eBooks...</div>
      ) : ebooks.length === 0 ? (
        <div className="text-center py-16 text-navy-400">
          No eBooks found. Try adjusting your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ebooks.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook} />
          ))}
        </div>
      )}
    </div>
  )
}
