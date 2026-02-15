import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''
);

// ─── Formulaire interne (enfant de <Elements>) ─────────────

function CheckoutForm({
  orderId,
  amount,
  onSuccess,
  onCancel,
}: {
  orderId: string;
  amount?: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message || 'Erreur de paiement');
      setProcessing(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      onSuccess(result.paymentIntent.id);
    }
  };

  const s = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 9999,
      background: 'rgba(5, 8, 13, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'flex-end' as const,
      justifyContent: 'center' as const,
    },
    sheet: {
      width: '100%',
      maxWidth: 480,
      background: '#0d1220',
      borderRadius: '20px 20px 0 0',
      padding: '24px 20px 32px',
      border: '1px solid rgba(255,255,255,0.06)',
      maxHeight: '80vh',
      overflowY: 'auto' as const,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: '#334155',
      margin: '0 auto 20px',
    },
    title: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      fontWeight: 700,
      color: '#f1f5f9',
      marginBottom: 4,
      textAlign: 'center' as const,
    },
    subtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13,
      color: '#94a3b8',
      marginBottom: 20,
      textAlign: 'center' as const,
    },
    error: {
      color: '#ef4444',
      fontSize: 13,
      marginTop: 12,
      textAlign: 'center' as const,
    },
    btnRow: {
      display: 'flex',
      gap: 12,
      marginTop: 24,
    },
    btnCancel: {
      flex: 1,
      padding: '14px 0',
      background: 'transparent',
      color: '#94a3b8',
      border: '1px solid #1e293b',
      borderRadius: 10,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
    },
    btnPay: {
      flex: 2,
      padding: '14px 0',
      background: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)',
      color: '#05080d',
      border: 'none',
      borderRadius: 10,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
    },
    secure: {
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      marginTop: 16,
      fontSize: 11,
      color: '#64748b',
      fontFamily: "'DM Sans', sans-serif",
    },
  };

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.handle} />
        <div style={s.title}>Paiement securise</div>
        {amount != null && (
          <div style={s.subtitle}>
            Total: <span style={{ color: '#d4a853', fontWeight: 700 }}>{amount.toFixed(2)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  address: { country: 'FR' },
                },
              },
            }}
          />

          {error && <p style={s.error}>{error}</p>}

          <div style={s.btnRow}>
            <button
              type="button"
              onClick={onCancel}
              style={s.btnCancel}
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !stripe}
              style={{
                ...s.btnPay,
                opacity: processing ? 0.6 : 1,
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? 'Traitement...' : 'Payer maintenant'}
            </button>
          </div>
        </form>

        <div style={s.secure}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Paiement chiffre via Stripe
        </div>
      </div>
    </div>
  );
}

// ─── Wrapper public (gere <Elements>) ───────────────────────

export function StripePaymentSheet({
  clientSecret,
  orderId,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  orderId: string;
  amount?: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#d4a853',
      colorBackground: '#0d1220',
      colorText: '#f1f5f9',
      colorDanger: '#ef4444',
      fontFamily: "'DM Sans', sans-serif",
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid #1e293b',
        backgroundColor: '#0a0f1a',
        color: '#f1f5f9',
        padding: '12px',
      },
      '.Input:focus': {
        border: '1px solid #d4a853',
        boxShadow: '0 0 0 2px rgba(212, 168, 83, 0.15)',
      },
      '.Label': {
        color: '#94a3b8',
        fontSize: '13px',
      },
      '.Tab': {
        border: '1px solid #1e293b',
        backgroundColor: '#0a0f1a',
        color: '#94a3b8',
      },
      '.Tab--selected': {
        border: '1px solid #d4a853',
        backgroundColor: 'rgba(212, 168, 83, 0.08)',
        color: '#d4a853',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm
        orderId={orderId}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
