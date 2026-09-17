import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import './styles.css';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-msg">Loading CityLink...</div>;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="section" style={{ maxWidth: '520px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 28px' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '8px' }}>Admin Access Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
            You are logged in as <strong>{user.email}</strong> (Standard Passenger). Administrator privileges are required to access the CityLink Management Dashboard.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="btn-primary" style={{ padding: '10px 20px' }}>
              Sign in as Admin
            </Link>
            <Link to="/" className="btn-secondary" style={{ padding: '10px 20px' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

function AppShell() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <div key={location.pathname} className="page-transition-wrapper">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">CITY<span>LINK</span></span>
            <span className="footer-tagline">"Jisko jana hai woh jake rahega"</span>
          </div>
          <div className="footer-copy">
            © 2026 CityLink Reservations — Safe, fast &amp; comfortable journeys across India.
          </div>
          <div className="footer-watermark">
            Made by Sristi Priya
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
