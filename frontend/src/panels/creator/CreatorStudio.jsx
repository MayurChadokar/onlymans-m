import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import './CreatorStudio.css';
import { apiRequest } from '../../utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, getRefreshToken } from '../../utils/auth';


const mapPost = (post) => ({
  id: post.id,
  content: post.content || '',
  date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now',
  visibility: post.visibility || 'PUBLIC',
  mediaUrl: post.media?.[0]?.url || 'https://picsum.photos/seed/creator-post/400/400',
  type: post.media?.[0]?.type || 'IMAGE',
});

const mapComment = (comment) => ({
  id: comment.id,
  username: comment.user?.username || comment.author?.username || 'fan',
  avatar: comment.user?.avatarUrl || `https://i.pravatar.cc/150?u=${comment.user?.username || comment.author?.username || comment.id}`,
  content: comment.content || '',
  createdAt: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now',
  postTitle: comment.post?.content || comment.post?.title || 'Your post',
});

const CreatorStudio = () => {
  const navigate = useNavigate();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(() => getCurrentUser());

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');

  // Toast notification for incomplete profile
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Profile fields — empty until API loads
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);   // actual File for S3 upload
  const [avatarFile, setAvatarFile] = useState(null); // actual File for S3 upload
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [subStats, setSubStats] = useState({ totalActive: 0, revenue: 0 });
  const [creatorComments, setCreatorComments] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState('');
  const [monetization, setMonetization] = useState('Subscriber Exclusive');

  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [isCreatingTier, setIsCreatingTier] = useState(false);
  const [isDeletingTierId, setIsDeletingTierId] = useState(null);
  const [isSubmittingTier, setIsSubmittingTier] = useState(false);
  const [newTierData, setNewTierData] = useState({ name: '', price: '', benefit1: '', benefit2: '', benefit3: '' });

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostData, setEditPostData] = useState({ caption: '', status: 'Free' });
  const [messages] = useState([
    { id: 1, from: 'fanboy99', avatar: 'https://i.pravatar.cc/150?u=fanboy99', text: 'Love your latest post!', time: '2 hours ago', unread: true },
    { id: 2, from: 'mystery_user', avatar: 'https://i.pravatar.cc/150?u=mystery_user', text: 'When is the next live stream?', time: '5 hours ago', unread: true },
    { id: 3, from: 'sarah_vlogs', avatar: 'https://i.pravatar.cc/150?u=sarah_vlogs', text: 'Hey! Wanna collab?', time: '1 day ago', unread: false },
  ]);
  const currentUser = getCurrentUser();
  const isCreator = currentUser?.role === 'CREATOR';

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

    if (!isCreator) {
      setDashboardLoading(false);
      setDashboardError('This account is not a creator yet. Please upgrade from Become a Creator first.');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (!isCreator) {
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError('');

      try {
        const response = await apiRequest('/creators/dashboard', { token: getAccessToken() });
        if (!active) return;

        const profile = response.profile || {};
        setDisplayName(profile.username || '');
        setBio(profile.bio || '');
        setSubscriptionPrice(profile.price > 0 ? String(profile.price) : '');
        setCoverUrl(profile.coverUrl || '');
        setAvatarUrl(profile.avatarUrl || '');
        setPosts((response.posts || []).map(mapPost));
        setSubscribers((response.subscribers || []).map((subscriber) => ({
          id: subscriber.subscriberId || subscriber.id,
          userUsername: subscriber.username || subscriber.subscriber?.username || 'subscriber',
          status: subscriber.endDate ? 'Canceled' : 'Active',
          renewDate: subscriber.endDate ? new Date(subscriber.endDate).toLocaleDateString() : new Date(subscriber.startDate || Date.now()).toLocaleDateString(),
          amount: `$${Number(profile.price ?? 0).toFixed(2)}/mo`,
        })));
        setSubStats({
          totalActive: response.stats?.totalSubscribers ?? 0,
          revenue: response.stats?.monthlyRevenueEstimate ?? 0,
        });

        // Show "Complete your profile" toast if profile is incomplete
        const isIncomplete = !profile.bio || !profile.price || profile.price === 0 || !profile.avatarUrl;
        if (isIncomplete && !toastDismissed) {
          setShowProfileToast(true);
        }
      } catch (error) {
        if (!active) return;
        setDashboardError(error.message || 'Failed to load creator dashboard');
      } finally {
        if (active) setDashboardLoading(false);
      }
    };

    const loadTiers = async () => {
      setTiersLoading(true);
      try {
        const res = await apiRequest('/creators/tiers', { token: getAccessToken() });
        if (!active) return;
        setTiers(res.tiers || []);
      } catch {
        // tiers fail silently — non-critical
      } finally {
        if (active) setTiersLoading(false);
      }
    };

    loadDashboard();
    loadTiers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'comments' || !isCreator) return;

    let active = true;
    const loadComments = async () => {
      setCommentsLoading(true);
      setCommentsError('');

      try {
        const response = await apiRequest('/creators/comments', { token: getAccessToken() });
        if (!active) return;
        setCreatorComments((response.comments || []).map(mapComment));
      } catch (error) {
        if (!active) return;
        setCommentsError(error.message || 'Failed to load comments');
      } finally {
        if (active) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => {
      active = false;
    };
  }, [activeTab]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          token: getAccessToken(),
        });
      }
    } catch {
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  };

  const handleImageUpload = (event, setUrl, setFile) => {
    const file = event.target.files?.[0];
    if (file) {
      setUrl(URL.createObjectURL(file));
      setFile(file);
    }
  };

  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest('/media/upload', {
      method: 'POST',
      token: getAccessToken(),
      body: formData,
    });
    
    // apiRequest automatically parses JSON, but if it's returning { url: "..." } we grab that.
    // NOTE: apiRequest helper usually sets Content-Type to application/json if body is not FormData.
    // Make sure apiRequest in utils handles FormData correctly (removes Content-Type header).
    return response.url;
  };

  const handleSaveProfile = async () => {
    if (!isCreator) {
      alert('Only creators can save creator profile settings.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const body = {
        bio,
        price: Number(subscriptionPrice),
      };

      // Upload avatar to Cloudinary if a new file was picked
      if (avatarFile) {
        body.avatarUrl = await uploadFileToCloudinary(avatarFile);
        setAvatarUrl(body.avatarUrl);
        setAvatarFile(null);
      }

      // Upload cover to Cloudinary if a new file was picked
      if (coverFile) {
        body.coverUrl = await uploadFileToCloudinary(coverFile);
        setCoverUrl(body.coverUrl);
        setCoverFile(null);
      }

      const response = await apiRequest('/creators/profile', {
        method: 'PATCH',
        token: getAccessToken(),
        body,
      });

      if (response.profile) {
        setBio(response.profile.bio ?? bio);
        setSubscriptionPrice(String(response.profile.price ?? subscriptionPrice));
        if (response.profile.avatarUrl) setAvatarUrl(response.profile.avatarUrl);
        if (response.profile.coverUrl) setCoverUrl(response.profile.coverUrl);
      }
    } catch (error) {
      alert(error.message || 'Could not save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handlePostSubmit = async () => {
    if (!isCreator) {
      alert('Only creators can create posts.');
      return;
    }

    const content = caption.trim();
    if (!content && !selectedFile) {
      alert('Please add a caption or select a file before posting.');
      return;
    }

    try {
      setIsSubmittingPost(true);
      let mediaArray = [];

      if (selectedFile) {
        // Prepare FormData for direct upload
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Upload the file using XMLHttpRequest to track progress
        setIsUploading(true);
        const uploadResponse = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
          xhr.open('POST', `${apiBase}/media/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(100);
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                resolve({ url: xhr.responseText });
              }
            } else {
              let errMsg = `Upload failed with status ${xhr.status}`;
              try {
                const errBody = JSON.parse(xhr.responseText);
                if (errBody.message) errMsg = errBody.message;
              } catch (_) {}
              reject(new Error(errMsg));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(formData);
        });
        setIsUploading(false);

        const mediaUrl = uploadResponse.url;
        const mediaType = selectedFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        mediaArray = [{ type: mediaType, url: mediaUrl }];
      }

      // Step 4: Create the post with content + media
      const response = await apiRequest('/posts', {
        method: 'POST',
        token: getAccessToken(),
        body: {
          content: content || selectedFile.name.replace(/\.[^.]+$/, ''),
          visibility: monetization === 'Subscriber Exclusive' ? 'PREMIUM' : 'PUBLIC',
          media: mediaArray,
        },
      });

      if (response.post) {
        setPosts((prev) => [mapPost(response.post), ...prev]);
      }
      setSelectedFile(null);
      setCaption('');
      setMonetization('Subscriber Exclusive');
      setUploadProgress(0);
      setActiveTab('posts');
    } catch (error) {
      setIsUploading(false);
      alert(error.message || 'Could not create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!isCreator) {
      alert('Only creators can manage posts.');
      return;
    }

    try {
      await apiRequest(`/posts/${postId}`, { method: 'DELETE', token: getAccessToken() });
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      alert(error.message || 'Could not delete post');
    }
  };

  const handleSaveEdit = () => {
    const visibility = editPostData.status === 'Premium' ? 'PREMIUM' : 'PUBLIC';
    setPosts((prev) => prev.map((post) => (
      post.id === editingPostId
        ? { ...post, content: editPostData.caption, visibility }
        : post
    )));
    setEditingPostId(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (!isCreator) {
      alert('Only creators can moderate comments.');
      return;
    }

    try {
      setDeletingCommentId(commentId);
      await apiRequest(`/creators/comments/${commentId}`, {
        method: 'DELETE',
        token: getAccessToken(),
      });
      setCreatorComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      alert(error.message || 'Could not delete comment');
    } finally {
      setDeletingCommentId('');
    }
  };

  const handleCreateTier = async () => {
    if (!newTierData.name || !newTierData.price) {
      alert('Please provide a name and price for the tier.');
      return;
    }
    const benefits = [newTierData.benefit1, newTierData.benefit2, newTierData.benefit3].filter(Boolean);
    if (!benefits.length) {
      alert('Please add at least one benefit.');
      return;
    }

    try {
      setIsSubmittingTier(true);
      const res = await apiRequest('/creators/tiers', {
        method: 'POST',
        token: getAccessToken(),
        body: {
          name: newTierData.name,
          price: Number(newTierData.price),
          benefits,
        },
      });
      setTiers((prev) => [...prev, res.tier]);
      setNewTierData({ name: '', price: '', benefit1: '', benefit2: '', benefit3: '' });
      setIsCreatingTier(false);
    } catch (error) {
      alert(error.message || 'Could not create tier');
    } finally {
      setIsSubmittingTier(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    try {
      setIsDeletingTierId(tierId);
      await apiRequest(`/creators/tiers/${tierId}`, {
        method: 'DELETE',
        token: getAccessToken(),
      });
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    } catch (error) {
      alert(error.message || 'Could not delete tier');
    } finally {
      setIsDeletingTierId(null);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
    { id: 'create', label: 'Create Post', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" /></svg> },
    { id: 'posts', label: 'Posts & Content', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg> },
    { id: 'comments', label: 'Comments', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'subscription', label: 'Subscription', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
    { id: 'statistics', label: 'Statistics', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg> },
    { id: 'messages', label: 'Messages', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'subscribers', label: 'Subscribers', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
  ];

  const renderDashboard = () => (
    <div className="manage-dashboard-view">
      <div className="upload-header">
        <h2>Manage Profile & Content</h2>
        <p>Customize your storefront and organize your existing posts.</p>
      </div>

      {dashboardLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading creator dashboard...</div>
      ) : dashboardError ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#ff6b6b' }}>{dashboardError}</div>
      ) : null}

      {/* ── Profile Incomplete Toast ───────────────────────────────────────── */}
      {showProfileToast && !toastDismissed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(255,165,44,0.12) 0%, rgba(255,82,82,0.08) 100%)',
          border: '1px solid rgba(255,165,44,0.35)',
          boxShadow: '0 4px 16px rgba(255,165,44,0.08)',
          animation: 'slideInToast 0.4s ease',
        }}>
          {/* Icon */}
          <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,165,44,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFA52C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: '600', color: '#FFA52C', fontSize: '0.95rem' }}>Complete Your Profile</p>
            <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
              Add your avatar, bio, and subscription price so fans can find and support you!
            </p>
          </div>
          {/* CTA */}
          <button
            onClick={() => {
              setShowProfileToast(false);
              setToastDismissed(true);
              // Scroll to profile section
              document.querySelector('.profile-management-card')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #FFA52C, #ff6b35)', border: 'none', color: 'white', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Complete Now
          </button>
          {/* Dismiss X */}
          <button
            onClick={() => { setShowProfileToast(false); setToastDismissed(true); }}
            style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="profile-management-card" style={{ background: 'var(--surface-dark)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3>Profile Appearance</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Bio and subscription price are saved to the backend. Avatar and cover photo changes are previewed locally.
        </p>
        <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setCoverUrl, setCoverFile)} />
        <input type="file" accept="image/*" ref={avatarInputRef} style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, setAvatarUrl, setAvatarFile)} />

        {/* Cover Photo */}
        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
          <div style={{ position: 'relative', width: '100%', height: '150px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden', border: '1px dashed var(--border-color)' }}>
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.85rem', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                No cover photo
              </div>
            )}
          </div>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="btn-secondary-dark"
            style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Change Cover Photo
          </button>
        </div>

        {/* Avatar + form */}
        <div className="profile-edit-flex" style={{ marginTop: '20px' }}>
          <div className="profile-edit-avatar">
            <img
              src={avatarUrl || 'https://i.pravatar.cc/150?img=11'}
              alt="Avatar"
              style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-card)', objectFit: 'cover' }}
            />
            {/* Pencil icon stays for quick click */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-gradient)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Change avatar"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
            </button>
            {/* Separate dedicated button below avatar */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="btn-secondary-dark"
              style={{ position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Change Photo
            </button>
          </div>
          <div className="profile-edit-form">
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-input, rgba(0,0,0,0.2))', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', marginBottom: '12px', fontSize: '1rem' }} />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-input, rgba(0,0,0,0.2))', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', minHeight: '80px', fontFamily: 'inherit', marginBottom: '12px' }} />
            <div style={{ background: 'var(--bg-input, rgba(0,180,216,0.1))', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#00B4D8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>Monthly Subscription Price (USD)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-color)', fontWeight: 'bold' }}>$</span>
                <input type="number" step="0.01" min="0" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} style={{ width: '120px', padding: '10px', background: 'var(--bg-dark, rgba(0,0,0,0.4))', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }} />
                <span style={{ color: 'var(--text-secondary)' }}>/ month</span>
              </div>
            </div>
            <button onClick={handleSaveProfile} className="btn-primary-gradient" style={{ marginTop: '12px' }}>
              {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </div>

      <h3>Your Posts</h3>
      <div className="manage-posts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '20px', marginTop: '16px' }}>
        {posts.map((post) => (
          <div key={post.id} className="manage-post-card" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', height: '160px' }}>
              <img src={post.mediaUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--bg-dark, rgba(0,0,0,0.6))', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{post.visibility === 'PREMIUM' ? 'Premium' : 'Free'}</span>
            </div>
            {editingPostId === post.id ? (
              <div style={{ padding: '16px', background: 'var(--bg-input, rgba(0,0,0,0.2))', borderTop: '1px solid var(--border-color)' }}>
                <input type="text" value={editPostData.caption} onChange={(e) => setEditPostData({ ...editPostData, caption: e.target.value })} style={{ width: '100%', padding: '10px', background: 'var(--bg-dark, rgba(0,0,0,0.4))', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px' }} />
                <select value={editPostData.status} onChange={(e) => setEditPostData({ ...editPostData, status: e.target.value })} style={{ width: '100%', padding: '10px', background: 'var(--bg-dark, rgba(0,0,0,0.4))', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px' }}>
                  <option value="Free">Free (Public)</option>
                  <option value="Premium">Premium (Subscribers Only)</option>
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', background: 'var(--primary-gradient)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                  <button onClick={() => setEditingPostId(null)} className="btn-secondary-dark" style={{ flex: 1, padding: '10px', borderRadius: '6px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                <h5 style={{ margin: '0 0 4px 0', color: 'var(--text-color)', fontSize: '0.95rem' }}>{post.content}</h5>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Posted {post.date}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingPostId(post.id); setEditPostData({ caption: post.content, status: post.visibility === 'PREMIUM' ? 'Premium' : 'Free' }); }} className="btn-secondary-dark" style={{ flex: 1, padding: '8px', borderRadius: '6px' }}>Edit</button>
                  <button onClick={() => handleDeletePost(post.id)} style={{ flex: 1, padding: '8px', background: 'var(--bg-input, rgba(255, 74, 74, 0.1))', border: '1px solid rgba(255, 74, 74, 0.3)', color: '#ff4a4a', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreatePost = () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 400px' }}>
        <div className="upload-header">
          <h2>Upload Content</h2>
          <p>Upload media directly to S3 via pre-signed URL, then publish as public or subscriber-only.</p>
        </div>
        <div className="upload-area">
          <div className="upload-box">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="video/mp4,video/quicktime,image/jpeg,image/png" />
            <div className="upload-icon-wrapper">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#FFA52C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <h4 className="upload-title">Drag & Drop Media</h4>
            <p className="upload-subtitle">Images & videos up to 10 files per post</p>
            <button className="btn-browse" onClick={() => fileInputRef.current?.click()}>Browse Files</button>
          </div>
        </div>
        {selectedFile && (
          <div className="upload-progress-card">
            <div className="upload-progress-info">
              <div className="file-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1-.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" /></svg></div>
              <div className="file-details">
                <div className="file-name-row"><span>{selectedFile.name}</span><span className="file-percentage">{uploadProgress}%</span></div>
                <div className="file-meta">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isUploading ? 'UPLOADING' : uploadProgress === 100 ? 'COMPLETED' : 'READY'}</div>
              </div>
            </div>
            <div className="upload-progress-bar"><div className="upload-progress-fill" style={{ width: `${uploadProgress}%`, background: uploadProgress === 100 ? '#4caf50' : '' }} /></div>
          </div>
        )}
      </div>
      <div style={{ flex: '0 0 300px' }}>
        <div className="settings-section">
          <h4 className="settings-title">CAPTION & HASHTAGS</h4>
          <div className="textarea-wrapper"><textarea placeholder="Describe your post and add #hashtags..." value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
          <div className="tags-row"><span className="tag-pill active">#exclusive</span></div>
        </div>
        <div className="settings-section">
          <h4 className="settings-title">MONETIZATION</h4>
          <label className={`radio-card ${monetization === 'Subscriber Exclusive' ? 'active' : ''}`}>
            <div className="radio-input-wrapper"><input type="radio" name="monetization" checked={monetization === 'Subscriber Exclusive'} onChange={() => setMonetization('Subscriber Exclusive')} /><span className="custom-radio" /></div>
            <div className="radio-content"><h5>Subscriber Exclusive</h5><p>Only active subscribers can view this.</p></div>
          </label>
          <label className={`radio-card ${monetization === 'Free for All' ? 'active' : ''}`}>
            <div className="radio-input-wrapper"><input type="radio" name="monetization" checked={monetization === 'Free for All'} onChange={() => setMonetization('Free for All')} /><span className="custom-radio" /></div>
            <div className="radio-content"><h5>Free for All</h5><p>Visible to anyone visiting your profile.</p></div>
          </label>
        </div>
        <div className="studio-actions">
          <button className="btn-primary-gradient" onClick={handlePostSubmit} disabled={isUploading || isSubmittingPost} style={{ opacity: isUploading || isSubmittingPost ? 0.6 : 1 }}>
            {isUploading ? 'Uploading media...' : isSubmittingPost ? 'Creating post...' : 'Post Content Now'}
          </button>
          <button className="btn-secondary-dark" onClick={() => { setSelectedFile(null); setCaption(''); setUploadProgress(0); setIsUploading(false); }}>Clear Form</button>
        </div>
      </div>
    </div>
  );

  const renderMediaThumbnail = (post, isSmall = false) => {
    const isVideo = post.type?.toUpperCase() === 'VIDEO' || post.mediaUrl?.match(/\.(mp4|mov|webm)$/i) || post.mediaUrl?.includes('video/upload');
    // For Cloudinary videos, replacing the extension with .jpg automatically fetches the thumbnail.
    const thumbUrl = isVideo && post.mediaUrl ? post.mediaUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg') : post.mediaUrl;
    
    return (
      <>
        <img src={thumbUrl} alt="Post Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isVideo && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: isSmall ? '28px' : '48px', height: isSmall ? '28px' : '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)' }}>
            <svg viewBox="0 0 24 24" width={isSmall ? "14" : "24"} height={isSmall ? "14" : "24"} fill="white" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
      </>
    );
  };

  const renderPosts = () => (
    <div>
      <div className="upload-header">
        <h2>Your Posts</h2>
        <p>Manage, edit, or delete your content.</p>
      </div>
      <div className="manage-posts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '20px', marginTop: '16px' }}>
        {posts.map((post) => (
          <div key={post.id} className="manage-post-card" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', height: '160px' }}>
              {renderMediaThumbnail(post)}
              <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--bg-dark, rgba(0,0,0,0.6))', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 2 }}>{post.visibility === 'PREMIUM' ? 'Premium' : 'Free'}</span>
            </div>
            <div style={{ padding: '16px' }}>
              <h5 style={{ margin: '0 0 4px 0', color: 'var(--text-color)', fontSize: '0.95rem' }}>{post.content}</h5>
              <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Posted {post.date}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingPostId(post.id); setEditPostData({ caption: post.content, status: post.visibility === 'PREMIUM' ? 'Premium' : 'Free' }); setActiveTab('dashboard'); }} className="btn-secondary-dark" style={{ flex: 1, padding: '8px', borderRadius: '6px' }}>Edit</button>
                <button onClick={() => handleDeletePost(post.id)} style={{ flex: 1, padding: '8px', background: 'var(--bg-input, rgba(255, 74, 74, 0.1))', border: '1px solid rgba(255, 74, 74, 0.3)', color: '#ff4a4a', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComments = () => (
    <div>
      <div className="upload-header">
        <h2>Comments</h2>
        <p>See what your fans are saying.</p>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
        {commentsLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading comments...</p>
        ) : commentsError ? (
          <p style={{ color: '#ff6b6b' }}>{commentsError}</p>
        ) : creatorComments.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No comments yet.</p>
        ) : (
          <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {creatorComments.map((comment) => (
              <div key={comment.id} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <img src={comment.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt={comment.username} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-color)', margin: '0 0 4px 0' }}><span style={{ fontWeight: 'bold' }}>@{comment.username}</span> on {comment.postTitle}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{comment.content}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>{comment.createdAt}</p>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    style={{ background: 'transparent', border: 'none', color: '#00B4D8', fontSize: '0.8rem', cursor: 'pointer', marginTop: '8px', padding: 0 }}
                  >
                    {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div>
      <div className="upload-header">
        <h2>Statistics & Analytics</h2>
        <p>Track your performance and growth metrics.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Subscribers', value: subStats.totalActive || 0, color: '#00B4D8' },
          { label: 'Total Posts', value: posts.length, color: '#FFA52C' },
          { label: 'Monthly Revenue', value: `$${Number(subStats.revenue || 0).toFixed(2)}`, color: '#4caf50' },
          { label: 'Comments', value: creatorComments.length, color: '#c4b5fd' },
        ].map((stat, index) => (
          <div key={index} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            <h3 style={{ fontSize: '2rem', margin: '0 0 4px 0', color: stat.color }}>{stat.value}</h3>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>Top Performing Posts</h3>
        {posts.slice(0, 5).map((post) => (
          <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              {renderMediaThumbnail(post, true)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-color)', fontSize: '0.9rem', marginBottom: '4px' }}>{post.content}</p>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{post.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div>
      <div className="upload-header">
        <h2>Messages</h2>
        <p>Connect with your subscribers and fans.</p>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: msg.unread ? 'rgba(0,180,216,0.03)' : 'transparent' }}>
            <div style={{ position: 'relative' }}>
              <img src={msg.avatar} alt={msg.from} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              {msg.unread && <div style={{ position: 'absolute', top: '0', right: '0', width: '12px', height: '12px', background: '#00B4D8', borderRadius: '50%', border: '2px solid var(--bg-card)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-color)', fontWeight: msg.unread ? '700' : '500' }}>@{msg.from}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{msg.time}</span>
              </div>
              <p style={{ color: msg.unread ? 'var(--text-color)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscribers = () => (
    <div>
      <div className="upload-header" style={{ marginBottom: '40px' }}>
        <h2>Your Subscribers</h2>
        <p>Manage and view details of your active and past subscribers.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active</p>
          <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-color)' }}>{subStats.totalActive}</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Monthly Revenue</p>
          <h3 style={{ fontSize: '2rem', margin: 0, color: '#00B4D8' }}>${Number(subStats.revenue || 0).toFixed(2)}</h3>
        </div>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)' }}>Subscriber List</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>User</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Since</th>
                <th style={{ padding: '16px 24px', fontWeight: '500' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={`https://i.pravatar.cc/150?u=${sub.userUsername}`} alt={sub.userUsername} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-color)', fontSize: '0.9rem' }}>{sub.userUsername}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{sub.userUsername}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ background: sub.status === 'Active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 74, 74, 0.1)', color: sub.status === 'Active' ? '#4caf50' : '#ff4a4a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>{sub.status}</span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{sub.renewDate}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-color)', fontSize: '0.9rem', fontWeight: '500' }}>{sub.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div>
      <div className="upload-header">
        <h2>Subscription Plans</h2>
        <p>Manage your tiers and offerings for your fans.</p>
      </div>

      {tiersLoading && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Loading tiers...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {tiers.map((tier, index) => (
          <div key={tier.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: index === 0 ? '1px solid #00B4D8' : '1px solid var(--border-color)', padding: '24px', position: 'relative' }}>
            {index === 0 && (
              <span style={{ position: 'absolute', top: '-12px', right: '24px', background: '#00B4D8', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ACTIVE TIER
              </span>
            )}
            <h3 style={{ margin: '0 0 8px 0' }}>{tier.name}</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>${Number(tier.price).toFixed(2)}</span>
              <span style={{ color: 'var(--text-secondary)', paddingBottom: '6px' }}>/month</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
              {(tier.benefits || []).map((benefit, i) => (
                <li key={i}>✓ {benefit}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDeleteTier(tier.id)}
                disabled={isDeletingTierId === tier.id}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #ff4a4a', color: '#ff4a4a', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', opacity: isDeletingTierId === tier.id ? 0.6 : 1 }}
              >
                {isDeletingTierId === tier.id ? 'Deleting...' : 'Delete Tier'}
              </button>
            </div>
          </div>
        ))}

        {isCreatingTier ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', gridColumn: '1 / -1', maxWidth: '600px', width: '100%' }}>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-color)', fontSize: '1.4rem' }}>✨ Create New Tier</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier Name</label>
              <input
                type="text"
                value={newTierData.name}
                onChange={(e) => setNewTierData({ ...newTierData, name: e.target.value })}
                placeholder="e.g. VIP Access"
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '12px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#00B4D8'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Price (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 'bold' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTierData.price}
                  onChange={(e) => setNewTierData({ ...newTierData, price: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '14px 16px 14px 36px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s', fontWeight: 'bold' }}
                  onFocus={(e) => e.target.style.borderColor = '#00B4D8'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier Benefits</label>
              {['benefit1', 'benefit2', 'benefit3'].map((key, i) => (
                <div key={key} style={{ position: 'relative', marginBottom: '12px' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00B4D8" strokeWidth="3" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <input
                    type="text"
                    value={newTierData[key]}
                    onChange={(e) => setNewTierData({ ...newTierData, [key]: e.target.value })}
                    placeholder={`Benefit ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = '#00B4D8'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleCreateTier}
                disabled={isSubmittingTier}
                className="btn-primary-gradient"
                style={{ flex: 2, padding: '14px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 'bold', opacity: isSubmittingTier ? 0.6 : 1, boxShadow: '0 4px 15px rgba(0, 180, 216, 0.3)' }}
              >
                {isSubmittingTier ? 'Creating Tier...' : 'Publish Tier'}
              </button>
              <button onClick={() => { setIsCreatingTier(false); setNewTierData({ name: '', price: '', benefit1: '', benefit2: '', benefit3: '' }); }} className="btn-secondary-dark" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsCreatingTier(true)}
            style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '2px dashed var(--border-color)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '260px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00B4D8'; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-color)', fontSize: '1.2rem' }}>Add New Tier</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '250px' }}>Create exclusive VIP experiences or personalized content tiers for your top fans.</p>
            <button className="btn-primary-gradient" style={{ padding: '12px 28px', borderRadius: '24px', fontSize: '0.95rem', pointerEvents: 'none' }}>
              Create Tier
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'create':
        return renderCreatePost();
      case 'posts':
        return renderPosts();
      case 'comments':
        return renderComments();
      case 'subscription':
        return renderSubscription();
      case 'statistics':
        return renderStatistics();
      case 'messages':
        return renderMessages();
      case 'subscribers':
        return renderSubscribers();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="creator-layout">
      <nav className="studio-top-nav">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}>
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            )}
          </button>
          <Link to="/creator/studio" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo size={24} textClass="brand-logo-small" />
            <span className="creator-badge" style={{ marginLeft: '4px' }}>CREATOR</span>
          </Link>
        </div>
        <div className="nav-right">
          <div className="search-analytics">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search analytics..." />
          </div>
          <button className="icon-btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
          <button className="icon-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button>
          <div className="user-avatar" style={{ position: 'relative' }}>
            <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Profile" onClick={() => setShowDropdown(!showDropdown)} />
            {showDropdown && (
              <div
                style={{ position: 'absolute', top: '48px', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}
                onClick={() => setShowDropdown(false)}
              >
                <Link
                  to="/creator/settings"
                  style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  ⚙️ Account Settings
                </Link>
                {user?.id && (
                  <Link
                    to={`/creator-profile/${user.id}`}
                    style={{ display: 'block', padding: '10px 16px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '0.9rem' }}
                  >
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

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`studio-menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', textAlign: 'left' }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="studio-content">
        <aside className="studio-sidebar">
          <div className="studio-menu">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`studio-menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', width: '100%', textAlign: 'left' }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="studio-main">
          {!isCreator ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '12px' }}>Creator access required</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                This session belongs to a regular user account, so creator dashboard APIs will return Forbidden.
                Upgrade this account first, or log in with a creator account.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/user/become-creator" className="btn-gradient" style={{ textDecoration: 'none' }}>
                  Become a Creator
                </Link>
                <Link to="/user/dashboard" className="btn-secondary-dark" style={{ textDecoration: 'none', padding: '10px 16px', borderRadius: '8px' }}>
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      <div className="mobile-bottom-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mobile-bottom-item ${activeTab === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CreatorStudio;
