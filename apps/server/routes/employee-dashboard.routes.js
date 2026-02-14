// ============================================================================
// VECTRYS — Employee Dashboard Routes
// Notes, Tasks (Gantt), Team management, Sessions, Schedule alerts, Avatar
// ============================================================================

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma.js';
import { requireCEO } from '../middleware/employee-auth.js';

const router = express.Router();

// ─── AVATAR UPLOAD CONFIG ─────────────────────────────────────
const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.employee.id}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporte. Utilisez JPG, PNG ou WebP.'));
  },
});

// ─── NOTES ────────────────────────────────────────────────────

// GET /api/employee/notes — List my notes
router.get('/notes', async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = { employee_id: req.employee.id };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.employeeNote.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { updated_at: 'desc' }],
    });

    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employee/notes — Create note
router.post('/notes', async (req, res) => {
  try {
    const { title, content, category, pinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title et content requis' });
    }

    const note = await prisma.employeeNote.create({
      data: {
        employee_id: req.employee.id,
        title,
        content,
        category: category || 'general',
        pinned: pinned || false,
      },
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/notes/:id — Update note
router.patch('/notes/:id', async (req, res) => {
  try {
    const existing = await prisma.employeeNote.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Note non trouvée' });
    if (existing.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { title, content, category, pinned } = req.body;
    const note = await prisma.employeeNote.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(pinned !== undefined && { pinned }),
      },
    });

    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employee/notes/:id — Delete note
router.delete('/notes/:id', async (req, res) => {
  try {
    const existing = await prisma.employeeNote.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Note non trouvée' });
    if (existing.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.employeeNote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Note supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TASKS (GANTT) ────────────────────────────────────────────

// GET /api/employee/tasks — My tasks (or all for CEO)
router.get('/tasks', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const isCEO = req.employee.role === 'ceo';

    const where = {};
    if (!isCEO) where.employee_id = req.employee.id;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.employeeTask.findMany({
      where,
      orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
      include: {
        employee: { select: { id: true, first_name: true, last_name: true, matricule: true } },
      },
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employee/tasks — Create task (CEO can assign to others)
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, start_date, due_date, employee_id } = req.body;
    if (!title) return res.status(400).json({ error: 'title requis' });

    // Only CEO can assign tasks to other employees
    const targetEmployeeId = (req.employee.role === 'ceo' && employee_id) ? employee_id : req.employee.id;

    const task = await prisma.employeeTask.create({
      data: {
        employee_id: targetEmployeeId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        start_date: start_date ? new Date(start_date) : null,
        due_date: due_date ? new Date(due_date) : null,
        created_by: req.employee.id,
      },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/tasks/:id — Update task
router.patch('/tasks/:id', async (req, res) => {
  try {
    const existing = await prisma.employeeTask.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Tâche non trouvée' });
    if (req.employee.role !== 'ceo' && existing.employee_id !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { title, description, status, priority, start_date, due_date } = req.body;

    const data = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
    };

    // Auto-set completed_at when status changes to done
    if (status === 'done' && existing.status !== 'done') {
      data.completed_at = new Date();
    } else if (status && status !== 'done') {
      data.completed_at = null;
    }

    const task = await prisma.employeeTask.update({
      where: { id: req.params.id },
      data,
      include: {
        employee: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employee/tasks/:id — Delete task
router.delete('/tasks/:id', async (req, res) => {
  try {
    const existing = await prisma.employeeTask.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Tâche non trouvée' });
    if (req.employee.role !== 'ceo' && existing.employee_id !== req.employee.id && existing.created_by !== req.employee.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.employeeTask.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EMPLOYEES / TEAM (CEO only) ──────────────────────────────

// GET /api/employee/team — List all employees
router.get('/team', requireCEO, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { active: true },
      select: {
        id: true, matricule: true, first_name: true, last_name: true,
        email: true, role: true, active: true, last_login: true, created_at: true,
        _count: { select: { call_sessions: true, prospects: true, tasks: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee/team/:id — Update employee
router.patch('/team/:id', requireCEO, async (req, res) => {
  try {
    const { role, active } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      },
      select: {
        id: true, matricule: true, first_name: true, last_name: true,
        email: true, role: true, active: true,
      },
    });

    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CONNECTION SESSIONS (CEO only) ──────────────────────────

// GET /api/employee/sessions — All sessions with employee info
router.get('/sessions', requireCEO, async (req, res) => {
  try {
    const { date, employee_id, limit } = req.query;
    const where = {};

    if (employee_id) where.employee_id = employee_id;
    if (date) {
      const d = new Date(date);
      where.login_at = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    const sessions = await prisma.employeeSession.findMany({
      where,
      orderBy: { login_at: 'desc' },
      take: parseInt(limit) || 100,
      include: {
        employee: {
          select: { id: true, matricule: true, first_name: true, last_name: true, avatar_url: true },
        },
      },
    });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/sessions/today — Today's connections summary
router.get('/sessions/today', requireCEO, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const sessions = await prisma.employeeSession.findMany({
      where: { login_at: { gte: startOfDay, lt: endOfDay } },
      orderBy: { login_at: 'desc' },
      include: {
        employee: {
          select: { id: true, matricule: true, first_name: true, last_name: true, avatar_url: true, role: true },
        },
      },
    });

    const activeCount = sessions.filter(s => s.is_active).length;
    const outsideScheduleCount = sessions.filter(s => s.outside_schedule).length;

    res.json({
      success: true,
      data: {
        sessions,
        summary: {
          total: sessions.length,
          active: activeCount,
          outsideSchedule: outsideScheduleCount,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employee/schedule-alerts — Connections outside schedule
router.get('/schedule-alerts', requireCEO, async (req, res) => {
  try {
    const { limit, acknowledged } = req.query;
    const where = { outside_schedule: true };

    // If acknowledged filter: only show sessions that are still active (unacknowledged = active)
    // We don't have an acknowledged field on sessions, so we just filter by outside_schedule

    const sessions = await prisma.employeeSession.findMany({
      where,
      orderBy: { login_at: 'desc' },
      take: parseInt(limit) || 50,
      include: {
        employee: {
          select: {
            id: true, matricule: true, first_name: true, last_name: true,
            avatar_url: true, work_schedule_start: true, work_schedule_end: true,
          },
        },
      },
    });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROFILE AVATAR ──────────────────────────────────────────

// POST /api/employee/profile/avatar — Upload avatar
router.post('/profile/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoye' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await prisma.employee.update({
      where: { id: req.employee.id },
      data: { avatar_url: avatarUrl },
    });

    res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employee/profile/avatar — Remove avatar
router.delete('/profile/avatar', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.employee.id },
      select: { avatar_url: true },
    });

    if (employee?.avatar_url) {
      const filePath = path.join(process.cwd(), employee.avatar_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.employee.update({
      where: { id: req.employee.id },
      data: { avatar_url: null },
    });

    res.json({ success: true, message: 'Photo de profil supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EMPLOYEE SCHEDULE (CEO update) ─────────────────────────

// PATCH /api/employee/team/:id/schedule — Update work schedule
router.patch('/team/:id/schedule', requireCEO, async (req, res) => {
  try {
    const { work_schedule_start, work_schedule_end } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...(work_schedule_start && { work_schedule_start }),
        ...(work_schedule_end && { work_schedule_end }),
      },
      select: {
        id: true, matricule: true, first_name: true, last_name: true,
        work_schedule_start: true, work_schedule_end: true,
      },
    });

    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
