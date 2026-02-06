// =============================================================================
// Firebase Messaging Service Worker
// =============================================================================
// This service worker handles background push notifications for web.
// It runs in the background even when the app is not open.
//
// IMPORTANT: Update the Firebase config below with your project's values.
// You can find these in Firebase Console > Project Settings > General
// =============================================================================

// Import Firebase scripts (using compat for service worker compatibility)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// =============================================================================
// Firebase Configuration
// =============================================================================
// Replace these values with your Firebase project configuration.
// These should match the values in your web/.env.local file.
//
// For production: Consider loading config from a separate file or using
// a build step to inject these values.
// =============================================================================

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// =============================================================================
// Notification Configuration
// =============================================================================

const defaultNotificationOptions = {
  icon: '/icon-192.png',
  badge: '/badge.png',
  vibrate: [100, 50, 100],
  requireInteraction: false,
  renotify: true,
  silent: false,
};

// =============================================================================
// Background Message Handler
// =============================================================================

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const notificationIcon = payload.notification?.icon || payload.data?.icon || defaultNotificationOptions.icon;
  const notificationImage = payload.notification?.image || payload.data?.image;
  const notificationTag = payload.data?.tag || 'default';

  // Build notification options
  const notificationOptions = {
    ...defaultNotificationOptions,
    body: notificationBody,
    icon: notificationIcon,
    tag: notificationTag,
    data: payload.data || {},
  };

  // Add image if provided (for rich notifications)
  if (notificationImage) {
    notificationOptions.image = notificationImage;
  }

  // Add actions if provided in data
  if (payload.data?.actions) {
    try {
      notificationOptions.actions = JSON.parse(payload.data.actions);
    } catch (e) {
      console.error('[firebase-messaging-sw] Error parsing actions:', e);
    }
  }

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// =============================================================================
// Notification Click Handler
// =============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked:', event);

  // Close the notification
  event.notification.close();

  // Get the click action or URL from notification data
  const clickAction = event.notification.data?.click_action ||
                      event.notification.data?.url ||
                      '/';

  // Handle action button clicks
  if (event.action) {
    console.log('[firebase-messaging-sw] Action clicked:', event.action);

    // You can handle specific actions here
    // For example: if (event.action === 'view') { ... }

    // Try to find an action URL
    const actionUrl = event.notification.data?.[`action_${event.action}_url`] || clickAction;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url === actionUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
    );
    return;
  }

  // Handle regular notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if ('focus' in client) {
          // Focus existing window and navigate to click action
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          });
          return client;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// =============================================================================
// Notification Close Handler
// =============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw] Notification closed:', event);

  // You can track dismissed notifications here
  // For example, send analytics or update backend
});

// =============================================================================
// Push Event Handler (fallback for non-FCM pushes)
// =============================================================================

self.addEventListener('push', (event) => {
  // This handles push events that might not come through FCM
  // FCM messages are typically handled by onBackgroundMessage above

  if (!event.data) {
    console.log('[firebase-messaging-sw] Push event with no data');
    return;
  }

  try {
    const payload = event.data.json();

    // Skip if this looks like an FCM message (FCM handles these)
    if (payload.notification || payload.fcmMessageId) {
      return;
    }

    console.log('[firebase-messaging-sw] Non-FCM push received:', payload);

    // Handle custom push messages
    const title = payload.title || 'Notification';
    const options = {
      ...defaultNotificationOptions,
      body: payload.body || '',
      data: payload.data || payload,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    console.error('[firebase-messaging-sw] Error handling push:', e);
  }
});

// =============================================================================
// Service Worker Lifecycle Events
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw] Installing service worker...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw] Service worker activated');
  // Claim clients to start controlling pages immediately
  event.waitUntil(clients.claim());
});

// =============================================================================
// Message Handler (for communication with main app)
// =============================================================================

self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw] Message from client:', event.data);

  // Handle messages from the main app
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[firebase-messaging-sw] Service worker loaded');
