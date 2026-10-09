import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function AdminEbooks() {
  const [ebooks, setEbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchEbooks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ebooks')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setEbooks(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEbooks()
  }, [])

  async function togglePublish(ebook) {
    const { error } = await supabase
      .from('ebooks')
      .update({ is_published: !ebook.is_published })
      .eq('id', ebook.id)

    if (error) {
      alert('Failed to update: ' + error.message)
    } else {
      fetchEbooks()
    }
  }

  async function handleDelete(ebook) {
    if (!window.confirm(`Are you sure you want to delete "${ebook.title}"? This cannot be undone.`)) {
      return
    }

    const { error } = await supabase.from('ebooks').delete().eq('id', ebook.id)

    if (error) {
      alert('Failed to delete: ' + error.message)
    } else {
      fetchEbooks()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900">eBooks</h1>
        <Link
          to="/admin/ebooks/new"
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          + Add New eBook
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-navy-400">Loading eBooks...</div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-16 text-navy-400">
            No eBooks yet. Click "Add New eBook" to create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-navy-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-5 py-3">Cover</th>
                  <th className="text-left px-5 py-3">Title</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {ebooks.map((ebook) => (
                  <tr key={ebook.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3">
                      <div className="w-10 h-14 bg-navy-100 rounded overflow-hidden">
                        {ebook.cover_image_url ? (
                          <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-400 text-xs">📖</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-navy-900">{ebook.title}</td>
                    <td className="px-5 py-3 text-navy-500">{ebook.categories?.name || '—'}</td>
                    <td className="px-5 py-3 text-navy-700">
                      {ebook.discount_price ? (
                        <>
                          <span className="font-medium">₹{ebook.discount_price}</span>{' '}
                          <span className="text-navy-400 line-through text-xs">₹{ebook.price}</span>
                        </>
                      ) : (
                        <span className="font-medium">₹{ebook.price}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => togglePublish(ebook)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          ebook.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-navy-100 text-navy-500'
                        }`}
                      >
                        {ebook.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right space-x-3">
                      <Link
                        to={`/admin/ebooks/${ebook.id}/edit`}
                        className="text-navy-600 hover:text-gold-600 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(ebook)}
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
