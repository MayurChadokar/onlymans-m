import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { clearAuthSession, getAccessToken, getRefreshToken, getCurrentUser } from '../utils/auth';
import { apiRequest } from '../utils/api';
import NotificationBell from './NotificationBell';

const CreatorNavbar = ({ isMobileMenuOpen, setIsMobileMenuOpen, searchTerm, onSearchChange }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);
  const [creatorAvatar, setCreatorAvatar] = useState(null);

  useEffect(() => {
    let active = true;
    if (user?.id) {
      apiRequest(`/creators/public/${user.id}`)
        .then((res) => {
          if (active && res.profile?.avatarUrl) {
            setCreatorAvatar(res.profile.avatarUrl);
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClose = () => setShowDropdown(false);
    // Delay to let click event propagate
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClose);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClose);
    };
  }, [showDropdown]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, token: accessToken });
      }
    } catch {
      // Ignore error
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="studio-top-nav">
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {setIsMobileMenuOpen && (
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        )}
        <Link to="/creator/studio" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo size={24} textClass="brand-logo-small" />
          <span className="creator-badge" style={{ marginLeft: '4px' }}>CREATOR</span>
        </Link>
      </div>
      <div className="nav-right">
        <div className="search-analytics">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <NotificationBell />
        {user && (
          <div className="user-avatar" style={{ position: 'relative' }}>
            <img
              loading="lazy"
              decoding="async"
              src={creatorAvatar || user?.avatarUrl || user?.avatar || 'https://i.pravatar.cc/150?img=11'}
              alt="Profile"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: 'pointer', objectFit: 'cover' }}
            />
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: '0',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 0',
                  minWidth: '180px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}
                onClick={() => setShowDropdown(false)}
              >
                <Link
                  to="/creator/settings"
                  style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  ⚙️ Account Settings
                </Link>
                {user?.id && (
                  <Link
                    to={`/creator-profile/${user.id}`}
                    style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}
                  >
                    👤 My Creator Page
                  </Link>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ff4a4a',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                >
                  🚪 Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default CreatorNavbar;
