import React, { useState } from 'react'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 2.123.682 4.09 1.837 5.693L2.5 22l4.422-1.303A9.95 9.95 0 0012.004 22C17.522 22 22 17.514 22 12.004 22 6.486 17.522 2 12.004 2zm5.468 12.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.563v1.877h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[16px]">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
    </svg>
  )
}

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
      icon: <WhatsAppIcon />,
      href: `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`,
      className: 'bg-[#25D366] hover:bg-[#1ebc59] text-white',
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-[#1877F2] hover:bg-[#1465d6] text-white',
    },
    {
      name: 'X (Twitter)',
      icon: <XIcon />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      className: 'bg-navy-900 hover:bg-navy-800 text-white',
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
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${link.className}`}
        >
          {link.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy link"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-navy-100 hover:bg-navy-200 text-navy-700 transition-colors"
      >
        <LinkIcon />
      </button>
      {copied && (
        <span className="text-xs text-green-600 font-medium">Link copied!</span>
      )}
    </div>
  )
}
