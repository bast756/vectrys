// ============================================================================
// VECTRYS — Subscription & Billing Routes
// Checkout Stripe, portail client, statut abonnement, webhook
// ============================================================================

import express from 'express';
import stripeService from '../services/stripe.service.js';
import { requireEmployee, requireCEO } from '../middleware/employee-auth.js';

const router = express.Router();

// ─── GET /api/subscription/plans ─────────────────────────────────
// Public — Retourne les plans disponibles
router.get('/plans', (req, res) => {
  const plans = Object.entries(stripeService.PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    monthly_price: plan.monthly_price_cents / 100,
    yearly_price: plan.yearly_price_cents / 100,
    monthly_price_cents: plan.monthly_price_cents,
    yearly_price_cents: plan.yearly_price_cents,
    features: plan.features,
  }));

  res.json({ success: true, data: plans });
});

// ─── GET /api/subscription/status ────────────────────────────────
// Auth required — Retourne le statut d'abonnement de l'organisation
router.get('/status', requireEmployee, async (req, res) => {
  try {
    const orgId = req.query.organization_id || req.employee.organization_id;

    if (!orgId) {
      return res.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          features: stripeService.PLANS.starter.features,
        },
      });
    }

    const subscription = await stripeService.getSubscription(orgId);
    res.json({ success: true, data: subscription });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/subscription/checkout ─────────────────────────────
// Auth required — Crée une session Stripe Checkout
router.post('/checkout', requireEmployee, async (req, res) => {
  try {
    const { plan, interval, organization_id } = req.body;

    if (!plan || !['starter', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide. Choisissez: starter, pro, enterprise' });
    }

    const orgId = organization_id || req.employee.organization_id;
    if (!orgId) {
      return res.status(400).json({ error: 'organization_id requis' });
    }

    const session = await stripeService.createCheckoutSession(
      orgId,
      plan,
      interval || 'monthly'
    );

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/subscription/portal ───────────────────────────────
// Auth required — Crée une session Stripe Customer Portal
router.post('/portal', requireEmployee, async (req, res) => {
  try {
    const orgId = req.body.organization_id || req.employee.organization_id;
    if (!orgId) {
      return res.status(400).json({ error: 'organization_id requis' });
    }

    const session = await stripeService.createPortalSession(orgId);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/subscription/trial ────────────────────────────────
// Auth required (CEO) — Démarre un essai gratuit 14 jours
router.post('/trial', requireEmployee, requireCEO, async (req, res) => {
  try {
    const { plan, organization_id } = req.body;
    const orgId = organization_id || req.employee.organization_id;

    if (!orgId) {
      return res.status(400).json({ error: 'organization_id requis' });
    }

    const subscription = await stripeService.startFreeTrial(orgId, plan || 'pro');
    res.json({ success: true, data: subscription });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
