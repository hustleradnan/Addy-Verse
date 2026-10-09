import React from 'react'

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-navy-900 mb-6 text-center">
        About BookVault
      </h1>

      <div className="prose max-w-none text-navy-700 space-y-6 leading-relaxed">
        <p>
          Welcome to BookVault — your trusted destination for premium eBooks and
          insightful articles. We believe that knowledge should be accessible,
          affordable, and beautifully presented.
        </p>

        <p>
          Our mission is simple: to curate high-quality digital content across
          business, self-improvement, technology, and lifestyle topics, helping
          readers around the world learn and grow at their own pace.
        </p>

        <h2 className="text-2xl font-serif-heading font-bold text-navy-900 mt-10 mb-4">
          Why Choose Us?
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Carefully curated eBooks across diverse categories</li>
          <li>Regularly updated articles with practical insights</li>
          <li>Secure and simple purchasing experience</li>
          <li>Instant access to your library after purchase</li>
        </ul>

        <h2 className="text-2xl font-serif-heading font-bold text-navy-900 mt-10 mb-4">
          Our Story
        </h2>
        <p>
          BookVault started with a simple idea — make great knowledge easy to
          find and own. Today, we continue to grow our collection every day,
          guided by our readers' feedback and curiosity.
        </p>
      </div>
    </div>
  )
}
