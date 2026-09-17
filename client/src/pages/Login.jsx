import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        const destination = location.state?.from || '/';
        navigate(destination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-wrap">
      <div className="glass-card auth-card">
        <div className="auth-brand-header">
          <div className="auth-logo">
            CITY<span>LINK</span>
          </div>
          <div className="auth-tagline">
            "Jisko jana hai woh jake rahega"
          </div>
        </div>

        <h2>Welcome back</h2>
        <p className="sub">Sign in to manage your bookings and e-tickets</p>

        {/* Quick Demo Credentials Bar for Easy Localhost Testing */}
        <div style={{
          background: 'var(--gray-50)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
            Quick Demo Login:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#EEF0FA', borderColor: '#4F5AE8', color: '#4F5AE8', fontWeight: 600 }}
              onClick={() => fillDemo('admin@citylink.com', 'admin123')}
            >
              Fill Admin
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}
              onClick={() => fillDemo('user@citylink.com', 'user123')}
            >
              Fill Passenger
            </button>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', minHeight: '46px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
