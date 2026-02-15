// ============================================================================
// VECTRYS — Stripe Billing Service
// Gestion abonnements SaaS : checkout, webhooks, portail client
// ============================================================================

import Stripe from 'stripe';
import prisma from '../config/prisma.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// ─── PLANS CONFIGURATION ─────────────────────────────────────────

const PLANS = {
  starter: {
    name: 'Starter',
    monthly_price_cents: 4900,   // 49€
    yearly_price_cents: 47000,   // 470€ (2 mois offerts)
    features: {
      max_properties: 5,
      cleancheck_verifications: 50,
      ai_responses: 100,
      channel_sync: true,
      dynamic_pricing: false,
      white_label: false,
    },
  },
  pro: {
    name: 'Pro',
    monthly_price_cents: 9900,   // 99€
    yearly_price_cents: 95000,   // 950€
    features: {
      max_properties: 25,
      cleancheck_verifications: 500,
      ai_responses: 1000,
      channel_sync: true,
      dynamic_pricing: true,
      white_label: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthly_price_cents: 39900,  // 399€
    yearly_price_cents: 383000,  // 3830€
    features: {
      max_properties: -1, // illimité
      cleancheck_verifications: -1,
      ai_responses: -1,
      channel_sync: true,
      dynamic_pricing: true,
      white_label: true,
    },
  },
};

// ─── STRIPE PRICE IDS (à configurer après création dans Stripe Dashboard) ────

const PRICE_IDS = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
};

// ─── CUSTOMER MANAGEMENT ─────────────────────────────────────────

async function getOrCreateCustomer(organizationId) {
  const sub = await prisma.subscription.findFirst({
    where: { organization_id: organizationId },
  });

  if (sub?.stripe_customer_id) {
    return sub.stripe_customer_id;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) throw Object.assign(new Error('Organisation non trouvée'), { statusCode: 404 });

  const customer = await stripe.customers.create({
    email: org.email,
    name: org.name,
    metadata: { organization_id: organizationId },
  });

  return customer.id;
}

// ─── CREATE CHECKOUT SESSION ─────────────────────────────────────

async function createCheckoutSession(organizationId, plan, interval = 'monthly') {
  const priceKey = `${plan}_${interval}`;
  const priceId = PRICE_IDS[priceKey];

  if (!priceId) {
    throw Object.assign(
      new Error(`Price ID non configuré pour ${priceKey}. Créez les produits dans Stripe Dashboard.`),
      { statusCode: 400 }
    );
  }

  const customerId = await getOrCreateCustomer(organizationId);
  const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organization_id: organizationId, plan },
    },
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/pricing?cancelled=true`,
    metadata: { organization_id: organizationId, plan, interval },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
  });

  return { url: session.url, sessionId: session.id };
}

// ─── CUSTOMER PORTAL ─────────────────────────────────────────────

async function createPortalSession(organizationId) {
  const sub = await prisma.subscription.findFirst({
    where: { organization_id: organizationId },
  });

  if (!sub?.stripe_customer_id) {
    throw Object.assign(new Error('Pas d\'abonnement actif'), { statusCode: 404 });
  }

  const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${clientUrl}/subscription`,
  });

  return { url: session.url };
}

// ─── GET SUBSCRIPTION STATUS ─────────────────────────────────────

async function getSubscription(organizationId) {
  const sub = await prisma.subscription.findFirst({
    where: { organization_id: organizationId },
    include: { invoices: { orderBy: { created_at: 'desc' }, take: 5 } },
  });

  if (!sub) {
    // Retourner un plan free par défaut
    return {
      plan: 'free',
      status: 'active',
      billing_interval: 'monthly',
      trial_end: null,
      current_period_end: null,
      features: PLANS.starter.features, // Free = mêmes limites que starter pour le trial
      invoices: [],
    };
  }

  const planConfig = PLANS[sub.plan] || PLANS.starter;
  const isTrialing = sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end) > new Date();
  const daysLeft = isTrialing
    ? Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    billing_interval: sub.billing_interval,
    trial_end: sub.trial_end,
    trial_days_left: daysLeft,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
    cancelled_at: sub.cancelled_at,
    features: planConfig.features,
    invoices: sub.invoices,
  };
}

// ─── START FREE TRIAL ────────────────────────────────────────────

async function startFreeTrial(organizationId, plan = 'pro') {
  // Vérifier qu'il n'y a pas déjà un abonnement
  const existing = await prisma.subscription.findFirst({
    where: { organization_id: organizationId },
  });

  if (existing) {
    throw Object.assign(new Error('Un abonnement existe déjà'), { statusCode: 409 });
  }

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 jours

  const subscription = await prisma.subscription.create({
    data: {
      organization_id: organizationId,
      plan,
      status: 'trialing',
      billing_interval: 'monthly',
      trial_start: new Date(),
      trial_end: trialEnd,
    },
  });

  // Mettre à jour l'organisation
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription_tier: plan,
      subscription_status: 'trial',
      trial_ends_at: trialEnd,
    },
  });

  return subscription;
}

// ─── HANDLE STRIPE WEBHOOK ───────────────────────────────────────

async function handleWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET non configuré');

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  console.log(`[Stripe] Webhook: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orgId = session.metadata.organization_id;
      const plan = session.metadata.plan;
      const stripeSubId = session.subscription;

      // Récupérer les détails de la subscription Stripe
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

      await prisma.subscription.upsert({
        where: { stripe_subscription_id: stripeSubId },
        update: {
          plan,
          status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
          stripe_customer_id: session.customer,
          stripe_price_id: stripeSub.items.data[0]?.price?.id,
          current_period_start: new Date(stripeSub.current_period_start * 1000),
          current_period_end: new Date(stripeSub.current_period_end * 1000),
          trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        },
        create: {
          organization_id: orgId,
          plan,
          status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
          billing_interval: stripeSub.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
          stripe_customer_id: session.customer,
          stripe_subscription_id: stripeSubId,
          stripe_price_id: stripeSub.items.data[0]?.price?.id,
          current_period_start: new Date(stripeSub.current_period_start * 1000),
          current_period_end: new Date(stripeSub.current_period_end * 1000),
          trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000) : null,
          trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        },
      });

      // Mettre à jour l'organisation
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          subscription_tier: plan,
          subscription_status: stripeSub.status === 'trialing' ? 'trial' : 'active',
          trial_ends_at: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        },
      });

      console.log(`[Stripe] Checkout completed: org=${orgId}, plan=${plan}`);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const stripeSubId = invoice.subscription;

      const sub = await prisma.subscription.findFirst({
        where: { stripe_subscription_id: stripeSubId },
      });

      if (sub) {
        await prisma.invoice.create({
          data: {
            subscription_id: sub.id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            period_start: new Date(invoice.period_start * 1000),
            period_end: new Date(invoice.period_end * 1000),
            paid_at: new Date(),
          },
        });

        // Activer si c'était en trial
        if (sub.status === 'trialing') {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'active' },
          });
          await prisma.organization.update({
            where: { id: sub.organization_id },
            data: { subscription_status: 'active' },
          });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const stripeSubId = invoice.subscription;

      await prisma.subscription.updateMany({
        where: { stripe_subscription_id: stripeSubId },
        data: { status: 'past_due' },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object;
      const sub = await prisma.subscription.findFirst({
        where: { stripe_subscription_id: stripeSub.id },
      });

      if (sub) {
        const statusMap = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'past_due',
        };

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: statusMap[stripeSub.status] || 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000),
            current_period_end: new Date(stripeSub.current_period_end * 1000),
            cancelled_at: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripe_subscription_id: stripeSub.id },
        data: { status: 'cancelled', cancelled_at: new Date() },
      });
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        try {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'CONFIRMED',
              stripePaymentIntentId: paymentIntent.id,
              paidAt: new Date(),
            },
          });
          console.log(`[Stripe] Order ${orderId} confirmed via payment_intent.succeeded`);
        } catch (orderErr) {
          console.error(`[Stripe] Failed to update order ${orderId}:`, orderErr.message);
        }
      }
      break;
    }

    default:
      console.log(`[Stripe] Webhook non géré: ${event.type}`);
  }

  return { received: true };
}

// ─── GUEST PORTAL — PAYMENT INTENT FOR ORDERS ───────────────────

/**
 * Create a PaymentIntent for a guest order
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default 'eur')
 * @param {Object} metadata - { orderId, guestId, reservationId }
 * @returns {Promise<{ paymentIntentId, clientSecret }>}
 */
async function createPaymentIntent(amount, currency = 'eur', metadata = {}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}

/**
 * Confirm a PaymentIntent by ID (check status)
 * @param {string} paymentIntentId
 * @returns {Promise<{ status, amount }>}
 */
async function confirmPaymentIntent(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
  };
}

// ─── EXPORTS ─────────────────────────────────────────────────────

export default {
  PLANS,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  startFreeTrial,
  handleWebhook,
  createPaymentIntent,
  confirmPaymentIntent,
};

export { PLANS };
