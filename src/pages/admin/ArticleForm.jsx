import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ArticleForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    category_id: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!isEdit) return

    async function fetchArticle() {
      setLoading(true)
      const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()

      if (error || !data) {
        setError('Failed to load article.')
      } else {
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          category_id: data.category_id || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          is_published: data.is_published || false,
        })
        setExistingImageUrl(data.featured_image_url || '')
      }
      setLoading(false)
    }

    fetchArticle()
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'title' && !isEdit) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError('Title, slug, and content are required.')
      return
    }

    setSaving(true)

    try {
      let imageUrl = existingImageUrl

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${form.slug}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('article-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrlData.publicUrl
      }

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content,
        category_id: form.category_id || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        is_published: form.is_published,
        featured_image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      }

      if (isEdit) {
        const { error: updateError } = await supabase.from('articles').update(payload).eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('articles').insert([payload])
        if (insertError) throw insertError
      }

      navigate('/admin/articles')
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-navy-400">Loading...</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/articles" className="text-navy-400 hover:text-navy-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-serif-heading font-bold text-navy-900">
          {isEdit ? 'Edit Article' : 'Add New Article'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Slug (URL) *</label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <p className="text-xs text-navy-400 mt-1">
            Website link will be: /articles/{form.slug || 'your-slug'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="">— Select —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Content *</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={10}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Featured Image</label>
          {(imagePreview || existingImageUrl) && (
            <img
              src={imagePreview || existingImageUrl}
              alt="Preview"
              className="w-full max-w-xs h-32 object-cover rounded-lg mb-2 border border-navy-200"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-navy-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-navy-100 file:text-navy-700 hover:file:bg-navy-200"
          />
        </div>

        <div className="border-t border-navy-100 pt-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-3">SEO Settings (Optional)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">SEO Title</label>
              <input
                type="text"
                name="seo_title"
                value={form.seo_title}
                onChange={handleChange}
                placeholder="Defaults to article title if left blank"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">SEO Description</label>
              <textarea
                name="seo_description"
                value={form.seo_description}
                onChange={handleChange}
                rows={2}
                placeholder="A short summary shown in search engine results"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-navy-700">
            Publish this article (visible to visitors)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article'}
          </button>
          <Link
            to="/admin/articles"
            className="bg-navy-100 hover:bg-navy-200 text-navy-700 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
