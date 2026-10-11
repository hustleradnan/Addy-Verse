import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

const TABS = [
  { key: 'general', label: 'General / Branding' },
  { key: 'about', label: 'About Page' },
  { key: 'contact', label: 'Contact Page' },
];

export default function Settings() {
  const { isAdminOrSuper } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const [general, setGeneral] = useState({ site_name: '', logo_emoji: '', tagline: '', favicon_url: '' });
  const [about, setAbout] = useState({
    heading: '',
    intro: '',
    mission: '',
    why_choose_us: [],
    our_story: '',
  });
  const [contact, setContact] = useState({ heading: '', intro: '', email: '', phone: '', address: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('site_content')
      .select('page_key, content')
      .in('page_key', ['general', 'about', 'contact']);

    if (error) {
      setError('Settings load karne mein error: ' + error.message);
      setLoading(false);
      return;
    }

    const generalRow = data.find((d) => d.page_key === 'general');
    const aboutRow = data.find((d) => d.page_key === 'about');
    const contactRow = data.find((d) => d.page_key === 'contact');

    if (generalRow) {
      setGeneral({ site_name: '', logo_emoji: '', tagline: '', favicon_url: '', ...generalRow.content });
    }

    if (aboutRow) {
      const mergedAbout = {
        heading: '',
        intro: '',
        mission: '',
        our_story: '',
        ...aboutRow.content,
      };
      setAbout({
        ...mergedAbout,
        why_choose_us: aboutRow.content.why_choose_us || [],
      });
    }

    if (contactRow) setContact({ heading: '', intro: '', email: '', phone: '', address: '', ...contactRow.content });

    setLoading(false);
  }

  async function saveSection(pageKey, content) {
    setError('');
    setSuccess('');
    setSaving(true);

    const { error } = await supabase
      .from('site_content')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('page_key', pageKey);

    if (error) {
      setError('Save karne mein error: ' + error.message);
    } else {
      setSuccess('Changes successfully save ho gaye! Naya favicon/title dikhne ke liye page ko refresh karein.');
    }
    setSaving(false);
  }

  async function handleFaviconUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFavicon(true);
    setError('');

    const fileExt = file.name.split('.').pop();
    const fileName = `favicon-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError('Favicon upload karne mein error: ' + uploadError.message);
      setUploadingFavicon(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
    setGeneral({ ...general, favicon_url: urlData.publicUrl });
    setUploadingFavicon(false);
  }

  function updateWhyChooseUs(index, value) {
    const updated = [...about.why_choose_us];
    updated[index] = value;
    setAbout({ ...about, why_choose_us: updated });
  }

  function addWhyChooseUsItem() {
    setAbout({ ...about, why_choose_us: [...about.why_choose_us, ''] });
  }

  function removeWhyChooseUsItem(index) {
    const updated = about.why_choose_us.filter((_, i) => i !== index);
    setAbout({ ...about, why_choose_us: updated });
  }

  if (!isAdminOrSuper) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <p className="text-navy-700 font-medium">
          Ye page sirf Admin/Super Admin ke liye accessible hai.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">Website Settings</h1>

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-navy-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError('');
              setSuccess('');
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? 'border-gold-500 text-navy-900'
                : 'border-transparent text-navy-400 hover:text-navy-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-navy-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-card p-6">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Website Ka Naam
                </label>
                <input
                  type="text"
                  value={general.site_name}
                  onChange={(e) => setGeneral({ ...general, site_name: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Logo Emoji (e.g. 📚, 📖, ✨)
                </label>
                <input
                  type="text"
                  value={general.logo_emoji}
                  onChange={(e) => setGeneral({ ...general, logo_emoji: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={general.tagline}
                  onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Browser Tab Icon (Favicon / Logo)
                </label>
                <p className="text-xs text-navy-400 mb-2">
                  Ye icon browser ke tab mein aur bookmark mein dikhega. Square image best rehti hai (jaise 512x512px PNG).
                </p>
                <div className="flex items-center gap-4">
                  {general.favicon_url ? (
                    <img
                      src={general.favicon_url}
                      alt="Current favicon"
                      className="w-12 h-12 rounded-lg border border-navy-200 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-navy-200 flex items-center justify-center text-navy-300 text-xs">
                      None
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      disabled={uploadingFavicon}
                      className="text-sm"
                    />
                    {uploadingFavicon && (
                      <p className="text-xs text-navy-400 mt-1">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => saveSection('general', general)}
                disabled={saving}
                className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Heading</label>
                <input
                  type="text"
                  value={about.heading}
                  onChange={(e) => setAbout({ ...about, heading: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Intro Paragraph</label>
                <textarea
                  rows={3}
                  value={about.intro}
                  onChange={(e) => setAbout({ ...about, intro: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Mission Paragraph</label>
                <textarea
                  rows={3}
                  value={about.mission}
                  onChange={(e) => setAbout({ ...about, mission: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  "Why Choose Us" List
                </label>
                <div className="space-y-2">
                  {about.why_choose_us.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateWhyChooseUs(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                      <button
                        onClick={() => removeWhyChooseUsItem(index)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 rounded-lg text-sm font-medium transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addWhyChooseUsItem}
                  className="mt-2 bg-navy-100 hover:bg-navy-200 text-navy-700 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  + Add Point
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Our Story Paragraph</label>
                <textarea
                  rows={3}
                  value={about.our_story}
                  onChange={(e) => setAbout({ ...about, our_story: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <button
                onClick={() => saveSection('about', about)}
                disabled={saving}
                className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Heading</label>
                <input
                  type="text"
                  value={contact.heading}
                  onChange={(e) => setContact({ ...contact, heading: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Intro Paragraph</label>
                <textarea
                  rows={2}
                  value={contact.intro}
                  onChange={(e) => setContact({ ...contact, intro: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Address</label>
                <input
                  type="text"
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <button
                onClick={() => saveSection('contact', contact)}
                disabled={saving}
                className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
