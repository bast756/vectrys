import { ReactNode, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
// INTERNAL GUARD — Bloque l'accès au Command Center pour les
// utilisateurs non-habilités (voyageurs, owners, partenaires)
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_ROLES = ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'];

interface InternalGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

export default function InternalGuard({ children, fallbackPath = '/' }: InternalGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        window.location.href = fallbackPath;
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || payload.user_metadata?.role || '';

      if (ALLOWED_ROLES.includes(userRole)) {
        setAuthorized(true);
      } else {
        console.warn('[SECURITY] Tentative accès Command Center — rôle:', userRole);
        window.location.href = fallbackPath;
      }
    } catch {
      window.location.href = fallbackPath;
    }
  }, [fallbackPath]);

  if (authorized === null) return null;
  if (!authorized) return null;

  return <>{children}</>;
}
