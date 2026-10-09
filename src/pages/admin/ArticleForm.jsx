import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

export default function ArticleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const quillRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) fetchArticle();
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  }

  async function fetchArticle() {
    setLoading(true);
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();

    if (error) {
      setError('Article load karne mein error: ' + error.message);
    } else if (data) {
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setSlugEdited(true);
      setCategoryId(data.category_id || '');
      setContent(data.content || '');
      setSeoTitle(data.seo_title || '');
      setSeoDescription(data.seo_description || '');
      setIsPublished(data.is_published || false);
      setExistingImageUrl(data.featured_image || '');
    }
    setLoading(false);
  }

  function handleTitleChange(value) {
    setTitle(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleFeaturedImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImageFile(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    }
  }

  // Custom image handler for Quill toolbar — uploads image to Supabase Storage
  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `inline-${Date.now()}.${fileExt}`;
      const filePath = `article-content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) {
        alert('Image upload failed: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, 'image', imageUrl);
      editor.setSelection(range.index + 1);
    };
  }

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['blockquote'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !slug.trim()) {
      setError('Title aur Slug zaroori hain.');
      return;
    }

    setSaving(true);

    let featuredImageUrl = existingImageUrl;

    try {
      if (featuredImageFile) {
        const fileExt = featuredImageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(filePath, featuredImageFile);

        if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

        const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(filePath);
        featuredImageUrl = urlData.publicUrl;
      }

      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        category_id: categoryId || null,
        content,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        is_published: isPublished,
        featured_image: featuredImageUrl || null,
      };

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await supabase.from('articles').insert(articleData);
        if (insertError) throw new Error(insertError.message);
      }

      navigate('/admin/articles');
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
        {isEditMode ? 'Article Edit Karein' : 'Naya Article Add Karein'}
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
            <p className="text-xs text-navy-400 mt-1">URL hoga: /articles/{slug || '...'}</p>
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
            <label className="block text-sm font-medium text-navy-700 mb-1">Featured Image</label>
            {(featuredImagePreview || existingImageUrl) && (
              <img
                src={featuredImagePreview || existingImageUrl}
                alt="Preview"
                className="w-40 h-28 object-cover rounded-lg mb-2 border border-navy-100"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageChange}
              className="block text-sm text-navy-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <label className="block text-sm font-medium text-navy-700 mb-2">Content *</label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            className="bg-white"
          />
          <p className="text-xs text-navy-400 mt-2">
            Toolbar se Bold, Italic, Headings, Lists, Link, aur Image insert kar sakte hain.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-navy-900">SEO Settings (Optional)</h3>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">SEO Description</label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900">Publish Status</p>
            <p className="text-xs text-navy-400">
              Published hone par ye article public website pe dikhega.
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
            {saving ? 'Saving...' : isEditMode ? 'Update Article' : 'Create Article'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="bg-navy-100 hover:bg-navy-200 text-navy-700 px-6 py-2.5 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
