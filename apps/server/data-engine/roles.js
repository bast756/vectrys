// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE — Rôles & Permissions internes
// ═══════════════════════════════════════════════════════════════════

/**
 * Rôles ayant accès au Data Engine et au Command Center.
 * AUCUN rôle client (guest, owner, partner) ne doit être ici.
 */
export const INTERNAL_ROLES = ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'];

/**
 * Permissions granulaires par sous-module.
 */
export const DATA_ENGINE_PERMISSIONS = {
  // Classification IA
  'data-engine:classify':         ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],
  'data-engine:classify:auto':    ['ADMIN', 'CTO'],

  // Anonymisation
  'data-engine:anonymize':        ['ADMIN', 'INTERNAL_DATA', 'CTO'],
  'data-engine:anonymize:config': ['ADMIN', 'CTO'],

  // Pricing & Marketplace
  'data-engine:pricing':          ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],
  'data-engine:pricing:subscribe':['ADMIN'],
  'data-engine:products':         ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],

  // Analytics
  'data-engine:analytics':        ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],
  'data-engine:insights':         ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],

  // Compliance & Audit (le plus sensible)
  'data-engine:compliance':       ['ADMIN', 'CTO', 'CEO'],
  'data-engine:audit':            ['ADMIN', 'CEO'],

  // Command Center (dashboard complet)
  'command-center:view':          ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'],
  'command-center:export':        ['ADMIN', 'CEO'],
};

export function hasPermission(userRole, permission) {
  const allowed = DATA_ENGINE_PERMISSIONS[permission];
  return allowed ? allowed.includes(userRole) : false;
}

export function isInternalUser(userRole) {
  return INTERNAL_ROLES.includes(userRole);
}
