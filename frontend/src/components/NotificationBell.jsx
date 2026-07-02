import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, BellRing } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getAccessToken } from '../utils/auth';
import { usePushNotifications } from '../hooks/usePushNotifications';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { requestPermissionAndGetToken } = usePushNotifications();
  const [permission, setPermission] = useState(Notification.permission);

  const fetchNotifications = async () => {
    try {
      const response = await apiRequest('/notifications?limit=10', { token: getAccessToken() });
      if (response) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id, linkUrl) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH', token: getAccessToken() });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (linkUrl) {
        setIsOpen(false);
        navigate(linkUrl);
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH', token: getAccessToken() });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-btn"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="notification-mark-all"
              >
                <Check className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {permission === 'default' && (
              <div className="notification-enable-push">
                <p>Enable push notifications to never miss an update.</p>
                <button 
                  onClick={async () => {
                    await requestPermissionAndGetToken();
                    setPermission(Notification.permission);
                  }}
                >
                  <BellRing className="w-4 h-4" />
                  Turn on Notifications
                </button>
              </div>
            )}
            
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <Bell className="w-6 h-6" />
                </div>
                <h4>You're all caught up!</h4>
                <p>No new notifications right now.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id, notification.linkUrl)}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-item-content">
                    <div className="notification-item-header">
                      <p className="notification-title">{notification.title}</p>
                      {!notification.isRead && <span className="notification-dot"></span>}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="notification-footer">
             <Link 
               to="/notifications" 
               onClick={() => setIsOpen(false)} 
               className="notification-view-all"
             >
               View All Notifications
             </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
