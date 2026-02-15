// ============================================================================
// VECTRYS — Forgot Password Page
// Step 1: Enter email → Step 2: Enter OTP + new password
// ============================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useEmployeeStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSuccess('Si un compte existe avec cet email, un code de verification a ete envoye.');
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de l\'envoi');
    }
    setLoading(false);
  };

  const handleStep2 = async (e: React.FormEvent) => {
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
      await resetPassword(email, code, newPassword);
      setSuccess('Mot de passe reinitialise avec succes !');
      setTimeout(() => navigate('/employee/login'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Code invalide ou expire');
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
          <img src="/brand/logo-stacked-white.png" alt="VECTRYS" style={{ height: 64, objectFit: 'contain' }} />
        </div>
        <p style={{ fontSize: 14, color: DL.text.secondary, margin: '0 0 32px' }}>
          Reinitialisation du mot de passe
        </p>

        {step === 1 ? (
          <form onSubmit={handleStep1}>
            <p style={{ fontSize: 13, color: DL.text.muted, marginBottom: 16, textAlign: 'left' }}>
              Entrez l'adresse email associee a votre compte. Un code de verification vous sera envoye.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Adresse email"
              autoFocus
              style={inputStyle}
            />

            {error && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: '#10b981', margin: '0 0 12px' }}>{success}</p>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px 0', background: DL.gradient.gold,
              color: DL.void, border: 'none', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2}>
            <p style={{ fontSize: 13, color: DL.text.muted, marginBottom: 16, textAlign: 'left' }}>
              Entrez le code de verification recu par email et votre nouveau mot de passe.
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              placeholder="Code de verification (6 chiffres)"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              style={inputStyle}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              placeholder="Nouveau mot de passe"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Confirmer le mot de passe"
              style={inputStyle}
            />

            {error && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: '#10b981', margin: '0 0 12px' }}>{success}</p>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px 0', background: DL.gradient.gold,
              color: DL.void, border: 'none', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <Link to="/employee/login" style={{
          display: 'block', fontSize: 12, color: DL.gold400,
          marginTop: 20, textDecoration: 'none',
        }}>
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}
