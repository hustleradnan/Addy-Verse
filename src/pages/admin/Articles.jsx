import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function AdminArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchArticles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setArticles(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  async function togglePublish(article) {
    const { error } = await supabase
      .from('articles')
      .update({ is_published: !article.is_published })
      .eq('id', article.id)

    if (error) {
      alert('Failed to update: ' + error.message)
    } else {
      fetchArticles()
    }
  }

  async function handleDelete(article) {
    if (!window.confirm(`Are you sure you want to delete "${article.title}"? This cannot be undone.`)) {
      return
    }

    const { error } = await supabase.from('articles').delete().eq('id', article.id)

    if (error) {
      alert('Failed to delete: ' + error.message)
    } else {
      fetchArticles()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900">Articles</h1>
        <Link
          to="/admin/articles/new"
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add New Article
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-navy-400">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-navy-400">
            No articles yet. Click "Add New Article" to create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-navy-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-5 py-3">Image</th>
                  <th className="text-left px-5 py-3">Title</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3">
                      <div className="w-14 h-10 bg-navy-100 rounded overflow-hidden">
                        {article.featured_image_url ? (
                          <img src={article.featured_image_url} alt={article.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-400 text-xs">📰</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-navy-900">{article.title}</td>
                    <td className="px-5 py-3 text-navy-500">{article.categories?.name || '—'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => togglePublish(article)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          article.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-navy-100 text-navy-500'
                        }`}
                      >
                        {article.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-navy-500">
                      {new Date(article.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right space-x-3">
                      <Link
                        to={`/admin/articles/${article.id}/edit`}
                        className="text-navy-600 hover:text-gold-600 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(article)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
