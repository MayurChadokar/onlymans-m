import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { getAccessToken, getCurrentUser } from '../../utils/auth';
import UserNavbar from '../../components/UserNavbar';
import './Dashboard.css';

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Report State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportType, setReportType] = useState('SPAM');
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchPostDetails = async () => {
      setLoading(true);
      try {
        const response = await apiRequest(`/posts/${postId}`, {
          token: getAccessToken()
        });
        if (!active) return;
        setPost(response.post);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load post');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPostDetails();

    return () => { active = false; };
  }, [postId]);

  useEffect(() => {
    let active = true;

    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const response = await apiRequest(`/posts/${postId}/comments`, {
          token: getAccessToken()
        });
        if (!active) return;
        setComments(response.comments || []);
      } catch (err) {
        if (!active) return;
        setCommentError(err.message || 'Failed to load comments');
      } finally {
        if (active) setCommentsLoading(false);
      }
    };

    fetchComments();

    return () => { active = false; };
  }, [postId]);

  const toggleLike = async () => {
    if (!post) return;
    
    const newLikedState = !post.isLiked;
    const previousState = { ...post };

    setPost({
      ...post,
      isLiked: newLikedState,
      likesCount: newLikedState ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
    });

    try {
      await apiRequest(`/posts/${postId}/like`, {
        method: 'POST',
        token: getAccessToken(),
      });
    } catch (err) {
      setPost(previousState);
      alert(err.message || 'Could not update like');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!post || !commentText.trim()) return;

    try {
      const response = await apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        body: { content: commentText.trim() },
        token: getAccessToken(),
      });

      if (response.comment) {
        setComments(prev => [response.comment, ...prev]);
        setPost({
          ...post,
          commentsCount: post.commentsCount + 1
        });
      }
      setCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Could not post comment');
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

  if (loading) {
    return (
      <div className="dashboard-layout">
        <UserNavbar />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
          Loading post details...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="dashboard-layout">
        <UserNavbar />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#ff6b6b' }}>
          {error || 'Post not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <UserNavbar />

      <div className="dashboard-content">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="nav-menu">
            <button onClick={() => navigate(-1)} className="menu-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Go Back
            </button>
            <Link to="/user/dashboard" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              Home
            </Link>
            <Link to="/user/explore" className="menu-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
              Explore
            </Link>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="main-feed" style={{ padding: '0 0 40px 0' }}>
          <article className="post-card" style={{ marginBottom: '24px' }}>
            <div className="post-header">
              <Link to={`/creator-profile/${post.creatorId}`} className="post-author" style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={post.creator?.avatarUrl || `https://i.pravatar.cc/150?u=${post.creator?.username}`} alt={post.creator?.username} loading="lazy" decoding="async" />
                <div>
                  <h4>@{post.creator?.username || 'creator'} <svg width="14" height="14" viewBox="0 0 24 24" fill="#00B4D8"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></h4>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </Link>
            </div>

            <div className="post-content">
              <p className="post-caption" style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </p>
              
              {post.media && post.media.length > 0 && (
                <div className="post-image-wrapper" style={{ position: 'relative', width: '100%', minHeight: '300px', backgroundColor: '#000', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
                  {post.media[0].type === 'VIDEO' ? (
                    <video src={post.media[0].url} controls autoPlay controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <img src={post.media[0].url} alt="Post Media" loading="lazy" decoding="async" onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
                  )}
                  {post.isLocked && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ marginBottom: '16px' }}><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" /></svg>
                      <h3 style={{ marginBottom: '16px' }}>Subscriber Exclusive</h3>
                      <Link to={`/creator-profile/${post.creatorId}`} className="btn-gradient small-btn">Unlock Access</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="post-actions border-top" style={{ paddingBottom: 0 }}>
              <div className="action-left">
                <button
                  onClick={toggleLike}
                  className="like-btn"
                  style={{ color: post.isLiked ? '#ff4a4a' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg className={`like-icon ${post.isLiked ? 'active' : ''}`} viewBox="0 0 24 24" width="20" height="20" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {post.isLiked ? 'Liked' : 'Like'} {post.likesCount || 0}
                </button>
                <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {post.commentsCount > 0 ? `${post.commentsCount} Comment${post.commentsCount !== 1 ? 's' : ''}` : 'Comment'}
                </div>
              </div>
            </div>
          </article>

          {/* Comments Section below the post */}
          <div className="comments-section" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Comments</h3>
            
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <button className="btn-primary-gradient" type="submit" disabled={!commentText.trim()} style={{ opacity: !commentText.trim() ? 0.6 : 1 }}>Post</button>
            </form>

            {commentError && (
              <div style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '0.9rem' }}>{commentError}</div>
            )}

            <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {commentsLoading && (
                <div style={{ color: 'var(--text-secondary)' }}>Loading comments...</div>
              )}

              {!commentsLoading && comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                  {comment.user?.id ? (
                    <Link to={`/creator-profile/${comment.user.id}`} style={{ textDecoration: 'none' }}>
                      <img src={`https://i.pravatar.cc/150?u=${comment.user?.username}`} alt="User avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                    </Link>
                  ) : (
                    <img src={`https://i.pravatar.cc/150?u=${comment.user?.username}`} alt="User avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
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
                    <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.4' }}>{comment.content}</p>
                  </div>
                </div>
              ))}

              {!commentsLoading && comments.length === 0 && !commentError && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No comments yet. Be the first one.</div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
           {/* Can put related posts or creator info here, left blank or simple for now */}
        </aside>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => !isReporting && setReportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Report User</h3>
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
                      placeholder="Please provide more details..."
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

export default PostDetails;
