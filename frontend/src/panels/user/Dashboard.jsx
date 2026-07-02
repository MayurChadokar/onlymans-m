import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';
import UserNavbar from '../../components/UserNavbar';

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

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportType, setReportType] = useState('SPAM');
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Pull-to-refresh state & refs
  const feedRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    let startY = 0;
    let pulling = false;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling) return;
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;
      if (diff > 0) {
        const dist = Math.min(diff * 0.4, PULL_THRESHOLD + 40);
        setPullDistance(dist);
        if (dist > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;
      pulling = false;
      
      const currentDistance = pullDistance;
      if (currentDistance >= PULL_THRESHOLD) {
        setPullDistance(PULL_THRESHOLD);
        const accessToken = getAccessToken();
        if (accessToken) {
          try {
            const feed = await apiRequest('/feed/random?bust=true', { token: accessToken });
            const mapped = (feed.posts || []).map((post) => ({
              id: post.id,
              creatorId: post.creator?.id || post.creatorId || '',
              creatorUsername: post.creator?.username || 'creator',
              creatorAvatar: post.creator?.creatorProfile?.avatarUrl || null,
              content: post.content || '',
              date: post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now',
              likes: post.likesCount ?? 0,
              commentsCount: post.commentsCount ?? 0,
              isLiked: post.isLiked ?? false,
              isBookmarked: post.isBookmarked ?? false,
              mediaUrl: post.media?.[0]?.url || 'https://picsum.photos/seed/post/600/400',
              type: post.media?.[0]?.type || 'IMAGE',
            }));

            for (let i = mapped.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
            }
            setPosts(mapped);
          } catch (err) {
            console.error('Pull to refresh failed:', err);
          }
        }
      }
      setPullDistance(0);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

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

    const loadFeed = async (bust = false) => {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      setFeedLoading(true);
      setFeedError('');

      try {
        const feed = await apiRequest(`/feed/random${bust ? '?bust=true' : ''}`, { token: accessToken });
        if (!active) return;

        const mapped = (feed.posts || []).map((post) => ({
          id: post.id,
          creatorId: post.creator?.id || post.creatorId || '',
          creatorUsername: post.creator?.username || 'creator',
          creatorAvatar: post.creator?.creatorProfile?.avatarUrl || null,
          content: post.content || '',
          date: post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now',
          likes: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          isLiked: post.isLiked ?? false,
          isBookmarked: post.isBookmarked ?? false,
          mediaUrl: post.media?.[0]?.url || 'https://picsum.photos/seed/post/600/400',
          type: post.media?.[0]?.type || 'IMAGE',
        }));

        // Fisher-Yates shuffle so order differs every load
        for (let i = mapped.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
        }

        const mappedPosts = mapped;
        setPosts(mappedPosts);
        setSuggestedCreators(feed.suggestedCreators || []);
        setLikedPostIds(new Set(mappedPosts.filter(p => p.isLiked).map(p => p.id)));
        setBookmarkedPostIds(new Set(mappedPosts.filter(p => p.isBookmarked).map(p => p.id)));
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

    loadFeed(false);

    return () => { active = false; };
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
    const isCurrentlyLiked = likedPostIds.has(postId);
    const newLikedState = !isCurrentlyLiked;
    
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (newLikedState) next.add(postId);
      else next.delete(postId);
      return next;
    });

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: newLikedState ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
        };
      }
      return post;
    }));

    try {
      await apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
        token: getAccessToken(),
      });
    } catch (error) {
      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isCurrentlyLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
          };
        }
        return post;
      }));
      alert(error.message || 'Could not update like');
    }
  };

  const toggleBookmark = async (postId) => {
    const isCurrentlyBookmarked = bookmarkedPostIds.has(postId);
    const newBookmarkedState = !isCurrentlyBookmarked;

    setBookmarkedPostIds(prev => {
      const next = new Set(prev);
      if (newBookmarkedState) next.add(postId);
      else next.delete(postId);
      return next;
    });

    try {
      await apiRequest(`/posts/${postId}/favorite`, {
        method: 'POST',
        token: getAccessToken(),
      });
    } catch (error) {
      setBookmarkedPostIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      alert(error.message || 'Could not update favorite');
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

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportTargetId || reportReason.trim().length < 10) {
      setReportError('Reason must be at least 10 characters long.');
      return;
    }
    setIsReporting(true);
    setReportError('');
    try {
      await apiRequest(`/users/${reportTargetId}/report`, {
        method: 'POST',
        token: getAccessToken(),
        body: { type: reportType, reason: reportReason.trim() }
      });
      setReportSuccess('Report submitted successfully. Thank you for keeping the community safe.');
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess('');
        setReportReason('');
        setReportType('SPAM');
        setReportTargetId(null);
      }, 3000);
    } catch (err) {
      setReportError(err.message || 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <UserNavbar />

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

          {/* Feed Posts — pull-to-refresh enabled via touch handlers */}
          <div className="feed-posts" ref={feedRef}>

            {/* Pull-to-refresh indicator */}
            {pullDistance > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', height: `${pullDistance}px`, overflow: 'hidden', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: `rotate(${pullDistance >= PULL_THRESHOLD ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
              </div>
            )}

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
                    <img src={post.creatorAvatar || `https://i.pravatar.cc/150?u=${post.creatorUsername}`} alt={post.creatorUsername} loading="lazy" decoding="async" />
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
                        <button 
                          onClick={(e) => { e.preventDefault(); setActiveMenuId(null); setReportTargetId(post.creatorId); setReportModalOpen(true); }}
                          style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#ff4a4a', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          Report Creator
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
                    <div className="post-image-wrapper" style={{ position: 'relative', width: '100%', minHeight: '300px', maxHeight: '500px', overflow: 'hidden', borderRadius: '12px', marginBottom: '16px', backgroundColor: '#000' }}>
                      {post.type === 'VIDEO' ? (
                        <video src={post.mediaUrl + "#t=0.1"} preload="none" controls className="post-main-img" style={{ width: '100%', height: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
                      ) : (
                        <img src={post.mediaUrl} alt="Post Media" className="post-main-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' }} />
                      )}
                    </div>
                  )}
                </div>

                <div className="post-actions border-top">
                  <div className="action-left">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="like-btn"
                      style={{ color: likedPostIds.has(post.id) ? '#ff4a4a' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg className={`like-icon ${likedPostIds.has(post.id) ? 'active' : ''}`} viewBox="0 0 24 24" width="20" height="20" fill={likedPostIds.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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
                    className="bookmark-btn"
                    style={{ color: bookmarkedPostIds.has(post.id) ? '#FFA52C' : 'var(--text-primary)' }}
                    title={bookmarkedPostIds.has(post.id) ? 'Remove favorite' : 'Add to favorites'}
                  >
                    <svg className={`bookmark-icon ${bookmarkedPostIds.has(post.id) ? 'active' : ''}`} viewBox="0 0 24 24" width="20" height="20" fill={bookmarkedPostIds.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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
                  <img src={cr.avatarUrl || cr.img || 'https://i.pravatar.cc/150?img=11'} alt={cr.username || cr.name} loading="lazy" decoding="async" />
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
                    {comment.user?.id ? (
                      <Link to={`/creator-profile/${comment.user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>@{comment.user.username}</strong>
                      </Link>
                    ) : (
                      <strong style={{ color: 'var(--text-primary)' }}>@{comment.user?.username || 'user'}</strong>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                      </span>
                      {comment.user?.id && comment.user.id !== user?.id && (
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setReportTargetId(comment.user.id); 
                            setReportReason(`[Reporting Comment]: "${comment.content}"\n\nReason: `);
                            setReportType('CONTENT_VIOLATION');
                            setReportModalOpen(true); 
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ff4a4a', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }}
                          title="Report Comment"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </button>
                      )}
                    </div>
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

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => !isReporting && setReportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Report Creator</h3>
              <button onClick={() => !isReporting && setReportModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ padding: '10px 0' }}>
              {reportSuccess ? (
                <div style={{ color: '#16a34a', background: '#dcfce7', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  {reportSuccess}
                </div>
              ) : (
                <form onSubmit={submitReport}>
                  {reportError && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{reportError}</div>}
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Reason</label>
                    <select 
                      value={reportType} 
                      onChange={e => setReportType(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      disabled={isReporting}
                    >
                      <option value="SPAM">Spam</option>
                      <option value="CONTENT_VIOLATION">Inappropriate Content</option>
                      <option value="HARASSMENT">Harassment or Bullying</option>
                      <option value="IMPERSONATION">Impersonation</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Details (min 10 characters)</label>
                    <textarea 
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      placeholder="Please provide more details about why you are reporting this creator..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '100px', resize: 'vertical' }}
                      disabled={isReporting}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setReportModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }} disabled={isReporting}>Cancel</button>
                    <button type="submit" style={{ padding: '10px 16px', background: '#dc2626', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} disabled={isReporting}>
                      {isReporting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
