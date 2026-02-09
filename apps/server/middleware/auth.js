// ============================================
// VECTRYS — Auth Middleware
// Vérifie le JWT et attache le guest à req
// ============================================

import prisma from '../config/prisma.js';
import { verifyAccessToken } from '../src/utils/jwt.js';

/**
 * Middleware d'authentification obligatoire.
 * Vérifie le Bearer token, charge le guest, vérifie l'acceptation légale.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requis' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);

    const guest = await prisma.guest.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        language: true,
        authProvider: true,
        legalAcceptedAt: true,
      },
    });

    if (!guest) {
      return res.status(401).json({ error: 'Guest non trouvé' });
    }

    req.guest = guest;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
}

/**
 * Middleware qui vérifie que le guest a accepté les CGU/RGPD.
 * À utiliser APRÈS requireAuth sur les routes protégées.
 */
export async function requireLegalAcceptance(req, res, next) {
  if (!req.guest?.legalAcceptedAt) {
    return res.status(403).json({
      error: 'Acceptation des CGU et politique RGPD requise',
      code: 'LEGAL_NOT_ACCEPTED',
    });
  }
  next();
}

/**
 * Middleware d'authentification optionnelle.
 * Si un token valide est présent, attache le guest. Sinon, continue.
 */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);

    req.guest = await prisma.guest.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, firstName: true, lastName: true, language: true },
    });
  } catch {
    // Token invalide → on continue sans auth
  }
  next();
}
