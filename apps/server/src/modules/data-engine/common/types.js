// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Types & Constantes
// ═══════════════════════════════════════════════════════════════════

export const PRICING_CONFIG = {
  base_per_1000: {
    operational: 2.50,
    behavioral: 8.00,
    market: 12.00,
    predictive: 20.00,
    financial: 15.00,
    geographic: 5.00,
  },
  freshness_multiplier: {
    realtime: 3.0,
    hourly: 2.5,
    daily: 2.0,
    weekly: 1.5,
    monthly: 1.0,
  },
  exclusivity_multiplier: {
    exclusive: 5.0,
    limited: 3.0,
    shared: 1.5,
    open: 1.0,
  },
  rate_limits: {
    free: 10,
    starter: 60,
    pro: 300,
    enterprise: 1000,
  },
  subscriptions: {
    free: { price: 0, requests: 100, overage: 5.00 },
    starter: { price: 99, requests: 5000, overage: 2.00 },
    pro: { price: 499, requests: 50000, overage: 1.00 },
    enterprise: { price: 0, requests: Infinity, overage: 0 },
  },
};
