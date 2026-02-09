/**
 * VECTRYS — Rate limiter par route (en memoire)
 *
 * Complement au rate limiter global express-rate-limit.
 * Utile pour proteger les endpoints sensibles (email, notifications)
 * avec des limites specifiques.
 *
 * @version 1.0.0
 */

const store = new Map();

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store) {
    if (now > data.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

export function createRateLimiter(windowMs = 60000, maxRequests = 30) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: 'Trop de requetes',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}
