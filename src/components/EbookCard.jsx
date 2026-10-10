import React from 'react'
import { Link } from 'react-router-dom'

export default function EbookCard({ ebook }) {
  const hasDiscount = ebook.discount_price && ebook.discount_price < ebook.price

  return (
    <Link
      to={`/ebooks/${ebook.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[3/4] bg-navy-100 overflow-hidden relative">
        {ebook.cover_image ? (
          <img
            src={ebook.cover_image}
            alt={ebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-navy-400 text-4xl">
            📖
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-gold-500 text-navy-950 text-xs font-bold px-2 py-1 rounded-md">
            SALE
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {ebook.category_name && (
          <span className="text-xs font-medium text-gold-600 uppercase tracking-wide mb-1">
            {ebook.category_name}
          </span>
        )}
        <h3 className="font-serif-heading font-bold text-navy-900 text-base mb-1 line-clamp-2 group-hover:text-navy-700">
          {ebook.title}
        </h3>
        {ebook.author && (
          <p className="text-sm text-navy-500 mb-3">by {ebook.author}</p>
        )}

        <div className="mt-auto flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-navy-900">₹{ebook.discount_price}</span>
              <span className="text-sm text-navy-400 line-through">₹{ebook.price}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-navy-900">₹{ebook.price}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
