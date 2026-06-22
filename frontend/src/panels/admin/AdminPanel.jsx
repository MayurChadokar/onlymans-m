import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Video, MessageSquare, LayoutDashboard, ShieldAlert,
  Trash2, Ban, CheckCircle, Eye, EyeOff, BadgeCheck, X,
  AlertTriangle, LogOut, Crown, DollarSign, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import './AdminPanel.css';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import { getAccessToken, getCurrentUser, clearAuthSession } from '../../utils/auth';

const AVATAR_PLACEHOLDER = 'https://i.pravatar.cc/150?img=3';

const ToggleSwitch = ({ isOn, onToggle, labelOn, labelOff }) => (
  <div className="switch-container" onClick={onToggle}>
    <div className={`switch ${isOn ? 'on' : ''}`}>
      <div className="switch-thumb"></div>
    </div>
    <span className="switch-label">{isOn ? labelOn : labelOff}</span>
  </div>
);

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
      <span style={{ fontSize: '13px', color: '#718096' }}>
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
      </span>
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', background: pagination.page <= 1 ? '#F7F8FA' : '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', background: pagination.page >= pagination.totalPages ? '#F7F8FA' : '#fff', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const LoadingRow = ({ cols }) => (
  <tr>
    <td colSpan={cols} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
      Loading…
    </td>
  </tr>
);

const EmptyRow = ({ cols, message }) => (
  <tr>
    <td colSpan={cols} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
      {message}
    </td>
  </tr>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState('overview');
  const [sectionLoading, setSectionLoading] = useState(false);

  // Dashboard
  const [stats, setStats] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userFilter, setUserFilter] = useState('ALL');

  // Posts
  const [posts, setPosts] = useState([]);
  const [postsPagination, setPostsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [postCommentsLoading, setPostCommentsLoading] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Creators
  const [creators, setCreators] = useState([]);
  const [creatorsPagination, setCreatorsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [reportFilter, setReportFilter] = useState('PENDING');

  const adminApi = useCallback((path, opts = {}) =>
    apiRequest(path, { ...opts, token: getAccessToken() }), []);

  // ==================== FETCH FUNCTIONS ====================

  const fetchStats = useCallback(async () => {
    setSectionLoading(true);
    try {
      const data = await adminApi('/admin/dashboard');
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  const fetchUsers = useCallback(async (page = 1, filter = 'ALL') => {
    setSectionLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== 'ALL') params.set('role', filter);
      const data = await adminApi(`/admin/users?${params}`);
      setUsers(data.users || []);
      setUsersPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load users:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  const fetchPosts = useCallback(async (page = 1) => {
    setSectionLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      const data = await adminApi(`/admin/posts?${params}`);
      setPosts(data.posts || []);
      setPostsPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load posts:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  const fetchPostComments = useCallback(async (postId) => {
    setPostCommentsLoading(true);
    try {
      const data = await adminApi(`/admin/comments?postId=${postId}&limit=50`);
      setPostComments(data.comments || []);
    } catch {
      setPostComments([]);
    } finally {
      setPostCommentsLoading(false);
    }
  }, [adminApi]);

  const fetchComments = useCallback(async (page = 1) => {
    setSectionLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      const data = await adminApi(`/admin/comments?${params}`);
      setComments(data.comments || []);
      setCommentsPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load comments:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  const fetchCreators = useCallback(async (page = 1) => {
    setSectionLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      const data = await adminApi(`/admin/creators?${params}`);
      setCreators(data.creators || []);
      setCreatorsPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load creators:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  const fetchReports = useCallback(async (page = 1, status = 'PENDING') => {
    setSectionLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.set('status', status);
      const data = await adminApi(`/admin/reports?${params}`);
      setReports(data.reports || []);
      setReportsPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load reports:', err.message);
    } finally {
      setSectionLoading(false);
    }
  }, [adminApi]);

  // Load data when tab switches
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'users') fetchUsers(1, userFilter);
    if (activeTab === 'posts') fetchPosts(1);
    if (activeTab === 'comments') fetchComments(1);
    if (activeTab === 'creators') fetchCreators(1);
    if (activeTab === 'reports') fetchReports(1, reportFilter);
  }, [activeTab]);

  // Re-fetch users when filter changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers(1, userFilter);
  }, [userFilter]);

  // Re-fetch reports when filter changes
  useEffect(() => {
    if (activeTab === 'reports') fetchReports(1, reportFilter);
  }, [reportFilter]);

  // Load comments when a post is selected
  useEffect(() => {
    if (selectedPost) fetchPostComments(selectedPost.id);
  }, [selectedPost]);

  // ==================== ACTION HANDLERS ====================

  const toggleUserStatus = async (userId, currentlyActive) => {
    try {
      await adminApi(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { isActive: !currentlyActive },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentlyActive } : u));
      if (stats) {
        setStats(prev => ({ ...prev, blockedUsers: prev.blockedUsers + (currentlyActive ? 1 : -1) }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user and all their content?')) return;
    try {
      await adminApi(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const toggleCreatorVerification = async (userId, currentlyVerified) => {
    try {
      await adminApi(`/admin/creators/${userId}/verify`, {
        method: 'PATCH',
        body: { isVerified: !currentlyVerified },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !currentlyVerified } : u));
      setCreators(prev => prev.map(c => c.id === userId ? { ...c, isVerified: !currentlyVerified } : c));
      if (selectedCreator?.id === userId) {
        setSelectedCreator(prev => ({ ...prev, isVerified: !currentlyVerified }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update verification');
    }
  };

  const togglePostVisibility = async (postId, currentVisibility) => {
    const newVisibility = currentVisibility === 'PUBLIC' ? 'PREMIUM' : 'PUBLIC';
    try {
      await adminApi(`/admin/posts/${postId}/visibility`, {
        method: 'PATCH',
        body: { visibility: newVisibility },
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, visibility: newVisibility } : p));
    } catch (err) {
      alert(err.message || 'Failed to update post visibility');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await adminApi(`/admin/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await adminApi(`/admin/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPostComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const blockCommentAuthor = async (commentId) => {
    if (!window.confirm('Block this comment author?')) return;
    try {
      await adminApi(`/admin/comments/${commentId}/block-author`, { method: 'POST' });
      // Refresh comments to reflect the author's new status
      if (activeTab === 'comments') fetchComments(commentsPagination.page);
    } catch (err) {
      alert(err.message || 'Failed to block comment author');
    }
  };

  const resolveReport = async (reportId) => {
    try {
      await adminApi(`/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        body: { status: 'RESOLVED' },
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
    } catch (err) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  const dismissReport = async (reportId) => {
    try {
      await adminApi(`/admin/reports/${reportId}/resolve`, {
        method: 'PATCH',
        body: { status: 'DISMISSED' },
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'DISMISSED' } : r));
    } catch (err) {
      alert(err.message || 'Failed to dismiss report');
    }
  };

  const blockAndResolveReport = async (reportId) => {
    if (!window.confirm('Block this user and resolve the report?')) return;
    try {
      await adminApi(`/admin/reports/${reportId}/block-and-resolve`, { method: 'POST' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
      if (stats) setStats(prev => ({ ...prev, blockedUsers: prev.blockedUsers + 1 }));
    } catch (err) {
      alert(err.message || 'Failed to block user and resolve report');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/admin-login');
  };

  // ==================== RENDERERS ====================

  const renderOverview = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Dashboard Overview</h2>
      </div>
      {sectionLoading || !stats ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>
          {sectionLoading ? 'Loading stats…' : 'No data available.'}
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}><Users size={26} /></div>
            <div className="stat-info"><h3>Total Users</h3><p>{stats.totalUsers?.toLocaleString()}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}><BadgeCheck size={26} /></div>
            <div className="stat-info"><h3>Verified Creators</h3><p>{stats.verifiedCreators?.toLocaleString()}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}><TrendingUp size={26} /></div>
            <div className="stat-info"><h3>Active Subscriptions</h3><p>{stats.activeSubscriptions?.toLocaleString()}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><DollarSign size={26} /></div>
            <div className="stat-info"><h3>Monthly Revenue</h3><p>${stats.monthlyRevenue?.toLocaleString()}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}><AlertTriangle size={26} /></div>
            <div className="stat-info"><h3>Pending Reports</h3><p>{stats.pendingReports?.toLocaleString()}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#F0F4FF', color: '#4F46E5' }}><MessageSquare size={26} /></div>
            <div className="stat-info"><h3>Total Comments</h3><p>{stats.totalComments?.toLocaleString()}</p></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>User & Creator Management</h2>
        <div className="segmented-control">
          {['ALL', 'USER', 'CREATOR'].map(f => (
            <button key={f} className={`segmented-btn ${userFilter === f ? 'active' : ''}`} onClick={() => setUserFilter(f)}>
              {f === 'ALL' ? 'All' : f === 'USER' ? 'Users' : 'Creators'}
            </button>
          ))}
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Status</th>
            {userFilter !== 'USER' && <th>Verification</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sectionLoading ? (
            <LoadingRow cols={userFilter !== 'USER' ? 4 : 3} />
          ) : users.length === 0 ? (
            <EmptyRow cols={userFilter !== 'USER' ? 4 : 3} message="No users found." />
          ) : users.map(user => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <img src={user.avatarUrl || user.creatorProfile?.avatarUrl || AVATAR_PLACEHOLDER} alt={user.username} />
                  <div className="user-cell-info">
                    <h4>
                      @{user.username}
                      {user.isVerified && <BadgeCheck size={14} color="#00B4D8" />}
                    </h4>
                    <span>{user.email} • {user.role}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`status-badge ${user.isActive ? 'status-active' : 'status-blocked'}`}>
                  {user.isActive ? 'ACTIVE' : 'BLOCKED'}
                </span>
              </td>
              {userFilter !== 'USER' && (
                <td>
                  {user.role === 'CREATOR' ? (
                    <ToggleSwitch
                      isOn={user.isVerified}
                      onToggle={() => toggleCreatorVerification(user.id, user.isVerified)}
                      labelOn="Verified"
                      labelOff="Unverified"
                    />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>—</span>
                  )}
                </td>
              )}
              <td>
                <div className="action-buttons">
                  <button
                    className={`btn-action ${user.isActive ? 'btn-block' : 'btn-unblock'}`}
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                  >
                    {user.isActive ? 'Block' : 'Unblock'}
                  </button>
                  <button className="btn-action btn-delete" onClick={() => deleteUser(user.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination pagination={usersPagination} onPageChange={(p) => fetchUsers(p, userFilter)} />
    </div>
  );

  const renderPosts = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Post & Video Moderation</h2>
      </div>
      {sectionLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>No posts found.</div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => {
            const firstMedia = post.media?.[0];
            const mediaUrl = firstMedia?.url || `https://picsum.photos/seed/${post.id}/400/300`;
            const isVideo = firstMedia?.type === 'VIDEO';
            return (
              <div className={`admin-post-card ${post.visibility !== 'PUBLIC' ? 'hidden-post' : ''}`} key={post.id}>
                <div className="admin-post-header">
                  <img src={post.creator?.avatarUrl || AVATAR_PLACEHOLDER} alt={post.creator?.username} />
                  <div>
                    <h4>@{post.creator?.username}</h4>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span className={`status-badge ${post.visibility === 'PUBLIC' ? 'status-public' : 'status-hidden'}`}>
                      {post.visibility}
                    </span>
                  </div>
                </div>

                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedPost(post)}>
                  <img src={mediaUrl} alt="Post media" className="admin-post-media" onError={e => { e.target.src = `https://picsum.photos/seed/${post.id}/400/300`; }} />
                  {isVideo && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '12px', pointerEvents: 'none' }}>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  )}
                </div>

                <div className="admin-post-content">
                  <p>{post.content || '(no caption)'}</p>
                  <div className="admin-post-actions">
                    <div className="post-stats">
                      <span>❤️ {post.likesCount ?? post._count?.likes ?? 0}</span>
                      <span>💬 {post.commentsCount ?? post._count?.comments ?? 0}</span>
                    </div>
                    <div className="action-buttons">
                      <button
                        className="btn-action"
                        onClick={() => togglePostVisibility(post.id, post.visibility)}
                        style={{ background: '#F0F4FF', color: '#4F46E5' }}
                        title={post.visibility === 'PUBLIC' ? 'Set to Premium' : 'Set to Public'}
                      >
                        {post.visibility === 'PUBLIC' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button className="btn-action btn-delete" onClick={() => deletePost(post.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination pagination={postsPagination} onPageChange={fetchPosts} />
    </div>
  );

  const renderComments = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Comments Moderation</h2>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Author</th>
            <th>Comment</th>
            <th>Post</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sectionLoading ? (
            <LoadingRow cols={4} />
          ) : comments.length === 0 ? (
            <EmptyRow cols={4} message="No comments to moderate." />
          ) : comments.map(comment => (
            <tr key={comment.id}>
              <td>
                <div className="user-cell">
                  <img src={comment.user?.avatarUrl || AVATAR_PLACEHOLDER} alt={comment.user?.username} />
                  <div className="user-cell-info">
                    <h4>@{comment.user?.username}</h4>
                    <span>
                      {!comment.user?.isActive
                        ? <span style={{ color: '#e74c3c' }}>(Blocked)</span>
                        : 'Active'}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div className="comment-text" title={comment.content}>"{comment.content}"</div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                {comment.post ? (
                  <span style={{ fontSize: '13px', color: '#4A5568' }}>
                    Post by @{comment.post.creatorId?.slice(0, 8)}…
                  </span>
                ) : (
                  <span style={{ color: '#e74c3c' }}>Post Deleted</span>
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn-action btn-delete" onClick={() => deleteComment(comment.id)} title="Delete Comment">
                    <Trash2 size={16} />
                  </button>
                  {comment.user?.isActive && (
                    <button className="btn-action btn-block" onClick={() => blockCommentAuthor(comment.id)} title="Block Author">
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination pagination={commentsPagination} onPageChange={fetchComments} />
    </div>
  );

  const renderCreators = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Creator Management</h2>
        <span style={{ fontSize: '13px', color: '#718096', background: '#EDE9FE', padding: '6px 14px', borderRadius: '20px', fontWeight: 600 }}>
          {creatorsPagination.total} Creators
        </span>
      </div>

      {sectionLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>Loading creators…</div>
      ) : creators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>No creators found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {creators.map(creator => (
            <div
              key={creator.id}
              style={{ background: '#FAFBFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              onClick={() => setSelectedCreator(creator)}
            >
              <div style={{ height: '90px', backgroundImage: `url(${creator.profile?.coverUrl || 'https://picsum.photos/seed/' + creator.id + '/600/200'})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: creator.isActive ? '#DCFCE7' : '#FEE2E2', color: creator.isActive ? '#16A34A' : '#DC2626', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                  {creator.isActive ? 'Active' : 'Blocked'}
                </span>
              </div>

              <div style={{ padding: '0 16px 16px', marginTop: '-28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={creator.profile?.avatarUrl || AVATAR_PLACEHOLDER} alt={creator.username} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #FFFFFF', objectFit: 'cover' }} />
                    {creator.isVerified && <BadgeCheck size={16} color="#2563EB" style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '5px 12px', borderRadius: '20px' }}>
                    <DollarSign size={13} color="#D97706" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#D97706' }}>{creator.profile?.price ?? 0}/mo</span>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A2E' }}>{creator.username}</span>
                    {creator.isVerified && <BadgeCheck size={14} color="#2563EB" />}
                  </div>
                  <span style={{ fontSize: '12px', color: '#718096' }}>{creator.email}</span>
                </div>

                <p style={{ fontSize: '13px', color: '#4A5568', lineHeight: '1.5', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {creator.profile?.bio || 'No bio.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ textAlign: 'center', background: '#F0F4FF', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#4F46E5' }}>{(creator.subscribersCount ?? 0).toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Subscribers</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#FFFBEB', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#D97706' }}>${((creator.totalEarnings ?? 0) / 1000).toFixed(1)}K</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Earnings</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#F0FFF4', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#16A34A' }}>{creator.postsCount ?? 0}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Posts</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-action"
                    style={{ flex: 1, background: creator.isVerified ? '#FEE2E2' : '#EDE9FE', color: creator.isVerified ? '#DC2626' : '#7C3AED', padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '12px' }}
                    onClick={e => { e.stopPropagation(); toggleCreatorVerification(creator.id, creator.isVerified); }}
                  >
                    {creator.isVerified ? 'Revoke Verify' : '✓ Verify Creator'}
                  </button>
                  <button
                    className="btn-action btn-block"
                    style={{ padding: '9px 14px' }}
                    onClick={e => { e.stopPropagation(); toggleUserStatus(creator.id, creator.isActive); }}
                    title={creator.isActive ? 'Block Creator' : 'Unblock Creator'}
                  >
                    <Ban size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={creatorsPagination} onPageChange={fetchCreators} />

      {selectedCreator && (
        <div className="modal-overlay" onClick={() => setSelectedCreator(null)}>
          <div className="modal-content" style={{ maxWidth: '560px', flexDirection: 'column', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: '140px', backgroundImage: `url(${selectedCreator.profile?.coverUrl || 'https://picsum.photos/seed/' + selectedCreator.id + '/600/200'})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
              <button onClick={() => setSelectedCreator(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '0 24px 24px', marginTop: '-32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={selectedCreator.profile?.avatarUrl || AVATAR_PLACEHOLDER} alt={selectedCreator.username} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }} />
                  {selectedCreator.isVerified && <BadgeCheck size={18} color="#2563EB" style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%' }} />}
                </div>
                <span style={{ background: '#F0F4FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                  Joined {new Date(selectedCreator.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 style={{ margin: '0 0 4px', color: '#1A1A2E', fontSize: '20px', fontWeight: 800 }}>@{selectedCreator.username}</h2>
              <p style={{ margin: '0 0 6px', color: '#718096', fontSize: '13px' }}>{selectedCreator.email}</p>
              <p style={{ fontSize: '14px', color: '#4A5568', lineHeight: '1.6', marginBottom: '20px' }}>{selectedCreator.profile?.bio || 'No bio.'}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Subscribers', value: (selectedCreator.subscribersCount ?? 0).toLocaleString(), icon: '👥', bg: '#F0F4FF', color: '#4F46E5' },
                  { label: 'Sub Price', value: `$${selectedCreator.profile?.price ?? 0}/mo`, icon: '💰', bg: '#FFFBEB', color: '#D97706' },
                  { label: 'Total Posts', value: selectedCreator.postsCount ?? 0, icon: '📸', bg: '#F0FFF4', color: '#16A34A' },
                  { label: 'Total Earnings', value: `$${(selectedCreator.totalEarnings ?? 0).toLocaleString()}`, icon: '📈', bg: '#FFF5F5', color: '#DC2626' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: stat.bg, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '22px' }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-action"
                  style={{ flex: 1, padding: '12px', background: selectedCreator.isVerified ? '#FEE2E2' : '#EDE9FE', color: selectedCreator.isVerified ? '#DC2626' : '#7C3AED', fontWeight: 700, fontSize: '14px', borderRadius: '10px' }}
                  onClick={() => toggleCreatorVerification(selectedCreator.id, selectedCreator.isVerified)}
                >
                  {selectedCreator.isVerified ? 'Revoke Verification' : '✓ Verify Creator'}
                </button>
                <button
                  className="btn-action btn-delete"
                  style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px' }}
                  onClick={() => { toggleUserStatus(selectedCreator.id, selectedCreator.isActive); setSelectedCreator(null); }}
                >
                  <Ban size={16} style={{ verticalAlign: 'middle' }} /> {selectedCreator.isActive ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>User & Creator Reports</h2>
        <div className="segmented-control">
          {['PENDING', 'RESOLVED', 'DISMISSED', ''].map((f, i) => (
            <button key={i} className={`segmented-btn ${reportFilter === f ? 'active' : ''}`} onClick={() => setReportFilter(f)}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Reported Account</th>
            <th>Violation Reason</th>
            <th>Reported By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sectionLoading ? (
            <LoadingRow cols={4} />
          ) : reports.length === 0 ? (
            <EmptyRow cols={4} message="No reports found." />
          ) : reports.map(report => (
            <tr key={report.id} style={{ opacity: report.status !== 'PENDING' ? 0.6 : 1 }}>
              <td>
                <div className="user-cell">
                  <img src={report.reportedUser?.avatarUrl || AVATAR_PLACEHOLDER} alt={report.reportedUser?.username} />
                  <div className="user-cell-info">
                    <h4>@{report.reportedUser?.username}</h4>
                    <span>
                      {report.type} • {!report.reportedUser?.isActive
                        ? <span style={{ color: '#e74c3c' }}>Blocked</span>
                        : 'Active'}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div className="comment-text" style={{ whiteSpace: 'normal', maxWidth: '350px', lineHeight: '1.4' }}>
                  {report.reason}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>@{report.reportedBy?.username}</span>
              </td>
              <td>
                <div className="action-buttons">
                  {report.status === 'PENDING' && (
                    <>
                      {report.reportedUser?.isActive && (
                        <button className="btn-action btn-delete" onClick={() => blockAndResolveReport(report.id)} title="Block & Resolve">
                          <Ban size={16} /> Block
                        </button>
                      )}
                      <button className="btn-action" onClick={() => dismissReport(report.id)} style={{ background: '#F0F4FF', color: '#4F46E5' }} title="Dismiss">
                        Dismiss
                      </button>
                    </>
                  )}
                  {report.status === 'RESOLVED' && (
                    <span className="status-badge status-active" style={{ background: 'transparent' }}>
                      <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Resolved
                    </span>
                  )}
                  {report.status === 'DISMISSED' && (
                    <span className="status-badge" style={{ background: '#F7FAFC', color: '#718096' }}>
                      Dismissed
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination pagination={reportsPagination} onPageChange={(p) => fetchReports(p, reportFilter)} />
    </div>
  );

  const renderPostModal = () => {
    if (!selectedPost) return null;
    return (
      <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-media-section">
            <img
              src={selectedPost.media?.[0]?.url || `https://picsum.photos/seed/${selectedPost.id}/400/300`}
              alt="Post media"
              onError={e => { e.target.src = `https://picsum.photos/seed/${selectedPost.id}/400/300`; }}
            />
          </div>
          <div className="modal-info-section">
            <div className="modal-header">
              <div className="user-cell">
                <img src={selectedPost.creator?.avatarUrl || AVATAR_PLACEHOLDER} alt={selectedPost.creator?.username} />
                <div className="user-cell-info">
                  <h4>@{selectedPost.creator?.username}</h4>
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="btn-action" onClick={() => setSelectedPost(null)} style={{ background: '#F0F2F5', color: '#4A5568', borderRadius: '8px', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>{selectedPost.content || '(no caption)'}</p>
              <div className="modal-comments">
                <h4>Comments ({postCommentsLoading ? '…' : postComments.length})</h4>
                {postCommentsLoading ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading…</p>
                ) : postComments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No comments yet.</p>
                ) : postComments.map(c => (
                  <div className="modal-comment" key={c.id}>
                    <img src={c.user?.avatarUrl || AVATAR_PLACEHOLDER} alt={c.user?.username} />
                    <div className="modal-comment-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h5>@{c.user?.username}</h5>
                        <button style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }} onClick={() => deleteComment(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabTitle = {
    overview: 'Overview',
    reports: 'Reports & Notices',
    creators: 'Creator Management',
    users: 'User Management',
    posts: 'Moderate Content',
    comments: 'Moderate Comments',
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand-container">
          <Logo size={32} showText={false} />
          <div className="admin-brand-text">
            <span className="brand-name">OnlyMans</span>
            <span className="brand-badge">ADMIN CONTROL</span>
          </div>
        </div>

        <nav className="admin-nav">
          {[
            { key: 'overview', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { key: 'reports', icon: <AlertTriangle size={20} />, label: 'Reports & Notices' },
            { key: 'creators', icon: <Crown size={20} />, label: 'Creators' },
            { key: 'users', icon: <Users size={20} />, label: 'Users' },
            { key: 'posts', icon: <Video size={20} />, label: 'Content Moderation' },
            { key: 'comments', icon: <MessageSquare size={20} />, label: 'Comments' },
          ].map(item => (
            <button key={item.key} className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-footer-profile">
            <img src={currentUser?.avatarUrl || AVATAR_PLACEHOLDER} alt="Admin avatar" className="footer-avatar" />
            <div className="footer-profile-info">
              <span className="footer-profile-name">{currentUser?.username || 'Admin'}</span>
              <span className="footer-profile-role">Root Access</span>
            </div>
          </div>
          <div className="footer-actions">
            <button className="footer-btn btn-logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{tabTitle[activeTab]}</h1>
          <div className="admin-user-profile">
            <span style={{ fontWeight: 600 }}>{currentUser?.username || 'Admin'}</span>
            <img src={currentUser?.avatarUrl || AVATAR_PLACEHOLDER} alt="Admin" />
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'creators' && renderCreators()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'posts' && renderPosts()}
          {activeTab === 'comments' && renderComments()}
        </div>
      </main>

      {renderPostModal()}
    </div>
  );
};

export default AdminPanel;
