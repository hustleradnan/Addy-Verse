import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import ShareButtons from '../components/ShareButtons';

export default function EbookDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);

  useEffect(() => {
    fetchEbook();
  }, [slug]);

  useEffect(() => {
    if (ebook && user) {
      checkOwnership();
    } else {
      setAlreadyOwned(false);
    }
  }, [ebook, user]);

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

  async function checkOwnership() {
    setCheckingOwnership(true);
    const { data } = await supabase
      .from('downloads')
      .select('id')
      .eq('user_id', user.id)
      .eq('ebook_id', ebook.id)
      .maybeSingle();

    setAlreadyOwned(!!data);
    setCheckingOwnership(false);
  }

  async function getAuthToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleGetFreeCopy() {
    setActionMessage('');
    setActionError('');
    setProcessing(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setActionError('Session expire ho gayi hai. Dobara login karein.');
        setProcessing(false);
        return;
      }

      const res = await fetch('/api/claim-free-ebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebook_id: ebook.id }),
      });

      const result = await res.json();

      if (!res.ok) {
        setActionError(result.error || 'Kuch galat ho gaya.');
      } else {
        setActionMessage('Aapne ye eBook successfully claim kar li hai! "My Purchases" page par jaakar dekhein.');
        setAlreadyOwned(true);
      }
    } catch (err) {
      setActionError('Server error: ' + err.message);
    }

    setProcessing(false);
  }

  async function handleBuyNow() {
    setActionMessage('');
    setActionError('');
    setProcessing(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setActionError('Session expire ho gayi hai. Dobara login karein.');
        setProcessing(false);
        return;
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebook_id: ebook.id }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        setActionError(orderData.error || 'Order create karne mein error aayi.');
        setProcessing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setActionError('Payment gateway load nahi ho paya. Internet check karein.');
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BookVault',
        description: orderData.ebook_title,
        order_id: orderData.razorpay_order_id,
        handler: async function (response) {
          setProcessing(true);
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderData.order_id,
              }),
            });

            const verifyResult = await verifyRes.json();

            if (!verifyRes.ok) {
              setActionError(verifyResult.error || 'Payment verify nahi ho paya.');
            } else {
              setActionMessage('Payment successful! "My Purchases" page par jaakar apni eBook dekhein.');
              setAlreadyOwned(true);
            }
          } catch (err) {
            setActionError('Verification error: ' + err.message);
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
        theme: {
          color: '#0f172a',
        },
      };

      const razorpayObject = new window.Razorpay(options);
      razorpayObject.open();
      setProcessing(false);
    } catch (err) {
      setActionError('Server error: ' + err.message);
      setProcessing(false);
    }
  }

  function handleActionClick() {
    setActionMessage('');
    setActionError('');

    if (!user) {
      navigate('/login', { state: { from: `/ebooks/${slug}` } });
      return;
    }

    const isFree = !ebook.price || Number(ebook.price) === 0;

    if (isFree) {
      handleGetFreeCopy();
    } else {
      handleBuyNow();
    }
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
        <div className="md:col-span-2">
          <img
            src={ebook.cover_image}
            alt={ebook.title}
            className="w-full rounded-xl shadow-card object-cover"
          />
        </div>

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

          {alreadyOwned ? (
            <Link
              to="/purchases"
              className="inline-block bg-navy-900 hover:bg-navy-800 text-white px-8 py-3 rounded-lg font-semibold transition shadow-card"
            >
              ✓ Already Purchased — Go to My Purchases
            </Link>
          ) : (
            <button
              onClick={handleActionClick}
              disabled={processing || checkingOwnership}
              className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-3 rounded-lg font-semibold transition shadow-card disabled:opacity-60"
            >
              {processing ? 'Processing...' : isFree ? 'Get Free Copy' : 'Buy Now'}
            </button>
          )}

          {!user && (
            <p className="text-navy-400 text-sm mt-3">
              {isFree ? 'Download' : 'Purchase'} karne ke liye login ya signup karna zaroori hai.
            </p>
          )}

          {actionMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {actionError}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-navy-100">
            <ShareButtons title={ebook.title} url={`/ebooks/${ebook.slug}`} />
          </div>
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
