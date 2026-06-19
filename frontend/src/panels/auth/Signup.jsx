import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { getAuthSession, setAuthSession } from '../../utils/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      navigate(session?.user?.role === 'CREATOR' ? '/creator-studio' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest('/auth/register', {
        method: 'POST',
        body: { username, email, password, role },
      });

      setAuthSession(payload);
      navigate(role === 'CREATOR' ? '/creator-studio' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
              <h3 className="form-title">Create an account</h3>
              <p className="form-subtitle">Join the community today</p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form className="login-form" onSubmit={handleSignup}>
              <div className="form-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
              </div>

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
                <label>Password</label>
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
                    minLength={8}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Account Type</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4"></path>
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </span>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="USER">User</option>
                    <option value="CREATOR">Creator</option>
                  </select>
                </div>
                <div className="form-hint">Pick Creator if you want to start posting premium content immediately.</div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
                {!loading && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>

            <div className="divider" style={{ marginTop: '2rem' }}>
              <span>WANT TO EARN?</span>
            </div>
            <div className="signup-prompt" style={{ marginTop: '1rem' }}>
              <Link to="/user/become-creator" style={{ color: 'var(--text-primary)' }}>Become a Creator</Link>
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

export default Signup;
