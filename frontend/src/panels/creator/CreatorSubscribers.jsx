import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CreatorStudio.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';
import CreatorNavbar from '../../components/CreatorNavbar';

const CreatorSubscribers = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, token: accessToken });
      }
    } catch {
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const subscribers = [
    { id: 1, userUsername: 'fanboy99', status: 'Active', renewDate: 'Oct 24, 2026', amount: '$4.99/mo' },
    { id: 2, userUsername: 'mystery_user', status: 'Canceled', renewDate: 'Sep 10, 2026', amount: '$4.99/mo' }
  ];

  const stats = { totalActive: 1, revenue: 4.99 };
  return (
    <div className="creator-layout">
      <CreatorNavbar />

      <div className="studio-content">
        {/* Left Sidebar */}
        <aside className="studio-sidebar">
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
            <Link to="/creator/subscribers" className="studio-menu-item active">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Subscribers
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="studio-main" style={{ maxWidth: '100%' }}>
          <div className="upload-header" style={{ marginBottom: '40px' }}>
            <h2>Your Subscribers</h2>
            <p>Manage and view details of your active and past subscribers.</p>
          </div>

          {/* Subscribers Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active</p>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-color)' }}>{stats.totalActive}</h3>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Monthly Revenue</p>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#00B4D8' }}>${stats.revenue}</h3>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New This Month</p>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#4caf50' }}>+{stats.totalActive}</h3>
            </div>
          </div>

          {/* Subscriber List Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)' }}>Subscriber List</h3>
              <input type="text" placeholder="Search by username..." style={{ background: 'var(--bg-input, rgba(0,0,0,0.2))', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }} />
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '16px 24px', fontWeight: '500' }}>User</th>
                    <th style={{ padding: '16px 24px', fontWeight: '500' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontWeight: '500' }}>Since</th>
                    <th style={{ padding: '16px 24px', fontWeight: '500' }}>Revenue</th>
                    <th style={{ padding: '16px 24px', fontWeight: '500' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img loading="lazy" decoding="async" src={`https://i.pravatar.cc/150?u=${sub.userUsername}`} alt={sub.userUsername} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-color)', fontSize: '0.9rem' }}>{sub.userUsername}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{sub.userUsername}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          background: sub.status === 'Active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 74, 74, 0.1)', 
                          color: sub.status === 'Active' ? '#4caf50' : '#ff4a4a', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600' 
                        }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{sub.renewDate}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-color)', fontSize: '0.9rem', fontWeight: '500' }}>{sub.amount}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Message</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Studio */}
      <div className="mobile-studio-nav">
         <Link to="/creator/create-post" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
          Upload
        </Link>
        <Link to="/creator/studio" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Stats
        </Link>
        <Link to="/creator/studio" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Msgs
        </Link>
        <Link to="/user/dashboard" className="mobile-nav-item">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Exit
        </Link>
      </div>
    </div>
  );
};

export default CreatorSubscribers;
