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

export default function EbookForm() {
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
    description: '',
    author: '',
    price: '',
    discount_price: '',
    category_id: '',
    page_count: '',
    is_published: false,
  })

  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [existingCoverUrl, setExistingCoverUrl] = useState('')

  const [ebookFile, setEbookFile] = useState(null)
  const [existingFilePath, setExistingFilePath] = useState('')

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!isEdit) return

    async function fetchEbook() {
      setLoading(true)
      const { data, error } = await supabase.from('ebooks').select('*').eq('id', id).single()

      if (error || !data) {
        setError('Failed to load eBook.')
      } else {
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          author: data.author || '',
          price: data.price ?? '',
          discount_price: data.discount_price ?? '',
          category_id: data.category_id || '',
          page_count: data.page_count ?? '',
          is_published: data.is_published || false,
        })
        setExistingCoverUrl(data.cover_image_url || '')
        setExistingFilePath(data.file_path || '')
      }
      setLoading(false)
    }

    fetchEbook()
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

  function handleCoverChange(e) {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  function handleEbookFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setEbookFile(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.slug.trim() || !form.price) {
      setError('Title, slug, and price are required.')
      return
    }

    setSaving(true)

    try {
      let coverUrl = existingCoverUrl
      let filePath = existingFilePath

      // Upload cover image if a new one was selected
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const fileName = `${form.slug}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('ebook-covers')
          .upload(fileName, coverFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('ebook-covers')
          .getPublicUrl(fileName)

        coverUrl = publicUrlData.publicUrl
      }

      // Upload ebook file (PDF/EPUB) if a new one was selected
      if (ebookFile) {
        const ext = ebookFile.name.split('.').pop()
        const fileName = `${form.slug}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('ebook-files')
          .upload(fileName, ebookFile, { upsert: true })

        if (uploadError) throw uploadError

        filePath = fileName // store path only — this bucket is private
      }

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        author: form.author.trim(),
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        category_id: form.category_id || null,
        page_count: form.page_count ? parseInt(form.page_count) : null,
        is_published: form.is_published,
        cover_image_url: coverUrl || null,
        file_path: filePath || null,
        updated_at: new Date().toISOString(),
      }

      if (isEdit) {
        const { error: updateError } = await supabase.from('ebooks').update(payload).eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('ebooks').insert([payload])
        if (insertError) throw insertError
      }

      navigate('/admin/ebooks')
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) 
