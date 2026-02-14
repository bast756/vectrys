/**
 * VECTRYS BACKEND SERVER
 *
 * Serveur Express principal intégrant tous les services LLM :
 * - FATE Framework (gestion des objections)
 * - Emotional Tracking (analyse sentiment)
 * - SONCAS Profiling (profil motivation)
 * - Chat Service Enhanced (orchestration)
 *
 * @version 2.0.0
 * @date 2026-02-06
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Routes
import llmEnhancedRoutes from './routes/llm-enhanced-routes.js';
import housekeepingRoutes from '../routes/housekeeping.routes.js';
import quizLanguageRoutes from '../routes/quiz.language.routes.js';
import quizCleaningRoutes from '../routes/quiz.cleaning.routes.js';
import quizUniversalRoutes from '../routes/quiz.universal.routes.js';
import marketplaceRoutes from '../routes/marketplace.routes.js';
import questRoutes from '../routes/quest.routes.js';
import agentTerrainRoutes, { initializeSocketIO } from '../routes/agent-terrain.routes.js';
import smsRoutes from '../routes/sms/smsRoutes.js';
import smsRoutesV2 from '../routes/sms.routes.js';
import googleMapsRoutes from '../routes/google-maps.routes.js';
import googleOAuthRoutes from '../routes/google-oauth.routes.js';
import openWeatherRoutes from '../routes/openweather.routes.js';
import emailRoutes from '../routes/email.routes.js';
import notificationRoutes from '../routes/notifications.routes.js';
import authRoutes from '../routes/auth.routes.js';
import callAssistantRoutes from '../routes/call-assistant.routes.js';
import employeeAuthRoutes from '../routes/employee-auth.routes.js';
import crmRoutes from '../routes/crm.routes.js';
import employeeDashboardRoutes from '../routes/employee-dashboard.routes.js';
import screenshotAlertRoutes from '../routes/screenshot-alerts.routes.js';
import { requireEmployee } from '../middleware/employee-auth.js';
import employeeAuthService from '../services/employee-auth.service.js';
import cron from 'node-cron';
import prisma from '../config/prisma.js';
import alertService from '../services/alert.service.js';
import deepgramService from '../services/deepgram.service.js';
import callAssistantService from '../services/call-assistant.service.js';

// Data Engine v3.0 — Routes INTERNES UNIQUEMENT
import dataEngineRoutes from '../src/modules/data-engine/data-engine.routes.js';
import { internalOnly } from '../src/modules/data-engine/guards/internal-only.guard.js';
import { ipWhitelist } from '../src/modules/data-engine/guards/ip-whitelist.guard.js';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS — Origines autorisées (production + dev)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqué: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing (50mb for screenshot alerts with base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files - Serve uploaded evidence photos
app.use('/uploads', express.static('uploads'));

// ============================================================================
// ROUTES
// ============================================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '2.0.0',
    services: {
      fate: 'operational',
      emotional: 'operational',
      soncas: 'operational',
      chat: 'operational',
      housekeeping: 'operational',
      language_quiz: 'operational',
      cleaning_quiz: 'operational',
      universal_quiz: 'operational',
      marketplace: 'operational',
      hero_quest: 'operational',
      agent_terrain: 'operational',
      sms_fate: 'operational',
      xp_system: 'operational',
      badge_system: 'operational',
      google_maps: process.env.GOOGLE_MAPS_API_KEY ? 'operational' : 'not_configured',
      google_oauth: process.env.GOOGLE_CLIENT_ID ? 'operational' : 'not_configured',
      openweather: process.env.OPENWEATHER_API_KEY ? 'operational' : 'not_configured',
      sendgrid: process.env.SENDGRID_API_KEY ? 'operational' : 'not_configured',
      firebase: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? 'operational' : 'not_configured',
      auth_guest_portal: process.env.JWT_SECRET ? 'operational' : 'not_configured',
      call_assistant: process.env.DEEPGRAM_API_KEY ? 'operational' : 'not_configured',
    },
    platform: 'Vectrys Lingua - Complete AAA Learning Platform'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'VECTRYS Backend API - Complete Platform',
    version: '2.0.0',
    docs: '/api/llm/health',
    endpoints: {
      health: '/health',
      llm: '/api/llm/*',
      housekeeping: '/api/housekeeping/*',
      language_quiz: '/api/quiz/language/*',
      cleaning_quiz: '/api/quiz/cleaning/*',
      universal_quiz: '/api/quiz/universal/*',
      marketplace: '/api/marketplace/*',
      hero_quest: '/api/quest/*',
      agent_terrain: '/api/agent-terrain/*',
      sms_fate: '/api/v2/sms/*',
      webhooks: '/api/webhooks/*',
      google_maps: '/api/maps/*',
      google_oauth: '/api/auth/google/*',
      weather: '/api/weather/*',
      email: '/api/email/*',
      notifications: '/api/notifications/*',
      auth: '/api/auth/*',
      call_assistant: '/api/call-assistant/*',
    },
    total_routes: 108,
    features: [
      'Housekeeper Management (6 routes)',
      'Language Quiz A1.1-C2 (6 routes)',
      'Cleaning Certification (6 routes)',
      'Universal Quiz System (10 routes)',
      'Marketplace & P2P Trading (8 routes)',
      'Hero Quest Journey (20 routes)',
      'Agent de Terrain Module (19 routes) - NEW!',
      'XP & Badge System',
      'Avatar 3D Customization',
      'Sage AI Professor',
      '5 Narrative Worlds',
      '10 Question Types (A1.0-C2)',
      'Field Work Management (Missions, Incidents, SOS)',
      'Adaptive Learning Algorithm',
      'Fuzzy Matching for Dictation'
    ]
  });
});

// API Routes
app.use('/api/llm', llmEnhancedRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/quiz/language', quizLanguageRoutes);
app.use('/api/quiz/cleaning', quizCleaningRoutes);
app.use('/api/quiz/universal', quizUniversalRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/quest', questRoutes);
app.use('/api/agent-terrain', agentTerrainRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/v2/sms', smsRoutesV2);       // 🆕 Routes SMS FATE v2
app.use('/api/webhooks', smsRoutesV2);      // 🆕 Webhooks Twilio
app.use('/api/maps', googleMapsRoutes);
app.use('/api/auth/google', googleOAuthRoutes);
app.use('/api/weather', openWeatherRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/call-assistant', callAssistantRoutes);
app.use('/api/employee/auth', employeeAuthRoutes);
app.use('/api/employee', requireEmployee, crmRoutes);
app.use('/api/employee', requireEmployee, employeeDashboardRoutes);
app.use('/api/employee', requireEmployee, screenshotAlertRoutes);

// Data Engine v3.0 — Routes INTERNES (RBAC protégé)
app.use(
  '/api/v1/internal/data-engine',
  ipWhitelist,
  internalOnly,
  dataEngineRoutes
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// WEBSOCKET SETUP
// ============================================================================

// Create HTTP server
const httpServer = createServer(app);

// Socket.IO configuration
export const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Initialize Socket.IO for services
initializeSocketIO(io);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✅ Manager connected: ${socket.id}`);

  // Join manager room (managers can subscribe to their alerts)
  socket.on('join:manager', (managerId) => {
    socket.join(`manager:${managerId}`);
    console.log(`📡 Manager ${managerId} joined their room`);
  });

  // Leave manager room
  socket.on('leave:manager', (managerId) => {
    socket.leave(`manager:${managerId}`);
    console.log(`📴 Manager ${managerId} left their room`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Manager disconnected: ${socket.id}`);
  });
});

// ============================================================================
// CALL ASSISTANT WEBSOCKET NAMESPACE
// ============================================================================

const callAssistantNsp = io.of('/call-assistant');

// ─── WebSocket Auth Middleware ───
callAssistantNsp.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (token) {
      const payload = employeeAuthService.verifyEmployeeAccessToken(token);
      const employee = await employeeAuthService.getEmployeeById(payload.sub);
      if (employee && employee.active) {
        socket.employee = employee;
      }
    }
    // Allow connection even without employee auth (backward compat with access code)
    next();
  } catch {
    next();
  }
});

callAssistantNsp.on('connection', (socket) => {
  console.log(`[Call Assistant WS] Connected: ${socket.id}${socket.employee ? ` (${socket.employee.matricule})` : ''}`);
  let deepgramConnection = null;
  let currentSessionId = null;
  let sessionStartTime = null;
  let sessionContext = {};
  let accumulatedTranscript = '';

  // ─── START SESSION ───
  socket.on('session:start', async ({ userId, platform, userRole, interlocutorType, fateProfile }) => {
    try {
      const employeeId = socket.employee?.id || null;
      const effectiveUserId = socket.employee?.matricule || userId || 'founder';
      const effectiveRole = socket.employee?.role || userRole || 'employee';

      sessionContext = {
        userRole: effectiveRole,
        interlocutorType: interlocutorType || 'unknown',
        fateProfile: fateProfile || null,
      };
      accumulatedTranscript = '';

      const session = await callAssistantService.startSession(effectiveUserId, platform, employeeId);
      currentSessionId = session.id;
      sessionStartTime = Date.now();

      // Create Deepgram live transcription
      deepgramConnection = deepgramService.createLiveTranscription({
        language: 'fr',
        onTranscript: async (rawText, confidence, isFinal) => {
          if (!currentSessionId) return;

          // Fix common transcription errors
          const text = callAssistantService.fixTranscription(rawText);
          const timestampMs = Date.now() - sessionStartTime;
          accumulatedTranscript += ' ' + text;

          // Auto-detect interlocutor if not manually set
          if (sessionContext.interlocutorType === 'unknown' && accumulatedTranscript.length > 100) {
            const detected = callAssistantService.detectInterlocutor(accumulatedTranscript);
            if (detected !== 'unknown') {
              sessionContext.interlocutorType = detected;
              socket.emit('interlocutor:detected', { type: detected });
            }
          }

          // Emit final transcript
          socket.emit('transcript:final', { text, speaker: 'unknown', confidence });
          console.log(`[Call Assistant] Transcript: "${text}" (confidence: ${confidence?.toFixed(2)})`);

          // Store and check for questions
          const { isQuestion } = await callAssistantService.processTranscript(
            currentSessionId, text, 'unknown', timestampMs, confidence
          );

          console.log(`[Call Assistant] Question detected: ${isQuestion}`);

          if (isQuestion) {
            socket.emit('suggestion:start', { triggeredBy: text });

            try {
              console.log(`[Call Assistant] Generating suggestion for: "${text}" [context: ${sessionContext.userRole}/${sessionContext.interlocutorType}]`);
              const suggestion = await callAssistantService.generateSuggestion(
                currentSessionId,
                text,
                (chunk) => socket.emit('suggestion:chunk', { text: chunk }),
                sessionContext
              );

              socket.emit('suggestion:complete', {
                id: suggestion.id,
                suggestion: suggestion.suggestion,
                sources: suggestion.sources,
              });
            } catch (err) {
              console.error('[Call Assistant WS] Suggestion error:', err);
              socket.emit('error', { message: 'Erreur génération suggestion' });
            }
          }
        },
        onInterim: (rawText) => {
          const text = callAssistantService.fixTranscription(rawText);
          socket.emit('transcript:interim', { text, speaker: 'unknown' });
        },
        onError: (err) => {
          console.error('[Call Assistant WS] Deepgram error:', err);
          socket.emit('error', { message: 'Erreur transcription' });
        },
        onClose: () => {
          console.log('[Call Assistant WS] Deepgram connection closed');
        },
      });

      socket.emit('session:started', { sessionId: session.id });
      console.log(`[Call Assistant WS] Session started: ${session.id}`);
    } catch (err) {
      console.error('[Call Assistant WS] Start session error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  // ─── UPDATE CONTEXT ───
  socket.on('context:update', ({ interlocutorType, fateProfile }) => {
    if (interlocutorType) sessionContext.interlocutorType = interlocutorType;
    if (fateProfile) sessionContext.fateProfile = fateProfile;
    console.log(`[Call Assistant WS] Context updated: ${JSON.stringify(sessionContext)}`);
  });

  // ─── AUDIO CHUNK ───
  socket.on('audio:chunk', (data) => {
    if (deepgramConnection) {
      deepgramConnection.send(data);
    }
  });

  // ─── END SESSION ───
  socket.on('session:end', async () => {
    try {
      if (deepgramConnection) {
        deepgramConnection.close();
        deepgramConnection = null;
      }

      if (currentSessionId) {
        await callAssistantService.endSession(currentSessionId);
        socket.emit('session:ended', { sessionId: currentSessionId });
        console.log(`[Call Assistant WS] Session ended: ${currentSessionId}`);
        currentSessionId = null;
        sessionStartTime = null;
      }
    } catch (err) {
      console.error('[Call Assistant WS] End session error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  // ─── DISCONNECT ───
  socket.on('disconnect', async () => {
    console.log(`[Call Assistant WS] Disconnected: ${socket.id}`);

    if (deepgramConnection) {
      deepgramConnection.close();
      deepgramConnection = null;
    }

    if (currentSessionId) {
      try {
        await callAssistantService.endSession(currentSessionId);
      } catch (err) {
        console.error('[Call Assistant WS] Cleanup error:', err);
      }
      currentSessionId = null;
    }
  });
});

// ============================================================================
// CRON MONITORING SMS + FATE
// ============================================================================

// Vérification toutes les heures
cron.schedule('0 * * * *', async () => {
  await alertService.runAllChecks();
});

// Vérification connexions hors horaires — toutes les 30 min
cron.schedule('*/30 * * * *', async () => {
  try {
    const activeSessions = await prisma.employeeSession.findMany({
      where: { is_active: true },
      include: { employee: { select: { id: true, work_schedule_end: true, matricule: true } } },
    });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const session of activeSessions) {
      if (currentTime > session.employee.work_schedule_end && !session.outside_schedule) {
        await prisma.employeeSession.update({
          where: { id: session.id },
          data: { outside_schedule: true },
        });
        console.log(`[CRON] Session ${session.employee.matricule} flagged as outside schedule (${currentTime} > ${session.employee.work_schedule_end})`);
      }
    }
  } catch (err) {
    console.error('[CRON] Schedule monitoring error:', err.message);
  }
});

// Verrouillage comptes inactifs 30 jours — verification quotidienne a 3h du matin
cron.schedule('0 3 * * *', async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find active employees with last_activity > 30 days ago (or never active)
    const inactiveEmployees = await prisma.employee.findMany({
      where: {
        active: true,
        locked_at: null,
        OR: [
          { last_activity: { lt: thirtyDaysAgo } },
          { last_activity: null, created_at: { lt: thirtyDaysAgo } },
        ],
      },
      select: { id: true, matricule: true, last_activity: true },
    });

    if (inactiveEmployees.length > 0) {
      await prisma.employee.updateMany({
        where: { id: { in: inactiveEmployees.map(e => e.id) } },
        data: { locked_at: new Date() },
      });

      for (const emp of inactiveEmployees) {
        console.log(`[CRON] Account locked for inactivity: ${emp.matricule} (last activity: ${emp.last_activity || 'never'})`);
      }
      console.log(`[CRON] ${inactiveEmployees.length} account(s) locked for 30-day inactivity`);
    }
  } catch (err) {
    console.error('[CRON] Inactivity lock error:', err.message);
  }
});

// ============================================================================
// SERVER START
// ============================================================================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 VECTRYS Backend Server Started');
  console.log('=====================================');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/llm`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log('=====================================\n');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
