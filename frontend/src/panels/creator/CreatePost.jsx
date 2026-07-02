import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './CreatorStudio.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';
import { toast } from 'react-hot-toast';
import CreatorNavbar from '../../components/CreatorNavbar';

const CreatePost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(() => getCurrentUser());

  const [mediaFiles, setMediaFiles] = useState([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [monetization, setMonetization] = useState('Subscriber Exclusive');
  const [creatorPrice, setCreatorPrice] = useState(null); // null = not loaded yet

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
      return;
    }
    apiRequest('/creators/dashboard', { token: getAccessToken() })
      .then(res => setCreatorPrice(res?.profile?.price ?? 0))
      .catch(() => setCreatorPrice(0));
  }, [navigate]);

  useEffect(() => {
    return () => {
      // Clean up object URLs to avoid memory leaks
      mediaFiles.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

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

  const getUploadUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    return baseUrl.replace(/\/$/, '') + '/media/upload';
  };

  const uploadFile = (entry) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', getUploadUrl(), true);
    
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setMediaFiles(prev => prev.map(item => item.id === entry.id ? { ...item, progress: percentComplete } : item));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resObj = JSON.parse(xhr.responseText);
          if (resObj && resObj.url) {
            setMediaFiles(prev => prev.map(item => item.id === entry.id ? { 
              ...item, 
              status: 'completed', 
              progress: 100, 
              url: resObj.url 
            } : item));
            toast.success(`Uploaded ${entry.name} successfully! 🚀`);
          } else {
            throw new Error('No URL in response');
          }
        } catch (e) {
          setMediaFiles(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'failed', error: 'Response error' } : item));
          toast.error(`Upload error for ${entry.name}`);
        }
      } else {
        setMediaFiles(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'failed', error: `Server error: ${xhr.status}` } : item));
        toast.error(`Failed to upload ${entry.name}: Server error`);
      }
    };

    xhr.onerror = () => {
      setMediaFiles(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'failed', error: 'Network error' } : item));
      toast.error(`Network error uploading ${entry.name}`);
    };

    const formData = new FormData();
    formData.append('file', entry.file);
    xhr.send(formData);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (monetization === 'Subscriber Exclusive' && !creatorPrice) {
      toast.error("Set up your subscription plan before uploading subscriber-exclusive content.");
      e.target.value = '';
      return;
    }

    const newEntries = files.map((file, index) => {
      const isVideo = file.type.startsWith('video/');
      return {
        id: Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        progress: 0,
        status: 'pending',
        url: '',
        previewUrl: URL.createObjectURL(file),
      };
    });

    setMediaFiles(prev => [...prev, ...newEntries]);

    // Start uploads immediately
    newEntries.forEach(entry => {
      uploadFile(entry);
    });
  };

  const handleRemoveFile = (id) => {
    setMediaFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handlePostSubmit = async () => {
    if (monetization === 'Subscriber Exclusive' && !creatorPrice) {
      toast.error("Please set up your subscription plan before posting subscriber-exclusive content.");
      return;
    }

    if (mediaFiles.length === 0) {
      toast.error("Please select at least one media file to upload first!");
      return;
    }

    const isAnyUploading = mediaFiles.some(item => item.status === 'uploading' || item.status === 'pending');
    if (isAnyUploading) {
      toast.error("Please wait for all media to finish uploading!");
      return;
    }

    const isAnyFailed = mediaFiles.some(item => item.status === 'failed');
    if (isAnyFailed) {
      toast.error("Some uploads failed. Please remove failed files or retry.");
      return;
    }

    const completedMedia = mediaFiles
      .filter(item => item.status === 'completed')
      .map(item => ({
        type: item.type,
        url: item.url
      }));

    if (completedMedia.length === 0) {
      toast.error("No successfully uploaded media found!");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const visibility = monetization === 'Subscriber Exclusive' ? 'PREMIUM' : 'PUBLIC';
      const response = await apiRequest('/posts', {
        method: 'POST',
        body: {
          content: caption,
          visibility,
          media: completedMedia
        },
        token: getAccessToken()
      });

      if (response && response.post) {
        toast.success(`Post submitted successfully! 🎉`);
        
        // Reset form
        mediaFiles.forEach(item => {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        setMediaFiles([]);
        setCaption('');
        setMonetization('Subscriber Exclusive');
        navigate('/creator/studio');
      } else {
        throw new Error('Failed to submit post');
      }
    } catch (error) {
      console.error('Post submit error:', error);
      toast.error(error.message || 'Failed to submit post. Please try again.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (!user) return <div className="creator-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-color)' }}>Loading...</div>;

  return (
    <div className="creator-layout">
      {/* Top Navbar */}
      <CreatorNavbar />

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
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="video/mp4,video/quicktime,image/jpeg,image/png" />
              <div className="upload-icon-wrapper">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#FFA52C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h4 className="upload-title">Drag & Drop Media</h4>
              <p className="upload-subtitle">MP4, MOV, JPEG or PNG (Max 2GB)</p>
              <button
                className="btn-browse"
                onClick={() => {
                  if (monetization === 'Subscriber Exclusive' && !creatorPrice) {
                    toast.error("Set up your subscription plan before uploading subscriber-exclusive content.");
                    return;
                  }
                  fileInputRef.current.click();
                }}
                disabled={creatorPrice === null}
              >
                {creatorPrice === null ? 'Loading...' : 'Browse Files'}
              </button>
            </div>
          </div>

          {/* Media Previews Grid */}
          {mediaFiles.length > 0 && (
            <div className="media-preview-list">
              {mediaFiles.map((item) => (
                <div key={item.id} className="media-preview-card">
                  <button className="btn-remove-media" onClick={() => handleRemoveFile(item.id)} title="Remove media">×</button>
                  <div className="media-preview-thumb">
                    {item.type === 'VIDEO' ? (
                      <video src={item.previewUrl} muted playsInline />
                    ) : (
                      <img src={item.previewUrl} alt={item.name} />
                    )}
                    <span className="media-preview-type-badge">{item.type}</span>
                  </div>
                  <div className={`media-preview-status ${item.status}`}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', fontSize: '0.7rem' }}>
                      {item.name}
                    </div>
                    {item.status === 'uploading' && (
                      <>
                        <div className="media-preview-progress-bar">
                          <div className="media-preview-progress-fill" style={{ width: `${item.progress}%` }}></div>
                        </div>
                        <span>Uploading ({item.progress}%)</span>
                      </>
                    )}
                    {item.status === 'completed' && <span>Ready 🚀</span>}
                    {item.status === 'failed' && <span style={{ color: '#ff4a4a' }}>Failed</span>}
                  </div>
                </div>
              ))}
              
              <div 
                className="media-preview-card add-more-card" 
                onClick={() => fileInputRef.current.click()} 
                style={{ 
                  cursor: 'pointer', 
                  border: '2px dashed var(--border-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--accent-secondary-text)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '300', lineHeight: '1' }}>+</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>Add More</span>
                </div>
              </div>
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

            {monetization === 'Subscriber Exclusive' && creatorPrice === 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(255, 165, 44, 0.1)', border: '1px solid rgba(255, 165, 44, 0.4)', borderRadius: '8px', marginBottom: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFA52C" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: '0.8rem', color: '#FFA52C', lineHeight: '1.4' }}>
                  You haven't set up a subscription plan yet.{' '}
                  <a href="/creator/studio?tab=subscription" style={{ color: '#FFA52C', fontWeight: 600, textDecoration: 'underline' }}>Set up your plan</a>{' '}
                  before posting subscriber-exclusive content.
                </span>
              </div>
            )}

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
            {(() => {
              const uploading = mediaFiles.some(item => item.status === 'uploading' || item.status === 'pending');
              const isDisabled = isSubmitLoading || uploading;
              return (
                <button
                  className="btn-primary-gradient"
                  onClick={handlePostSubmit}
                  disabled={isDisabled}
                  style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitLoading ? 'Submitting Post...' : uploading ? 'Uploading Media...' : 'Post Content Now'}
                </button>
              );
            })()}
            <button className="btn-secondary-dark" onClick={() => {
              mediaFiles.forEach(item => {
                if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
              });
              setMediaFiles([]);
              setCaption('');
              setMonetization('Subscriber Exclusive');
            }}>Clear Form</button>
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
