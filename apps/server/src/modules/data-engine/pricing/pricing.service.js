// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Service Pricing dynamique + Stripe
// ═══════════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { PRICING_CONFIG } from '../common/types.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Calcule le prix dynamique d'un data asset.
 * @param {object} asset - DataAsset complet
 * @param {object} options - Options de pricing (exclusivity, granularity, volume)
 * @returns {object} Prix calculé avec détails
 */
export function calculateDynamicPrice(asset, options = {}) {
  const base = PRICING_CONFIG.base_per_1000[asset.category] || 5;

  const freshnessMap = { realtime: 3.0, hourly: 2.5, daily: 2.0, weekly: 1.5, monthly: 1.0 };
  const freshKey = asset.freshness_hours <= 1 ? 'realtime'
    : asset.freshness_hours <= 6 ? 'hourly'
    : asset.freshness_hours <= 24 ? 'daily'
    : asset.freshness_hours <= 168 ? 'weekly'
    : 'monthly';
  const freshness_multiplier = freshnessMap[freshKey];

  const exclMap = { exclusive: 5.0, limited: 3.0, shared: 1.5, open: 1.0 };
  const exclusivity_multiplier = exclMap[options.exclusivity || 'shared'];

  const granMap = { record: 2.0, segment: 1.5, aggregate: 1.0, summary: 0.5 };
  const granularity_multiplier = granMap[options.granularity || 'aggregate'];

  const quality_adjustment = 0.7 + (asset.quality_score / 100) * 0.6;
  const demand_adjustment = 0.8 + (asset.demand_score / 100) * 0.4;

  const computed_price_per_1000 = Math.round(
    base * freshness_multiplier * exclusivity_multiplier * granularity_multiplier * quality_adjustment * demand_adjustment * 100
  ) / 100;

  const result = {
    asset_id: asset.id,
    base_price: base,
    freshness_multiplier,
    exclusivity_multiplier,
    granularity_multiplier,
    quality_adjustment: Math.round(quality_adjustment * 100) / 100,
    demand_adjustment: Math.round(demand_adjustment * 100) / 100,
    computed_price_per_1000,
  };

  if (options.volume) {
    let discount = 0;
    if (options.volume > 1_000_000) discount = 0.35;
    else if (options.volume > 100_000) discount = 0.20;
    else if (options.volume > 10_000) discount = 0.10;

    const units = options.volume / 1000;
    result.volume_discount = discount;
    result.total_cost = Math.round(units * computed_price_per_1000 * (1 - discount) * 100) / 100;
  }

  return result;
}

/**
 * Crée un abonnement Stripe pour un partenaire.
 * @param {string} partnerEmail - Email du partenaire
 * @param {string} tier - Tier d'abonnement (starter, pro, enterprise)
 * @returns {Promise<object>} Détails de l'abonnement Stripe
 */
export async function createStripeSubscription(partnerEmail, tier) {
  if (!stripe) throw new Error('Stripe non configuré — STRIPE_SECRET_KEY manquant');

  const sub = PRICING_CONFIG.subscriptions[tier];
  if (!sub || sub.price === 0) throw new Error(`Tier ${tier} ne nécessite pas d'abonnement Stripe`);

  const customer = await stripe.customers.create({
    email: partnerEmail,
    metadata: { tier, platform: 'vectrys-data-engine' }
  });

  const price = await stripe.prices.create({
    unit_amount: sub.price * 100,
    currency: 'eur',
    recurring: { interval: 'month' },
    product_data: { name: `VECTRYS Data Engine — ${tier}`, metadata: { tier } },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  const invoice = subscription.latest_invoice;
  const pi = invoice?.payment_intent;

  return {
    customerId: customer.id,
    subscriptionId: subscription.id,
    clientSecret: pi?.client_secret || undefined,
  };
}
