import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
        CITY<span>LINK</span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="nav-links desktop-only">
        <Link to="/">Bus Tickets</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      </div>

      {/* Desktop User CTA */}
      <div className="desktop-only">
        {user ? (
          <div className="nav-user">
            <span className="user-greeting">{user.name}</span>
            <button onClick={handleLogout} className="btn-nav-logout">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="nav-cta">Sign In</Link>
        )}
      </div>

      {/* Mobile Hamburger Toggle Button (44x44px min tap target) */}
      <button
        type="button"
        className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
      >
        <span className="hamburger-line line1" />
        <span className="hamburger-line line2" />
        <span className="hamburger-line line3" />
      </button>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            CITY<span>LINK</span>
          </Link>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-nav-links">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            Bus Tickets
          </Link>
          {user && (
            <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
              My Bookings
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="mobile-drawer-footer">
          {user ? (
            <div className="mobile-user-box">
              <div className="mobile-user-name">Signed in as <strong>{user.name}</strong></div>
              <div className="mobile-user-email">{user.email}</div>
              <button onClick={handleLogout} className="btn-primary mobile-logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="mobile-auth-actions">
              <Link to="/login" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
