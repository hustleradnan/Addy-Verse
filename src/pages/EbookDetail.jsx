import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function EbookDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchEbook();
  }, [slug]);

  async function fetchEbook() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('ebooks')
      .select('*, categories ( name, slug )')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      setError('Ye eBook nahi mila ya abhi published nahi hai.');
    } else {
      setEbook(data);
    }
    setLoading(false);
  }

  function handleActionClick() {
    setActionMessage('');

    // Guest user: redirect to login, remember where to come back after login
    if (!user) {
      navigate('/login', { state: { from: `/ebooks/${slug}` } });
      return;
    }

    // Logged in user: payment/download not implemented yet (Phase 3 & 4)
    const isFree = !ebook.price || Number(ebook.price) === 0;
    setActionMessage(
      isFree
        ? 'Free download jald hi available hoga. Dhanyavaad!'
        : 'Payment system jald hi available hoga. Dhanyavaad!'
    );
  }

  function formatPrice(price, discountPrice) {
    const hasDiscount = discountPrice && Number(discountPrice) < Number(price);
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-navy-900">
          ₹{hasDiscount ? discountPrice : price}
        </span>
        {hasDiscount && (
          <span className="text-lg text-navy-400 line-through">₹{price}</span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-navy-500">
        Loading...
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-navy-700 font-medium mb-4">{error}</p>
        <Link to="/ebooks" className="text-gold-600 hover:underline">
          ← Sabhi eBooks par wapas jayein
        </Link>
      </div>
    );
  }

  const isFree = !ebook.price || Number(ebook.price) === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Cover Image */}
        <div className="md:col-span-2">
          <img
            src={ebook.cover_image}
            alt={ebook.title}
            className="w-full rounded-xl shadow-card object-cover"
          />
        </div>

        {/* Details */}
        <div className="md:col-span-3">
          {ebook.categories && (
            <Link
              to={`/categories/${ebook.categories.slug}`}
              className="inline-block text-xs font-medium text-gold-600 bg-gold-50 px-3 py-1 rounded-full mb-4 hover:bg-gold-100 transition"
            >
              {ebook.categories.name}
            </Link>
          )}

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 mb-2 leading-tight">
            {ebook.title}
          </h1>

          <p className="text-navy-500 mb-4">by {ebook.author}</p>

          <div className="mb-4">{formatPrice(ebook.price, ebook.discount_price)}</div>

          {ebook.page_count && (
            <p className="text-navy-400 text-sm mb-6">{ebook.page_count} pages</p>
          )}

          <p className="text-navy-700 leading-relaxed mb-8 whitespace-pre-line">
            {ebook.description}
          </p>

          <button
            onClick={handleActionClick}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-3 rounded-lg font-semibold transition shadow-card"
          >
            {isFree ? 'Get Free Copy' : 'Buy Now'}
          </button>

          {!user && (
            <p className="text-navy-400 text-sm mt-3">
              {isFree ? 'Download' : 'Purchase'} karne ke liye login ya signup karna zaroori hai.
            </p>
          )}

          {actionMessage && (
            <div className="mt-4 bg-navy-50 border border-navy-200 text-navy-700 px-4 py-3 rounded-lg text-sm">
              {actionMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-navy-100">
        <Link to="/ebooks" className="text-gold-600 hover:underline text-sm font-medium">
          ← Sabhi eBooks dekhein
        </Link>
      </div>
    </div>
  );
}
