import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalAllTime: 0,
    totalLast30Days: 0,
    todayViews: 0,
    uniqueVisitors: 0,
    topPages: [],
    topEbooks: [],
    topArticles: [],
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    setError('')

    const { count: totalAllTime, error: totalError } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      setError('Analytics load karne mein error: ' + totalError.message)
      setLoading(false)
      return
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: rows, error: rowsError } = await supabase
      .from('page_views')
      .select('path, visitor_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000)

    if (rowsError) {
      setError('Analytics load karne mein error: ' + rowsError.message)
      setLoading(false)
      return
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayViews = rows.filter((r) => new Date(r.created_at) >= todayStart).length
    const uniqueVisitors = new Set(rows.map((r) => r.visitor_id)).size

    const pageCounts = {}
    rows.forEach((r) => {
      pageCounts[r.path] = (pageCounts[r.path] || 0) + 1
    })
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const ebookCounts = {}
    rows.forEach((r) => {
      if (r.path.startsWith('/ebooks/')) {
        const slug = r.path.replace('/ebooks/', '').split('/')[0]
        if (slug) ebookCounts[slug] = (ebookCounts[slug] || 0) + 1
      }
    })
    const ebookSlugs = Object.keys(ebookCounts)
    let topEbooks = []
    if (ebookSlugs.length > 0) {
      const { data: ebooksData } = await supabase
        .from('ebooks')
        .select('title, slug, cover_image')
        .in('slug', ebookSlugs)

      topEbooks = (ebooksData || [])
        .map((e) => ({ ...e, count: ebookCounts[e.slug] || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }

    const articleCounts = {}
    rows.forEach((r) => {
      if (r.path.startsWith('/articles/')) {
        const slug = r.path.replace('/articles/', '').split('/')[0]
        if (slug) articleCounts[slug] = (articleCounts[slug] || 0) + 1
      }
    })
    const articleSlugs = Object.keys(articleCounts)
    let topArticles = []
    if (articleSlugs.length > 0) {
      const { data: articlesData } = await supabase
        .from('articles')
        .select('title, slug, featured_image')
        .in('slug', articleSlugs)

      topArticles = (articlesData || [])
        .map((a) => ({ ...a, count: articleCounts[a.slug] || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }

    setStats({
      totalAllTime: totalAllTime || 0,
      totalLast30Days: rows.length,
      todayViews,
      uniqueVisitors,
      topPages,
      topEbooks,
      topArticles,
    })
    setLoading(false)
  }

  const cards = [
    { label: 'Total Views (All Time)', value: stats.totalAllTime },
    { label: 'Views (Last 30 Days)', value: stats.totalLast30Days },
    { label: "Today's Views", value: stats.todayViews },
    { label: 'Unique Visitors (30 Days)', value: stats.uniqueVisitors },
  ]

  return (
    <div>
      <h1 className="text-2xl font-serif-heading font-bold text-navy-900 mb-6">
        Website Analytics
      </h1>
      <p className="text-sm text-navy-400 -mt-4 mb-6">
        Niche diya gaya data pichhle 30 dinon ka hai (jab tak "All Time" na likha ho).
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-navy-400">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl shadow-card p-6">
                <p className="text-2xl font-bold text-navy-900">{card.value}</p>
                <p className="text-sm text-navy-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-navy-100">
                <h2 className="font-semibold text-navy-900">Most Viewed eBooks</h2>
              </div>
              {stats.topEbooks.length === 0 ? (
                <div className="text-center py-10 text-navy-400 text-sm">Abhi koi data nahi hai.</div>
              ) : (
                <div className="divide-y divide-navy-100">
                  {stats.topEbooks.map((e) => (
                    <Link
                      key={e.slug}
                      to={`/ebooks/${e.slug}`}
                      target="_blank"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50"
                    >
                      <div className="w-8 h-11 bg-navy-100 rounded overflow-hidden flex-shrink-0">
                        {e.cover_image ? (
                          <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-400 text-[10px]">book</div>
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium text-navy-800">{e.title}</span>
                      <span className="text-sm font-semibold text-navy-900">{e.count} views</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-navy-100">
                <h2 className="font-semibold text-navy-900">Most Viewed Articles</h2>
              </div>
              {stats.topArticles.length === 0 ? (
                <div className="text-center py-10 text-navy-400 text-sm">Abhi koi data nahi hai.</div>
              ) : (
                <div className="divide-y divide-navy-100">
                  {stats.topArticles.map((a) => (
                    <Link
                      key={a.slug}
                      to={`/articles/${a.slug}`}
                      target="_blank"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50"
                    >
                      <div className="w-11 h-8 bg-navy-100 rounded overflow-hidden flex-shrink-0">
                        {a.featured_image ? (
                          <img src={a.featured_image} alt={a.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-400 text-[10px]">📰</div>
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium text-navy-800">{a.title}</span>
                      <span className="text-sm font-semibold text-navy-900">{a.count} views</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-900">Top Pages (All Page Types)</h2>
            </div>
            {stats.topPages.length === 0 ? (
              <div className="text-center py-12 text-navy-400">Abhi koi data available nahi hai.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-navy-50 text-navy-500 uppercase text-xs">
                  <tr>
                    <th className="text-left px-5 py-3">Page</th>
                    <th className="text-right px-5 py-3">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {stats.topPages.map((p) => (
                    <tr key={p.path}>
                      <td className="px-5 py-3 text-navy-700 font-medium">{p.path}</td>
                      <td className="px-5 py-3 text-right text-navy-900 font-semibold">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
