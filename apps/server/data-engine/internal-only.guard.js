// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE — Middleware RBAC + Audit d'accès
//
// Ces données sont la propriété exclusive de VECTRYS.
// Elles ne doivent JAMAIS être exposées publiquement, partagées avec
// des tiers, ou accessibles en dehors des rôles internes autorisés.
// ═══════════════════════════════════════════════════════════════════

import { isInternalUser, hasPermission } from './roles.js';

/**
 * Middleware de base : vérifie que l'utilisateur est authentifié ET interne.
 * Bloque TOUT accès externe — même authentifié (voyageurs, owners, partners).
 *
 * Couches de sécurité :
 * 1. Authentification requise (JWT)
 * 2. Rôle interne obligatoire (ADMIN, INTERNAL_DATA, CTO, CEO)
 * 3. Retourne 404 (pas 403) pour masquer l'existence des routes
 * 4. Headers anti-cache + no-index sur toutes les réponses
 * 5. Audit trail de chaque accès
 *
 * Usage : app.use('/api/v1/internal/data-engine', internalOnly, routes);
 */
export function internalOnly(req, res, next) {
  const user = req.user;

  // 1. Pas authentifié → 401
  if (!user) {
    res.status(401).json({
      error: 'Authentification requise',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  // 2. Pas un rôle interne → 404 (ne révèle pas l'existence de la route)
  if (!isInternalUser(user.role)) {
    console.warn(`[SECURITY] Accès refusé Data Engine — user=${user.id} role=${user.role} path=${req.path} ip=${req.ip}`);
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // 3. Headers de protection — empêche le caching et l'indexation
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });

  // 4. Log d'audit de l'accès (non-bloquant)
  logInternalAccess(user, req).catch(() => {});

  next();
}

/**
 * Middleware granulaire : vérifie une permission spécifique.
 *
 * Usage : router.post('/classify', requirePermission('data-engine:classify'), handler);
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !hasPermission(user.role, permission)) {
      console.warn(`[SECURITY] Permission refusée — user=${user?.id} role=${user?.role} perm=${permission} path=${req.path}`);
      res.status(403).json({
        error: 'Permission insuffisante',
        code: 'FORBIDDEN',
        required: permission,
      });
      return;
    }

    next();
  };
}

/**
 * Log chaque accès au Data Engine dans l'audit trail.
 * Non-bloquant — ne ralentit pas la requête.
 */
async function logInternalAccess(user, req) {
  try {
    console.log(`[AUDIT] Data Engine — ${user.role}:${user.id} ${req.method} ${req.originalUrl}`);
  } catch (err) {
    console.error('[AUDIT] Erreur log accès:', err);
  }
}

/**
 * Middleware de rate limiting renforcé pour les routes sensibles (export, audit).
 * Limite à 5 requêtes par minute pour les exports.
 */
const sensitiveRateLimit = new Map();

export function sensitiveRateLimiter(req, res, next) {
  const user = req.user;
  if (!user) { next(); return; }

  const key = `sensitive:${user.id}`;
  const now = Date.now();
  let entry = sensitiveRateLimit.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    sensitiveRateLimit.set(key, entry);
  }

  entry.count++;
  if (entry.count > 5) {
    res.status(429).json({ error: 'Trop de requêtes sur endpoint sensible. Réessayez dans 1 minute.' });
    return;
  }

  next();
}
