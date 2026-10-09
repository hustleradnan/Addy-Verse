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

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    isStaff: ['super_admin', 'admin', 'editor'].includes(profile?.roles?.name),
    isSuperAdmin: profile?.roles?.name === 'super_admin',
    isAdminOrSuper: ['super_admin', 'admin'].includes(profile?.roles?.name),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
