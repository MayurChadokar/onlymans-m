import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';

const Subscriptions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);

  const subscriptions = [
    { id: 1, creatorUsername: 'julian_x', status: 'Active', renewDate: 'Oct 24, 2026', amount: '$4.99/mo' },
    { id: 2, creatorUsername: 'marcus_fit', status: 'Canceled', renewDate: 'Ends Sep 30, 2026', amount: '$9.99/mo' }
  ];

  useEffect(() => {
    setUser(getCurrentUser());
    if (!getAccessToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          token: accessToken,
        });
      }
    } catch {
      // Ignore backend logout errors and clear local session anyway.
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="dashboard-layout">
      <nav className="top-nav">
        <div className="nav-left">
          <Link to="/user/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={24} textClass="brand-logo-small" />
          </Link>
        </div>
        <div className="nav-center">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search creators, hashtags..." />
          </div>
        </div>
        <div className="nav-right">
          {user && (
            <div className="user-avatar" style={{ position: 'relative' }}>
              <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Profile" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }} />
              {showDropdown && (
                <div style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <Link to="/user/profile" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>View Profile</Link>
                  {user?.role === 'CREATOR' && (
                    <Link to="/creator/studio" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>Creator Studio</Link>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', color: '#ff4a4a', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="left-sidebar">
          <div className="nav-menu">
            <Link to="/user/dashboard" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              Home
            </Link>
            <Link to="/user/explore" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
              Explore
            </Link>
            <Link to="/user/subscriptions" className="menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Subscriptions
            </Link>
            <Link to="/user/favorites" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Favorites
            </Link>
          </div>
          <div className="promo-card">
            <h4>Be the Star</h4>
            <p>Start sharing your world today.</p>
            <Link to="/user/become-creator" className="btn-gradient">Become a Creator</Link>
          </div>
        </aside>

        <main className="main-feed" style={{ maxWidth: '800px' }}>
          <div className="upload-header">
            <h2>Your Subscriptions</h2>
            <p>Manage the creators you are supporting.</p>
          </div>

          <div className="feed-posts">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="post-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/user/explore" style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', color: 'inherit' }}>
                  <img src={`https://i.pravatar.cc/150?u=${sub.creatorUsername}`} alt={sub.creatorUsername} style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{sub.creatorUsername}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{sub.creatorUsername}</p>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', display: 'flex', gap: '12px' }}>
                      <span style={{ color: sub.status === 'Active' ? '#00B4D8' : '#ff4a4a' }}>● {sub.status}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Renews: {sub.renewDate}</span>
                    </div>
                  </div>
                </Link>
                <div>
                  <h4 style={{ textAlign: 'right', marginBottom: '8px', color: 'var(--text-primary)' }}>{sub.amount}</h4>
                  <button className={sub.status === 'Active' ? 'btn-secondary-dark' : 'btn-gradient small-btn'} style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    {sub.status === 'Active' ? 'Cancel' : 'Renew'}
                  </button>
                </div>
              </div>
            ))}

            {subscriptions.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                You have no active subscriptions.
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="mobile-bottom-nav">
        <Link to="/user/dashboard" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Home
        </Link>
        <Link to="/user/explore" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
          Explore
        </Link>
        <Link to="/user/subscriptions" className="mobile-nav-item active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Subs
        </Link>
        <Link to="/user/favorites" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Favorites
        </Link>
      </div>
    </div>
  );
};

export default Subscriptions;
