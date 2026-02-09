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
import cron from 'node-cron';
import alertService from '../services/alert.service.js';

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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    },
    total_routes: 102,
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
// CRON MONITORING SMS + FATE
// ============================================================================

// Vérification toutes les heures
cron.schedule('0 * * * *', async () => {
  await alertService.runAllChecks();
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
