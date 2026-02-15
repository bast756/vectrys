// ============================================
// VECTRYS — Auth Routes
// POST /api/auth/*
// ============================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  validate,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  googleAuthSchema,
  appleAuthSchema,
  reservationCodeSchema,
  legalAcceptSchema,
  refreshTokenSchema,
} from '../middleware/validate.js';
import {
  createMagicLink,
  verifyMagicLink,
  authenticateGoogle,
  authenticateApple,
  authenticateByReservationCode,
  refreshTokens,
  logout,
  acceptLegal,
  AuthError,
} from '../services/auth.service.js';
import { sendMagicLink } from '../services/sendgrid.service.js';

const router = Router();

// ─── Helpers ────────────────────────────────

/** Format standard de la réponse auth */
function authResponse(res, { guest, accessToken, refreshToken, reservation }) {
  return res.json({
    guest: {
      id: guest.id,
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName,
      language: guest.language,
      legalAccepted: !!guest.legalAcceptedAt,
    },
    accessToken,
    refreshToken,
    ...(reservation && {
      reservation: {
        id: reservation.id,
        code: reservation.code,
        propertyName: reservation.property?.name,
      },
    }),
  });
}

/** Handler d'erreur auth centralisé */
function handleAuthError(res, err) {
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('[Auth Error]', err);
  return res.status(500).json({ error: 'Erreur interne' });
}

// ─── MAGIC LINK ─────────────────────────────

/**
 * POST /api/auth/magic-link
 * Envoie un magic link par email
 */
router.post('/magic-link', validate(magicLinkRequestSchema), async (req, res) => {
  try {
    const { email } = req.validated;
    const { token, expiresAt } = await createMagicLink(email);

    // Envoyer le magic link via SendGrid
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendMagicLink(email, { token, baseUrl });

    // En dev, on renvoie le token pour tester
    const response = { message: 'Magic link envoyé', expiresAt };
    if (process.env.NODE_ENV === 'development') {
      response.debug = { token };
    }

    return res.json(response);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

/**
 * POST /api/auth/magic-link/verify
 * Vérifie le token du magic link
 */
router.post('/magic-link/verify', validate(magicLinkVerifySchema), async (req, res) => {
  try {
    const result = await verifyMagicLink(req.validated.token);
    return authResponse(res, result);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── GOOGLE ─────────────────────────────────

/**
 * POST /api/auth/google
 * Auth via Google OAuth id_token
 */
router.post('/google', validate(googleAuthSchema), async (req, res) => {
  try {
    const result = await authenticateGoogle(req.validated.idToken);
    return authResponse(res, result);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── APPLE ──────────────────────────────────

/**
 * POST /api/auth/apple
 * Auth via Apple Sign In identity token
 */
router.post('/apple', validate(appleAuthSchema), async (req, res) => {
  try {
    const result = await authenticateApple(req.validated);
    return authResponse(res, result);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── RESERVATION CODE ───────────────────────

/**
 * POST /api/auth/reservation-code
 * Auth via code de réservation + nom de famille
 */
router.post('/reservation-code', validate(reservationCodeSchema), async (req, res) => {
  try {
    const result = await authenticateByReservationCode(req.validated);
    return authResponse(res, result);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// Alias for frontend compatibility (returns format expected by Zustand store)
router.post('/booking-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code requis' });

    // Find reservation by code
    const reservation = await import('../config/prisma.js').then(m => m.default).then(prisma =>
      prisma.reservation.findUnique({
        where: { code: code.toUpperCase().trim() },
        include: { guest: true, property: { select: { id: true, name: true } } },
      })
    );

    if (!reservation) return res.status(404).json({ error: 'Code reservation introuvable' });
    if (reservation.status === 'CANCELLED') return res.status(403).json({ error: 'Reservation annulee' });

    const guest = reservation.guest;
    const { generateTokenPair } = await import('../src/utils/jwt.js');
    const tokens = generateTokenPair(guest);

    const prisma = (await import('../config/prisma.js')).default;
    await prisma.guest.update({
      where: { id: guest.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: guest.id,
          email: guest.email,
          first_name: guest.firstName,
          last_name: guest.lastName,
          lang: guest.language || 'fr',
          role: 'guest',
          terms_accepted: !!guest.legalAcceptedAt,
        },
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: 900,
        },
      },
    });
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── REFRESH TOKEN ──────────────────────────

/**
 * POST /api/auth/refresh
 * Rafraîchit la paire de tokens JWT
 */
router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    const tokens = await refreshTokens(req.validated.refreshToken);
    return res.json(tokens);
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── LOGOUT ─────────────────────────────────

/**
 * POST /api/auth/logout
 * Invalide le refresh token
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await logout(req.guest.id);
    return res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── LEGAL ACCEPTANCE ───────────────────────

/**
 * POST /api/auth/legal-accept
 * Enregistre l'acceptation CGU + RGPD
 */
router.post('/legal-accept', requireAuth, validate(legalAcceptSchema), async (req, res) => {
  try {
    const guest = await acceptLegal(req.guest.id);
    return res.json({
      message: 'CGU et RGPD acceptées',
      legalAcceptedAt: guest.legalAcceptedAt,
    });
  } catch (err) {
    return handleAuthError(res, err);
  }
});

// ─── PROFILE ────────────────────────────────

/**
 * GET /api/auth/me
 * Retourne le profil du guest connecté
 */
router.get('/me', requireAuth, async (req, res) => {
  return res.json({
    guest: {
      id: req.guest.id,
      email: req.guest.email,
      firstName: req.guest.firstName,
      lastName: req.guest.lastName,
      language: req.guest.language,
      legalAccepted: !!req.guest.legalAcceptedAt,
    },
  });
});

export default router;
