import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
  if (loading) return <div className="center-msg">Loading...</div>;
  if (!user) return <Login />;
  if (adminOnly && user.role !== 'admin') return <div className="center-msg">Access denied</div>;
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
