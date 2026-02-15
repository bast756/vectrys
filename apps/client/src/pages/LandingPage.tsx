import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🔍', title: 'CleanCheck IA', desc: 'Vérification automatique du ménage par photo avec score de propreté 0-100 et preuve cryptographique.' },
  { icon: '💰', title: 'Tarification Dynamique', desc: 'Optimisez vos prix en temps réel grâce à l\'IA. Jusqu\'à +23% de RevPAR.' },
  { icon: '🤖', title: 'Autopilot IA', desc: 'Réponses automatiques aux voyageurs 24/7. 6 catégories gérées, adoption progressive.' },
  { icon: '📅', title: 'Channel Manager', desc: 'Synchronisation Airbnb, Booking, VRBO. Un calendrier, zéro doublon.' },
  { icon: '📊', title: 'Analytics Avancés', desc: 'Tableaux de bord RevPAR, taux d\'occupation, comparaison YoY.' },
  { icon: '♿', title: 'Accessibilité Totale', desc: 'WCAG AAA, 8 langues, mode audio, loupe intelligente. L\'outil pour tous.' },
];

const STATS = [
  { value: '30 min → 2 min', label: 'Coordination ménage' },
  { value: '+23%', label: 'RevPAR moyen' },
  { value: '14 jours', label: 'Essai gratuit' },
  { value: '6,59€/mois', label: 'Infrastructure' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', background: '#05080d' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <img src="/brand/logo-horizontal-dark.png" alt="VECTRYS" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button onClick={() => navigate('/pricing')} style={{ padding: '8px 20px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: 14 }}>Tarifs</button>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', background: 'transparent', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Connexion</button>
          <button onClick={() => navigate('/pricing')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', color: '#05080d', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Essai gratuit</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.3)', borderRadius: 20, fontSize: 13, color: '#d4a853', marginBottom: 24 }}>
          Plateforme SaaS de gestion locative intelligente
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, background: 'linear-gradient(180deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          La gestion locative<br />réinventée par l'IA
        </h1>
        <p style={{ fontSize: 20, color: '#94a3b8', lineHeight: 1.6, maxWidth: 650, margin: '0 auto 40px' }}>
          Vérification IA du ménage, tarification dynamique, communication automatisée. Tout ce dont les conciergeries et propriétaires ont besoin en une seule plateforme.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => navigate('/pricing')} style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', color: '#05080d', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Commencer gratuitement →
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '16px 36px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            Voir la démo
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, maxWidth: 1000, margin: '0 auto 80px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
        {STATS.map(({ value, label }) => (
          <div key={label} style={{ padding: '32px 24px', textAlign: 'center', background: '#0d1220' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d4a853', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 100px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 60 }}>Tout ce qu'il faut pour réussir</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: '#0d1220', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.055)' }}>
              <span style={{ fontSize: 36 }}>{icon}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', color: '#f1f5f9' }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 40px', background: 'linear-gradient(180deg, #0d1220 0%, #05080d 100%)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Prêt à transformer votre gestion locative ?</h2>
        <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 32 }}>14 jours d'essai gratuit. Sans engagement. Sans carte bancaire.</p>
        <button onClick={() => navigate('/pricing')} style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', color: '#05080d', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          Démarrer l'essai gratuit →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: '1px solid rgba(255,255,255,0.055)', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        <p>© 2026 VECTRYS SAS — Tous droits réservés</p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>CGU</span>
          <span style={{ cursor: 'pointer' }}>Confidentialité</span>
          <span style={{ cursor: 'pointer' }}>Contact</span>
        </div>
      </footer>
    </div>
  );
}
