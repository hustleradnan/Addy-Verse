import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export default function AdminSidebar() {
  const { profile, signOut } = useAuth();
  const roleName = profile?.roles?.name;

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '📊', roles: ['super_admin', 'admin', 'editor'], end: true },
    { to: '/admin/ebooks', label: 'eBooks', icon: '📘', roles: ['super_admin', 'admin'] },
    { to: '/admin/articles', label: 'Articles', icon: '📝', roles: ['super_admin', 'admin', 'editor'] },
    { to: '/admin/pages', label: 'Pages', icon: '📄', roles: ['super_admin', 'admin', 'editor'] },
    { to: '/admin/categories', label: 'Categories', icon: '🏷️', roles: ['super_admin', 'admin', 'editor'] },
    { to: '/admin/orders', label: 'Orders', icon: '🧾', roles: ['super_admin', 'admin'] },
    { to: '/admin/customers', label: 'Customers', icon: '👥', roles: ['super_admin', 'admin'] },
    { to: '/admin/admin-users', label: 'Admin Users', icon: '🔐', roles: ['super_admin'] },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️', roles: ['super_admin', 'admin'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(roleName));

  return (
    <aside className="w-64 bg-navy-900 text-white min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-navy-800">
        <h2 className="text-xl font-serif font-bold">Admin Panel</h2>
        <p className="text-navy-400 text-xs mt-1 capitalize">{roleName?.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-gold-500 text-navy-900'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-navy-800">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white transition"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
