import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Ebooks from './pages/Ebooks';
import EbookDetail from './pages/EbookDetail';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Categories from './pages/Categories';
import About from './pages/About';
import Contact from './pages/Contact';
import PageView from './pages/PageView';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import Purchases from './pages/Purchases';

import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminEbooks from './pages/admin/Ebooks';
import EbookForm from './pages/admin/EbookForm';
import AdminArticles from './pages/admin/Articles';
import ArticleForm from './pages/admin/ArticleForm';
import AdminCategories from './pages/admin/Categories';
import AdminPages from './pages/admin/Pages';
import PageForm from './pages/admin/PageForm';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import AdminUsers from './pages/admin/AdminUsers';
import Settings from './pages/admin/Settings';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-serif font-bold text-navy-900 mb-3">404</h1>
      <p className="text-navy-500 mb-6">Ye page exist nahi karta.</p>
      <Link to="/" className="text-gold-600 hover:underline font-medium">
        ← Home par wapas jayein
      </Link>
    </div>
  );
}

const ALL_STAFF = ['super_admin', 'admin', 'editor'];
const ADMIN_ONLY = ['super_admin', 'admin'];
const SUPER_ADMIN_ONLY = ['super_admin'];

function Staff({ children, roles }) {
  return (
    <ProtectedRoute allowedRoles={roles} redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={ALL_STAFF} redirectTo="/admin/login">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="ebooks" element={<Staff roles={ADMIN_ONLY}><AdminEbooks /></Staff>} />
            <Route path="ebooks/new" element={<Staff roles={ADMIN_ONLY}><EbookForm /></Staff>} />
            <Route path="ebooks/edit/:id" element={<Staff roles={ADMIN_ONLY}><EbookForm /></Staff>} />

            <Route path="articles" element={<Staff roles={ALL_STAFF}><AdminArticles /></Staff>} />
            <Route path="articles/new" element={<Staff roles={ALL_STAFF}><ArticleForm /></Staff>} />
            <Route path="articles/edit/:id" element={<Staff roles={ALL_STAFF}><ArticleForm /></Staff>} />

            <Route path="pages" element={<Staff roles={ALL_STAFF}><AdminPages /></Staff>} />
            <Route path="pages/new" element={<Staff roles={ALL_STAFF}><PageForm /></Staff>} />
            <Route path="pages/edit/:id" element={<Staff roles={ALL_STAFF}><PageForm /></Staff>} />

            <Route path="categories" element={<Staff roles={ALL_STAFF}><AdminCategories /></Staff>} />

            <Route path="orders" element={<Staff roles={ADMIN_ONLY}><Orders /></Staff>} />
            <Route path="customers" element={<Staff roles={ADMIN_ONLY}><Customers /></Staff>} />
            <Route path="admin-users" element={<Staff roles={SUPER_ADMIN_ONLY}><AdminUsers /></Staff>} />
            <Route path="settings" element={<Staff roles={ADMIN_ONLY}><Settings /></Staff>} />
          </Route>

          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="ebooks" element={<Ebooks />} />
            <Route path="ebooks/:slug" element={<EbookDetail />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:slug" element={<ArticleDetail />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<Categories />} />
            <Route path="pages/:slug" element={<PageView />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route
              path="account"
              element={
                <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchases"
              element={
                <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
                  <Purchases />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
