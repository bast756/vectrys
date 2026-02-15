// ============================================================
// VECTRYS — Firebase Cloud Messaging (FCM)
// Push notifications for guest portal
// ============================================================

import { fcmApi } from '@/api/endpoints';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let fcmToken: string | null = null;

/**
 * Request notification permission and register FCM token
 * Called on HomePage mount
 */
export async function initPushNotifications(): Promise<string | null> {
  // Check if Firebase config is available
  if (!FIREBASE_CONFIG.apiKey || !VAPID_KEY) {
    console.log('[FCM] Firebase not configured, skipping push notifications');
    return null;
  }

  // Check if notifications are supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('[FCM] Notifications not supported');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    // Dynamically import Firebase (lazy load to reduce bundle size)
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) {
      console.warn('[FCM] No token received');
      return null;
    }

    fcmToken = token;

    // Register token with backend
    try {
      await fcmApi.registerToken(token);
      console.log('[FCM] Token registered successfully');
    } catch (err) {
      console.warn('[FCM] Failed to register token:', err);
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload);
      // Show in-app notification via Sonner toast
      const { title, body } = payload.notification || {};
      if (title) {
        // Import dynamically to avoid circular dependency
        import('sonner').then(({ toast }) => {
          toast.info(title, { description: body });
        });
      }
    });

    return token;
  } catch (err) {
    console.error('[FCM] Initialization error:', err);
    return null;
  }
}

export function getFcmToken(): string | null {
  return fcmToken;
}
