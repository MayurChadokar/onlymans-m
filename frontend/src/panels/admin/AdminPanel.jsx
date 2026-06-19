import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Video,
  MessageSquare,
  LayoutDashboard,
  ShieldAlert,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  BadgeCheck,
  X,
  AlertTriangle,
  LogOut,
  Crown,
  DollarSign,
  TrendingUp,
  Star,
  UserCheck,
  BarChart2
} from 'lucide-react';
import './AdminPanel.css';
import Logo from '../../components/Logo';



// --- REUSABLE COMPONENTS ---
const ToggleSwitch = ({ isOn, onToggle, labelOn, labelOff }) => (
  <div className="switch-container" onClick={onToggle}>
    <div className={`switch ${isOn ? 'on' : ''}`}>
      <div className="switch-thumb"></div>
    </div>
    <span className="switch-label">{isOn ? labelOn : labelOff}</span>
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userFilter, setUserFilter] = useState('ALL'); // 'ALL', 'CREATOR', 'USER'

  useEffect(() => {
    document.body.classList.add('light-theme');
    // We could return a cleanup function here, but since the user wants standard light behavior, we'll keep it simple.
  }, []);

  const [users, setUsers] = useState([
    { id: 1, username: 'julianvane_official', email: 'julian@example.com', role: 'CREATOR', status: 'ACTIVE', isVerified: true, avatar: 'https://i.pravatar.cc/150?u=julian' },
    { id: 2, username: 'fanboy99', email: 'fanboy99@example.com', role: 'USER', status: 'ACTIVE', isVerified: false, avatar: 'https://i.pravatar.cc/150?u=fanboy99' },
    { id: 3, username: 'spammer42', email: 'spam@example.com', role: 'USER', status: 'BLOCKED', isVerified: false, avatar: 'https://i.pravatar.cc/150?u=spammer' },
    { id: 4, username: 'marcus_fit', email: 'marcus@example.com', role: 'CREATOR', status: 'ACTIVE', isVerified: false, avatar: 'https://i.pravatar.cc/150?u=marcus' },
  ]);

  const [posts, setPosts] = useState([
    { id: 101, creatorUsername: 'julianvane_official', content: 'New exclusive drop tonight! 🔥', date: '2 hours ago', likes: 1204, visibility: 'PUBLIC', type: 'IMAGE', mediaUrl: 'https://picsum.photos/seed/vip/400/300' },
    { id: 102, creatorUsername: 'marcus_fit', content: 'Workout routine in my DMs.', date: '5 hours ago', likes: 890, visibility: 'HIDDEN', type: 'VIDEO', mediaUrl: 'https://picsum.photos/seed/gym/400/300' },
  ]);

  const [comments, setComments] = useState([
    { id: 1001, postId: 101, author: 'fanboy99', authorId: 2, content: 'Cant wait for this!!', date: '1 hour ago', authorAvatar: 'https://i.pravatar.cc/150?u=fanboy99' },
    { id: 1002, postId: 101, author: 'spammer42', authorId: 3, content: 'Check out my free link in bio!!!', date: '30 mins ago', authorAvatar: 'https://i.pravatar.cc/150?u=spammer' },
  ]);

  const [reports, setReports] = useState([
    { id: 501, reportedUser: 'spammer42', reportedUserId: 3, reportedUserAvatar: 'https://i.pravatar.cc/150?u=spammer', reportedBy: 'fanboy99', reason: 'Spamming comments with external links.', type: 'SPAM', status: 'PENDING', date: '10 mins ago' },
    { id: 502, reportedUser: 'marcus_fit', reportedUserId: 4, reportedUserAvatar: 'https://i.pravatar.cc/150?u=marcus', reportedBy: 'julianvane_official', reason: 'Inappropriate content in DMs.', type: 'CONTENT_VIOLATION', status: 'RESOLVED', date: '2 days ago' },
  ]);

  const [creators] = useState([
    {
      id: 1, username: 'julianvane_official', displayName: 'Julian Vane', email: 'julian@example.com',
      avatar: 'https://i.pravatar.cc/150?u=julian', cover: 'https://picsum.photos/seed/vip/600/200',
      isVerified: true, status: 'ACTIVE',
      subscribers: 3842, subscriptionPrice: 14.99,
      totalPosts: 128, totalEarnings: 57618, joinedDate: 'Jan 2024',
      bio: 'Exclusive content, behind the scenes & more. Subscribe for full access.'
    },
    {
      id: 4, username: 'marcus_fit', displayName: 'Marcus Fit', email: 'marcus@example.com',
      avatar: 'https://i.pravatar.cc/150?u=marcus', cover: 'https://picsum.photos/seed/gym/600/200',
      isVerified: false, status: 'ACTIVE',
      subscribers: 1207, subscriptionPrice: 9.99,
      totalPosts: 64, totalEarnings: 12069, joinedDate: 'Mar 2024',
      bio: 'Fitness, nutrition plans, and personalized workout routines.'
    },
  ]);

  const [selectedCreator, setSelectedCreator] = useState(null);

  // --- ACTIONS: USERS ---
  const toggleUserStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const deleteUser = (userId) => {
    if (window.confirm('Permanently delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      setComments(comments.filter(c => c.authorId !== userId));
      setReports(reports.filter(r => r.reportedUserId !== userId));
    }
  };

  const toggleCreatorVerification = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId && u.role === 'CREATOR') {
        return { ...u, isVerified: !u.isVerified };
      }
      return u;
    }));
  };

  // --- ACTIONS: POSTS ---
  const togglePostVisibility = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, visibility: p.visibility === 'PUBLIC' ? 'HIDDEN' : 'PUBLIC' };
      }
      return p;
    }));
  };

  const deletePost = (postId) => {
    if (window.confirm('Delete this post?')) {
      setPosts(posts.filter(p => p.id !== postId));
      setComments(comments.filter(c => c.postId !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    }
  };

  // --- ACTIONS: COMMENTS ---
  const deleteComment = (commentId) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  const blockCommentAuthor = (authorId) => {
    toggleUserStatus(authorId);
    alert('User has been blocked from the platform.');
  };

  // --- ACTIONS: REPORTS ---
  const resolveReport = (reportId) => {
    setReports(reports.map(r => {
      if (r.id === reportId) {
        return { ...r, status: 'RESOLVED' };
      }
      return r;
    }));
  };

  const blockReportedUser = (userId, reportId) => {
    toggleUserStatus(userId);
    resolveReport(reportId);
    alert('Creator/User has been blocked successfully and report resolved.');
  };

  // --- ACTIONS: AUTH ---
  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin-login');
  };

  // --- RENDERERS ---
  const renderOverview = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Dashboard Overview</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}><Users size={26} /></div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{users.filter(u => u.role === 'USER').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}><BadgeCheck size={26} /></div>
          <div className="stat-info">
            <h3>Verified Creators</h3>
            <p>{users.filter(u => u.role === 'CREATOR' && u.isVerified).length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}><TrendingUp size={26} /></div>
          <div className="stat-info">
            <h3>Active Subscriptions</h3>
            <p>1,420</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><DollarSign size={26} /></div>
          <div className="stat-info">
            <h3>Monthly Revenue</h3>
            <p>$8,490</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}><AlertTriangle size={26} /></div>
          <div className="stat-info">
            <h3>Pending Reports</h3>
            <p>{reports.filter(r => r.status === 'PENDING').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F0F4FF', color: '#4F46E5' }}><MessageSquare size={26} /></div>
          <div className="stat-info">
            <h3>Total Comments</h3>
            <p>{comments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(u => userFilter === 'ALL' || u.role === userFilter);

    return (
      <div className="admin-panel-section">
        <div className="section-header">
          <h2>User & Creator Management</h2>
          <div className="segmented-control">
            <button className={`segmented-btn ${userFilter === 'ALL' ? 'active' : ''}`} onClick={() => setUserFilter('ALL')}>All</button>
            <button className={`segmented-btn ${userFilter === 'CREATOR' ? 'active' : ''}`} onClick={() => setUserFilter('CREATOR')}>Creators</button>
            <button className={`segmented-btn ${userFilter === 'USER' ? 'active' : ''}`} onClick={() => setUserFilter('USER')}>Users</button>
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
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <img src={user.avatar} alt={user.username} />
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
                  <span className={`status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-blocked'}`}>
                    {user.status}
                  </span>
                </td>
                {userFilter !== 'USER' && (
                  <td>
                    {user.role === 'CREATOR' ? (
                      <ToggleSwitch
                        isOn={user.isVerified}
                        onToggle={() => toggleCreatorVerification(user.id)}
                        labelOn="Verified"
                        labelOff="Unverified"
                      />
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                )}
                <td>
                  <div className="action-buttons">
                    <button
                      className={`btn-action ${user.status === 'ACTIVE' ? 'btn-block' : 'btn-unblock'}`}
                      onClick={() => toggleUserStatus(user.id)}
                    >
                      {user.status === 'ACTIVE' ? 'Block' : 'Unblock'}
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
      </div>
    );
  };

  const renderPosts = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Post & Video Moderation</h2>
      </div>
      <div className="posts-grid">
        {posts.map(post => {
          const postComments = comments.filter(c => c.postId === post.id).length;
          return (
            <div className={`admin-post-card ${post.visibility === 'HIDDEN' ? 'hidden-post' : ''}`} key={post.id}>
              <div className="admin-post-header">
                <img src={`https://i.pravatar.cc/150?u=${post.creatorUsername}`} alt={post.creatorUsername} />
                <div>
                  <h4>@{post.creatorUsername}</h4>
                  <span>{post.date}</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`status-badge ${post.visibility === 'PUBLIC' ? 'status-public' : 'status-hidden'}`}>
                    {post.visibility}
                  </span>
                </div>
              </div>

              <div style={{ position: 'relative' }} onClick={() => setSelectedPost(post)}>
                <img src={post.mediaUrl} alt="Post media" className="admin-post-media" />
                {post.type === 'VIDEO' && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '12px', pointerEvents: 'none' }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                )}
              </div>

              <div className="admin-post-content">
                <p>{post.content}</p>
                <div className="admin-post-actions">
                  <div className="post-stats">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {postComments}</span>
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn-action"
                      onClick={() => togglePostVisibility(post.id)}
                      style={{ background: '#F0F4FF', color: '#4F46E5' }}
                      title={post.visibility === 'PUBLIC' ? 'Hide Post' : 'Unhide Post'}
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
            <th>Context</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map(comment => {
            const post = posts.find(p => p.id === comment.postId);
            const authorStatus = users.find(u => u.id === comment.authorId)?.status || 'UNKNOWN';

            return (
              <tr key={comment.id}>
                <td>
                  <div className="user-cell">
                    <img src={comment.authorAvatar} alt={comment.author} />
                    <div className="user-cell-info">
                      <h4>@{comment.author}</h4>
                      <span>
                        {authorStatus === 'BLOCKED' ? <span style={{ color: '#e74c3c' }}>(Blocked)</span> : 'Active'}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="comment-text" title={comment.content}>
                    "{comment.content}"
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{comment.date}</span>
                </td>
                <td>
                  {post ? (
                    <div className="comment-context" style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(post)}>
                      <span className="comment-context-post">Post by @{post.creatorUsername}</span>
                      <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>View Context</span>
                    </div>
                  ) : (
                    <span style={{ color: '#e74c3c' }}>Post Deleted</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-delete"
                      onClick={() => deleteComment(comment.id)}
                      title="Delete Comment"
                    >
                      <Trash2 size={16} />
                    </button>
                    {authorStatus !== 'BLOCKED' && (
                      <button
                        className="btn-action btn-block"
                        onClick={() => blockCommentAuthor(comment.authorId)}
                        title="Block Author"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {comments.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No comments to moderate.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCreators = () => (
    <div className="admin-panel-section">
      <div className="section-header">
        <h2>Creator Management</h2>
        <span style={{ fontSize: '13px', color: '#718096', background: '#EDE9FE', padding: '6px 14px', borderRadius: '20px', fontWeight: 600 }}>
          {creators.length} Active Creators
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {creators.map(creator => {
          const creatorPosts = posts.filter(p => p.creatorUsername === creator.username).length;
          return (
            <div key={creator.id} style={{ background: '#FAFBFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              onClick={() => setSelectedCreator(creator)}
            >
              {/* Cover */}
              <div style={{ height: '90px', backgroundImage: `url(${creator.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                {creator.status === 'ACTIVE' ? (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#DCFCE7', color: '#16A34A', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Active</span>
                ) : (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Blocked</span>
                )}
              </div>

              {/* Avatar + Name */}
              <div style={{ padding: '0 16px 16px', marginTop: '-28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={creator.avatar} alt={creator.username} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #FFFFFF', objectFit: 'cover' }} />
                    {creator.isVerified && (
                      <BadgeCheck size={16} color="#2563EB" style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '5px 12px', borderRadius: '20px' }}>
                    <DollarSign size={13} color="#D97706" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#D97706' }}>{creator.subscriptionPrice}/mo</span>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A2E' }}>{creator.displayName}</span>
                    {creator.isVerified && <BadgeCheck size={14} color="#2563EB" />}
                  </div>
                  <span style={{ fontSize: '12px', color: '#718096' }}>@{creator.username}</span>
                </div>

                <p style={{ fontSize: '13px', color: '#4A5568', lineHeight: '1.5', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {creator.bio}
                </p>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ textAlign: 'center', background: '#F0F4FF', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#4F46E5' }}>{creator.subscribers.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Subscribers</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#FFFBEB', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#D97706' }}>${(creator.totalEarnings / 1000).toFixed(1)}K</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Earnings</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#F0FFF4', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#16A34A' }}>{creator.totalPosts}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>Posts</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#FFF5F5', borderRadius: '10px', padding: '10px 4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#DC2626' }}>{creatorPosts}</div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontWeight: 600 }}>On Platform</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-action"
                    style={{ flex: 1, background: creator.isVerified ? '#FEE2E2' : '#EDE9FE', color: creator.isVerified ? '#DC2626' : '#7C3AED', padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '12px' }}
                    onClick={e => { e.stopPropagation(); }}
                  >
                    {creator.isVerified ? 'Revoke Verify' : '✓ Verify Creator'}
                  </button>
                  <button
                    className="btn-action btn-delete"
                    style={{ padding: '9px 14px' }}
                    onClick={e => { e.stopPropagation(); }}
                  >
                    <Ban size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creator Detail Modal */}
      {selectedCreator && (
        <div className="modal-overlay" onClick={() => setSelectedCreator(null)}>
          <div className="modal-content" style={{ maxWidth: '560px', flexDirection: 'column', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: '140px', backgroundImage: `url(${selectedCreator.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
              <button onClick={() => setSelectedCreator(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '0 24px 24px', marginTop: '-32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={selectedCreator.avatar} alt={selectedCreator.username} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }} />
                  {selectedCreator.isVerified && <BadgeCheck size={18} color="#2563EB" style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%' }} />}
                </div>
                <span style={{ background: '#F0F4FF', color: '#4F46E5', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                  Joined {selectedCreator.joinedDate}
                </span>
              </div>
              <h2 style={{ margin: '0 0 4px', color: '#1A1A2E', fontSize: '20px', fontWeight: 800 }}>{selectedCreator.displayName}</h2>
              <p style={{ margin: '0 0 6px', color: '#718096', fontSize: '13px' }}>@{selectedCreator.username} • {selectedCreator.email}</p>
              <p style={{ fontSize: '14px', color: '#4A5568', lineHeight: '1.6', marginBottom: '20px' }}>{selectedCreator.bio}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Subscribers', value: selectedCreator.subscribers.toLocaleString(), icon: '👥', bg: '#F0F4FF', color: '#4F46E5' },
                  { label: 'Sub Price', value: `$${selectedCreator.subscriptionPrice}/mo`, icon: '💰', bg: '#FFFBEB', color: '#D97706' },
                  { label: 'Total Posts', value: selectedCreator.totalPosts, icon: '📸', bg: '#F0FFF4', color: '#16A34A' },
                  { label: 'Total Earnings', value: `$${selectedCreator.totalEarnings.toLocaleString()}`, icon: '📈', bg: '#FFF5F5', color: '#DC2626' },
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
                <button className="btn-action" style={{ flex: 1, padding: '12px', background: '#EDE9FE', color: '#7C3AED', fontWeight: 700, fontSize: '14px', borderRadius: '10px' }}>
                  {selectedCreator.isVerified ? '✓ Verified' : 'Verify Creator'}
                </button>
                <button className="btn-action btn-delete" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px' }}>
                  <Ban size={16} style={{ verticalAlign: 'middle' }} /> Block
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
          {reports.map(report => {
            const userStatus = users.find(u => u.id === report.reportedUserId)?.status || 'UNKNOWN';

            return (
              <tr key={report.id} style={{ opacity: report.status === 'RESOLVED' ? 0.6 : 1 }}>
                <td>
                  <div className="user-cell">
                    <img src={report.reportedUserAvatar} alt={report.reportedUser} />
                    <div className="user-cell-info">
                      <h4>@{report.reportedUser}</h4>
                      <span>
                        {report.type} • {userStatus === 'BLOCKED' ? <span style={{ color: '#e74c3c' }}>Blocked</span> : 'Active'}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="comment-text" style={{ whiteSpace: 'normal', maxWidth: '350px', lineHeight: '1.4' }}>
                    {report.reason}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{report.date}</span>
                </td>
                <td>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>@{report.reportedBy}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    {report.status === 'PENDING' && (
                      <>
                        {userStatus !== 'BLOCKED' && (
                          <button
                            className="btn-action btn-delete"
                            onClick={() => blockReportedUser(report.reportedUserId, report.id)}
                            title="Block Offender & Resolve"
                          >
                            <Ban size={16} /> Block User
                          </button>
                        )}
                        <button
                          className="btn-action"
                          onClick={() => resolveReport(report.id)}
                          style={{ background: '#F0F4FF', color: '#4F46E5' }}
                          title="Dismiss Report"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {report.status === 'RESOLVED' && (
                      <span className="status-badge status-active" style={{ background: 'transparent' }}>
                        <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Resolved
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {reports.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No pending reports.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // --- MODAL ---
  const renderPostModal = () => {
    if (!selectedPost) return null;
    const postComments = comments.filter(c => c.postId === selectedPost.id);

    return (
      <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-media-section">
            <img src={selectedPost.mediaUrl} alt="Post media" />
          </div>
          <div className="modal-info-section">
            <div className="modal-header">
              <div className="user-cell">
                <img src={`https://i.pravatar.cc/150?u=${selectedPost.creatorUsername}`} alt={selectedPost.creatorUsername} />
                <div className="user-cell-info">
                  <h4>@{selectedPost.creatorUsername}</h4>
                  <span>{selectedPost.date}</span>
                </div>
              </div>
              <button className="btn-action" onClick={() => setSelectedPost(null)} style={{ background: '#F0F2F5', color: '#4A5568', borderRadius: '8px', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>{selectedPost.content}</p>

              <div className="modal-comments">
                <h4>Comments ({postComments.length})</h4>
                {postComments.map(c => (
                  <div className="modal-comment" key={c.id}>
                    <img src={c.authorAvatar} alt={c.author} />
                    <div className="modal-comment-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h5>@{c.author}</h5>
                        <button style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }} onClick={() => deleteComment(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))}
                {postComments.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No comments yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand-container">
          <Logo size={32} showText={false} />
          <div className="admin-brand-text">
            <span className="brand-name">OnlyMans</span>
            <span className="brand-badge">ADMIN CONTROL</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <AlertTriangle size={20} /> Reports & Notices
          </button>
          <button className={`admin-nav-item ${activeTab === 'creators' ? 'active' : ''}`} onClick={() => setActiveTab('creators')}>
            <Crown size={20} /> Creators
          </button>
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={20} /> Users
          </button>
          <button className={`admin-nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            <Video size={20} /> Content Moderation
          </button>
          <button className={`admin-nav-item ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
            <MessageSquare size={20} /> Comments
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-footer-profile">
            <img src="https://i.pravatar.cc/150?img=68" alt="Admin avatar" className="footer-avatar" />
            <div className="footer-profile-info">
              <span className="footer-profile-name">Super Admin</span>
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'reports' && 'Reports & Notices'}
            {activeTab === 'creators' && 'Creator Management'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'posts' && 'Moderate Content'}
            {activeTab === 'comments' && 'Moderate Comments'}
          </h1>
          <div className="admin-user-profile">
            <span style={{ fontWeight: 600 }}>Super Admin</span>
            <img src="https://i.pravatar.cc/150?img=68" alt="Admin" />
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

      {/* Modals */}
      {renderPostModal()}
    </div>
  );
};

export default AdminPanel;
