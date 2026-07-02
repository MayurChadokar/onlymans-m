const { initializeApp, cert, getApps } = require('firebase-admin/app');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'appzeto-6b06a-firebase-adminsdk-fbsvc-930c80418b.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully using service account JSON.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully from env variables.');
    } else {
      console.warn('Firebase Admin credentials not found. Push notifications will not be sent.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
};

module.exports = {
  initializeFirebase,
  getApps,
};
