import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store';

export default function TermsPage() {
  const navigate = useNavigate();
  const { acceptTerms, isLoading, error } = useAuth();
  const [cgu, setCgu] = useState(false);
  const [cgv, setCgv] = useState(false);
  const [rgpd, setRgpd] = useState(false);

  const allAccepted = cgu && cgv && rgpd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAccepted) return;
    try {
      await acceptTerms(cgu, cgv, rgpd);
      navigate('/');
    } catch {}
  };

  const checkboxStyle = { width: 18, height: 18, cursor: 'pointer', accentColor: '#0f172a' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: '#0f172a' }}>Conditions d'utilisation</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 14 }}>
          Veuillez accepter les conditions pour continuer
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
            <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} style={checkboxStyle} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Conditions Generales d'Utilisation (CGU)</span>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>J'accepte les conditions generales d'utilisation de la plateforme VECTRYS.</p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
            <input type="checkbox" checked={cgv} onChange={(e) => setCgv(e.target.checked)} style={checkboxStyle} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Conditions Generales de Vente (CGV)</span>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>J'accepte les conditions de vente applicables aux services proposes.</p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={rgpd} onChange={(e) => setRgpd(e.target.checked)} style={checkboxStyle} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Protection des donnees (RGPD)</span>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>J'accepte le traitement de mes donnees personnelles conformement a la politique de confidentialite.</p>
            </div>
          </label>

          <button type="submit" disabled={!allAccepted || isLoading}
            style={{ width: '100%', padding: '12px', marginTop: 24, background: allAccepted ? '#0f172a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: allAccepted && !isLoading ? 'pointer' : 'not-allowed' }}>
            {isLoading ? 'Validation...' : 'Accepter et continuer'}
          </button>
        </form>
      </div>
    </div>
  );
}
