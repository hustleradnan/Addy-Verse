import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError('Categories load karne mein error: ' + error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Category ka naam likhna zaroori hai.');
      return;
    }

    setSaving(true);

    const slug = slugify(name);

    const { error } = await supabase.from('categories').insert({
      name: name.trim(),
      slug,
      description: description.trim() || null,
    });

    if (error) {
      setError('Category add karne mein error: ' + error.message);
    } else {
      setSuccess('Category successfully add ho gayi!');
      setName('');
      setDescription('');
      fetchCategories();
    }
    setSaving(false);
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  }

  async function handleUpdateCategory(id) {
    setError('');
    setSuccess('');

    if (!editName.trim()) {
      setError('Category ka naam likhna zaroori hai.');
      return;
    }

    setEditSaving(true);

    const slug = slugify(editName);

    const { error } = await supabase
      .from('categories')
      .update({
        name: editName.trim(),
        slug,
        description: editDescription.trim() || null,
      })
      .eq('id', id);

    if (error) {
      setError('Category update karne mein error: ' + error.message);
    } else {
      setSuccess('Category successfully update ho gayi!');
      cancelEdit();
      fetchCategories();
    }
    setEditSaving(false);
  }

  async function handleDeleteCategory(id) {
    const confirmed = window.confirm(
      'Kya aap sach mein ye category delete karna chahte hain? Agar kisi ebook/article mein ye category use ho rahi hai, to delete fail ho sakta hai.'
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    setSuccess('');

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      setError(
        'Category delete nahi ho payi. Shayad ye kisi ebook ya article mein use ho rahi hai. Error: ' +
          error.message
      );
    } else {
      setSuccess('Category delete ho gayi.');
      fetchCategories();
    }
    setDeletingId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">
        Categories Manage Karein
      </h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add New Category Form */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Nayi Category Add Karein</h2>
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Category Naam *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Business, Self-Help, Technology"
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chhota sa description"
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 sm:mt-7 bg-navy-900 hover:bg-navy-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Add ho raha hai...' : '+ Add Category'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <p className="text-navy-500 p-6">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-navy-500 p-6">Abhi tak koi category add nahi hui hai.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Naam</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Slug</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Description</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-navy-50 last:border-0">
                  {editingId === cat.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                        />
                      </td>
                      <td className="px-6 py-3 text-navy-400 text-sm">
                        {slugify(editName)}
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-1.5 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                        />
                      </td>
                      <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdateCategory(cat.id)}
                          disabled={editSaving}
                          className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {editSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-navy-100 hover:bg-navy-200 text-navy-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 text-navy-900 font-medium">{cat.name}</td>
                      <td className="px-6 py-3 text-navy-400 text-sm">{cat.slug}</td>
                      <td className="px-6 py-3 text-navy-600 text-sm">
                        {cat.description || '—'}
                      </td>
                      <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(cat)}
                          className="bg-navy-100 hover:bg-navy-200 text-navy-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {deletingId === cat.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
