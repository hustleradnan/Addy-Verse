import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      setError('Pages load karne mein error: ' + error.message);
    } else {
      setPages(data || []);
    }
    setLoading(false);
  }

  async function togglePublish(page) {
    const { error } = await supabase
      .from('pages')
      .update({ is_published: !page.is_published, updated_at: new Date().toISOString() })
      .eq('id', page.id);

    if (error) {
      alert('Status update karne mein error: ' + error.message);
    } else {
      fetchPages();
    }
  }

  async function handleDelete(page) {
    const confirmed = window.confirm(`Kya aap "${page.title}" page delete karna chahte hain?`);
    if (!confirmed) return;

    const { error } = await supabase.from('pages').delete().eq('id', page.id);

    if (error) {
      alert('Delete karne mein error: ' + error.message);
    } else {
      fetchPages();
    }
  }

  if (loading) {
    return <p className="text-navy-500">Loading...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-navy-900">Pages</h1>
        <Link
          to="/admin/pages/new"
          className="bg-navy-900 hover:bg-navy-800 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          + Naya Page Add Karein
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {pages.length === 0 ? (
          <p className="text-navy-500 p-6">Abhi tak koi page add nahi kiya gaya.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-navy-50 text-navy-700 text-sm">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="px-6 py-4 font-medium text-navy-900">{page.title}</td>
                  <td className="px-6 py-4 text-navy-500">/pages/{page.slug}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(page)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        page.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-navy-100 text-navy-500'
                      }`}
                    >
                      {page.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <Link
                      to={`/admin/pages/${page.id}`}
                      className="text-gold-600 hover:text-gold-700 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(page)}
                      className="text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}