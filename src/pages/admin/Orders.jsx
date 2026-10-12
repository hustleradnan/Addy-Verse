import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        profiles:user_id ( full_name, email ),
        order_items (
          id,
          price,
          ebooks ( title )
        ),
        payments (
          status,
          razorpay_payment_id,
          method
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Orders load karne mein error: ' + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusBadge(status) {
    const map = {
      paid: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-gold-50 text-gold-700 border-gold-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-navy-50 text-navy-500 border-navy-200',
    };
    const classes = map[status] || 'bg-navy-50 text-navy-500 border-navy-200';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${classes}`}>
        {status || 'unknown'}
      </span>
    );
  }

  // ----- Sales Analytics Calculations -----
  const analytics = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === 'paid');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let revenueAllTime = 0;
    let revenueLast30 = 0;
    let revenueToday = 0;

    const bookStats = {};

    paidOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const amount = Number(order.total_amount) || 0;

      revenueAllTime += amount;
      if (orderDate >= thirtyDaysAgo) revenueLast30 += amount;
      if (orderDate >= startOfToday) revenueToday += amount;

      (order.order_items || []).forEach((item) => {
        const title = item.ebooks?.title || 'Unknown eBook';
        const price = Number(item.price) || 0;

        if (!bookStats[title]) {
          bookStats[title] = { title, unitsSold: 0, revenue: 0 };
        }
        bookStats[title].unitsSold += 1;
        bookStats[title].revenue += price;
      });
    });

    const bookBreakdown = Object.values(bookStats).sort((a, b) => b.revenue - a.revenue);

    return {
      totalPaidOrders: paidOrders.length,
      revenueAllTime,
      revenueLast30,
      revenueToday,
      bookBreakdown,
    };
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    const customerText = `${order.profiles?.full_name || ''} ${order.profiles?.email || ''}`.toLowerCase();
    const ebookTitles = (order.order_items || [])
      .map((item) => item.ebooks?.title || '')
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      search.trim() === '' ||
      customerText.includes(search.toLowerCase()) ||
      ebookTitles.includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-navy-900 mb-6">Orders & Sales Analytics</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Sales Analytics Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-navy-400 text-sm mb-1">Total Revenue (All Time)</p>
            <p className="text-2xl font-bold text-navy-900">₹{analytics.revenueAllTime.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-navy-400 text-sm mb-1">Revenue (Last 30 Days)</p>
            <p className="text-2xl font-bold text-navy-900">₹{analytics.revenueLast30.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-navy-400 text-sm mb-1">Revenue (Today)</p>
            <p className="text-2xl font-bold text-navy-900">₹{analytics.revenueToday.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-navy-400 text-sm mb-1">Total Paid Orders</p>
            <p className="text-2xl font-bold text-navy-900">{analytics.totalPaidOrders}</p>
          </div>
        </div>
      )}

      {/* Per-eBook Sales Breakdown */}
      {!loading && analytics.bookBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-navy-100">
            <h2 className="font-semibold text-navy-900">Sales by eBook</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">eBook Title</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Units Sold</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.bookBreakdown.map((book) => (
                <tr key={book.title} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-3 text-navy-900 font-medium">{book.title}</td>
                  <td className="px-6 py-3 text-navy-700">{book.unitsSold}</td>
                  <td className="px-6 py-3 text-navy-900 font-medium">₹{book.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order ID, customer naam/email, ya ebook title se search karein..."
          className="flex-1 px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <option value="all">Sabhi Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="text-navy-500 p-6">Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-navy-500">
            <p className="mb-1">Abhi tak koi order nahi hai.</p>
          </div>
        ) : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Order ID</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Customer</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">eBook(s)</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Amount</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Payment Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-navy-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-3 text-navy-500 text-xs font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-navy-900 font-medium">
                      {order.profiles?.full_name || 'N/A'}
                    </p>
                    <p className="text-navy-400 text-xs">{order.profiles?.email || ''}</p>
                  </td>
                  <td className="px-6 py-3 text-navy-700 text-sm">
                    {(order.order_items || [])
                      .map((item) => item.ebooks?.title)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-6 py-3 text-navy-900 font-medium">
                    ₹{order.total_amount}
                  </td>
                  <td className="px-6 py-3">{statusBadge(order.status)}</td>
                  <td className="px-6 py-3 text-navy-500 text-sm">
                    {formatDate(order.created_at)}
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
