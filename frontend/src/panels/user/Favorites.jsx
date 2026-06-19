import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';

const Favorites = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(getCurrentUser());
    if (!getAccessToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiRequest('/users/favorites', { token: getAccessToken() });
        if (!active) return;

        setFavorites((response.favorites || []).map((post) => ({
          id: post.id,
          creatorId: post.creator?.id || post.creatorId || '',
          creatorUsername: post.creator?.username || 'creator',
          content: post.content || '',
          date: post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Saved recently',
          likes: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          mediaUrl: post.media?.[0]?.url || 'https://picsum.photos/seed/post/600/400',
          type: post.media?.[0]?.type || 'IMAGE',
          bookmarkedAt: post.bookmarkedAt ? new Date(post.bookmarkedAt).toLocaleString() : 'Recently',
        })));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load favorites');
        setFavorites([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFavorites();

    return () => {
      active = false;
    };
  }, []);

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
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  const removeFavorite = async (postId) => {
    try {
      await apiRequest(`/posts/${postId}/favorite`, {
        method: 'POST',
        token: getAccessToken(),
      });
      setFavorites(prev => prev.filter(f => f.id !== postId));
    } catch (err) {
      alert(err.message || 'Could not remove favorite');
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
          <button className="icon-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          {user && (
            <div className="user-avatar" style={{ position: 'relative' }}>
              <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Profile" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }} />
              {showDropdown && (
                <div style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <Link to="/user/profile" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>View Profile</Link>
                  {user?.role === 'CREATOR' && (
                    <Link to="/creator/studio" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>Creator Studio</Link>
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
            <Link to="/user/subscriptions" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Subscriptions
            </Link>
            <Link to="/user/favorites" className="menu-item active">
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

        <main className="main-feed">
          <div className="upload-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Your Favorites
            </h2>
            <p>Posts you've saved for later. {favorites.length} saved {favorites.length === 1 ? 'post' : 'posts'}.</p>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
              Loading favorites...
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '24px', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div className="feed-posts">
            {favorites.map(post => (
              <article className="post-card" key={post.id}>
                <div className="post-header">
                  <Link to={post.creatorId ? `/view-profile/${post.creatorId}` : '/explore'} className="post-author" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={`https://i.pravatar.cc/150?u=${post.creatorUsername}`} alt={post.creatorUsername} />
                    <div>
                      <h4>@{post.creatorUsername} <svg width="14" height="14" viewBox="0 0 24 24" fill="#00B4D8"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></h4>
                      <span>{post.date}</span>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                      Saved {post.bookmarkedAt}
                    </span>
                    <button className="more-options" style={{ color: 'var(--text-primary)' }}>•••</button>
                  </div>
                </div>

                <div className="post-content">
                  <p className="post-caption" style={{ color: 'var(--text-primary)' }}>
                    {post.content}
                  </p>
                  {post.mediaUrl && (
                    <div className="post-image-wrapper">
                      <img src={post.mediaUrl} alt="Post Media" className="post-main-img" />
                      {post.type === 'VIDEO' && (
                        <div className="video-icon-overlay" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="post-actions border-top">
                  <div className="action-left">
                    <button style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {post.likes}
                    </button>
                    <button style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {post.commentsCount} Comments
                    </button>
                  </div>
                  <button
                    onClick={() => removeFavorite(post.id)}
                    title="Remove from favorites"
                    style={{ color: '#FFA52C', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#FFA52C" stroke="#FFA52C" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    Saved
                  </button>
                </div>
              </article>
            ))}

            {!loading && favorites.length === 0 && !error && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <h3 style={{ color: 'var(--text-color)', marginBottom: '8px' }}>No favorites yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Posts you save will appear here. Start exploring to find content you love!</p>
                <Link to="/user/explore" className="btn-gradient" style={{ display: 'inline-block', padding: '12px 24px', textDecoration: 'none' }}>
                  Explore Creators
                </Link>
              </div>
            )}
          </div>
        </main>

        <aside className="right-sidebar">
          <div className="trending-section">
            <h3 className="section-header">Trending Creators</h3>
            <div className="trending-list">
              {[
                { name: '@UrbanExplorer', desc: 'Rising fast this week', img: 'https://i.pravatar.cc/150?img=14' },
                { name: '@MountainMan', desc: 'Most active stories', img: 'https://i.pravatar.cc/150?img=59' },
              ].map((cr, i) => (
                <div className="trending-item" key={i}>
                  <img src={cr.img} alt={cr.name} />
                  <div className="trending-info">
                    <h4>{cr.name}</h4>
                    <p>{cr.desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
              ))}
            </div>
            <Link to="/user/explore" className="explore-link">Explore Discover Page</Link>
          </div>

          <div className="dashboard-footer">
            <Link to="/">About</Link>
            <Link to="/">Privacy</Link>
            <Link to="/">Terms</Link>
            <Link to="/">Help</Link>
            <p>© 2026 OnlyMans. All rights reserved.</p>
          </div>
        </aside>
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
        <Link to="/user/subscriptions" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Subs
        </Link>
        <Link to="/user/favorites" className="mobile-nav-item active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Favorites
        </Link>
      </div>
    </div>
  );
};

export default Favorites;
