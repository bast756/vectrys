// ============================================================================
// VECTRYS — Employee Auth Middleware
// JWT validation + role-based access control for employee dashboard
// ============================================================================

import employeeAuthService from '../services/employee-auth.service.js';
import prisma from '../config/prisma.js';

/**
 * Middleware: requires valid employee JWT.
 * Attaches employee to req.employee.
 * Updates last_activity for session persistence tracking.
 */
export async function requireEmployee(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token employé requis' });
    }

    const token = header.split(' ')[1];
    const payload = employeeAuthService.verifyEmployeeAccessToken(token);

    const employee = await employeeAuthService.getEmployeeById(payload.sub);
    if (!employee || !employee.active) {
      return res.status(401).json({ error: 'Employé non trouvé ou inactif' });
    }

    // Check if account is locked for inactivity
    if (employee.locked_at) {
      return res.status(403).json({
        error: 'Compte verrouillé pour inactivité (30 jours). Contactez votre administrateur.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Update last_activity (throttled: max once per 5 minutes to avoid DB spam)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!employee.last_activity || new Date(employee.last_activity) < fiveMinAgo) {
      prisma.employee.update({
        where: { id: employee.id },
        data: { last_activity: new Date() },
      }).catch(() => {}); // Fire-and-forget, don't block the request
    }

    req.employee = employee;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
}

/**
 * Middleware: requires one of the specified roles.
 * Must be used AFTER requireEmployee.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({ error: 'Accès refusé — rôle insuffisant' });
    }
    next();
  };
}

/**
 * Shortcut: CEO only access
 */
export const requireCEO = requireRole('ceo');
