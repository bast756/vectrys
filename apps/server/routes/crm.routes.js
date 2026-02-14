// ============================================================================
// VECTRYS — CRM Routes
// Prospect management + prospect calls + stats
// ============================================================================

import express from 'express';
import prisma from '../config/prisma.js';
import { requireCEO } from '../middleware/employee-auth.js';

const router = express.Router();

// ─── PROSPECTS ────────────────────────────────────────────────

// GET /api/employee/prospects — List prospects
router.get('/prospects', async (req, res) => {
  try {
    const { status, search } = req.query;
    const isCEO = req.employee.role === 'ceo';

    const where = {};
    if (!isCEO) where.employee_id = req.employee.id;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { company_name: { contains: search, mode: 'insensitive' } },
        { contact_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true, matricule: true } },
        _count: { select: { call_sessions: true } },
      },
    });

    res.json({ success: true, data: prospects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employee/prospects — Create prospect
router.post('/prospects', async (req, res) => {
  try {
    const { company_name, contact_name, contact_role, phone, email, status, fate_profile, interlocutor_type, notes, next_action, next_action_date } = req.body;
    if (!company_name) {
      return res.status(400).json({ error: 'company_name requis' });
    }

    const prospect = await prisma.prospect.create({
      data: {
        employee_id: req.employee.id,
        company_name,
        contact_name,
        contact_role,
        phone,
        email,
        status: status || 'new',
        fate_profile,
        interlocutor_type,
        notes,
        next_action,
        next_action_date: next_action_date ? new Date(next_action_date) : null,
      },
    });

    res.status(201).json({ success: true, data: prospect });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/prospects/:id — Prospect detail with call history
router.get('/prospects/:id', async (req, res) => {
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true } },
        call_sessions: {
          orderBy: { created_at: 'desc' },
          include: {
            session: {
              select: { id: true, started_at: true, ended_at: true, platform: true },
            },
          },
        },
      },
    });

    if (!prospect) return res.status(404).json({ error: 'Prospect non trouvé' });

    // Check access
    if (req.employee.role !== 'ceo' && prospect.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/prospects/:id — Update prospect
router.patch('/prospects/:id', async (req, res) => {
  try {
    const existing = await prisma.prospect.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Prospect non trouvé' });
    if (req.employee.role !== 'ceo' && existing.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { company_name, contact_name, contact_role, phone, email, status, fate_profile, interlocutor_type, notes, last_contact, next_action, next_action_date } = req.body;

    const prospect = await prisma.prospect.update({
      where: { id: req.params.id },
      data: {
        ...(company_name !== undefined && { company_name }),
        ...(contact_name !== undefined && { contact_name }),
        ...(contact_role !== undefined && { contact_role }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
        ...(fate_profile !== undefined && { fate_profile }),
        ...(interlocutor_type !== undefined && { interlocutor_type }),
        ...(notes !== undefined && { notes }),
        ...(last_contact !== undefined && { last_contact: new Date(last_contact) }),
        ...(next_action !== undefined && { next_action }),
        ...(next_action_date !== undefined && { next_action_date: next_action_date ? new Date(next_action_date) : null }),
      },
    });

    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employee/prospects/:id — Delete prospect
router.delete('/prospects/:id', async (req, res) => {
  try {
    const existing = await prisma.prospect.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Prospect non trouvé' });
    if (req.employee.role !== 'ceo' && existing.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.prospect.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Prospect supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROSPECT CALLS ──────────────────────────────────────────

// POST /api/employee/prospects/:id/calls — Link session to prospect
router.post('/prospects/:id/calls', async (req, res) => {
  try {
    const { session_id, outcome, summary } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id requis' });

    const prospectCall = await prisma.prospectCall.create({
      data: {
        prospect_id: req.params.id,
        session_id,
        outcome,
        summary,
      },
    });

    // Update last_contact on prospect
    await prisma.prospect.update({
      where: { id: req.params.id },
      data: { last_contact: new Date() },
    });

    res.status(201).json({ success: true, data: prospectCall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/prospect-calls/:id — Update call outcome/summary
router.patch('/prospect-calls/:id', async (req, res) => {
  try {
    const { outcome, summary } = req.body;

    const call = await prisma.prospectCall.update({
      where: { id: req.params.id },
      data: {
        ...(outcome !== undefined && { outcome }),
        ...(summary !== undefined && { summary }),
      },
    });

    res.json({ success: true, data: call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STATS (CEO) ─────────────────────────────────────────────

// GET /api/employee/stats/overview — Team KPIs
router.get('/stats/overview', requireCEO, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, totalProspects, totalCalls, todayCalls, prospectsByStatus, recentProspects] = await Promise.all([
      prisma.employee.count({ where: { active: true } }),
      prisma.prospect.count(),
      prisma.prospectCall.count(),
      prisma.callSession.count({ where: { started_at: { gte: today } } }),
      prisma.prospect.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.prospect.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { employee: { select: { first_name: true, last_name: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalProspects,
        totalCalls,
        todayCalls,
        prospectsByStatus: Object.fromEntries(prospectsByStatus.map(s => [s.status, s._count.id])),
        recentProspects,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/stats/pipeline — CRM funnel
router.get('/stats/pipeline', requireCEO, async (req, res) => {
  try {
    const pipeline = await prisma.prospect.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const stages = ['new', 'contacted', 'meeting', 'proposal', 'won', 'lost'];
    const funnel = stages.map(stage => ({
      stage,
      count: pipeline.find(p => p.status === stage)?._count.id || 0,
    }));

    res.json({ success: true, data: funnel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
