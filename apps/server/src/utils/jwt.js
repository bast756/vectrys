// ============================================
// VECTRYS — JWT Utilities
// Access token (15min) + Refresh token (30j)
// ============================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans .env');
}

/**
 * Génère un access token (courte durée)
 * @param {{ sub: string, email?: string, provider: string }} payload
 * @returns {string}
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Génère un refresh token (longue durée)
 * @param {{ sub: string }} payload
 * @returns {string}
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

/**
 * Vérifie un access token
 * @param {string} token
 * @returns {object}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Vérifie un refresh token
 * @param {string} token
 * @returns {object}
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Génère la paire access + refresh
 * @param {{ id: string, email?: string, authProvider: string }} guest
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateTokenPair(guest) {
  const accessToken = generateAccessToken({
    sub: guest.id,
    email: guest.email,
    provider: guest.authProvider,
  });
  const refreshToken = generateRefreshToken({ sub: guest.id });
  return { accessToken, refreshToken };
}
