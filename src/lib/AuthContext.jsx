import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user, mounted);
      } else {
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user, mounted);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Apply site branding (title + favicon) from DB on first load
  useEffect(() => {
    async function applySiteBranding() {
      const { data } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_key', 'general')
        .single();

      if (data?.content) {
        if (data.content.site_name) {
          document.title = data.content.site_name;
        }

        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }

        if (data.content.favicon_url) {
          // Uploaded image takes priority
          link.href = data.content.favicon_url;
        } else if (data.content.logo_emoji) {
          // Convert emoji into a favicon using an SVG data URL (no upload needed)
          const emoji = data.content.logo_emoji;
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="80">${emoji}</text></svg>`;
          link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        }
      }
    }

    applySiteBranding();
  }, []);

  async function loadUserProfile(authUser, mounted = true) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active, role_id, roles ( name )')
      .eq('id', authUser.id)
      .single();

    if (!mounted) return;

    if (error || !profileData) {
      setUser(authUser);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (profileData.is_active === false) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
      alert('Aapka account disable kar diya gaya hai. Kripya support se contact karein.');
      return;
    }

    setUser(authUser);
    setProfile(profileData);
    setLoading(false);
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    if (data?.user) {
      await loadUserProfile(data.user, true);
    }
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isStaff: ['super_admin', 'admin', 'editor'].includes(profile?.roles?.name),
    isSuperAdmin: profile?.roles?.name === 'super_admin',
    isAdminOrSuper: ['super_admin', 'admin'].includes(profile?.roles?.name),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
