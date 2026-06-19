import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import './CreatorStudio.css';
import { apiRequest } from '../../utils/api';
import {
  clearAuthSession,
  getAccessToken,
  getCurrentUser,
  getRefreshToken,
} from '../../utils/auth';

const CreatorSettings = () => {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [user] = useState(() => getCurrentUser());
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showDropdown, setShowDropdown] = useState(false);

  // Profile fields
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: '' }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!getAccessToken()) { navigate('/login', { replace: true }); return; }
    if (user?.role !== 'CREATOR') { navigate('/creator-studio', { replace: true }); return; }

    const load = async () => {
      try {
        const res = await apiRequest('/creators/dashboard', { token: getAccessToken() });
        const p = res.profile || {};
        setBio(p.bio || '');
        setPrice(p.price > 0 ? String(p.price) : '');
        setAvatarUrl(p.avatarUrl || '');
        setCoverUrl(p.coverUrl || '');
      } catch {
        showToast('error', 'Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, user]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken)
        await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, token: getAccessToken() });
    } catch { } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiRequest('/creators/profile', {
        method: 'PATCH',
        token: getAccessToken(),
        body: { bio, price: Number(price) },
      });
      showToast('success', 'Profile saved successfully!');
    } catch (err) {
      showToast('error', err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return showToast('error', 'Fill all password fields.');
    if (newPassword !== confirmPassword) return showToast('error', 'New passwords do not match.');
    if (newPassword.length < 8) return showToast('error', 'Password must be at least 8 characters.');
    setChangingPw(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        token: getAccessToken(),
        body: { oldPassword, newPassword },
      });
      showToast('success', 'Password changed successfully!');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      showToast('error', err.message || 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleImagePreview = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-color)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionCard = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '24px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
    fontWeight: '600',
  };

  return (
    <div className="creator-layout">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="studio-top-nav">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/creator/studio" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={24} textClass="brand-logo-small" />
            <span className="creator-badge" style={{ marginLeft: '4px' }}>CREATOR</span>
          </Link>
        </div>
        <div className="nav-right">
          <button
            className="icon-btn"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <div className="user-avatar" style={{ position: 'relative' }}>
            <img
              src={avatarUrl || user?.avatar || 'https://i.pravatar.cc/150?img=11'}
              alt="Profile"
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
              <div
                style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}
                onClick={() => setShowDropdown(false)}
              >
                <Link to="/creator/settings" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
                  ⚙️ Account Settings
                </Link>
                <Link to="/creator/studio" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  🎬 Creator Studio
                </Link>
                {user?.id && (
                  <Link to={`/creator-profile/${user.id}`} style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    👤 My Creator Page
                  </Link>
                )}
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
        </div>
      </nav>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '12px', maxWidth: '340px',
          background: toast.type === 'success' ? 'rgba(76,175,80,0.15)' : 'rgba(255,74,74,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(76,175,80,0.4)' : 'rgba(255,74,74,0.4)'}`,
          color: toast.type === 'success' ? '#4caf50' : '#ff6b6b',
          fontWeight: '600', fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideInToast 0.3s ease',
          backdropFilter: 'blur(12px)',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div className="studio-content">
        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="studio-sidebar">
          <div className="studio-menu">
            <Link to="/creator/studio" className="studio-menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Studio Dashboard
            </Link>
            <Link to="/creator/settings" className="studio-menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Account Settings
            </Link>
            {user?.id && (
              <Link to={`/creator-profile/${user.id}`} className="studio-menu-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                My Creator Page
              </Link>
            )}
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="studio-main">
          <div className="upload-header">
            <h2>⚙️ Creator Account Settings</h2>
            <p>Manage your creator profile, subscription pricing, and account security.</p>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading settings...</div>
          ) : (
            <>
              {/* ── 1. Profile Info ─────────────────────────────────── */}
              <div style={sectionCard}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00B4D8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Profile Information
                </h3>

                {/* Cover image */}
                <label style={labelStyle}>Cover Photo</label>
                <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleImagePreview(e, setCoverUrl)} />
                <div style={{ position: 'relative', width: '100%', height: '130px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border-color)' }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No cover photo set</div>
                  )}
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '7px 14px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}
                  >
                    Change Cover
                  </button>
                </div>

                {/* Avatar */}
                <label style={labelStyle}>Profile Avatar</label>
                <input type="file" accept="image/*" ref={avatarInputRef} style={{ display: 'none' }} onChange={(e) => handleImagePreview(e, setAvatarUrl)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={avatarUrl || 'https://i.pravatar.cc/150?img=11'}
                      alt="Avatar"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)' }}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #00B4D8, #c4b5fd)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                    </button>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-color)', fontWeight: '600', marginBottom: '4px' }}>@{user?.username}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{user?.email}</p>
                    <p style={{ color: '#00B4D8', fontSize: '0.78rem', marginTop: '4px', fontWeight: '600' }}>CREATOR ✓</p>
                  </div>
                </div>

                {/* Bio */}
                <label style={labelStyle}>Creator Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell fans what you create…"
                  maxLength={500}
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '8px' }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'right', marginBottom: '20px' }}>{bio.length}/500</p>

                {/* Subscription Price */}
                <label style={labelStyle}>Monthly Subscription Price (USD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-color)' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="9.99"
                    style={{ ...inputStyle, width: '140px' }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ month</span>
                </div>

                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary-gradient" style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : 'Save Profile Changes'}
                </button>
              </div>

              {/* ── 2. Account Info (read-only) ──────────────────────── */}
              <div style={sectionCard}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c4b5fd" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 4l10 8 10-8" /></svg>
                  Account Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'Username', value: user?.username },
                    { label: 'Email', value: user?.email },
                    { label: 'Role', value: 'CREATOR' },
                    { label: 'Verified', value: user?.isVerified ? 'Yes ✓' : 'No' },
                    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
                  ].map((row) => (
                    <div key={row.label}>
                      <label style={labelStyle}>{row.label}</label>
                      <div style={{ ...inputStyle, opacity: 0.7, cursor: 'default', userSelect: 'text' }}>{row.value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 3. Change Password ───────────────────────────────── */}
              <div style={sectionCard}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFA52C" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Change Password
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px' }}>
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={inputStyle} />
                  </div>
                  <button onClick={handleChangePassword} disabled={changingPw} className="btn-primary-gradient" style={{ opacity: changingPw ? 0.7 : 1, cursor: changingPw ? 'not-allowed' : 'pointer', marginTop: '4px', alignSelf: 'flex-start', padding: '11px 24px' }}>
                    {changingPw ? 'Changing…' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* ── 4. Danger Zone ───────────────────────────────────── */}
              <div style={{ ...sectionCard, borderColor: 'rgba(255,74,74,0.25)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff6b6b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  Danger Zone
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: '16px' }}>Once you log out, you'll need your credentials to get back in.</p>
                <button
                  onClick={handleLogout}
                  style={{ padding: '10px 20px', background: 'rgba(255,74,74,0.1)', border: '1px solid rgba(255,74,74,0.3)', color: '#ff4a4a', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', fontFamily: 'inherit' }}
                >
                  🚪 Log Out of Account
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreatorSettings;
