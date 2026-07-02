import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Logo from '../../components/Logo';
import StripeCheckoutModal from '../../components/StripeCheckoutModal';
import './Dashboard.css';
import './CreatorProfile.css';
import { apiRequest } from '../../utils/api';
import { getAccessToken, getCurrentUser } from '../../utils/auth';
import UserNavbar from '../../components/UserNavbar';
import CreatorNavbar from '../../components/CreatorNavbar';

const FALLBACK_COVER = 'https://picsum.photos/seed/city/800/300';
const FALLBACK_AVATAR = 'https://i.pravatar.cc/150?img=11';

const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
};

const CreatorProfile = () => {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isCreator = currentUser?.role === 'CREATOR';
  const isOwnProfile = isCreator && String(currentUser?.id) === String(creatorId);
  const homePath = isCreator ? '/creator-studio' : '/dashboard';
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    handle: '',
    bio: '',
    coverUrl: FALLBACK_COVER,
    avatarUrl: FALLBACK_AVATAR,
    subscriptionPrice: '4.99',
    joinedAt: '',
    tiers: [],
  });
  const [stats, setStats] = useState({
    fansCount: 0,
    postsCount: 0,
    likesCount: 0,
  });
  const [posts, setPosts] = useState([]);
  const [similarCreators, setSimilarCreators] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!creatorId) {
        setError('Creator not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const accessToken = getAccessToken();
        const response = accessToken
          ? await apiRequest(`/creators/profile/secure/${creatorId}`, { token: accessToken })
          : await apiRequest(`/creators/public/${creatorId}`);

        if (!active) return;

        const profile = response.profile || {};
        setProfileData({
          displayName: profile.username || 'Creator',
          handle: profile.username || 'creator',
          bio: profile.bio || 'This creator has not added a bio yet.',
          coverUrl: profile.coverUrl || FALLBACK_COVER,
          avatarUrl: profile.avatarUrl || FALLBACK_AVATAR,
          subscriptionPrice: formatCurrency(profile.price ?? 4.99),
          joinedAt: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '',
          tiers: response.tiers || [],
        });
        setStats(response.stats || { fansCount: 0, postsCount: 0, likesCount: 0 });
        setIsSubscribed(Boolean(response.isSubscribed));
        setPosts((response.posts || []).map((post) => {
          const firstMedia = post.media?.[0];
          return {
            id: post.id,
            content: post.content || '',
            visibility: post.visibility || 'PUBLIC',
            createdAt: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now',
            mediaUrl: firstMedia?.url || FALLBACK_COVER,
            type: firstMedia?.type || 'IMAGE',
            isLocked: Boolean(post.isLocked),
            likesCount: post.likesCount || 0,
          };
        }));
      } catch (secureError) {
        try {
          const publicResponse = await apiRequest(`/creators/public/${creatorId}`);

          if (!active) return;

          const profile = publicResponse || {};
          setProfileData({
            displayName: profile.username || 'Creator',
            handle: profile.username || 'creator',
            bio: profile.bio || 'This creator has not added a bio yet.',
            coverUrl: FALLBACK_COVER,
            avatarUrl: FALLBACK_AVATAR,
            subscriptionPrice: formatCurrency(profile.price ?? 4.99),
            joinedAt: profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : '',
            tiers: profile.tiers || [],
          });
          setStats({ fansCount: 0, postsCount: 0, likesCount: 0 });
          setIsSubscribed(false);
          setPosts([]);
        } catch (publicError) {
          if (!active) return;
          setError(publicError.message || secureError.message || 'Failed to load creator profile');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadSimilarCreators = async () => {
      const token = getAccessToken();
      try {
        const response = await apiRequest('/creators?limit=4', { token });
        if (!active) return;
        setSimilarCreators((response.creators || []).filter((creator) => creator.id !== creatorId).slice(0, 2));
      } catch {
        if (!active) return;
        setSimilarCreators([]);
      }
    };

    loadProfile();
    loadSimilarCreators();
    return () => {
      active = false;
    };
  }, [creatorId]);

  const [selectedTier, setSelectedTier] = useState(null);

  const handleSubscribe = (tier = null) => {
    setSelectedTier(tier);
    setIsStripeModalOpen(true);
  };

  return (
    <div className={isOwnProfile ? "creator-layout" : "dashboard-layout"}>
      {isOwnProfile ? <CreatorNavbar /> : <UserNavbar />}

      <div className={isOwnProfile ? "studio-content" : "dashboard-content"}>
        {isOwnProfile ? (
          <aside className="studio-sidebar" style={{ borderRight: '1px solid var(--border-color)', height: 'calc(100vh - 64px)' }}>
            <div className="studio-menu">
              <Link to="/creator/studio?tab=dashboard" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Dashboard
              </Link>
              <Link to="/creator/create-post" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
                Create Post
              </Link>
              <Link to="/creator/studio?tab=posts" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                Posts & Content
              </Link>
              <Link to="/creator/studio?tab=comments" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Comments
              </Link>
              <Link to="/creator/studio?tab=subscription" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Subscription
              </Link>
              <Link to="/creator/subscribers" className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Subscribers
              </Link>
            </div>
          </aside>
        ) : (
          <aside className="left-sidebar">
            <div className="nav-menu">
              <Link to={homePath} className="menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                Home
              </Link>
              <Link to="/user/explore" className="menu-item active">
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
            <div className="promo-card">
              <h4>{isCreator ? 'Creator Mode' : (isSubscribed ? 'Subscribed' : 'Be the Star')}</h4>
              <p>{isCreator ? 'Manage your creator profile.' : (isSubscribed ? 'You already have access.' : 'Start sharing your world today.')}</p>
              <Link to={isCreator ? '/creator-studio' : '/become-creator'} className="btn-gradient">
                {isCreator ? 'Open Creator Studio' : 'Become a Creator'}
              </Link>
            </div>
          </aside>
        )}

        <main className="main-feed" style={{ padding: 0, maxWidth: '750px', border: '1px solid var(--border-color)', borderRadius: '16px', overflowX: 'hidden', overflowY: 'auto', background: 'var(--bg-card)' }}>
          <div className="hero-banner-container" style={{ height: '220px', width: '100%', position: 'relative' }}>
            <img loading="lazy" decoding="async" src={profileData.coverUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
              <Link to="/user/explore" style={{ color: 'white', display: 'flex' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </Link>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px', position: 'relative', zIndex: 10 }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading creator profile...</div>
            ) : error ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#ff6b6b' }}>{error}</div>
            ) : (
              <>
                <div className="profile-header-flex" style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
                  <div className="profile-avatar-wrapper" style={{ width: '120px', height: '120px', background: 'var(--bg-card)', border: '4px solid var(--bg-card)', borderRadius: '50%', padding: 0 }}>
                    <img loading="lazy" decoding="async" src={profileData.avatarUrl} alt={profileData.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>

                  <div className="profile-bio-section" style={{ marginTop: '8px' }}>
                    <h1 className="profile-name">
                      {profileData.displayName}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B4D8"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    </h1>
                    <p className="profile-handle" style={{ margin: 0, color: 'var(--text-secondary)' }}>@{profileData.handle}</p>
                    <p className="profile-bio" style={{ marginTop: '12px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                      {profileData.bio}
                    </p>
                    {profileData.joinedAt && (
                      <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Joined {profileData.joinedAt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="profile-stats" style={{ margin: '24px 0' }}>
                  <div className="stat-item">
                    <h3>{stats.fansCount?.toLocaleString?.() ?? stats.fansCount ?? 0}</h3>
                    <span>FANS</span>
                  </div>
                  <div className="stat-item">
                    <h3>{stats.postsCount?.toLocaleString?.() ?? stats.postsCount ?? 0}</h3>
                    <span>POSTS</span>
                  </div>
                  <div className="stat-item">
                    <h3>{stats.likesCount?.toLocaleString?.() ?? stats.likesCount ?? 0}</h3>
                    <span>LIKES</span>
                  </div>
                </div>

                <div className="profile-feed-grid">
                  {posts.map((post) => (
                    <div key={post.id} className={`grid-post ${post.isLocked ? 'locked-post' : 'unlocked-post'}`}>
                      {post.isLocked ? (
                        <div className="locked-content">
                          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" /></svg>
                          <h3>Subscriber Exclusive</h3>
                          <button onClick={handleSubscribe} className="btn-gradient small-btn">Unlock Access</button>
                        </div>
                      ) : (
                        <div onClick={() => navigate(`/post/${post.id}`)} style={{ cursor: 'pointer', height: '100%', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px' }} className="post-thumbnail-wrapper">
                          {post.type === 'VIDEO' ? (
                            <>
                              <video src={post.mediaUrl + "#t=0.1"} preload="metadata" style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            </>
                          ) : (
                            <>
                              <img loading="lazy" decoding="async" src={post.mediaUrl} alt="Post" style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '6px', backdropFilter: 'blur(4px)' }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                              </div>
                            </>
                          )}
                          
                          <div className="post-hover-stats" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 12px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500 }}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                              {post.likesCount || 0}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#E1E2E6' }}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {!posts.length && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                      No posts found for this creator yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <aside className="right-sidebar">
          {profileData.tiers && profileData.tiers.length > 0 ? (
            profileData.tiers.map((tier) => (
              <div key={tier.id} className="fan-tier-card glass-panel" style={{ background: 'var(--bg-card)', marginBottom: '16px' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>{tier.name}</h3>
                <ul className="tier-benefits">
                  {tier.benefits && tier.benefits.map((benefit, index) => (
                    <li key={index}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> {benefit}</li>
                  ))}
                </ul>
                <div className="tier-actions" style={{ marginTop: '20px' }}>
                  <button onClick={() => handleSubscribe(tier)} className="btn-gradient w-100 tier-sub-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    {isSubscribed ? 'Subscribed' : `Subscribe $${Number(tier.price).toFixed(2)}/mo`}
                    <small style={{ display: 'block' }}>{isSubscribed ? 'You are already a fan' : 'Become a Fan'}</small>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="fan-tier-card glass-panel" style={{ background: 'var(--bg-card)', marginBottom: '16px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Fan Tier</h3>
              <ul className="tier-benefits">
                <li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Full access to all media</li>
                <li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Direct messaging priority</li>
                <li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Exclusive live streams</li>
              </ul>
              <div className="tier-actions" style={{ marginTop: '20px' }}>
                <button onClick={() => handleSubscribe(null)} className="btn-gradient w-100 tier-sub-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  {isSubscribed ? 'Subscribed' : `Subscribe $${profileData.subscriptionPrice || '4.99'}/mo`}
                  <small style={{ display: 'block' }}>{isSubscribed ? 'You are already a fan' : 'Become a Fan'}</small>
                </button>
              </div>
            </div>
          )}

          <div className="similar-creators-card" style={{ marginTop: '24px' }}>
            <h4>Similar Creators</h4>
            <div className="similar-list">
              {similarCreators.map((creator) => (
                <Link to={`/creator-profile/${creator.id}`} key={creator.id} className="similar-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <img loading="lazy" decoding="async" src={creator.creatorProfile?.avatarUrl || `https://i.pravatar.cc/150?u=${creator.username}`} alt={creator.username} />
                  <div className="similar-info">
                    <h5>{creator.username}</h5>
                    <p>@{creator.username}</p>
                  </div>
                  <button className="add-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mobile-bottom-nav">
        <Link to={homePath} className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          Home
        </Link>
        <Link to="/user/explore" className="mobile-nav-item active">
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


      <StripeCheckoutModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        planName={selectedTier ? selectedTier.name : "Monthly Subscription"}
        price={selectedTier ? `$${Number(selectedTier.price).toFixed(2)}` : `$${profileData.subscriptionPrice || '4.99'}`}
        creatorName={profileData.displayName || 'Creator'}
        avatarUrl={profileData.avatarUrl}
        creatorId={creatorId}
        onSuccess={() => {
          setIsSubscribed(true);
          setPosts(prevPosts => prevPosts.map(post => ({ ...post, isLocked: false })));
        }}
      />
    </div>
  );
};

export default CreatorProfile;
