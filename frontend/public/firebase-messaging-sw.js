importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// We use importScripts to load the firebase libs.
// The config will be injected or hardcoded here because process.env is not available in the service worker directly unless handled by a bundler.
// Since Vite doesn't bundle public files by default, we need a hardcoded config or fetch it.
// For now, it will look for the query parameters or we can just leave it empty and let users replace it.
// To make it easy, replace the below config with your actual config.

const firebaseConfig = {
  apiKey: "AIzaSyCFhoTzqRqmtqJu0TA100NhWBMFzuzEQT4",
  authDomain: "appzeto-6b06a.firebaseapp.com",
  databaseURL: "https://appzeto-6b06a-default-rtdb.firebaseio.com",
  projectId: "appzeto-6b06a",
  storageBucket: "appzeto-6b06a.firebasestorage.app",
  messagingSenderId: "711467295128",
  appId: "1:711467295128:web:2ef76624c83a9c0fd2cbed",
  measurementId: "G-NPQNJR003E"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: '/vite.svg',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW failed to initialize', e);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const linkUrl = event.notification.data?.linkUrl || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === linkUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(linkUrl);
      }
    })
  );
});
