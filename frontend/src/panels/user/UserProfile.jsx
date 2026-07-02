import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { getAccessToken, getCurrentUser } from '../../utils/auth';
import { toast } from 'react-hot-toast';
import UserNavbar from '../../components/UserNavbar';

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());
  const isCreator = user?.role === 'CREATOR';
  const homePath = isCreator ? '/creator-studio' : '/dashboard';

  // Edit Profile Form State
  const [editData, setEditData] = useState({
    displayName: '',
    username: '',
    bio: '',
    price: '',
  });

  // Creator profile data
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiRequest('/users/avatar', {
        method: 'PUT',
        token: getAccessToken(),
        body: formData,
        isFormData: true
      });

      if (res.user) {
        setUser(res.user);
        // Also update local storage so it persists on reload
        const sessionStr = localStorage.getItem('onlymans_auth_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          session.user = { ...session.user, avatar: res.user.avatarUrl };
          localStorage.setItem('onlymans_auth_session', JSON.stringify(session));
        }
        toast.success('Avatar updated successfully! 🚀');
      }
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    if (!getAccessToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || user.username || '',
        username: user.username || '',
        bio: user.bio || '',
        price: '',
      });
    }

    // If creator, fetch creator profile
    if (isCreator) {
      const loadCreatorProfile = async () => {
        setCreatorLoading(true);
        try {
          const res = await apiRequest('/creators/dashboard', { token: getAccessToken() });
          setCreatorProfile(res.profile || null);
          setEditData(prev => ({
            ...prev,
            bio: res.profile?.bio || prev.bio,
            price: String(res.profile?.price ?? ''),
          }));
        } catch {
          // ignore — show basic info
        } finally {
          setCreatorLoading(false);
        }
      };
      loadCreatorProfile();
    }
  }, [user?.id]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading('Saving profile...');
    try {
      if (isCreator) {
        await apiRequest('/creators/profile', {
          method: 'PATCH',
          token: getAccessToken(),
          body: {
            bio: editData.bio,
            price: Number(editData.price),
          },
        });
        toast.success('Creator profile saved successfully! 🎉', { id: loadingToast });
      } else {
        const body = {};
        if (editData.username !== user.username) {
          body.username = editData.username;
        }
        
        if (Object.keys(body).length > 0) {
          const res = await apiRequest('/users/profile', {
            method: 'PATCH',
            token: getAccessToken(),
            body,
          });
          if (res.user) {
            setUser(res.user);
            // Update local storage
            const sessionStr = localStorage.getItem('onlymans_auth_session');
            if (sessionStr) {
              const session = JSON.parse(sessionStr);
              session.user = { ...session.user, username: res.user.username };
              localStorage.setItem('onlymans_auth_session', JSON.stringify(session));
            }
          }
        }
        toast.success('Profile saved successfully! 🎉', { id: loadingToast });
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Save failed. Try again.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="dashboard-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-color)' }}>
      Loading...
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <UserNavbar />

      <div className="dashboard-content">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="nav-menu">
            <Link to={homePath} className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              Home
            </Link>
            <Link to="/user/explore" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
              Explore
            </Link>
            {!isCreator && (
              <>
                <Link to="/user/subscriptions" className="menu-item">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Subscriptions
                </Link>
                <Link to="/user/favorites" className="menu-item">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Favorites
                </Link>
              </>
            )}
          </div>

          <div className="menu-section">
            <h4 className="section-title">ACCOUNT</h4>
            <Link to="/user/profile" className="menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {isCreator ? 'Account Settings' : 'My Profile & Settings'}
            </Link>
            {isCreator ? (
              <Link to="/creator/studio" className="menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Creator Studio
              </Link>
            ) : (
              <Link to="/user/become-creator" className="menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Upgrade to Creator
              </Link>
            )}
          </div>

          <div className="promo-card">
            {isCreator ? (
              <>
                <h4>Creator Mode 🎬</h4>
                <p>Manage your content, subscribers and earnings.</p>
                <Link to="/creator/studio" className="btn-gradient">Open Creator Studio</Link>
              </>
            ) : (
              <>
                <h4>Be the Star ⭐</h4>
                <p>Start sharing your world today.</p>
                <Link to="/user/become-creator" className="btn-gradient">Become a Creator</Link>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-feed" style={{ maxWidth: '800px' }}>

          {/* === CREATOR ACCOUNT SETTINGS === */}
          {isCreator ? (
            <>
              <div className="upload-header">
                <h2>Creator Account Settings</h2>
                <p>Manage your account details and creator profile.</p>
              </div>

              {/* Creator Identity Card */}
              <div className="post-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-secondary-dark"
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <img loading="lazy" decoding="async" 
                      src={creatorProfile?.avatarUrl || user?.avatar || "https://i.pravatar.cc/150?img=11"}
                      alt="Profile"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #00B4D8' }}
                    />
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#00B4D8', borderRadius: '999px', padding: '3px 6px', fontSize: '0.6rem', fontWeight: 700, color: 'white' }}>
                      CREATOR
                    </div>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-color)' }}>{user?.username}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>@{user?.username}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.3)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✅ Creator Account
                      </span>
                      {user?.isVerified && (
                        <span style={{ background: 'rgba(76,175,80,0.1)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          ☑️ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator Profile Edit */}
              {isEditing && (
                <div className="post-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Edit Creator Profile</h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={e => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Tell your fans about yourself..."
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', height: '100px', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly Subscription Price (USD)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.price}
                        onChange={e => setEditData({ ...editData, price: e.target.value })}
                        style={{ width: '140px', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontFamily: 'inherit', fontSize: '1rem' }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>/month</span>
                    </div>
                  </div>

                  {saveMsg && (
                    <div style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', background: saveMsg.includes('saved') ? 'rgba(76,175,80,0.1)' : 'rgba(255,74,74,0.1)', color: saveMsg.includes('saved') ? '#4caf50' : '#ff4a4a', border: `1px solid ${saveMsg.includes('saved') ? 'rgba(76,175,80,0.3)' : 'rgba(255,74,74,0.3)'}` }}>
                      {saveMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn-primary-gradient"
                    style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? 'Saving...' : 'Save Creator Profile'}
                  </button>
                </div>
              )}

              {/* Creator Stats (from dashboard) */}
              {creatorLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>Loading creator stats...</div>
              ) : creatorProfile && (
                <div className="post-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>Creator Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                    {[
                      { label: 'Subscription Price', value: `$${Number(creatorProfile.price || 0).toFixed(2)}/mo`, color: '#FFA52C' },
                      { label: 'Bio Set', value: creatorProfile.bio ? '✅ Yes' : '❌ Not yet', color: '#00B4D8' },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{stat.label}</p>
                        <h4 style={{ color: stat.color, fontSize: '1.1rem', fontWeight: 700 }}>{stat.value}</h4>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Link to="/creator/studio" className="btn-primary-gradient" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', color: 'white' }}>
                      Open Full Creator Studio →
                    </Link>
                  </div>
                </div>
              )}

              {/* Account Details */}
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ marginBottom: '16px' }}>Account Details</h3>
                <div className="post-card" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Username</label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
                    />
                  </div>
                  <div style={{ padding: '12px 16px', background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    💡 To change your username or email, please contact support.
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* === USER ACCOUNT SETTINGS === */
            <>
              <div className="upload-header">
                <h2>Account Settings</h2>
                <p>Manage your personal information and preferences.</p>
              </div>

              <div className="post-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  <button onClick={() => setIsEditing(true)} className="btn-secondary-dark" style={{ padding: '8px 16px', borderRadius: '8px' }}>Edit Profile</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <img loading="lazy" decoding="async" 
                    src={user?.avatar || "https://i.pravatar.cc/150?img=11"}
                    alt="Profile"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                  />
                  <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-color)' }}>{user?.displayName || user?.username}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>@{user?.username}</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                      />
                      <button 
                        className="btn-secondary-dark" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </button>
                      <button className="btn-secondary-dark" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#ff4a4a' }}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Account Details</h3>
                <div className="post-card" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Payment Methods</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input, rgba(255,255,255,0.03))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-color)' }}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        <span>Visa ending in **** 4242</span>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#ff4a4a', cursor: 'pointer' }}>Remove</button>
                    </div>
                    <button className="btn-gradient small-btn" style={{ marginTop: '12px', padding: '8px 16px' }}>+ Add Payment Method</button>
                  </div>
                  <div>
                    <button className="btn-primary-gradient" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}>Save Settings</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="mobile-bottom-nav">
        <Link to={homePath} className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Home
        </Link>
        <Link to="/user/explore" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
          Explore
        </Link>
        <Link to="/user/profile" className="mobile-nav-item active">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </Link>
        {isCreator ? (
          <Link to="/creator/studio" className="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Studio
          </Link>
        ) : (
          <Link to="/user/favorites" className="mobile-nav-item">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Favorites
          </Link>
        )}
      </div>

      {/* Edit Profile Modal — User only */}
      {isEditing && !isCreator && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay, rgba(0,0,0,0.8))', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div className="post-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-color)' }}>Edit Profile Info</h3>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Display Name</label>
              <input type="text" value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Username / Handle</label>
              <input type="text" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</label>
              <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-input, rgba(255,255,255,0.03))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', height: '100px', resize: 'none', fontFamily: 'inherit' }}></textarea>
            </div>
            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary-gradient" style={{ width: '100%', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
