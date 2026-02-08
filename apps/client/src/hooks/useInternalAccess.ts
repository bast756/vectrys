import { useMemo } from 'react';

const INTERNAL_ROLES = ['ADMIN', 'INTERNAL_DATA', 'CTO', 'CEO'];

/**
 * Hook qui retourne si l'utilisateur courant a accès aux outils internes.
 * Utilise-le pour afficher/masquer le lien "Command Center" dans le menu.
 */
export function useInternalAccess(): { hasAccess: boolean; role: string | null } {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return { hasAccess: false, role: null };

      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload.user_metadata?.role || '';
      return { hasAccess: INTERNAL_ROLES.includes(role), role };
    } catch {
      return { hasAccess: false, role: null };
    }
  }, []);
}
