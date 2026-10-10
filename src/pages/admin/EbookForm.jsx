import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function EbookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState('');

  const [ebookFile, setEbookFile] = useState(null);
  const [existingFilePath, setExistingFilePath] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) fetchEbook();
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  }

  async function fetchEbook() {
    setLoading(true);
    const { data, error } = await supabase.from('ebooks').select('*').eq('id', id).single();

    if (error) {
      setError('eBook load karne mein error: ' + error.message);
    } else if (data) {
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setSlugEdited(true);
      setAuthor(data.author || '');
      setDescription(data.description || '');
      setCategoryId(data.category_id || '');
      setPrice(data.price ?? '');
      setDiscountPrice(data.discount_price ?? '');
      setPageCount(data.page_count ?? '');
      setIsPublished(data.is_published || false);
      setExistingCoverUrl(data.cover_image || '');
      setExistingFilePath(data.file_path || '');
    }
    setLoading(false);
  }

  function handleTitleChange(value) {
    setTitle(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  function handleEbookFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setEbookFile(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !slug.trim() || !author.trim() || !price) {
      setError('Title, Slug, Author, aur Price zaroori hain.');
      return;
    }

    setSaving(true);

    let coverImageUrl = existingCoverUrl;
    let filePath = existingFilePath;

    try {
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const uploadPath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ebook-covers')
          .upload(uploadPath, coverFile);

        if (uploadError) throw new Error('Cover image upload failed: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('ebook-covers').getPublicUrl(uploadPath);
        coverImageUrl = urlData.publicUrl;
      }

      if (ebookFile) {
        const fileExt = ebookFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const uploadPath = `files/${fileName}`;

        const { error: fileUploadError } = await supabase.storage
          .from('ebook-files')
          .upload(uploadPath, ebookFile);

        if (fileUploadError) throw new Error('eBook file upload failed: ' + fileUploadError.message);

        filePath = uploadPath;
      }

      const ebookData = {
        title: title.trim(),
        slug: slug.trim(),
        author: author.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        page_count: pageCount ? Number(pageCount) : null,
        is_published: isPublished,
        cover_image: coverImageUrl || null,
        file_path: filePath || null,
      };

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('ebooks')
          .update(ebookData)
          .eq('id', id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await supabase.from('ebooks').insert(ebookData);
        if (insertError) throw new Error(insertError.message);
      }

      navigate('/admin/ebooks');
    } catch (err) {
      setError(err.message);
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-navy-500">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">
        {isEditMode ? 'eBook Edit Karein' : 'Naya eBook Add Karein'}
      </h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Slug (URL) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
            <p className="text-xs text-navy-400 mt-1">URL hoga: /ebooks/{slug || '...'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Author *</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Price (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
            <p className="text-xs text-navy-400 mt-1">0 rakhein agar eBook free hai.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Discount Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Page Count</label>
            <input
              type="number"
              min="0"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Cover Image</label>
            {(coverPreview || existingCoverUrl) && (
              <img
                src={coverPreview || existingCoverUrl}
                alt="Cover Preview"
                className="w-32 h-44 object-cover rounded-lg mb-2 border border-navy-100"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="block text-sm text-navy-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">eBook File (PDF)</label>
            {existingFilePath && !ebookFile && (
              <p className="text-sm text-navy-500 mb-2">
                Current file: {existingFilePath.split('/').pop()}
              </p>
            )}
            {ebookFile && (
              <p className="text-sm text-green-600 mb-2">Nayi file select ki gayi: {ebookFile.name}</p>
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={handleEbookFileChange}
              className="block text-sm text-navy-600"
            />
            <p className="text-xs text-navy-400 mt-1">
              Ye file private storage mein save hogi — kabhi public URL nahi milega (Phase 4 mein secure download setup hoga).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900">Publish Status</p>
            <p className="text-xs text-navy-400">
              Published hone par ye eBook public website pe dikhega.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-navy-200 rounded-full peer peer-checked:bg-gold-500 transition"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditMode ? 'Update eBook' : 'Create eBook'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/ebooks')}
            className="bg-navy-100 hover:bg-navy-200 text-navy-700 px-6 py-2.5 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
