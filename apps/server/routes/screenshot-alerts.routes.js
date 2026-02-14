// ============================================================================
// VECTRYS — Screenshot Alert Routes
// Create alerts on screenshot detection, fetch for CEO dashboard
// ============================================================================

import express from 'express';
import prisma from '../config/prisma.js';
import { requireCEO } from '../middleware/employee-auth.js';

const router = express.Router();

// POST /api/employee/screenshot-alerts — Report a screenshot attempt
router.post('/screenshot-alerts', async (req, res) => {
  try {
    const { screenshot, page_url, page_title, context_summary, detection_method } = req.body;

    if (!screenshot || !page_url) {
      return res.status(400).json({ error: 'screenshot and page_url are required' });
    }

    const alert = await prisma.employeeScreenshotAlert.create({
      data: {
        employee_id: req.employee.id,
        screenshot,
        page_url,
        page_title: page_title || 'Page inconnue',
        context_summary: context_summary || '',
        detection_method: detection_method || 'keydown',
        severity: 'high',
      },
      include: {
        employee: {
          select: { id: true, matricule: true, first_name: true, last_name: true, role: true },
        },
      },
    });

    console.log(
      `[SECURITY] Screenshot alert — ${alert.employee.matricule} (${alert.employee.first_name} ${alert.employee.last_name}) on ${page_url} via ${detection_method}`
    );

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    console.error('[Screenshot Alerts] Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/screenshot-alerts — CEO: list all alerts
router.get('/screenshot-alerts', requireCEO, async (req, res) => {
  try {
    const { acknowledged, employee_id, limit = '50' } = req.query;

    const where = {};
    if (acknowledged === 'true') where.acknowledged = true;
    if (acknowledged === 'false') where.acknowledged = false;
    if (employee_id) where.employee_id = employee_id;

    const alerts = await prisma.employeeScreenshotAlert.findMany({
      where,
      include: {
        employee: {
          select: { id: true, matricule: true, first_name: true, last_name: true, role: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit, 10),
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/screenshot-alerts/count — CEO: unread alert count
router.get('/screenshot-alerts/count', requireCEO, async (req, res) => {
  try {
    const count = await prisma.employeeScreenshotAlert.count({
      where: { acknowledged: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/screenshot-alerts/:id/acknowledge — CEO: acknowledge alert
router.patch('/screenshot-alerts/:id/acknowledge', requireCEO, async (req, res) => {
  try {
    const alert = await prisma.employeeScreenshotAlert.update({
      where: { id: req.params.id },
      data: {
        acknowledged: true,
        acknowledged_at: new Date(),
        acknowledged_by: req.employee.id,
      },
      include: {
        employee: {
          select: { id: true, matricule: true, first_name: true, last_name: true },
        },
      },
    });

    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
