// VECTRYS Guest Portal — DIVINE LUMINANCE v5.3 Dark Theme
// Black Edition with glass-morphism and gold accents

export const G = {
  // Core backgrounds
  void: '#05080d',
  obsidian: '#0d1220',
  surface: '#121828',
  elevated: '#171e34',

  // Gold accents
  gold: '#d4a853',
  goldLight: '#fcd34d',
  goldDark: '#b8860b',
  goldGradient: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Glass morphism
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.055)',
  glassHover: 'rgba(255,255,255,0.06)',

  // Status colors
  success: '#22c55e',
  successBg: 'rgba(34,197,94,0.12)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.12)',
  info: '#3b82f6',
  infoBg: 'rgba(59,130,246,0.12)',
  warning: '#f59e0b',
  warningBg: 'rgba(245,158,11,0.12)',

  // Radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,

  // Font
  font: "'Inter', 'DM Sans', system-ui, -apple-system, sans-serif",
  fontDisplay: "'Playfair Display', Georgia, serif",
} as const;

// Reusable style objects
export const glassCard: React.CSSProperties = {
  background: G.glass,
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: `1px solid ${G.glassBorder}`,
  borderRadius: G.radiusLg,
};

export const glassCardSm: React.CSSProperties = {
  background: G.glass,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${G.glassBorder}`,
  borderRadius: G.radiusMd,
};

export const goldBadge: React.CSSProperties = {
  background: 'rgba(212,168,83,0.15)',
  color: G.gold,
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
};

export const pageBase: React.CSSProperties = {
  minHeight: '100vh',
  background: G.void,
  fontFamily: G.font,
  color: G.textPrimary,
  paddingBottom: 80, // space for dock nav
};

export const pageHeader: React.CSSProperties = {
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'transparent',
};

export const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${G.glassBorder}`,
  color: G.textSecondary,
  fontSize: 16,
  cursor: 'pointer',
  padding: '8px 12px',
  borderRadius: G.radiusSm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: G.textPrimary,
  margin: '0 0 12px',
  letterSpacing: '0.01em',
};
