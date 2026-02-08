/**
 * VECTRYS — Routes SMS avec intégration FATE
 *
 * Endpoints API pour l'envoi et la gestion des SMS :
 * - Envoi simple, template, FATE (détection automatique)
 * - OTP (public), envoi groupé
 * - Statuts, historique, stats, dashboard
 * - Webhook Twilio (public, validé par signature)
 *
 * @version 2.0.0
 */

import express from 'express';
import smsController from '../controllers/sms.controller.js';

const router = express.Router();

// ============================================
// 🔐 MIDDLEWARE AUTH (placeholder)
// À remplacer par votre middleware JWT quand prêt
// ============================================

/**
 * Middleware d'authentification temporaire
 * TODO: Remplacer par le vrai middleware JWT/auth
 */
const requireAuth = (req, res, next) => {
  // En développement : pas de vérification
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // En production : vérifier le header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      erreur: 'Authentification requise',
      code: 'AUTH_REQUISE'
    });
  }

  // TODO: Vérifier le JWT ici
  next();
};

/**
 * Middleware admin (placeholder)
 * TODO: Vérifier le rôle admin dans le JWT
 */
const requireAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // TODO: Vérifier req.user.role === 'admin'
  next();
};

// ============================================
// 📤 ROUTES ENVOI SMS
// ============================================

/**
 * @route   POST /api/sms/send
 * @desc    Envoi SMS simple
 * @access  Admin uniquement
 * @body    { to: string, message: string }
 */
router.post('/send', requireAuth, requireAdmin, (req, res) => smsController.sendSMS(req, res));

/**
 * @route   POST /api/sms/template
 * @desc    Envoi SMS avec template (sélection manuelle profil FATE)
 * @access  Admin uniquement
 * @body    { to: string, templateName: string, variables: object, fateProfile?: string }
 */
router.post('/template', requireAuth, requireAdmin, (req, res) => smsController.sendTemplatedSMS(req, res));

/**
 * @route   POST /api/sms/fate
 * @desc    🆕 Envoi SMS avec détection automatique profil FATE
 * @access  Admin uniquement
 * @body    { to: string, templateName: string, variables: object, bookingData: object }
 */
router.post('/fate', requireAuth, requireAdmin, (req, res) => smsController.sendFATESMS(req, res));

/**
 * @route   POST /api/sms/otp
 * @desc    Envoi code OTP (pas de personnalisation FATE)
 * @access  Public (rate limité)
 * @body    { phoneNumber: string, code: string, expirationMinutes?: number }
 */
router.post('/otp', (req, res) => smsController.sendOTP(req, res));

// ============================================
// 📤 ROUTES ENVOI GROUPÉ
// ============================================

/**
 * @route   POST /api/sms/bulk
 * @desc    Envoi groupé de SMS simples
 * @access  Admin uniquement
 * @body    { recipients: array, message: string }
 */
router.post('/bulk', requireAuth, requireAdmin, (req, res) => smsController.sendBulkSMS(req, res));

/**
 * @route   POST /api/sms/bulk/fate
 * @desc    🆕 Envoi groupé avec détection FATE par booking
 * @access  Admin uniquement
 * @body    { bookings: array, templateName: string }
 */
router.post('/bulk/fate', requireAuth, requireAdmin, (req, res) => smsController.sendBulkFATESMS(req, res));

// ============================================
// 📊 ROUTES CONSULTATION
// ============================================

/**
 * @route   GET /api/sms/status/:messageSid
 * @desc    Vérifier le statut d'un SMS via Twilio
 * @access  Authentifié
 * @params  messageSid — SID Twilio du message
 */
router.get('/status/:messageSid', requireAuth, (req, res) => smsController.checkStatus(req, res));

/**
 * @route   GET /api/sms/history
 * @desc    Historique des SMS avec filtres
 * @access  Authentifié
 * @query   destinataire, statut, type, dateDebut, dateFin, page, limit
 */
router.get('/history', requireAuth, (req, res) => smsController.getHistory(req, res));

/**
 * @route   GET /api/sms/stats
 * @desc    Statistiques globales SMS
 * @access  Authentifié
 * @query   period (day, week, month)
 */
router.get('/stats', requireAuth, (req, res) => smsController.getStats(req, res));

/**
 * @route   GET /api/sms/stats/fate
 * @desc    🆕 Statistiques par profil FATE
 * @access  Authentifié
 * @query   period (day, week, month)
 */
router.get('/stats/fate', requireAuth, (req, res) => smsController.getFATEStats(req, res));

/**
 * @route   GET /api/sms/dashboard
 * @desc    Dashboard complet SMS + FATE + templates
 * @access  Authentifié
 * @query   period (day, week, month)
 */
router.get('/dashboard', requireAuth, (req, res) => smsController.getDashboard(req, res));

// ============================================
// 🔔 WEBHOOKS
// ============================================

/**
 * @route   POST /api/webhooks/twilio
 * @desc    Webhook de statut Twilio (livraison/échec)
 * @access  Public (validé par signature Twilio via middleware)
 * @body    { MessageSid, MessageStatus, ErrorCode?, ErrorMessage? }
 */
router.post('/webhooks/twilio', (req, res) => smsController.twilioWebhook(req, res));

export default router;
