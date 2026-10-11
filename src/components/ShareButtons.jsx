import React, { useState } from 'react'

export default function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title || '')

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const links = [
    {
      name: 'WhatsApp',
      icon: '🟢',
      href: `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: '🔵',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter/X',
      icon: '⚫',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-navy-500 mr-1">Share:</span>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${link.name}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-navy-50 hover:bg-navy-100 border border-navy-200 text-base transition-colors"
        >
          {link.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy link"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-navy-50 hover:bg-navy-100 border border-navy-200 text-base transition-colors"
      >
        🔗
      </button>
      {copied && (
        <span className="text-xs text-green-600 font-medium">Link copied!</span>
      )}
    </div>
  )
}
