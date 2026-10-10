import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

export default function AdminUsers() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.roles?.name === 'super_admin';

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('editor');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active, created_at, roles ( name )')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Staff list load karne mein error: ' + error.message);
    } else {
      const staffOnly = (data || []).filter(
        (p) => p.roles?.name && p.roles.name !== 'customer'
      );
      setStaff(staffOnly);
    }
    setLoading(false);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Sabhi fields bharna zaroori hai.');
      return;
    }

    if (password.length < 8) {
      setError('Password kam se kam 8 characters ka hona chahiye.');
      return;
    }

    setCreating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError('Session expire ho gaya hai. Dobara login karein.');
        setCreating(false);
        return;
      }

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Account create karne mein error aayi.');
      } else {
        setSuccess(`${role === 'admin' ? 'Admin' : 'Editor'} account successfully ban gaya!`);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('editor');
        fetchStaff();
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }

    setCreating(false);
  }

  async function toggleActive(member) {
    if (member.roles?.name === 'super_admin') {
      setError('Super Admin account ko disable nahi kiya ja sakta.');
      return;
    }

    const action = member.is_active ? 'disable' : 'enable';
    const confirmed = window.confirm(
      `Kya aap sach mein is account ko ${action} karna chahte hain?`
    );
    if (!confirmed) return;

    setTogglingId(member.id);
    setError('');
    setSuccess('');

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !member.is_active })
      .eq('id', member.id);

    if (error) {
      setError('Status update karne mein error: ' + error.message);
    } else {
      setSuccess(`Account ${action} ho gaya.`);
      fetchStaff();
    }
    setTogglingId(null);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function roleBadge(roleName) {
    const map = {
      super_admin: 'bg-gold-100 text-gold-800 border-gold-300',
      admin: 'bg-navy-100 text-navy-800 border-navy-300',
      editor: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
          map[roleName] || 'bg-navy-50 text-navy-500 border-navy-200'
        }`}
      >
        {roleName?.replace('_', ' ') || 'N/A'}
      </span>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <p className="text-navy-700 font-medium">
          Ye page sirf Super Admin ke liye accessible hai.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">
        Admin / Editor Accounts
      </h1>

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

      {/* Create New Staff Account */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Naya Admin / Editor Account Banayein
        </h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kam se kam 8 characters"
                className="w-full px-4 py-2 pr-12 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 text-sm"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {creating ? 'Account ban raha hai...' : '+ Create Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="text-navy-500 p-6">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-navy-500 p-6">Koi staff account nahi mila.</p>
        ) : (
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Naam</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Email</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Role</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Joined</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-3 text-navy-900 font-medium">
                    {member.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-3 text-navy-600 text-sm">{member.email}</td>
                  <td className="px-6 py-3">{roleBadge(member.roles?.name)}</td>
                  <td className="px-6 py-3 text-navy-500 text-sm">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        member.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {member.roles?.name !== 'super_admin' && (
                      <button
                        onClick={() => toggleActive(member)}
                        disabled={togglingId === member.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                          member.is_active
                            ? 'bg-red-50 hover:bg-red-100 text-red-600'
                            : 'bg-green-50 hover:bg-green-100 text-green-700'
                        }`}
                      >
                        {togglingId === member.id
                          ? 'Updating...'
                          : member.is_active
                          ? 'Disable'
                          : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
