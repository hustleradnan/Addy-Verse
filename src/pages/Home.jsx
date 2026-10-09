import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import EbookCard from '../components/EbookCard'
import ArticleCard from '../components/ArticleCard'

export default function Home() {
  const [featuredEbooks, setFeaturedEbooks] = useState([])
  const [recentArticles, setRecentArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: ebooksData } = await supabase
        .from('ebooks')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4)

      const { data: articlesData } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3)

      setFeaturedEbooks(
        (ebooksData || []).map((e) => ({ ...e, category_name: e.categories?.name }))
      )
      setRecentArticles(
        (articlesData || []).map((a) => ({ ...a, category_name: a.categories?.name }))
      )
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-heading font-bold mb-6 leading-tight">
            Knowledge That <span className="text-gold-400">Transforms</span>
          </h1>
          <p className="text-lg sm:text-xl text-navy-200 max-w-2xl mx-auto mb-10">
            Discover premium eBooks and insightful articles curated to help you grow, learn, and succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/ebooks"
              className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Browse eBooks
            </Link>
            <Link
              to="/articles"
              className="border border-navy-600 hover:border-gold-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Read Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Featured eBooks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif-heading font-bold text-navy-900">
            Featured eBooks
          </h2>
          <Link to="/ebooks" className="text-sm font-semibold text-gold-600 hover:text-gold-700">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-navy-400">Loading...</div>
        ) : featuredEbooks.length === 0 ? (
          <div className="text-center py-12 text-navy-400">No eBooks available yet. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEbooks.map((ebook) => (
              <EbookCard key={ebook.id} ebook={ebook} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Articles */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif-heading font-bold text-navy-900">
              Latest Articles
            </h2>
            <Link to="/articles" className="text-sm font-semibold text-gold-600 hover:text-gold-700">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-navy-400">Loading...</div>
          ) : recentArticles.length === 0 ? (
            <div className="text-center py-12 text-navy-400">No articles published yet. Check back soon!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif-heading font-bold mb-4">
            Start Your Reading Journey Today
          </h2>
          <p className="text-navy-200 mb-8">
            Join thousands of readers exploring our curated collection of eBooks and articles.
          </p>
          <Link
            to="/ebooks"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Explore Now
          </Link>
        </div>
      </section>
    </div>
  )
}
