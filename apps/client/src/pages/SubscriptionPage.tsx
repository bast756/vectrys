import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/store';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { subscription, isLoadingSubscription, fetchSubscription, openPortal } = useSubscription();

  useEffect(() => { fetchSubscription(); }, []);

  if (isLoadingSubscription) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', background: '#05080d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Chargement...</p>
      </div>
    );
  }

  const sub = subscription;
  const planName = sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'Free';
  const statusColors: Record<string, string> = {
    active: '#10b981', trialing: '#d4a853', past_due: '#f97316', cancelled: '#ef4444', expired: '#64748b',
  };
  const statusLabels: Record<string, string> = {
    active: 'Actif', trialing: 'Essai gratuit', past_due: 'Paiement en retard', cancelled: 'Annulé', expired: 'Expiré',
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#f1f5f9', background: '#05080d', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <img onClick={() => navigate('/employee/dashboard')} src="/brand/logo-horizontal-dark.png" alt="VECTRYS" style={{ height: 32, objectFit: 'contain', cursor: 'pointer' }} />
        <button onClick={() => navigate('/employee/dashboard')} style={{ padding: '8px 20px', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>← Dashboard</button>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Mon abonnement</h1>

        {/* Current Plan Card */}
        <div style={{ background: '#0d1220', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.055)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Plan {planName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[sub?.status || 'expired'] }} />
                <span style={{ fontSize: 14, color: statusColors[sub?.status || 'expired'] }}>{statusLabels[sub?.status || 'expired'] || sub?.status}</span>
              </div>
            </div>
            {sub?.plan !== 'free' && (
              <button
                onClick={openPortal}
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >
                Gérer l'abonnement
              </button>
            )}
          </div>

          {sub?.status === 'trialing' && sub.trial_days_left != null && (
            <div style={{ padding: '12px 16px', background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: '#d4a853' }}>
                {sub.trial_days_left > 0
                  ? `${sub.trial_days_left} jour${sub.trial_days_left > 1 ? 's' : ''} restant${sub.trial_days_left > 1 ? 's' : ''} dans votre essai gratuit`
                  : 'Votre essai gratuit expire aujourd\'hui'}
              </span>
            </div>
          )}

          {sub?.current_period_end && (
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Prochaine facturation : {new Date(sub.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {sub?.plan === 'free' && (
            <button onClick={() => navigate('/pricing')} style={{ marginTop: 16, padding: '12px 24px', background: 'linear-gradient(135deg, #d4a853, #fcd34d)', color: '#05080d', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Passer à un plan payant →
            </button>
          )}
        </div>

        {/* Invoices */}
        {sub?.invoices && sub.invoices.length > 0 && (
          <div style={{ background: '#0d1220', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.055)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Factures récentes</h3>
            {sub.invoices.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <span style={{ fontSize: 14, color: '#f1f5f9' }}>{(inv.amount_cents / 100).toFixed(2)}€</span>
                  <span style={{ fontSize: 13, color: '#64748b', marginLeft: 12 }}>
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('fr-FR') : 'En attente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: inv.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(251,146,60,0.1)',
                    color: inv.status === 'paid' ? '#10b981' : '#fb923c' }}>
                    {inv.status === 'paid' ? 'Payée' : inv.status}
                  </span>
                  {inv.invoice_pdf && (
                    <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#d4a853', textDecoration: 'none' }}>PDF</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
