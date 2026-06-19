import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { apiRequest } from './utils/api';
import { clearAuthSession, getAccessToken, getCurrentUser, updateAuthUser } from './utils/auth';

// ── Auth ──────────────────────────────────────────────────────────────────────
import Login        from './panels/auth/Login';
import Signup       from './panels/auth/Signup';

// ── User Panel ────────────────────────────────────────────────────────────────
import Dashboard      from './panels/user/Dashboard';
import Explore        from './panels/user/Explore';
import Favorites      from './panels/user/Favorites';
import Subscriptions  from './panels/user/Subscriptions';
import BecomeCreator  from './panels/user/BecomeCreator';
import UserProfile    from './panels/user/UserProfile';
import CreatorProfile from './panels/user/CreatorProfile';

// ── Creator Panel ─────────────────────────────────────────────────────────────
import CreatorStudio      from './panels/creator/CreatorStudio';
import CreatePost         from './panels/creator/CreatePost';
import CreatorSubscribers from './panels/creator/CreatorSubscribers';
import CreatorSettings    from './panels/creator/CreatorSettings';

// ── Admin Panel ───────────────────────────────────────────────────────────────
import AdminPanel from './panels/admin/AdminPanel';
import AdminLogin from './panels/admin/AdminLogin';

// ── Shared ────────────────────────────────────────────────────────────────────
import VideoPlayer from './panels/shared/VideoPlayer';


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
      <Routes>
        <Route path="/" element={<SessionHomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
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
        <Route path="/video/:id" element={<VideoPlayer />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

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
    </div>
  );
}

export default App;
