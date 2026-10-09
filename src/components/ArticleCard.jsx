import React from 'react'
import { Link } from 'react-router-dom'

export default function ArticleCard({ article }) {
  const formattedDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[16/9] bg-navy-100 overflow-hidden">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-navy-400 text-4xl">
            📰
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {article.category_name && (
          <span className="text-xs font-medium text-gold-600 uppercase tracking-wide mb-2">
            {article.category_name}
          </span>
        )}
        <h3 className="font-serif-heading font-bold text-navy-900 text-lg mb-2 line-clamp-2 group-hover:text-navy-700">
          {article.title}
        </h3>
        {formattedDate && (
          <p className="text-sm text-navy-400 mt-auto">{formattedDate}</p>
        )}
      </div>
    </Link>
  )
}
