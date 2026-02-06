// =============================================================================
// Types
// =============================================================================

export interface PushNotification {
  title?: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

export type MessageHandler = (payload: PushNotification & { data?: Record<string, unknown> }) => void;

// =============================================================================
// State
// =============================================================================

let messaging: unknown = null;
let currentToken: string | null = null;
let initialized = false;
const messageHandlers: Set<MessageHandler> = new Set();

// =============================================================================
// Firebase Config
// =============================================================================

function getFirebaseConfig(): PushConfig | null {
  const config: PushConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
  };

  if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
    console.warn('[PushNotifications] Firebase config missing required fields');
    return null;
  }

  return config;
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize push notifications
 * Should be called once on app load
 */
export async function initPushNotifications(): Promise<boolean> {
  if (initialized) {
    console.log('[PushNotifications] Already initialized');
    return true;
  }

  // Check browser support
  if (typeof window === 'undefined') {
    console.log('[PushNotifications] Not in browser environment');
    return false;
  }

  if (!('Notification' in window)) {
    console.warn('[PushNotifications] Browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[PushNotifications] Browser does not support service workers');
    return false;
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.warn('[PushNotifications] Firebase config not available');
    return false;
  }

  try {
    // Dynamic import to avoid SSR issues
    const firebase = await import('firebase/app');
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');

    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.warn('[PushNotifications] Firebase Messaging not supported in this browser');
      return false;
    }

    // Initialize Firebase
    const app = firebase.getApps().length === 0
      ? firebase.initializeApp(config)
      : firebase.getApps()[0];

    messaging = getMessaging(app);

    // Register service worker
    await registerServiceWorker();

    // Setup message handler
    onMessage(messaging as ReturnType<typeof getMessaging>, (payload) => {
      console.log('[PushNotifications] Message received:', payload);

      const notification: PushNotification & { data?: Record<string, unknown> } = {
        title: payload.notification?.title,
        body: payload.notification?.body,
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data,
      };

      // Notify all handlers
      messageHandlers.forEach(handler => {
        try {
          handler(notification);
        } catch (e) {
          console.error('[PushNotifications] Handler error:', e);
        }
      });

      // Show notification if page is hidden
      if (document.hidden && Notification.permission === 'granted') {
        showNotification(notification);
      }
    });

    initialized = true;
    console.log('[PushNotifications] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[PushNotifications] Initialization error:', error);
    return false;
  }
}

/**
 * Register the Firebase messaging service worker
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );
    console.log('[PushNotifications] Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[PushNotifications] Service worker registration failed:', error);
    return null;
  }
}

// =============================================================================
// Permission & Token
// =============================================================================

/**
 * Request notification permission and get FCM token
 */
export async function requestPermission(): Promise<string | null> {
  if (!initialized) {
    console.warn('[PushNotifications] Not initialized. Call initPushNotifications first.');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('[PushNotifications] Permission denied');
      return null;
    }

    // Get token
    const { getToken } = await import('firebase/messaging');
    const config = getFirebaseConfig();

    if (!config || !messaging) {
      return null;
    }

    currentToken = await getToken(messaging as ReturnType<typeof import('firebase/messaging').getMessaging>, {
      vapidKey: config.vapidKey,
    });

    console.log('[PushNotifications] Token obtained:', currentToken?.substring(0, 20) + '...');
    return currentToken;
  } catch (error) {
    console.error('[PushNotifications] Permission request error:', error);
    return null;
  }
}

/**
 * Get the current FCM token (if available)
 */
export function getToken(): string | null {
  return currentToken;
}

/**
 * Check if notifications are supported
 */
export function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

/**
 * Get current permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// =============================================================================
// Message Handling
// =============================================================================

/**
 * Register a handler for incoming messages
 */
export function onMessage(handler: MessageHandler): () => void {
  messageHandlers.add(handler);

  // Return unsubscribe function
  return () => {
    messageHandlers.delete(handler);
  };
}

/**
 * Show a notification using the Notification API
 */
export function showNotification(notification: PushNotification): void {
  if (Notification.permission !== 'granted') {
    console.warn('[PushNotifications] Permission not granted');
    return;
  }

  const options: NotificationOptions = {
    body: notification.body,
    icon: notification.icon || '/icon-192.png',
    badge: notification.badge || '/badge.png',
    image: notification.image,
    tag: notification.tag,
    requireInteraction: notification.requireInteraction,
    data: notification.data,
  };

  if (notification.actions) {
    // @ts-expect-error - actions is experimental
    options.actions = notification.actions;
  }

  try {
    new Notification(notification.title || 'Notification', options);
  } catch (error) {
    // Fallback to service worker notification
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(notification.title || 'Notification', options);
    });
  }
}

// =============================================================================
// Token Registration with Backend
// =============================================================================

/**
 * Register the current token with the backend
 */
export async function registerToken(apiUrl: string = '/api/notifications/register'): Promise<boolean> {
  if (!currentToken) {
    console.warn('[PushNotifications] No token to register');
    return false;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: currentToken,
        platform: 'web',
        deviceName: getDeviceName(),
      }),
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      console.log('[PushNotifications] Token registered with backend');
      return true;
    } else {
      console.error('[PushNotifications] Backend registration failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('[PushNotifications] Backend registration error:', error);
    return false;
  }
}

/**
 * Unregister the current token from the backend
 */
export async function unregisterToken(apiUrl: string = '/api/notifications/unregister'): Promise<boolean> {
  if (!currentToken) {
    return true;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: currentToken }),
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      console.log('[PushNotifications] Token unregistered from backend');
      currentToken = null;
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PushNotifications] Backend unregister error:', error);
    return false;
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get a user-friendly device name
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';

  return 'Web Browser';
}

// =============================================================================
// Notification Sound
// =============================================================================

/**
 * Play notification sound
 */
export function playNotificationSound(soundUrl: string = '/notification.mp3'): void {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Audio play failed (probably due to autoplay policy)
    });
  } catch {
    // Audio not supported
  }
}

// =============================================================================
// Export all
// =============================================================================

export default {
  init: initPushNotifications,
  requestPermission,
  getToken,
  onMessage,
  showNotification,
  registerToken,
  unregisterToken,
  isSupported,
  getPermissionStatus,
  playNotificationSound,
};
