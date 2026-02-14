// ============================================================================
// VECTRYS — Employee Auth Routes
// 2FA login, OTP verification, register (CEO), forgot/reset/change password
// ============================================================================

import express from 'express';
import prisma from '../config/prisma.js';
import employeeAuthService from '../services/employee-auth.service.js';
import { sendEmployeeInvitation, sendEmployeeOtp } from '../services/sendgrid.service.js';
import { requireEmployee, requireCEO } from '../middleware/employee-auth.js';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── STEP 1: POST /api/employee/auth/login ────────────────────
// Validates credentials, sends OTP to employee email
router.post('/login', async (req, res) => {
  try {
    const { matricule, password } = req.body;
    if (!matricule || !password) {
      return res.status(400).json({ error: 'Matricule et mot de passe requis' });
    }

    const result = await employeeAuthService.loginEmployee(matricule, password);

    // Send OTP email
    try {
      await sendEmployeeOtp(result._employee.email, {
        firstName: result._employee.first_name,
        code: result.otpCode,
        purpose: 'login_2fa',
      });
    } catch (emailErr) {
      console.error('[Employee Auth] Failed to send OTP email:', emailErr.message);
      // Continue anyway — in dev mode, log the code
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] OTP code for ${matricule}: ${result.otpCode}`);
      }
    }

    // Never send the OTP code or internal employee data to client
    res.json({
      success: true,
      data: {
        requiresOtp: true,
        employeeId: result.employeeId,
        email: result.email,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── STEP 2: POST /api/employee/auth/verify-otp ──────────────
// Validates OTP code, returns tokens + employee data
router.post('/verify-otp', async (req, res) => {
  try {
    const { employeeId, code } = req.body;
    if (!employeeId || !code) {
      return res.status(400).json({ error: 'employeeId et code requis' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await employeeAuthService.completeLogin(employeeId, code, ipAddress, userAgent);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/refresh ──────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken requis' });
    }

    const tokens = await employeeAuthService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
});

// ─── GET /api/employee/auth/me ────────────────────────────────
router.get('/me', requireEmployee, async (req, res) => {
  res.json({ success: true, data: req.employee });
});

// ─── POST /api/employee/auth/register — CEO only ─────────────
// CEO provides name + email + role, system generates matricule + temp password
router.post('/register', requireEmployee, requireCEO, async (req, res) => {
  try {
    const { firstName, lastName, email, role, workScheduleStart, workScheduleEnd } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Prenom, nom et email sont requis' });
    }

    const { employee, tempPassword } = await employeeAuthService.registerEmployee({
      firstName, lastName, email, role, workScheduleStart, workScheduleEnd,
    });

    // Send invitation email
    try {
      await sendEmployeeInvitation(email, {
        firstName,
        matricule: employee.matricule,
        tempPassword,
        loginUrl: `${CLIENT_URL}/employee/login`,
      });
      console.log(`[Employee Auth] Invitation sent to ${email} — matricule: ${employee.matricule}`);
    } catch (emailErr) {
      console.error('[Employee Auth] Failed to send invitation email:', emailErr.message);
      // Still return success — the employee was created
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Temp password for ${employee.matricule}: ${tempPassword}`);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        employee,
        invitationSent: true,
        // In dev mode, return temp password for testing
        ...(process.env.NODE_ENV !== 'production' && { tempPassword }),
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/change-password ──────────────────
router.post('/change-password', requireEmployee, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres' });
    }

    await employeeAuthService.changePassword(req.employee.id, currentPassword, newPassword);

    res.json({ success: true, message: 'Mot de passe modifie avec succes' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/forgot-password ──────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const result = await employeeAuthService.forgotPassword(email);

    // Send OTP email if employee was found
    if (result._employee && result._otpCode) {
      try {
        await sendEmployeeOtp(result._employee.email, {
          firstName: result._employee.first_name,
          code: result._otpCode,
          purpose: 'password_reset',
        });
      } catch (emailErr) {
        console.error('[Employee Auth] Failed to send reset OTP:', emailErr.message);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEV] Reset OTP for ${email}: ${result._otpCode}`);
        }
      }
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'Si un compte existe avec cet email, un code de verification a ete envoye.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/reset-password ───────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code et nouveau mot de passe requis' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres' });
    }

    await employeeAuthService.resetPassword(email, code, newPassword);

    res.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/logout-session ───────────────────
router.post('/logout-session', requireEmployee, async (req, res) => {
  try {
    await employeeAuthService.logoutSession(req.employee.id);
    res.json({ success: true, message: 'Session fermee' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ─── POST /api/employee/auth/accept-nda ───────────────────────
router.post('/accept-nda', requireEmployee, async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.employee.id },
      data: { nda_accepted_at: new Date() },
      select: {
        id: true, matricule: true, first_name: true, last_name: true,
        email: true, role: true, active: true, avatar_url: true,
        temp_password: true, nda_accepted_at: true, last_login: true,
        work_schedule_start: true, work_schedule_end: true,
      },
    });
    console.log(`[Employee Auth] NDA accepted by ${employee.matricule} at ${employee.nda_accepted_at}`);
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
