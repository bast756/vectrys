// ============================================================================
// VECTRYS — Call Assistant REST Routes
// Sessions management + embedding pipeline + semantic search
// Secured with employee auth + rate limiting + confidentiality headers
// ============================================================================

import express from 'express';
import callAssistantService from '../services/call-assistant.service.js';
import embeddingPipelineService from '../services/embedding-pipeline.service.js';
import embeddingService from '../services/embedding.service.js';
import { createRateLimiter } from '../src/utils/rate-limiter.js';

const router = express.Router();

// ─── SECURITY HEADERS ─────────────────────────────────────────
router.use((req, res, next) => {
  res.set('X-Data-Classification', 'CONFIDENTIAL');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// Rate limiter for embedding sync (expensive operation)
const embeddingSyncLimiter = createRateLimiter(60000, 5);

// ─── SESSIONS ───────────────────────────────────────────────

// POST /api/call-assistant/sessions — Start a new call session
router.post('/sessions', async (req, res) => {
  try {
    const { userId, platform } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const employeeId = req.employee?.id || null;
    const session = await callAssistantService.startSession(userId, platform, employeeId);
    console.log(`[Call Assistant] Audit: Session started by ${req.employee?.matricule || userId}`);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error('[Call Assistant Routes] Start session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/call-assistant/sessions/:id/end — End a call session
router.patch('/sessions/:id/end', async (req, res) => {
  try {
    const session = await callAssistantService.endSession(req.params.id);
    console.log(`[Call Assistant] Audit: Session ended by ${req.employee?.matricule || 'unknown'}`);
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('[Call Assistant Routes] End session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/call-assistant/sessions — List sessions
router.get('/sessions', async (req, res) => {
  try {
    const { userId, limit } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const sessions = await callAssistantService.listSessions(userId, limit ? parseInt(limit) : 20);
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Call Assistant Routes] List sessions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/call-assistant/sessions/:id — Get session with transcripts
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await callAssistantService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('[Call Assistant Routes] Get session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── EMBEDDINGS ─────────────────────────────────────────────

// POST /api/call-assistant/embeddings/sync — Trigger embedding pipeline
router.post('/embeddings/sync', embeddingSyncLimiter, async (req, res) => {
  try {
    console.log(`[Call Assistant] Audit: Embedding sync triggered by ${req.employee?.matricule || 'unknown'}`);
    const result = await embeddingPipelineService.syncAllEmbeddings();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Call Assistant Routes] Sync embeddings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/call-assistant/embeddings/search — Test semantic search
router.get('/embeddings/search', async (req, res) => {
  try {
    const { q, topK, threshold } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'q query param is required' });
    }

    const results = await embeddingService.searchSimilar(
      q,
      topK ? parseInt(topK) : 5,
      threshold ? parseFloat(threshold) : 0.5,
    );

    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    console.error('[Call Assistant Routes] Search embeddings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/call-assistant/embeddings/stats — Get embedding stats
router.get('/embeddings/stats', async (req, res) => {
  try {
    const stats = await embeddingPipelineService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[Call Assistant Routes] Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
