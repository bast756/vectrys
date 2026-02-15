// ============================================================================
// VECTRYS — Employee Layout
// Dark sidebar + top bar with DIVINE LUMINANCE theme
// Avatar, matricule, profile link
// ============================================================================

import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store';
import { useScreenshotDetection } from '@/hooks/useScreenshotDetection';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828', elevated: '#171e34',
  hover: '#1c2440', glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  gradient: { gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  ceo: { label: 'CEO', color: '#d4a853' },
  manager: { label: 'Manager', color: '#06b6d4' },
  employee: { label: 'Employe', color: '#10b981' },
};

interface NavItem { to: string; label: string; ceoOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { to: '/employee/dashboard', label: 'Dashboard' },
  { to: '/employee/calls', label: 'Call Assistant' },
  { to: '/employee/crm', label: 'CRM' },
  { to: '/employee/notes', label: 'Notes' },
  { to: '/employee/gantt', label: 'Gantt' },
  { to: '/employee/pointage', label: 'Pointage' },
  { to: '/employee/planning', label: 'Planning', ceoOnly: true },
  { to: '/employee/profile', label: 'Mon Profil' },
  { to: '/employee/security-alerts', label: 'Alertes Securite', ceoOnly: true },
];

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const { employee, isEmployeeAuthenticated, fetchEmployeeMe, employeeLogout, unreadAlertCount, fetchUnreadAlertCount } = useEmployeeStore();

  // Screenshot detection — active for all employees
  useScreenshotDetection();

  useEffect(() => {
    if (!isEmployeeAuthenticated) {
      fetchEmployeeMe().catch(() => navigate('/employee/login'));
    }
  }, []);

  // CEO: poll unread alert count
  useEffect(() => {
    if (employee?.role === 'ceo') {
      fetchUnreadAlertCount();
      const interval = setInterval(fetchUnreadAlertCount, 30000);
      return () => clearInterval(interval);
    }
  }, [employee?.role]);

  if (!isEmployeeAuthenticated || !employee) return null;

  const role = employee.role || 'employee';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.employee;
  const avatarUrl = employee.avatar_url ? `${API_BASE}${employee.avatar_url}` : null;
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DL.void, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: DL.obsidian, borderRight: `1px solid ${DL.glassBorder}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${DL.glassBorder}` }}>
          <img src="/brand/logo-horizontal-dark.png" alt="VECTRYS" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        {/* Employee identity card */}
        <NavLink to="/employee/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '16px 14px', borderBottom: `1px solid ${DL.glassBorder}`,
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : DL.elevated,
              border: `2px solid ${DL.gold400}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: DL.gold400, flexShrink: 0,
              overflow: 'hidden',
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: DL.text.primary, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employee.first_name} {employee.last_name}
              </div>
              <div style={{ fontSize: 10, color: DL.gold400, fontWeight: 600, letterSpacing: 1 }}>
                {employee.matricule}
              </div>
            </div>
          </div>
        </NavLink>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS
            .filter(item => !item.ceoOnly || role === 'ceo')
            .map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  color: isActive ? DL.gold400 : DL.text.secondary,
                  background: isActive ? `${DL.gold400}12` : 'transparent',
                  marginBottom: 2, transition: 'all 0.2s',
                })}
              >
                <span>{item.label}</span>
                {item.to === '/employee/security-alerts' && unreadAlertCount > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                    borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>{unreadAlertCount}</span>
                )}
              </NavLink>
            ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 14px', borderTop: `1px solid ${DL.glassBorder}`,
          fontSize: 10, color: DL.text.muted, letterSpacing: 0.5,
        }}>
          DIVINE LUMINANCE v5.3
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 56, background: DL.surface,
          borderBottom: `1px solid ${DL.glassBorder}`,
        }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Role badge */}
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: `${badge.color}15`, color: badge.color,
              border: `1px solid ${badge.color}30`, letterSpacing: 0.5,
            }}>{badge.label}</span>

            {/* Name */}
            <span style={{ fontSize: 13, color: DL.text.primary, fontWeight: 500 }}>
              {employee.first_name} {employee.last_name}
            </span>

            {/* Matricule */}
            <span style={{ fontSize: 11, color: DL.gold400, fontWeight: 600 }}>
              {employee.matricule}
            </span>

            {/* Logout */}
            <button
              onClick={() => { employeeLogout(); navigate('/employee/login'); }}
              style={{
                padding: '6px 12px', background: 'transparent', color: DL.text.muted,
                border: `1px solid ${DL.glassBorder}`, borderRadius: 6, fontSize: 11,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Deconnexion
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
