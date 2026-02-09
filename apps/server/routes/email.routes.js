/**
 * VECTRYS — Routes Email (SendGrid)
 *
 * Endpoints : confirmation booking, rappel check-in,
 * instructions depart, demande avis, magic link.
 * Prefixe : /api/email/*
 */

import express from 'express';
import { createRateLimiter } from '../src/utils/rate-limiter.js';
import {
  sendBookingConfirmation,
  sendCheckinReminder,
  sendCheckoutInstructions,
  sendReviewRequest,
  sendMagicLink,
} from '../services/sendgrid.service.js';

const router = express.Router();

// 10 emails/min max par IP
router.use(createRateLimiter(60000, 10));

// ============================================================================
// POST /api/email/booking-confirmation
// ============================================================================
router.post('/booking-confirmation', async (req, res) => {
  try {
    const { to, guestName, propertyName, checkinDate, checkoutDate, accessCode } = req.body;
    if (!to || !guestName || !propertyName) {
      return res.status(400).json({ success: false, error: 'Champs requis : to, guestName, propertyName' });
    }

    await sendBookingConfirmation(to, { guestName, propertyName, checkinDate, checkoutDate, accessCode });
    res.json({ success: true, message: 'Email de confirmation envoye' });
  } catch (error) {
    console.error('[EMAIL] Erreur booking-confirmation:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/email/checkin-reminder
// ============================================================================
router.post('/checkin-reminder', async (req, res) => {
  try {
    const { to, guestName, propertyName, checkinTime, accessCode } = req.body;
    if (!to || !guestName) {
      return res.status(400).json({ success: false, error: 'Champs requis : to, guestName' });
    }

    await sendCheckinReminder(to, { guestName, propertyName, checkinTime, accessCode });
    res.json({ success: true, message: 'Rappel check-in envoye' });
  } catch (error) {
    console.error('[EMAIL] Erreur checkin-reminder:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/email/checkout-instructions
// ============================================================================
router.post('/checkout-instructions', async (req, res) => {
  try {
    const { to, guestName, propertyName, checkoutTime, instructions } = req.body;
    if (!to || !guestName) {
      return res.status(400).json({ success: false, error: 'Champs requis : to, guestName' });
    }

    await sendCheckoutInstructions(to, { guestName, propertyName, checkoutTime, instructions });
    res.json({ success: true, message: 'Instructions depart envoyees' });
  } catch (error) {
    console.error('[EMAIL] Erreur checkout-instructions:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/email/review-request
// ============================================================================
router.post('/review-request', async (req, res) => {
  try {
    const { to, guestName, propertyName, reviewUrl } = req.body;
    if (!to || !guestName || !propertyName) {
      return res.status(400).json({ success: false, error: 'Champs requis : to, guestName, propertyName' });
    }

    await sendReviewRequest(to, { guestName, propertyName, reviewUrl });
    res.json({ success: true, message: 'Demande avis envoyee' });
  } catch (error) {
    console.error('[EMAIL] Erreur review-request:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/email/magic-link
// ============================================================================
router.post('/magic-link', async (req, res) => {
  try {
    const { to, token, baseUrl } = req.body;
    if (!to || !token) {
      return res.status(400).json({ success: false, error: 'Champs requis : to, token' });
    }

    await sendMagicLink(to, { token, baseUrl: baseUrl || process.env.FRONTEND_URL });
    res.json({ success: true, message: 'Magic link envoye' });
  } catch (error) {
    console.error('[EMAIL] Erreur magic-link:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur envoi email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
