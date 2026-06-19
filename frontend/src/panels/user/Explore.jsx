import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';

const Explore = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);
  const [creators, setCreators] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setUser(getCurrentUser());
    if (!getAccessToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadCreators = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'All') {
          params.set('category', selectedCategory);
        }
        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }
        params.set('limit', '12');

        const path = `/creators${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await apiRequest(path);
        if (!active) return;

        setCreators(response.creators || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load creators');
        setCreators([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCreators();

    return () => {
      active = false;
    };
  }, [selectedCategory, searchTerm]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, token: accessToken });
      }
    } catch {
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <nav className="top-nav">
        <div className="nav-left">
          <Link to="/user/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={24} textClass="brand-logo-small" />
          </Link>
        </div>
        <div className="nav-center">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search creators, hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="nav-right">
          <button className="icon-btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <button className="icon-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          {user && (
            <div className="user-avatar" style={{ position: 'relative' }}>
              <img src={user?.avatar || "https://i.pravatar.cc/150?img=11"} alt="Profile" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }} />
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
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="nav-menu">
            <Link to="/user/dashboard" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              Home
            </Link>
            <Link to="/user/explore" className="menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
              Explore
            </Link>
            <Link to="/user/subscriptions" className="menu-item">
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

        {/* Main Explore Content */}
        <main className="main-feed" style={{ maxWidth: '1000px' }}>
          <div className="upload-header">
            <h2>Discover Creators</h2>
            <p>Find new content that matches your interests.</p>
          </div>
          
          <div className="explore-categories" style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {['All', 'Fitness', 'Lifestyle', 'Gaming', 'Vlogs', 'Music'].map(cat => (
              <button
                key={cat}
                className="tag-pill"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? 'rgba(196, 181, 253, 0.15)' : '',
                  color: selectedCategory === cat ? '#c4b5fd' : '',
                  border: selectedCategory === cat ? '1px solid rgba(196, 181, 253, 0.3)' : '',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
              Loading creators...
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '24px', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '24px' }}>
            {creators.map((creator) => (
              <div key={creator.id} className="post-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Cover Image */}
                <div style={{ width: '100%', height: '120px', overflow: 'hidden' }}>
                  <img src={creator.creatorProfile?.coverUrl || 'https://picsum.photos/seed/cover/600/300'} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                {/* Avatar (positioned absolutely to avoid clipping) */}
                <img 
                  src={creator.creatorProfile?.avatarUrl || `https://i.pravatar.cc/150?u=${creator.username}`} 
                  alt={creator.username} 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    border: '4px solid var(--bg-card)', 
                    objectFit: 'cover', 
                    background: 'var(--bg-card)',
                    position: 'absolute',
                    top: '80px',
                    left: '16px',
                    zIndex: 10
                  }} 
                />

                {/* Info */}
                <div style={{ padding: '50px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '2px', color: 'var(--text-primary)' }}>{creator.username}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>@{creator.username}</p>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', opacity: 0.9, lineHeight: '1.4', marginBottom: '16px', flex: 1 }}>
                    {creator.creatorProfile?.bio || 'This creator hasn\'t set a bio yet.'}
                  </p>

                  <Link to={`/creator-profile/${creator.id}`} className="btn-gradient small-btn" style={{ width: '100%', display: 'block', textDecoration: 'none', textAlign: 'center', padding: '10px 0' }}>
                    View Profile
                  </Link>
                </div>
              </div>
            ))}

            {!loading && creators.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px', gridColumn: '1 / -1' }}>
                No creators found for this filter.
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Mobile Nav */}
      <div className="mobile-bottom-nav">
        <Link to="/user/dashboard" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Home
        </Link>
        <Link to="/user/explore" className="mobile-nav-item active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
          Explore
        </Link>
        <Link to="/user/subscriptions" className="mobile-nav-item">
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

export default Explore;
