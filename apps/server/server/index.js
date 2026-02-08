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

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
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
      xp_system: 'operational',
      badge_system: 'operational',
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
    },
    total_routes: 75,
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
