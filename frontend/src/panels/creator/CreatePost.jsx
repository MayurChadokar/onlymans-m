import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './CreatorStudio.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';

const CreatePost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState('');
  const [monetization, setMonetization] = useState('Subscriber Exclusive');

  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
        }
      }, 150); // fast fake upload
    }
  };

  const handlePostSubmit = () => {
    if (!selectedFile) {
      alert("Please select a media file to upload first!");
      return;
    }
    
      alert(`Post submitted successfully!`);
      
      // Reset form
      setSelectedFile(null);
      setCaption('');
      setMonetization('Subscriber Exclusive');
      setUploadProgress(0);
      navigate('/creator/studio'); // Redirect back to studio dashboard
  };

  if (!user) return <div className="creator-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-color)' }}>Loading...</div>;

  return (
    <div className="creator-layout">
      {/* Top Navbar */}
      <nav className="studio-top-nav">
        <div className="nav-left">
          <Link to="/creator/studio" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={24} textClass="brand-logo-small" />
            <span className="creator-badge" style={{ marginLeft: '4px' }}>CREATOR</span>
          </Link>
        </div>
        <div className="nav-right">
          <div className="search-analytics">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search analytics..." />
          </div>
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
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <div className="user-avatar" style={{ position: 'relative' }}>
            <img src={user?.avatar || "https://i.pravatar.cc/150?img=11"} alt="Profile" onClick={() => setShowDropdown(!showDropdown)} />
            {showDropdown && (
              <div style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <Link to="/user/profile" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>View Profile</Link>
                <Link to="/user/dashboard" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}>User Dashboard</Link>
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
        </div>
      </nav>

      <div className="studio-content">
        {/* Left Sidebar */}
        <aside className="studio-sidebar">
          <div className="studio-menu">
            <Link to="/creator/studio?tab=dashboard" className="studio-menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Dashboard
            </Link>
            <Link to="/creator/create-post" className="studio-menu-item active">
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

        {/* Main Content Area */}
        <main className="studio-main">
          <div className="upload-header">
            <h2>Upload Content</h2>
            <p>Share your latest masterpiece with your community.</p>
          </div>

          <div className="upload-area">
            <div className="upload-box">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="video/mp4,video/quicktime,image/jpeg,image/png" />
              <div className="upload-icon-wrapper">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#FFA52C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h4 className="upload-title">Drag & Drop Media</h4>
              <p className="upload-subtitle">MP4, MOV, JPEG or PNG (Max 2GB)</p>
              <button className="btn-browse" onClick={() => fileInputRef.current.click()}>Browse Files</button>
            </div>
          </div>

          {/* Upload Progress Card */}
          {selectedFile && (
            <div className="upload-progress-card">
              <div className="upload-progress-info">
                <div className="file-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
                </div>
                <div className="file-details">
                  <div className="file-name-row">
                    <span>{selectedFile.name}</span>
                    <span className="file-percentage">{uploadProgress}%</span>
                  </div>
                  <div className="file-meta">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isUploading ? 'UPLOADING' : 'COMPLETED'}
                  </div>
                </div>
              </div>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${uploadProgress}%`, background: uploadProgress === 100 ? '#4caf50' : '' }}></div>
              </div>
              {isUploading && <button className="btn-cancel-upload" onClick={() => setSelectedFile(null)}>Cancel</button>}
            </div>
          )}
        </main>

        {/* Right Sidebar - Settings */}
        <aside className="studio-settings">
          {/* Caption & Hashtags */}
          <div className="settings-section">
            <h4 className="settings-title">CAPTION & HASHTAGS</h4>
            <div className="textarea-wrapper">
              <textarea 
                placeholder="Describe your post and add #hashtags..." 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)}
              ></textarea>
            </div>
            <div className="tags-row">
              <span className="tag-pill active">#exclusive</span>
              <button className="add-tag-btn">+ Add Tag</button>
            </div>
          </div>

          {/* Monetization */}
          <div className="settings-section">
            <h4 className="settings-title">MONETIZATION SETTINGS</h4>
            
            <label className={`radio-card ${monetization === 'Subscriber Exclusive' ? 'active' : ''}`}>
              <div className="radio-input-wrapper">
                <input type="radio" name="monetization" checked={monetization === 'Subscriber Exclusive'} onChange={() => setMonetization('Subscriber Exclusive')} />
                <span className="custom-radio"></span>
              </div>
              <div className="radio-content">
                <h5>Subscriber Exclusive</h5>
                <p>Only active subscribers can view this.</p>
              </div>
              {monetization === 'Subscriber Exclusive' && (
                <div className="radio-check-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
              )}
            </label>

            <label className={`radio-card ${monetization === 'Free for All' ? 'active' : ''}`}>
              <div className="radio-input-wrapper">
                <input type="radio" name="monetization" checked={monetization === 'Free for All'} onChange={() => setMonetization('Free for All')} />
                <span className="custom-radio"></span>
              </div>
              <div className="radio-content">
                <h5>Free for All</h5>
                <p>Visible to anyone visiting your profile.</p>
              </div>
            </label>
          </div>

          {/* Toggles */}
          <div className="settings-section toggles-section">
            <div className="toggle-row">
              <div className="toggle-label">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Schedule Post</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-row">
              <div className="toggle-label">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <span>Hide from Search</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="studio-actions">
            <button className="btn-primary-gradient" onClick={handlePostSubmit} disabled={isUploading} style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? 'Uploading...' : 'Post Content Now'}
            </button>
            <button className="btn-secondary-dark" onClick={() => setSelectedFile(null)}>Clear Form</button>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation for Studio */}
      <div className="mobile-studio-nav">
         <Link to="/creator/create-post" className="mobile-nav-item active">
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

export default CreatePost;
