import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    setError('');

    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'customer')
      .single();

    if (roleError || !roleData) {
      setError('Customer role fetch karne mein error.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active, created_at')
      .eq('role_id', roleData.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Customers load karne mein error: ' + error.message);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }

  async function toggleActive(customer) {
    const action = customer.is_active ? 'disable' : 'enable';
    const confirmed = window.confirm(
      `Kya aap sach mein is customer ka account ${action === 'disable' ? 'disable' : 'enable'} karna chahte hain?`
    );
    if (!confirmed) return;

    setTogglingId(customer.id);
    setError('');
    setSuccess('');

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !customer.is_active })
      .eq('id', customer.id);

    if (error) {
      setError('Status update karne mein error: ' + error.message);
    } else {
      setSuccess(`Customer account ${action === 'disable' ? 'disable' : 'enable'} ho gaya.`);
      fetchCustomers();
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

  const filteredCustomers = customers.filter((c) => {
    if (search.trim() === '') return true;
    const text = `${c.full_name || ''} ${c.email || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">Customers</h1>

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

      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Naam ya email se search karein..."
          className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="text-navy-500 p-6">Loading...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-navy-500 p-6">Abhi tak koi customer register nahi hua hai.</p>
        ) : (
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Naam</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Email</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Joined</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-3 text-navy-900 font-medium">
                    {c.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-3 text-navy-600 text-sm">{c.email}</td>
                  <td className="px-6 py-3 text-navy-500 text-sm">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        c.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={togglingId === c.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        c.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-600'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      {togglingId === c.id
                        ? 'Updating...'
                        : c.is_active
                        ? 'Disable'
                        : 'Enable'}
                    </button>
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
