// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE — IP Whitelist optionnelle
// ═══════════════════════════════════════════════════════════════════

/**
 * Optionnel : restreindre l'accès au Data Engine à certaines IPs.
 * Si INTERNAL_ALLOWED_IPS n'est pas défini, le middleware laisse passer.
 * Format : IPs séparées par virgule dans la variable d'env.
 */
export function ipWhitelist(req, res, next) {
  const allowedIPs = process.env.INTERNAL_ALLOWED_IPS;

  // Si pas configuré, skip (sécurité par RBAC uniquement)
  if (!allowedIPs) {
    next();
    return;
  }

  const allowed = allowedIPs.split(',').map(ip => ip.trim());
  const clientIP = req.ip || req.socket.remoteAddress || '';

  if (!allowed.includes(clientIP) && !allowed.includes('*')) {
    console.warn(`[SECURITY] IP refusée Data Engine — ip=${clientIP} path=${req.path}`);
    res.status(404).json({ error: 'Not found' });
    return;
  }

  next();
}
