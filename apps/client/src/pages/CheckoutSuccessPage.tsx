import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/store';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { fetchSubscription } = useSubscription();

  useEffect(() => {
    fetchSubscription();
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', background: '#05080d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Bienvenue chez VECTRYS !</h1>
        <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
          Votre abonnement est actif. Vous disposez de 14 jours d'essai gratuit pour découvrir toutes les fonctionnalités.
        </p>

        <div style={{ background: '#0d1220', borderRadius: 16, padding: 24, marginBottom: 32, border: '1px solid rgba(255,255,255,0.055)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#d4a853' }}>Prochaines étapes</h3>
          <div style={{ textAlign: 'left' }}>
            {[
              { step: '1', text: 'Configurez votre première propriété' },
              { step: '2', text: 'Invitez votre équipe de ménage' },
              { step: '3', text: 'Connectez vos calendriers Airbnb/Booking' },
              { step: '4', text: 'Lancez votre première vérification CleanCheck' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,168,83,0.15)', color: '#d4a853', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{step}</div>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/employee/dashboard')}
            style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', color: '#05080d', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Accéder au dashboard →
          </button>
          <button
            onClick={() => navigate('/subscription')}
            style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            Mon abonnement
          </button>
        </div>
      </div>
    </div>
  );
}
