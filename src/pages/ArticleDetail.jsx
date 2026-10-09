import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true)
      setNotFound(false)

      const { data, error } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error || !data) {
        setNotFound(true)
        setArticle(null)
      } else {
        setArticle({ ...data, category_name: data.categories?.name })

        // Set SEO meta tags dynamically
        if (data.seo_title) document.title = data.seo_title
        if (data.seo_description) {
          let metaDesc = document.querySelector('meta[name="description"]')
          if (metaDesc) metaDesc.setAttribute('content', data.seo_description)
        }
      }

      setLoading(false)
    }

    fetchArticle()

    return () => {
      document.title = 'BookVault - Premium eBooks & Articles'
    }
  }, [slug])

  if (loading) {
    return <div className="text-center py-24 text-navy-400">Loading...</div>
  }

  if (notFound || !article) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900 mb-3">
          Article Not Found
        </h1>
        <p className="text-navy-500 mb-6">
          This article doesn't exist or is no longer available.
        </p>
        <Link to="/articles" className="text-gold-600 font-semibold hover:text-gold-700">
          ← Back to Articles
        </Link>
      </div>
    )
  }

  const formattedDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {article.category_name && (
        <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
          {article.category_name}
        </span>
      )}
      <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mt-2 mb-3">
        {article.title}
      </h1>
      {formattedDate && <p className="text-navy-400 mb-8">{formattedDate}</p>}

      {article.featured_image_url && (
        <div className="aspect-[16/9] bg-navy-100 rounded-xl overflow-hidden mb-8 shadow-card">
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-navy max-w-none text-navy-700 whitespace-pre-line leading-relaxed">
        {article.content}
      </div>

      <div className="mt-12 pt-6 border-t border-navy-100">
        <Link to="/articles" className="text-gold-600 font-semibold hover:text-gold-700">
          ← Back to Articles
        </Link>
      </div>
    </article>
  )
}
