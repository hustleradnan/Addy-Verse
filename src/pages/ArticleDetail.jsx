import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (article) {
      document.title = article.seo_title || article.title;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        article.seo_description || article.title
      );
    }
  }, [article]);

  async function fetchArticle() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('articles')
      .select('*, categories ( name, slug )')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      setError('Ye article nahi mila ya abhi published nahi hai.');
    } else {
      setArticle(data);
    }
    setLoading(false);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-navy-500">
        Loading...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-navy-700 font-medium mb-4">{error}</p>
        <Link to="/articles" className="text-gold-600 hover:underline">
          ← Sabhi Articles par wapas jayein
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {article.categories && (
        <Link
          to={`/categories/${article.categories.slug}`}
          className="inline-block text-xs font-medium text-gold-600 bg-gold-50 px-3 py-1 rounded-full mb-4 hover:bg-gold-100 transition"
        >
          {article.categories.name}
        </Link>
      )}

      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-3 leading-tight">
        {article.title}
      </h1>

      <p className="text-navy-400 text-sm mb-8">
        {formatDate(article.created_at)}
      </p>

      {article.featured_image && (
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full h-72 sm:h-96 object-cover rounded-xl shadow-card mb-8"
        />
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="mt-12 pt-6 border-t border-navy-100">
        <Link to="/articles" className="text-gold-600 hover:underline text-sm font-medium">
          ← Sabhi Articles dekhein
        </Link>
      </div>
    </div>
  );
}
