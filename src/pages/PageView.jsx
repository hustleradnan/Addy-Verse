import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PageView() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPage();
  }, [slug]);

  useEffect(() => {
    if (page) {
      document.title = page.seo_title || page.title;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', page.seo_description || page.title);
    }
  }, [page]);

  async function fetchPage() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      setError('Ye page nahi mila ya abhi published nahi hai.');
    } else {
      setPage(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-navy-500">
        Loading...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-navy-700 font-medium mb-4">{error}</p>
        <Link to="/" className="text-gold-600 hover:underline">
          ← Home par wapas jayein
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-8 leading-tight">
        {page.title}
      </h1>

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
