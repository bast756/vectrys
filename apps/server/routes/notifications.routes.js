/**
 * VECTRYS — Routes Notifications (Firebase FCM)
 *
 * Endpoints : push device, push topic, subscribe topic.
 * Prefixe : /api/notifications/*
 */

import express from 'express';
import { createRateLimiter } from '../src/utils/rate-limiter.js';
import {
  sendToDevice,
  sendToTopic,
  subscribeToTopic,
} from '../services/firebase.service.js';

const router = express.Router();

// 20 notifications/min max par IP
router.use(createRateLimiter(60000, 20));

// ============================================================================
// POST /api/notifications/send
// ============================================================================
router.post('/send', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    if (!token || !title || !body) {
      return res.status(400).json({ success: false, error: 'Champs requis : token, title, body' });
    }

    const result = await sendToDevice(token, { title, body, data });
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('[NOTIF] Erreur send:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/notifications/topic
// ============================================================================
router.post('/topic', async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;
    if (!topic || !title || !body) {
      return res.status(400).json({ success: false, error: 'Champs requis : topic, title, body' });
    }

    const result = await sendToTopic(topic, { title, body, data });
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('[NOTIF] Erreur topic:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi notification topic',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/notifications/subscribe
// ============================================================================
router.post('/subscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;
    if (!tokens || !Array.isArray(tokens) || !topic) {
      return res.status(400).json({ success: false, error: 'Champs requis : tokens (array), topic' });
    }

    const result = await subscribeToTopic(tokens, topic);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[NOTIF] Erreur subscribe:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur abonnement topic',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
