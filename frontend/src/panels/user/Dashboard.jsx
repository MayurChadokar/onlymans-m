import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);
  const [posts, setPosts] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [likedPostIds, setLikedPostIds] = useState(() => new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(() => new Set());
  const [commentModalPost, setCommentModalPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [actionBusyId, setActionBusyId] = useState('');
  const [followingCreatorIds, setFollowingCreatorIds] = useState(() => new Set());
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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

    const loadFeed = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return;
      }

      setFeedLoading(true);
      setFeedError('');

      try {
        const feed = await apiRequest('/feed/random', { token: accessToken });
        if (!active) return;

        const mappedPosts = (feed.posts || []).map((post) => ({
          id: post.id,
          creatorId: post.creator?.id || post.creatorId || '',
          creatorUsername: post.creator?.username || 'creator',
          content: post.content || '',
          date: post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now',
          likes: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          isLiked: post.isLiked ?? false,
          mediaUrl: post.media?.[0]?.url || 'https://picsum.photos/seed/post/600/400',
          type: post.media?.[0]?.type || 'IMAGE',
        }));
        setPosts(mappedPosts);
        setSuggestedCreators(feed.suggestedCreators || []);
        setLikedPostIds(new Set(mappedPosts.filter(p => p.isLiked).map(p => p.id)));
        setBookmarkedPostIds(new Set());
        const newFollowingSet = new Set();
        (feed.posts || []).forEach(p => { if (p.creator?.isFollowing) newFollowingSet.add(p.creator.id || p.creatorId); });
        (feed.suggestedCreators || []).forEach(c => { if (c.isFollowing) newFollowingSet.add(c.id); });
        setFollowingCreatorIds(newFollowingSet);

      } catch (error) {
        if (!active) return;
        setFeedError(error.message || 'Failed to load feed');
        setPosts([]);
        setSuggestedCreators([]);
      } finally {
        if (active) setFeedLoading(false);
      }
    };

    loadFeed();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!commentModalPost) {
      setPostComments([]);
      setCommentText('');
      setCommentError('');
      return;
    }

    let active = true;

    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentError('');

      try {
        const response = await apiRequest(`/posts/${commentModalPost.id}/comments`, {
          token: getAccessToken(),
        });
        if (!active) return;

        setPostComments(response.comments || []);
      } catch (error) {
        if (!active) return;
        setCommentError(error.message || 'Failed to load comments');
        setPostComments([]);
      } finally {
        if (active) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => {
      active = false;
    };
  }, [commentModalPost]);

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
      // Always clear the local session, even if the backend logout call fails.
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  const toggleFollow = async (creatorId) => {
    try {
      const response = await apiRequest(`/creators/${creatorId}/follow`, {
        method: 'POST',
        token: getAccessToken()
      });
      setFollowingCreatorIds(prev => {
        const next = new Set(prev);
        if (response.isFollowing) next.add(creatorId);
        else next.delete(creatorId);
        return next;
      });
      setActiveMenuId(null);
    } catch (error) {
      alert(error.message || 'Failed to toggle follow');
    }
  };

  const toggleLike = async (postId) => {
    if (actionBusyId) return;
    setActionBusyId(postId);

    try {
      const result = await apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
        token: getAccessToken(),
      });

      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (result.liked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: result.liked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
          };
        }
        return post;
      }));
    } catch (error) {
      alert(error.message || 'Could not update like');
    } finally {
      setActionBusyId('');
    }
  };

  const toggleBookmark = async (postId) => {
    if (actionBusyId) return;
    setActionBusyId(postId);

    try {
      const result = await apiRequest(`/posts/${postId}/favorite`, {
        method: 'POST',
        token: getAccessToken(),
      });

      setBookmarkedPostIds(prev => {
        const next = new Set(prev);
        if (result.bookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch (error) {
      alert(error.message || 'Could not update favorite');
    } finally {
      setActionBusyId('');
    }
  };

  const openComments = (post) => {
    setCommentModalPost(post);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentModalPost || !commentText.trim()) return;

    try {
      const response = await apiRequest(`/posts/${commentModalPost.id}/comments`, {
        method: 'POST',
        body: { content: commentText.trim() },
        token: getAccessToken(),
      });

      if (response.comment) {
        setPostComments(prev => [response.comment, ...prev]);
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === commentModalPost.id) {
            return {
              ...post,
              commentsCount: (post.commentsCount || 0) + 1
            };
          }
          return post;
        }));
      }
      setCommentText('');
    } catch (error) {
      setCommentError(error.message || 'Could not post comment');
    }
  };
  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="top-nav">
        <div className="top-nav-inner" style={{ display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto', alignItems: 'center' }}>
          <div className="nav-left">
            <Link to="/user/dashboard" className="brand-logo-small">
              <Logo size={24} textClass="brand-logo-small" />
            </Link>
          </div>

          <div className="nav-center">
            <div className="search-bar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search creators, posts..." />
            </div>
          </div>

          <div className="nav-right">
            <button className="icon-btn" onClick={toggleTheme}>
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
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            {user && (
              <div className="user-avatar" style={{ position: 'relative' }}>
                <img
                  src={user?.avatar || "https://i.pravatar.cc/150?img=11"}
                  alt="Profile"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ cursor: 'pointer' }}
                />
                {showDropdown && (
                  <div
                    style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}
                    onClick={() => setShowDropdown(false)}
                  >
                    <Link
                      to="/user/profile"
                      style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      ⚙️ Account Settings
                    </Link>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', border: 'none', color: '#ff4a4a', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="nav-menu">
            <Link to="/user/dashboard" className="menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              Home
            </Link>
            <Link to="/user/explore" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
              Explore
            </Link>
            <Link to="/user/subscriptions" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Subscriptions
            </Link>
            <Link to="/user/favorites" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              Favorites
            </Link>
          </div>

          <div className="menu-section">
            <h4 className="section-title">YOUR COMMUNITIES</h4>
            <Link to="/user/explore" className="menu-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Creator Groups
            </Link>
            <Link to="/user/subscriptions" className="menu-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              VIP Lounges
            </Link>
          </div>

          <div className="promo-card">
            <h4>Be the Star ⭐</h4>
            <p>Start creating exclusive content and earn from your fans.</p>
            <Link to="/user/become-creator" className="btn-gradient">Become a Creator</Link>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="main-feed">

          {/* Feed Posts */}
          <div className="feed-posts">
            {feedLoading && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                Loading your random feed...
              </div>
            )}

            {feedError && !feedLoading && (
              <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '24px', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
                {feedError}
              </div>
            )}

            {posts.map(post => (
              <article className="post-card" key={post.id}>
                <div className="post-header">
                  <Link to={post.creatorId ? `/view-profile/${post.creatorId}` : '/explore'} className="post-author" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={`https://i.pravatar.cc/150?u=${post.creatorUsername}`} alt={post.creatorUsername} />
                    <div>
                      <h4>@{post.creatorUsername} <svg width="14" height="14" viewBox="0 0 24 24" fill="#00B4D8"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></h4>
                      <span>{post.date}</span>
                    </div>
                  </Link>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="more-options" 
                      onClick={(e) => { e.preventDefault(); setActiveMenuId(activeMenuId === post.id ? null : post.id); }} 
                      style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
                    >•••</button>
                    {activeMenuId === post.id && (
                      <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '180px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        <button 
                          onClick={(e) => { e.preventDefault(); toggleFollow(post.creatorId); }}
                          style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                          {followingCreatorIds.has(post.creatorId) ? 'Unfollow' : 'Follow'} @{post.creatorUsername}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="post-content">
                  <p className="post-caption" style={{ color: 'var(--text-primary)' }}>
                    {post.content}
                  </p>
                  {post.mediaUrl && (
                    <div className="post-image-wrapper" style={{ position: 'relative', width: '100%', maxHeight: '500px', overflow: 'hidden', borderRadius: '12px', marginBottom: '16px', backgroundColor: '#000' }}>
                      {post.type === 'VIDEO' ? (
                        <video src={post.mediaUrl + "#t=0.1"} preload="metadata" controls className="post-main-img" style={{ width: '100%', height: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
                      ) : (
                        <img src={post.mediaUrl} alt="Post Media" className="post-main-img" style={{ width: '100%', height: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} />
                      )}
                    </div>
                  )}
                </div>

                <div className="post-actions border-top">
                  <div className="action-left">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={actionBusyId === post.id}
                      style={{ color: likedPostIds.has(post.id) ? '#ff4a4a' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill={likedPostIds.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {likedPostIds.has(post.id) ? 'Liked' : 'Like'} {post.likes}
                    </button>
                    <button
                      onClick={() => openComments(post)}
                      style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      {post.commentsCount > 0 ? `${post.commentsCount} Comment${post.commentsCount !== 1 ? 's' : ''}` : 'Comment'}
                    </button>
                  </div>
                  <button
                    onClick={() => toggleBookmark(post.id)}
                    disabled={actionBusyId === post.id}
                    style={{ color: bookmarkedPostIds.has(post.id) ? '#FFA52C' : 'var(--text-primary)' }}
                    title={bookmarkedPostIds.has(post.id) ? 'Remove favorite' : 'Add to favorites'}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill={bookmarkedPostIds.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}

            {posts.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                No posts found. Start following some creators!
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="trending-section">
            <h3 className="section-header">Trending Creators</h3>
            <div className="trending-list">
              {(suggestedCreators.length > 0 ? suggestedCreators : [
                { username: 'UrbanExplorer', bio: 'Rising fast this week', avatarUrl: 'https://i.pravatar.cc/150?img=14' },
                { username: 'MountainMan', bio: 'Most active stories', avatarUrl: 'https://i.pravatar.cc/150?img=59' },
              ]).map((cr, i) => (
                <div className="trending-item" key={i}>
                  <img src={cr.avatarUrl || cr.img || 'https://i.pravatar.cc/150?img=11'} alt={cr.username || cr.name} />
                  <div className="trending-info">
                    <h4>@{cr.username || cr.name?.replace(/^@/, '')}</h4>
                    <p>{cr.bio || cr.desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                </div>
              ))}
            </div>
            <Link to="/user/explore" className="explore-link">Explore Discover Page</Link>
          </div>

          <div className="suggested-section">
            <h3 className="section-header">You Might Like</h3>
            <div className="suggested-grid">
              {(suggestedCreators.slice(0, 2).length > 0 ? suggestedCreators.slice(0, 2) : [
                { username: 'Lifestyle', coverUrl: 'https://picsum.photos/seed/life/150/150' },
                { username: 'Vlogs', coverUrl: 'https://picsum.photos/seed/vlog/150/150' },
              ]).map((creator, index) => (
                <Link to="/user/explore" style={{ textDecoration: 'none' }} key={creator.id || index}>
                  <div className="suggested-card" style={{ backgroundImage: `url(${creator.coverUrl || 'https://picsum.photos/seed/life/150/150'})` }}>
                    <span>{creator.username || 'CREATOR'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="dashboard-footer">
            <Link to="/">About</Link>
            <Link to="/">Privacy</Link>
            <Link to="/">Terms</Link>
            <Link to="/">Cookies</Link>
            <Link to="/">Help</Link>
            <p>© 2026 OnlyMans. All rights reserved.</p>
          </div>
        </aside>
      </div>

      {commentModalPost && (
        <div className="dashboard-modal-overlay" onClick={() => setCommentModalPost(null)}>
          <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Comments</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{commentModalPost.creatorUsername}</p>
              </div>
              <button onClick={() => setCommentModalPost(null)} className="btn-secondary-dark" style={{ padding: '8px 12px' }}>Close</button>
            </div>

            <form onSubmit={submitComment} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
              <button className="btn-primary-gradient" type="submit">Post</button>
            </form>

            {commentError && (
              <div style={{ color: '#ff6b6b', marginBottom: '12px', fontSize: '0.9rem' }}>{commentError}</div>
            )}

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {commentsLoading && (
                <div style={{ color: 'var(--text-secondary)' }}>Loading comments...</div>
              )}

              {!commentsLoading && postComments.map((comment) => (
                <div key={comment.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>@{comment.user?.username || 'user'}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{comment.content}</p>
                </div>
              ))}

              {!commentsLoading && postComments.length === 0 && !commentError && (
                <div style={{ color: 'var(--text-secondary)' }}>No comments yet. Be the first one.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Visible only on mobile/tablet) */}
      <div className="mobile-bottom-nav">
        <Link to="/user/dashboard" className="mobile-nav-item active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          Home
        </Link>
        <Link to="/user/explore" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
          Explore
        </Link>
        <Link to="/user/subscriptions" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Subs
        </Link>
        <Link to="/user/favorites" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          Favorites
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
