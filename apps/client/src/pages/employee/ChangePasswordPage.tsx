// ============================================================================
// VECTRYS — Change Password Page (First login with temp password)
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  gradient: { gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)' },
};

const inputStyle = {
  width: '100%', padding: '14px 16px', background: DL.obsidian,
  border: `1px solid ${DL.glassBorder}`, borderRadius: 10,
  color: DL.text.primary, fontSize: 14, outline: 'none',
  boxSizing: 'border-box' as const, marginBottom: 12,
  fontFamily: "'DM Sans', sans-serif",
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { employee, changePassword } = useEmployeeStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await changePassword(currentPassword, newPassword);
      const emp = useEmployeeStore.getState().employee;
      if (emp && !emp.nda_accepted_at) {
        navigate('/employee/nda');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors du changement de mot de passe');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: DL.void, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: DL.surface, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 20, padding: '48px 40px', width: 420, textAlign: 'center',
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 28, fontWeight: 800, letterSpacing: 6,
            background: DL.gradient.gold,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>VECTRYS</span>
        </div>
        <p style={{ fontSize: 14, color: DL.text.secondary, margin: '0 0 8px' }}>
          Changement de mot de passe
        </p>

        {employee?.temp_password && (
          <div style={{
            background: `${DL.gold400}10`, border: `1px solid ${DL.gold400}25`,
            borderRadius: 10, padding: 12, marginBottom: 24,
          }}>
            <p style={{ fontSize: 12, color: DL.gold400, margin: 0 }}>
              Votre mot de passe est temporaire. Vous devez le changer avant de continuer.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
            placeholder="Mot de passe actuel (temporaire)"
            autoFocus
            style={inputStyle}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            placeholder="Nouveau mot de passe (min. 8 caracteres)"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            placeholder="Confirmer le nouveau mot de passe"
            style={inputStyle}
          />

          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 0', background: DL.gradient.gold,
            color: DL.void, border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
