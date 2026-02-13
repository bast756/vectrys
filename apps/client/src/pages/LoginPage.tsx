import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithBookingCode, loginWithGoogle, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'email' | 'booking'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bookingCode, setBookingCode] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch {}
  };

  const handleBookingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithBookingCode(bookingCode);
      navigate('/terms');
    } catch {}
  };

  const handleGoogleLogin = async () => {
    // Google OAuth flow - redirect to Google, then handle callback
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
    window.location.href = url;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: '#0f172a' }}>VECTRYS</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 14 }}>Guest Portal</p>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => { setMode('email'); clearError(); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: mode === 'email' ? '#0f172a' : '#fff',
              color: mode === 'email' ? '#fff' : '#64748b' }}
          >
            Email
          </button>
          <button
            onClick={() => { setMode('booking'); clearError(); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: mode === 'booking' ? '#0f172a' : '#fff',
              color: mode === 'booking' ? '#fff' : '#64748b' }}
          >
            Code de reservation
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {mode === 'email' ? (
          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBookingLogin}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Code de reservation</label>
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                required
                placeholder="ABC123"
                maxLength={10}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 18, fontWeight: 600, textAlign: 'center', letterSpacing: 4, outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Entrez le code recu par email ou SMS</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Verification...' : 'Acceder a ma reservation'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {/* Social Login */}
        <button
          onClick={handleGoogleLogin}
          style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#374151' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 24 }}>
          Pas encore de compte ? <Link to="/register" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>Creer un compte</Link>
        </p>
      </div>
    </div>
  );
}
