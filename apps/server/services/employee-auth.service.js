// ============================================================================
// VECTRYS — Employee Auth Service
// Registration, login (2FA), JWT management, OTP, password management
// ============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

// ─── JWT GENERATION & VERIFICATION ────────────────────────────

function generateEmployeeAccessToken(employee) {
  return jwt.sign(
    { sub: employee.id, matricule: employee.matricule, role: employee.role, type: 'employee' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateEmployeeRefreshToken(employee) {
  return jwt.sign(
    { sub: employee.id, type: 'employee_refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyEmployeeAccessToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.type !== 'employee') throw new Error('Invalid token type');
  return payload;
}

function verifyEmployeeRefreshToken(token) {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET);
  if (payload.type !== 'employee_refresh') throw new Error('Invalid token type');
  return payload;
}

// ─── MATRICULE AUTO-GENERATION ────────────────────────────────

async function generateMatricule() {
  const lastEmployee = await prisma.employee.findFirst({
    where: { matricule: { startsWith: 'VEC-' } },
    orderBy: { created_at: 'desc' },
  });

  let nextNum = 1;
  if (lastEmployee) {
    const match = lastEmployee.matricule.match(/VEC-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return `VEC-${String(nextNum).padStart(3, '0')}`;
}

// ─── TEMPORARY PASSWORD GENERATION ────────────────────────────

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += special.charAt(Math.floor(Math.random() * special.length));
  return password;
}

// ─── OTP GENERATION & VERIFICATION ───────────────────────────

async function generateEmployeeOtp(employeeId, purpose) {
  // Invalidate any existing unused OTPs for same purpose
  await prisma.employeeOtp.updateMany({
    where: { employee_id: employeeId, purpose, used_at: null },
    data: { used_at: new Date() },
  });

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otp = await prisma.employeeOtp.create({
    data: {
      employee_id: employeeId,
      code,
      purpose,
      expires_at: expiresAt,
    },
  });

  return { code, expiresAt, otpId: otp.id };
}

async function verifyEmployeeOtp(employeeId, code, purpose) {
  const otp = await prisma.employeeOtp.findFirst({
    where: {
      employee_id: employeeId,
      purpose,
      used_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otp) {
    throw Object.assign(new Error('Code OTP invalide ou expire'), { statusCode: 401 });
  }

  if (otp.attempts >= 3) {
    throw Object.assign(new Error('Nombre maximum de tentatives atteint. Demandez un nouveau code.'), { statusCode: 429 });
  }

  if (otp.code !== code) {
    await prisma.employeeOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = 2 - otp.attempts;
    throw Object.assign(
      new Error(`Code OTP incorrect. ${remaining > 0 ? remaining + ' tentative(s) restante(s).' : 'Demandez un nouveau code.'}`),
      { statusCode: 401 }
    );
  }

  // Mark as used
  await prisma.employeeOtp.update({
    where: { id: otp.id },
    data: { used_at: new Date() },
  });

  return true;
}

// ─── REGISTER (CEO creates employee) ─────────────────────────

async function registerEmployee({ firstName, lastName, email, role = 'employee', workScheduleStart, workScheduleEnd }) {
  // Only @vectrys.fr emails allowed
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain !== 'vectrys.fr') {
    throw Object.assign(new Error('Seuls les emails @vectrys.fr sont autorises'), { statusCode: 400 });
  }

  const existing = await prisma.employee.findFirst({
    where: { email },
  });
  if (existing) {
    throw Object.assign(new Error('Un employe avec cet email existe deja'), { statusCode: 409 });
  }

  const matricule = await generateMatricule();
  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 12);

  const data = {
    matricule,
    first_name: firstName,
    last_name: lastName,
    email,
    password_hash,
    role,
    temp_password: true,
  };

  if (workScheduleStart) data.work_schedule_start = workScheduleStart;
  if (workScheduleEnd) data.work_schedule_end = workScheduleEnd;

  const employee = await prisma.employee.create({
    data,
    select: {
      id: true, matricule: true, first_name: true, last_name: true,
      email: true, role: true, active: true, created_at: true,
      work_schedule_start: true, work_schedule_end: true,
    },
  });

  return { employee, tempPassword };
}

// ─── LOGIN STEP 1: Validate credentials, send OTP ────────────

async function loginEmployee(matricule, password) {
  const employee = await prisma.employee.findUnique({ where: { matricule } });
  if (!employee || !employee.active) {
    throw Object.assign(new Error('Identifiants invalides'), { statusCode: 401 });
  }

  // Check if account is locked for inactivity
  if (employee.locked_at) {
    throw Object.assign(
      new Error('Compte verrouille pour inactivite (30 jours). Contactez votre administrateur.'),
      { statusCode: 403, code: 'ACCOUNT_LOCKED' }
    );
  }

  const valid = await bcrypt.compare(password, employee.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Identifiants invalides'), { statusCode: 401 });
  }

  // Generate OTP for 2FA
  const { code } = await generateEmployeeOtp(employee.id, 'login_2fa');

  return {
    requiresOtp: true,
    employeeId: employee.id,
    email: employee.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
    otpCode: code, // Will be sent via email by the route handler
    _employee: employee, // Internal use only — not sent to client
  };
}

// ─── LOGIN STEP 2: Verify OTP, return tokens ─────────────────

async function completeLogin(employeeId, code, ipAddress, userAgent) {
  await verifyEmployeeOtp(employeeId, code, 'login_2fa');

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || !employee.active) {
    throw Object.assign(new Error('Employe non trouve ou inactif'), { statusCode: 401 });
  }

  // Update last login + last activity
  await prisma.employee.update({
    where: { id: employee.id },
    data: { last_login: new Date(), last_activity: new Date() },
  });

  // Check if login is outside work schedule
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const outsideSchedule = currentTime < employee.work_schedule_start || currentTime > employee.work_schedule_end;

  // Create session record
  await prisma.employeeSession.create({
    data: {
      employee_id: employee.id,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      outside_schedule: outsideSchedule,
    },
  });

  const accessToken = generateEmployeeAccessToken(employee);
  const refreshToken = generateEmployeeRefreshToken(employee);

  return {
    tokens: { accessToken, refreshToken },
    employee: {
      id: employee.id,
      matricule: employee.matricule,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      avatar_url: employee.avatar_url,
      temp_password: employee.temp_password,
      nda_accepted_at: employee.nda_accepted_at,
      work_schedule_start: employee.work_schedule_start,
      work_schedule_end: employee.work_schedule_end,
    },
    outsideSchedule,
  };
}

// ─── REFRESH TOKENS ──────────────────────────────────────────

async function refreshToken(token) {
  const payload = verifyEmployeeRefreshToken(token);

  const employee = await prisma.employee.findUnique({ where: { id: payload.sub } });
  if (!employee || !employee.active) {
    throw Object.assign(new Error('Employe non trouve ou inactif'), { statusCode: 401 });
  }

  // Check if account is locked for inactivity
  if (employee.locked_at) {
    throw Object.assign(
      new Error('Compte verrouille pour inactivite (30 jours). Contactez votre administrateur.'),
      { statusCode: 403, code: 'ACCOUNT_LOCKED' }
    );
  }

  // Update last_activity on refresh
  await prisma.employee.update({
    where: { id: employee.id },
    data: { last_activity: new Date() },
  });

  return {
    accessToken: generateEmployeeAccessToken(employee),
    refreshToken: generateEmployeeRefreshToken(employee),
  };
}

// ─── CHANGE PASSWORD ─────────────────────────────────────────

async function changePassword(employeeId, currentPassword, newPassword) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw Object.assign(new Error('Employe non trouve'), { statusCode: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, employee.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Mot de passe actuel incorrect'), { statusCode: 401 });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.employee.update({
    where: { id: employeeId },
    data: { password_hash, temp_password: false },
  });

  return true;
}

// ─── FORGOT PASSWORD (send OTP to email) ─────────────────────

async function forgotPassword(email) {
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee || !employee.active) {
    // Return silently to avoid email enumeration
    return { sent: true };
  }

  const { code } = await generateEmployeeOtp(employee.id, 'password_reset');

  return { sent: true, _employee: employee, _otpCode: code };
}

// ─── RESET PASSWORD (verify OTP + set new password) ──────────

async function resetPassword(email, code, newPassword) {
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) {
    throw Object.assign(new Error('Compte non trouve'), { statusCode: 404 });
  }

  await verifyEmployeeOtp(employee.id, code, 'password_reset');

  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.employee.update({
    where: { id: employee.id },
    data: { password_hash, temp_password: false },
  });

  return true;
}

// ─── LOGOUT SESSION ──────────────────────────────────────────

async function logoutSession(employeeId) {
  const activeSession = await prisma.employeeSession.findFirst({
    where: { employee_id: employeeId, is_active: true },
    orderBy: { login_at: 'desc' },
  });

  if (activeSession) {
    await prisma.employeeSession.update({
      where: { id: activeSession.id },
      data: { logout_at: new Date(), is_active: false },
    });
  }

  return true;
}

// ─── GET EMPLOYEE BY ID ──────────────────────────────────────

async function getEmployeeById(id) {
  return prisma.employee.findUnique({
    where: { id },
    select: {
      id: true, matricule: true, first_name: true, last_name: true,
      email: true, role: true, active: true, avatar_url: true,
      temp_password: true, nda_accepted_at: true, last_login: true,
      last_activity: true, locked_at: true,
      work_schedule_start: true, work_schedule_end: true,
    },
  });
}

// ─── UNLOCK EMPLOYEE (CEO unlocks locked account) ───────────

async function unlockEmployee(employeeId) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw Object.assign(new Error('Employe non trouve'), { statusCode: 404 });
  }
  if (!employee.locked_at) {
    return { alreadyUnlocked: true };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { locked_at: null, last_activity: new Date() },
  });

  return { unlocked: true, matricule: employee.matricule };
}

export default {
  registerEmployee,
  loginEmployee,
  completeLogin,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutSession,
  getEmployeeById,
  generateEmployeeOtp,
  unlockEmployee,
  verifyEmployeeAccessToken,
  verifyEmployeeRefreshToken,
};
