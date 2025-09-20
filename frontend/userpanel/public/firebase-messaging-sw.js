importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC77LMCGIELnnZkEUgBSPOQNT-IEf_cvnw",
  authDomain: "civiceye-hackathon.firebaseapp.com",
  projectId: "civiceye-hackathon",
  storageBucket: "civiceye-hackathon.firebasestorage.app",
  messagingSenderId: "359665042474",
  appId: "1:359665042474:web:80a768bd7cd73d5c0a2f53",
  measurementId: "G-HNC8K83SKE"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'CivicEye Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'New civic report submitted',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'civiceye-notification',
    requireInteraction: true,
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View Report',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  event.notification.close();

  if (event.action === 'view') {
    // Open the app to view the report
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});