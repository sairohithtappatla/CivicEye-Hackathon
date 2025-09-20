import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyC77LMCGIELnnZkEUgBSPOQNT-IEf_cvnw",
  authDomain: "civiceye-hackathon.firebaseapp.com",
  projectId: "civiceye-hackathon",
  storageBucket: "civiceye-hackathon.firebasestorage.app",
  messagingSenderId: "359665042474",
  appId: "1:359665042474:web:80a768bd7cd73d5c0a2f53",
  measurementId: "G-HNC8K83SKE"
};

// Initialize Firebase
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);

  // Initialize messaging only if supported
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    messaging = getMessaging(app);
    console.log('🔥 Firebase messaging initialized for civiceye-hackathon');
  } else {
    console.warn('⚠️ FCM not supported in this environment');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

export { messaging, getToken, onMessage };
export default app;