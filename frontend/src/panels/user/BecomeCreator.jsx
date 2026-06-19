import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../auth/Login.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getAuthSession, getCurrentUser, getRefreshToken, setAuthSession } from '../../utils/auth';

const BecomeCreator = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('9.99');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    setCurrentUser(session?.user || null);

    if (session?.user?.role === 'CREATOR') {
      navigate('/creator-studio', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (currentUser) {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken || !refreshToken) {
          throw new Error('Please log in again to upgrade your account.');
        }

        await apiRequest('/creators/become', {
          method: 'POST',
          token: accessToken,
          body: {
            bio,
            price: Number(price),
          },
        });

        const refreshed = await apiRequest('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        });

        setAuthSession(refreshed);
        navigate('/creator-studio', { replace: true });
        return;
      }

      const payload = await apiRequest('/auth/register', {
        method: 'POST',
        body: { username, email, password, role: 'CREATOR' },
      });

      setAuthSession(payload);
      navigate('/creator-studio', { replace: true });
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        clearAuthSession();
      }
      setError(err.message || 'Creator signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isUpgradeFlow = Boolean(currentUser);

  return (
    <div className="login-container">
      <div className="login-right">
        <div className="login-form-wrapper">
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '2.5rem' }}>
            <Logo size={40} textClass="brand-logo" />
          </div>

          <div className="form-card">
            <div className="form-header">
              <h3 className="form-title">{isUpgradeFlow ? 'Upgrade to Creator' : 'Become a Creator'}</h3>
              <p className="form-subtitle">
                {isUpgradeFlow
                  ? 'Your existing account will be upgraded and your role will refresh automatically.'
                  : 'Monetize your unique content'}
              </p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              {isUpgradeFlow ? (
                <>
                  <div className="form-group">
                    <label>Creator Bio</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Tell fans what you create..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Monthly Price</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1v22"></path>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3 3 0 0 1 0 6H6"></path>
                        </svg>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="9.99"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.18)', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    Logged in as <strong style={{ color: 'var(--text-primary)' }}>@{currentUser.username}</strong>. After upgrade, your role will be refreshed automatically.
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Creator Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="your_creator_alias"
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
                </>
              )}

              <div className="checkbox-group">
                <label className="checkbox-container">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the Creator Terms
                </label>
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }} disabled={loading}>
                {loading ? (isUpgradeFlow ? 'Upgrading...' : 'Applying...') : (isUpgradeFlow ? 'Upgrade Account' : 'Apply as Creator')}
                {!loading && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              {isUpgradeFlow ? (
                <Link to="/user/dashboard">Back to Dashboard</Link>
              ) : (
                <>Back to <Link to="/signup">Normal Sign Up</Link></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeCreator;
