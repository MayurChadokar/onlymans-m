import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { apiRequest } from './utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, updateAuthUser } from './utils/auth';
import { Toaster } from 'react-hot-toast';

// ── Auth ──────────────────────────────────────────────────────────────────────
const Login          = lazy(() => import('./panels/auth/Login'));
const Signup         = lazy(() => import('./panels/auth/Signup'));
const ForgotPassword = lazy(() => import('./panels/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('./panels/auth/ResetPassword'));

// ── User Panel ────────────────────────────────────────────────────────────────
const Dashboard      = lazy(() => import('./panels/user/Dashboard'));
const Explore        = lazy(() => import('./panels/user/Explore'));
const Favorites      = lazy(() => import('./panels/user/Favorites'));
const Subscriptions  = lazy(() => import('./panels/user/Subscriptions'));
const BecomeCreator  = lazy(() => import('./panels/user/BecomeCreator'));
const UserProfile    = lazy(() => import('./panels/user/UserProfile'));
const CreatorProfile = lazy(() => import('./panels/user/CreatorProfile'));
const PostDetails    = lazy(() => import('./panels/user/PostDetails'));

// ── Creator Panel ─────────────────────────────────────────────────────────────
const CreatorStudio      = lazy(() => import('./panels/creator/CreatorStudio'));
const CreatePost         = lazy(() => import('./panels/creator/CreatePost'));
const CreatorSubscribers = lazy(() => import('./panels/creator/CreatorSubscribers'));
const CreatorSettings    = lazy(() => import('./panels/creator/CreatorSettings'));

// ── Admin Panel ───────────────────────────────────────────────────────────────
const AdminPanel = lazy(() => import('./panels/admin/AdminPanel'));
const AdminLogin = lazy(() => import('./panels/admin/AdminLogin'));

// ── Shared ────────────────────────────────────────────────────────────────────
const VideoPlayer = lazy(() => import('./panels/shared/VideoPlayer'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-color, #e74c3c)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);


const getHomePathForRole = (role) => (role === 'CREATOR' ? '/creator/studio' : '/user/dashboard');

const SessionHomeRedirect = () => {
  const user = getCurrentUser();
  return <Navigate to={user ? getHomePathForRole(user.role) : '/login'} replace />;
};

const ProtectedRoute = ({ children }) => {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ allow = [], fallback, children }) => {
  const user = getCurrentUser();
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  if (allow.length && !allow.includes(user?.role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
};

function App() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        if (active) {
          setAuthChecked(true);
        }
        return;
      }

      try {
        const response = await apiRequest('/auth/me', { token: accessToken });
        if (!active) return;
        if (response?.user) {
          updateAuthUser(response.user);
        }
      } catch {
        if (!active) return;
        clearAuthSession();
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    };

    syncSession();

    return () => {
      active = false;
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
        Syncing session...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { 
            background: 'var(--bg-card)', 
            color: 'var(--text-color)', 
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }
        }} 
      />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<SessionHomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* USER-only dashboard: creators go to /creator/studio */}
        <Route path="/user/dashboard" element={<RoleRoute allow={['USER']} fallback="/creator/studio"><Dashboard /></RoleRoute>} />
        <Route path="/user/become-creator" element={<BecomeCreator />} />

        {/* CREATOR-only routes */}
        <Route path="/creator/studio" element={<RoleRoute allow={['CREATOR']} fallback="/user/become-creator"><CreatorStudio /></RoleRoute>} />
        <Route path="/creator/create-post" element={<RoleRoute allow={['CREATOR']} fallback="/user/become-creator"><CreatePost /></RoleRoute>} />
        <Route path="/creator/subscribers" element={<RoleRoute allow={['CREATOR']} fallback="/user/become-creator"><CreatorSubscribers /></RoleRoute>} />
        <Route path="/creator/settings" element={<RoleRoute allow={['CREATOR']} fallback="/user/become-creator"><CreatorSettings /></RoleRoute>} />

        {/* Both USER and CREATOR can access these */}
        <Route path="/user/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/user/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/user/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
        
        {/* /user/profile: USER → UserProfile, CREATOR → /creator/settings */}
        <Route path="/user/profile" element={<RoleRoute allow={['USER']} fallback="/creator/settings"><UserProfile /></RoleRoute>} />
        
        {/* Public view profile */}
        <Route path="/creator-profile/:creatorId" element={<CreatorProfile />} />
        <Route path="/creator-profile" element={<Navigate to="/user/explore" replace />} />
        <Route path="/post/:postId" element={<PostDetails />} />
        <Route path="/video/:id" element={<VideoPlayer />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<RoleRoute allow={['ADMIN']} fallback="/admin-login"><AdminPanel /></RoleRoute>} />

        {/* Legacy route redirects for backward compatibility */}
        <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
        <Route path="/explore" element={<Navigate to="/user/explore" replace />} />
        <Route path="/subscriptions" element={<Navigate to="/user/subscriptions" replace />} />
        <Route path="/favorites" element={<Navigate to="/user/favorites" replace />} />
        <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
        <Route path="/become-creator" element={<Navigate to="/user/become-creator" replace />} />
        <Route path="/creator-studio" element={<Navigate to="/creator/studio" replace />} />
        <Route path="/create-post" element={<Navigate to="/creator/create-post" replace />} />
        <Route path="/creator-subscribers" element={<Navigate to="/creator/subscribers" replace />} />
        <Route path="/creator-settings" element={<Navigate to="/creator/settings" replace />} />
        <Route path="/view-profile/:creatorId" element={<CreatorProfile />} />
        
        {/* Catch-all 404 Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
