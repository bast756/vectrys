// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Routes API PROTÉGÉES
//
// Ce router est protégé par internalOnly au niveau du montage.
// Les requirePermission ajoutent une couche granulaire par sous-module.
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { classifyDataAsset, getValorizationRecommendations } from './classifier.service.js';
import { runAnonymizationPipeline } from './pipeline.service.js';
import { calculateDynamicPrice, createStripeSubscription } from './pricing.service.js';
import { clusterAssets, generateInsightsReport } from './analytics.service.js';
import { requirePermission, sensitiveRateLimiter } from './internal-only.guard.js';

const router = Router();

// Header de classification sur TOUTES les réponses du Data Engine
router.use((req, res, next) => {
  res.set('X-Data-Classification', 'CONFIDENTIAL');
  res.set('X-Data-Owner', 'VECTRYS');
  next();
});

function asyncHandler(fn) {
  return (req, res) => fn(req, res).catch(err => {
    console.error('[DATA-ENGINE]', err.message);
    // Ne PAS exposer les détails d'erreur internes en production
    const message = process.env.NODE_ENV === 'production'
      ? 'Erreur interne du Data Engine'
      : err.message;
    res.status(500).json({ error: message });
  });
}

// ─── Classification IA ───────────────────────────────────────────
router.post('/classify',
  requirePermission('data-engine:classify'),
  asyncHandler(async (req, res) => {
    const { asset, sample_data, schema, context } = req.body;
    const result = await classifyDataAsset(asset, sample_data || [], schema || {}, context);
    res.json(result);
  })
);

router.post('/classify/recommendations',
  requirePermission('data-engine:classify'),
  asyncHandler(async (req, res) => {
    const { assets } = req.body;
    const result = await getValorizationRecommendations(assets || []);
    res.json(result);
  })
);

// ─── Anonymisation ───────────────────────────────────────────────
router.post('/anonymize',
  requirePermission('data-engine:anonymize'),
  asyncHandler(async (req, res) => {
    const { data, config } = req.body;
    const result = await runAnonymizationPipeline(data || [], config || {});
    res.json(result);
  })
);

// ─── Pricing ─────────────────────────────────────────────────────
router.post('/pricing/calculate',
  requirePermission('data-engine:pricing'),
  asyncHandler(async (req, res) => {
    const { asset, options } = req.body;
    const result = calculateDynamicPrice(asset, options || {});
    res.json(result);
  })
);

router.post('/pricing/subscribe',
  requirePermission('data-engine:pricing:subscribe'),
  asyncHandler(async (req, res) => {
    const { email, tier } = req.body;
    const result = await createStripeSubscription(email, tier);
    res.json(result);
  })
);

// ─── Analytics ───────────────────────────────────────────────────
router.post('/analytics/clusters',
  requirePermission('data-engine:analytics'),
  asyncHandler(async (req, res) => {
    const { assets, k } = req.body;
    const result = clusterAssets(assets || [], k);
    res.json(result);
  })
);

router.post('/analytics/insights',
  requirePermission('data-engine:insights'),
  asyncHandler(async (req, res) => {
    const { assets } = req.body;
    const result = await generateInsightsReport(assets || []);
    res.json(result);
  })
);

// ─── Compliance & Audit (accès le plus restreint) ────────────────
router.get('/compliance',
  requirePermission('data-engine:compliance'),
  asyncHandler(async (req, res) => {
    res.json({
      status: 'operational',
      message: 'Compliance checks — connecter à Prisma pour données réelles',
      checks: [],
      timestamp: new Date().toISOString()
    });
  })
);

router.get('/audit',
  requirePermission('data-engine:audit'),
  sensitiveRateLimiter,
  asyncHandler(async (req, res) => {
    res.json({
      status: 'operational',
      message: 'Audit log — connecter à Prisma pour données réelles',
      entries: [],
      timestamp: new Date().toISOString()
    });
  })
);

// ─── Health check Data Engine ────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '3.0.0',
    modules: {
      classification: 'ready',
      anonymization: 'ready',
      pricing: 'ready',
      analytics: 'ready',
      compliance: 'ready',
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
