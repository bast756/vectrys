// ============================================
// VECTRYS — Auth Service
// Logique métier pour les 4 providers d'auth
// ============================================

import crypto from 'node:crypto';
import prisma from '../config/prisma.js';
import { generateTokenPair } from '../src/utils/jwt.js';

// ─── MAGIC LINK ─────────────────────────────

/**
 * Crée un magic link et retourne le token.
 * L'envoi d'email est géré par le caller (via sendgrid.service.js existant).
 * @param {string} email
 * @returns {Promise<{ token: string, expiresAt: Date }>}
 */
export async function createMagicLink(email) {
  // Invalide les anciens magic links non utilisés
  await prisma.magicLink.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.magicLink.create({
    data: { email, token, expiresAt },
  });

  return { token, expiresAt };
}

/**
 * Vérifie un magic link token et authentifie le guest.
 * Crée le guest si première connexion.
 * @param {string} token
 * @returns {Promise<{ guest: object, accessToken: string, refreshToken: string }>}
 */
export async function verifyMagicLink(token) {
  const link = await prisma.magicLink.findUnique({ where: { token } });

  if (!link) {
    throw new AuthError('Lien invalide', 404);
  }
  if (link.usedAt) {
    throw new AuthError('Lien déjà utilisé', 410);
  }
  if (link.expiresAt < new Date()) {
    throw new AuthError('Lien expiré', 410);
  }

  // Marquer comme utilisé
  await prisma.magicLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  // Trouver ou créer le guest
  let guest = await prisma.guest.findUnique({ where: { email: link.email } });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        email: link.email,
        firstName: '',
        lastName: '',
        authProvider: 'EMAIL_MAGIC_LINK',
      },
    });
  }

  // Générer les tokens
  const tokens = generateTokenPair(guest);

  // Stocker le refresh token
  await prisma.guest.update({
    where: { id: guest.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { guest, ...tokens };
}

// ─── GOOGLE OAUTH ───────────────────────────

/**
 * Authentifie via Google ID token.
 * @param {string} idToken — token reçu du frontend Google Sign-In
 * @returns {Promise<{ guest: object, accessToken: string, refreshToken: string }>}
 */
export async function authenticateGoogle(idToken) {
  // Import dynamique pour ne pas bloquer si non configuré
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AuthError('Google token invalide', 401);
  }

  const { email, given_name, family_name, sub: googleId } = payload;

  let guest = await prisma.guest.findUnique({ where: { email } });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        authProvider: 'GOOGLE',
      },
    });
  }

  const tokens = generateTokenPair(guest);
  await prisma.guest.update({
    where: { id: guest.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { guest, ...tokens };
}

// ─── APPLE SIGN IN ──────────────────────────

/**
 * Authentifie via Apple Identity Token.
 * @param {{ identityToken: string, firstName?: string, lastName?: string }} data
 * @returns {Promise<{ guest: object, accessToken: string, refreshToken: string }>}
 */
export async function authenticateApple({ identityToken, firstName, lastName }) {
  const appleSignin = await import('apple-signin-auth');

  let applePayload;
  try {
    applePayload = await appleSignin.default.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });
  } catch {
    throw new AuthError('Apple token invalide', 401);
  }

  const { email, sub: appleId } = applePayload;

  let guest = email
    ? await prisma.guest.findUnique({ where: { email } })
    : null;

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        email: email || null,
        firstName: firstName || '',
        lastName: lastName || '',
        authProvider: 'APPLE',
      },
    });
  }

  const tokens = generateTokenPair(guest);
  await prisma.guest.update({
    where: { id: guest.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { guest, ...tokens };
}

// ─── RESERVATION CODE ───────────────────────

/**
 * Authentifie via code de réservation + nom de famille.
 * @param {{ code: string, lastName: string }} data
 * @returns {Promise<{ guest: object, reservation: object, accessToken: string, refreshToken: string }>}
 */
export async function authenticateByReservationCode({ code, lastName }) {
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: {
      guest: true,
      property: {
        select: { id: true, name: true },
      },
    },
  });

  if (!reservation) {
    throw new AuthError('Code réservation introuvable', 404);
  }

  // Vérifier le nom de famille (insensible à la casse)
  if (reservation.guest.lastName.toLowerCase() !== lastName.toLowerCase()) {
    throw new AuthError('Nom de famille incorrect', 401);
  }

  // Vérifier que la réservation est active
  if (reservation.status === 'CANCELLED') {
    throw new AuthError('Réservation annulée', 403);
  }

  const guest = reservation.guest;
  const tokens = generateTokenPair(guest);

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      refreshToken: tokens.refreshToken,
      authProvider: 'RESERVATION_CODE',
    },
  });

  return { guest, reservation, ...tokens };
}

// ─── REFRESH & LOGOUT ───────────────────────

/**
 * Rafraîchit la paire de tokens via le refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export async function refreshTokens(refreshToken) {
  const { verifyRefreshToken } = await import('../src/utils/jwt.js');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Refresh token invalide', 401);
  }

  const guest = await prisma.guest.findUnique({ where: { id: payload.sub } });

  if (!guest || guest.refreshToken !== refreshToken) {
    throw new AuthError('Refresh token révoqué', 401);
  }

  const tokens = generateTokenPair(guest);

  await prisma.guest.update({
    where: { id: guest.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return tokens;
}

/**
 * Déconnexion — invalide le refresh token.
 * @param {string} guestId
 */
export async function logout(guestId) {
  await prisma.guest.update({
    where: { id: guestId },
    data: { refreshToken: null },
  });
}

/**
 * Enregistre l'acceptation des CGU et RGPD.
 * @param {string} guestId
 * @returns {Promise<object>}
 */
export async function acceptLegal(guestId) {
  return prisma.guest.update({
    where: { id: guestId },
    data: { legalAcceptedAt: new Date() },
  });
}

// ─── ERROR CLASS ────────────────────────────

export class AuthError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
