import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Footer() {
  const [siteName, setSiteName] = useState('BookVault');
  const [logoEmoji, setLogoEmoji] = useState('📚');
  const [tagline, setTagline] = useState('Premium eBooks & Articles');
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetchGeneralContent();
    fetchPublishedPages();
  }, []);

  async function fetchGeneralContent() {
    const { data } = await supabase
      .from('site_content')
      .select('content')
      .eq('page_key', 'general')
      .single();

    if (data?.content) {
      setSiteName(data.content.site_name || 'BookVault');
      setLogoEmoji(data.content.logo_emoji || '📚');
      setTagline(data.content.tagline || 'Premium eBooks & Articles');
    }
  }

  async function fetchPublishedPages() {
    const { data } = await supabase
      .from('pages')
      .select('title, slug')
      .eq('is_published', true)
      .order('title', { ascending: true });

    setPages(data || []);
  }

  return (
    <footer className="bg-navy-900 text-navy-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-white text-xl font-serif font-bold mb-3">
              <span>{logoEmoji}</span>
              <span>{siteName}</span>
            </Link>
            <p className="text-navy-400 text-sm">{tagline}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ebooks" className="hover:text-gold-400 transition">eBooks</Link></li>
              <li><Link to="/articles" className="hover:text-gold-400 transition">Articles</Link></li>
              <li><Link to="/categories" className="hover:text-gold-400 transition">Categories</Link></li>
              <li><Link to="/about" className="hover:text-gold-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-gold-400 transition">Login</Link></li>
              <li><Link to="/account" className="hover:text-gold-400 transition">My Account</Link></li>
              <li><Link to="/purchases" className="hover:text-gold-400 transition">My Purchases</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            {pages.length === 0 ? (
              <p className="text-navy-500 text-sm">Coming soon</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {pages.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/pages/${p.slug}`} className="hover:text-gold-400 transition">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-navy-800 mt-10 pt-6 text-center text-navy-500 text-sm">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
