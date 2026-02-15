import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/store';

const PLAN_DATA = [
  {
    id: 'starter' as const,
    name: 'Starter',
    subtitle: 'Pour les propriétaires individuels',
    monthlyPrice: 49,
    yearlyPrice: 470,
    popular: false,
    features: [
      'Jusqu\'à 5 propriétés',
      '50 vérifications CleanCheck / mois',
      '100 réponses IA / mois',
      'Synchronisation calendrier iCal',
      'Portail voyageur',
      'Support par email',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    subtitle: 'Pour les conciergeries',
    monthlyPrice: 99,
    yearlyPrice: 950,
    popular: true,
    features: [
      'Jusqu\'à 25 propriétés',
      '500 vérifications CleanCheck / mois',
      '1 000 réponses IA / mois',
      'Synchronisation multi-canal',
      'Tarification dynamique IA',
      'Analytics avancés',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    subtitle: 'Pour les groupes hôteliers',
    monthlyPrice: 399,
    yearlyPrice: 3830,
    popular: false,
    features: [
      'Propriétés illimitées',
      'Vérifications illimitées',
      'Réponses IA illimitées',
      'Tout Pro inclus',
      'White-label complet',
      'API dédiée',
      'Account manager',
      'SLA garanti 99.9%',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const cancelled = searchParams.get('cancelled');

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    await startCheckout(planId, interval);
    setLoading(null);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', background: '#05080d', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <img onClick={() => navigate('/landing')} src="/brand/logo-horizontal-dark.png" alt="VECTRYS" style={{ height: 32, objectFit: 'contain', cursor: 'pointer' }} />
        <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>Connexion</button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px' }}>
        {cancelled && (
          <div style={{ padding: '12px 20px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 8, color: '#fb923c', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
            Paiement annulé. Vous pouvez réessayer quand vous voulez.
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 12 }}>Choisissez votre plan</h1>
          <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 32 }}>14 jours d'essai gratuit sur tous les plans. Sans carte bancaire.</p>

          {/* Toggle Monthly/Yearly */}
          <div style={{ display: 'inline-flex', background: '#0d1220', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.055)' }}>
            <button
              onClick={() => setInterval('monthly')}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: interval === 'monthly' ? 'linear-gradient(135deg, #d4a853, #fcd34d)' : 'transparent',
                color: interval === 'monthly' ? '#05080d' : '#94a3b8' }}
            >Mensuel</button>
            <button
              onClick={() => setInterval('yearly')}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: interval === 'yearly' ? 'linear-gradient(135deg, #d4a853, #fcd34d)' : 'transparent',
                color: interval === 'yearly' ? '#05080d' : '#94a3b8' }}
            >
              Annuel <span style={{ fontSize: 12, opacity: 0.8 }}>(-20%)</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
          {PLAN_DATA.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: '#0d1220',
                borderRadius: 20,
                padding: 36,
                border: plan.popular ? '2px solid #d4a853' : '1px solid rgba(255,255,255,0.055)',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#05080d' }}>
                  Le plus populaire
                </div>
              )}

              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{plan.subtitle}</p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 48, fontWeight: 800 }}>
                  {interval === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}€
                </span>
                <span style={{ fontSize: 14, color: '#64748b' }}>/mois</span>
                {interval === 'yearly' && (
                  <div style={{ fontSize: 13, color: '#d4a853', marginTop: 4 }}>
                    Facturé {plan.yearlyPrice}€/an
                  </div>
                )}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                  marginBottom: 28,
                  background: plan.popular ? 'linear-gradient(135deg, #d4a853, #fcd34d)' : 'rgba(255,255,255,0.08)',
                  color: plan.popular ? '#05080d' : '#f1f5f9',
                  opacity: loading === plan.id ? 0.6 : 1,
                }}
              >
                {loading === plan.id ? 'Redirection...' : 'Commencer l\'essai gratuit'}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ padding: '8px 0', fontSize: 14, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#d4a853', fontSize: 16 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Questions fréquentes</h2>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'left' }}>
            {[
              { q: 'L\'essai gratuit nécessite-t-il une carte bancaire ?', a: 'Non. Vous pouvez tester VECTRYS pendant 14 jours sans aucun moyen de paiement.' },
              { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le prorata est calculé automatiquement.' },
              { q: 'Comment fonctionne la tarification dynamique ?', a: 'Notre algorithme IA analyse les événements locaux, la saisonnalité et la concurrence pour optimiser vos prix en temps réel.' },
              { q: 'Mes données sont-elles sécurisées ?', a: 'Absolument. VECTRYS est conforme RGPD, hébergé en France (Paris), avec chiffrement AES-256 et preuves cryptographiques.' },
            ].map(({ q, a }) => (
              <div key={q} style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#f1f5f9' }}>{q}</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
