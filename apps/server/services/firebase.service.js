/**
 * VECTRYS — Service Firebase (notifications push)
 *
 * Notifications push via Firebase Cloud Messaging (FCM).
 * Necessite FIREBASE_SERVICE_ACCOUNT_PATH et FIREBASE_PROJECT_ID.
 *
 * @version 1.0.0
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

let messaging = null;

function initFirebase() {
  if (admin.apps.length) {
    messaging = admin.messaging();
    return;
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!saPath || !projectId) {
    console.warn('⚠️ Firebase non configure (FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_PROJECT_ID manquant)');
    return;
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
    messaging = admin.messaging();
    console.log('✅ Service Firebase initialise');
  } catch (err) {
    console.warn('⚠️ Firebase init echouee:', err.message);
  }
}

initFirebase();

function ensureFirebase() {
  if (!messaging) {
    throw Object.assign(
      new Error('Firebase non configure'),
      { statusCode: 503 }
    );
  }
}

/**
 * Envoyer une notification push a un device (token FCM).
 */
export async function sendToDevice(token, { title, body, data = {} }) {
  ensureFirebase();

  const result = await messaging.send({
    token,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  return { success: true, messageId: result };
}

/**
 * Envoyer une notification a un topic (broadcast).
 */
export async function sendToTopic(topic, { title, body, data = {} }) {
  ensureFirebase();

  const result = await messaging.send({
    topic,
    notification: { title, body },
    data,
  });

  return { success: true, messageId: result };
}

/**
 * Abonner des tokens a un topic.
 */
export async function subscribeToTopic(tokens, topic) {
  ensureFirebase();

  const result = await messaging.subscribeToTopic(tokens, topic);
  return { success: true, successCount: result.successCount, failureCount: result.failureCount };
}

// --- Notifications metier VECTRYS ---

export async function notifyNewBooking(token, { propertyName, guestName, checkinDate }) {
  return sendToDevice(token, {
    title: 'Nouvelle reservation',
    body: `${guestName} a reserve ${propertyName} pour le ${checkinDate}`,
    data: { type: 'new_booking', propertyName, guestName, checkinDate },
  });
}

export async function notifyCheckinToday(token, { propertyName, guestName, checkinTime }) {
  return sendToDevice(token, {
    title: 'Check-in aujourd\'hui',
    body: `${guestName} arrive a ${propertyName} a ${checkinTime}`,
    data: { type: 'checkin_today', propertyName, guestName, checkinTime },
  });
}

export async function notifyMaintenanceAlert(token, { propertyName, issue }) {
  return sendToDevice(token, {
    title: 'Alerte maintenance',
    body: `${propertyName} : ${issue}`,
    data: { type: 'maintenance_alert', propertyName, issue },
  });
}

export default {
  sendToDevice,
  sendToTopic,
  subscribeToTopic,
  notifyNewBooking,
  notifyCheckinToday,
  notifyMaintenanceAlert,
};
