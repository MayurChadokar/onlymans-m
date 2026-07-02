import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// Replace these with your actual Firebase config from the console
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

let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase initialization failed. Push notifications may not work. Error:', error);
}

export { app, messaging };
