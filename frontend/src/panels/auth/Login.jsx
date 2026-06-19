import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { getAuthSession, setAuthSession } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      navigate(session?.user?.role === 'CREATOR' ? '/creator-studio' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      setAuthSession(payload);
      navigate(payload?.user?.role === 'CREATOR' ? '/creator-studio' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-right">
        <div className="login-form-wrapper">
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '2.5rem' }}>
            <Logo size={40} textClass="brand-logo" />
          </div>

          <div className="form-card">
            <div className="form-header">
              <h3 className="form-title">Welcome back</h3>
              <p className="form-subtitle">Sign in to your account</p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M2 4l10 8 10-8"></path>
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="password-header">
                  <label>Password</label>
                  <a href="#" className="forgot-password">Forgot Password?</a>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Stay logged in
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </div>

          <div className="footer-links">
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
