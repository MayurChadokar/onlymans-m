import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../utils/firebase';
import { apiRequest } from '../utils/api';
import { getAccessToken } from '../utils/auth';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    if (!messaging) return;

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message', payload);
      toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
        duration: 5000,
        position: 'top-right',
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const requestPermissionAndGetToken = async () => {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = "BM24hYir4xKXeoLTjyxUYm-eS5Ki2lb5q_F7IqZGUYNRukm8a-7kfpj2TtwLrWfkMZ73Cx_36FOV3uwd_yS-Z28";
        if (!vapidKey) {
          console.warn('VITE_FIREBASE_VAPID_KEY is missing');
          return null;
        }

        const token = await getToken(messaging, { vapidKey });
        
        if (token) {
          setFcmToken(token);
          // Send to backend
          await apiRequest('/notifications/fcm-token', {
            method: 'POST',
            body: { token, device: 'web' },
            token: getAccessToken()
          });
          return token;
        }
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error getting FCM token', error);
    }
    return null;
  };

  return { fcmToken, requestPermissionAndGetToken };
};
