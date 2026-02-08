import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createQuizSession,
  getQuestionById,
  submitResponse,
  getSessionStats,
  getUserStats,
  selectNextQuestion
} from '../services/universal-quiz.service.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 🎯 UNIVERSAL QUIZ ROUTES
 *
 * RESTful API pour le système de quiz universel
 * Support 10 types de questions + validation intelligente
 */

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * POST /api/quiz/universal/session/start
 * Start a new quiz session with adaptive question selection
 *
 * Body:
 * {
 *   housekeeper_id: string,
 *   question_count?: number (default: 10),
 *   question_type?: string,
 *   category?: string,
 *   difficulty_level?: string,
 *   skill_category?: string
 * }
 */
router.post('/session/start', async (req, res) => {
  try {
    const {
      housekeeper_id,
      question_count = 10,
      question_type,
      category,
      difficulty_level,
      skill_category
    } = req.body;

    if (!housekeeper_id) {
      return res.status(400).json({
        error: 'housekeeper_id is required'
      });
    }

    const session = await createQuizSession(housekeeper_id, {
      questionCount: question_count,
      questionType: question_type,
      category,
      difficultyLevel: difficulty_level,
      skillCategory: skill_category
    });

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error starting quiz session:', error);
    res.status(500).json({
      error: error.message || 'Failed to start quiz session'
    });
  }
});

/**
 * GET /api/quiz/universal/session/:sessionId
 * Get session statistics and results
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await getSessionStats(sessionId);

    if (!stats) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({
      error: error.message || 'Failed to get session stats'
    });
  }
});

// ========================================
// QUESTIONS
// ========================================

/**
 * GET /api/quiz/universal/question/:questionId
 * Get a specific question by ID (without correct answer)
 */
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await getQuestionById(questionId);

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(404).json({
      error: error.message || 'Question not found'
    });
  }
});

/**
 * GET /api/quiz/universal/random
 * Get a random question with adaptive difficulty
 *
 * Query params:
 * - housekeeper_id: string (required)
 * - question_type?: string
 * - category?: string
 * - difficulty_level?: string
 * - skill_category?: string
 * - count?: number (default: 1)
 */
router.get('/random', async (req, res) => {
  try {
    const {
      housekeeper_id,
      question_type,
      category,
      difficulty_level,
      skill_category,
      count = 1
    } = req.query;

    if (!housekeeper_id) {
      return res.status(400).json({
        error: 'housekeeper_id is required'
      });
    }

    const questions = await selectNextQuestion(housekeeper_id, {
      questionType: question_type,
      category,
      difficultyLevel: difficulty_level,
      skillCategory: skill_category,
      count: parseInt(count)
    });

    if (questions.length === 0) {
      return res.status(404).json({
        error: 'No questions available with the specified filters'
      });
    }

    // Get full question data for each (without correct answers)
    const questionsWithData = await Promise.all(
      questions.map(q => getQuestionById(q.id))
    );

    res.json({
      success: true,
      questions: questionsWithData,
      count: questionsWithData.length
    });
  } catch (error) {
    console.error('Error getting random question:', error);
    res.status(500).json({
      error: error.message || 'Failed to get random question'
    });
  }
});

// ========================================
// RESPONSE SUBMISSION
// ========================================

/**
 * POST /api/quiz/universal/respond
 * Submit and validate a quiz response
 *
 * Body:
 * {
 *   housekeeper_id: string,
 *   question_id: string,
 *   user_answer: object (structure depends on question type),
 *   session_id?: string,
 *   time_taken_seconds?: number
 * }
 *
 * user_answer examples:
 * - ALPHABET/AUDIO_TO_IMAGE/etc: { id: 'A' }
 * - AUDIO_TO_TEXT: { text: 'Je nettoie la chambre' }
 * - MATCHING: { matches: ['1-1', '2-2', '3-3'] }
 */
router.post('/respond', async (req, res) => {
  try {
    const {
      housekeeper_id,
      question_id,
      user_answer,
      session_id,
      time_taken_seconds
    } = req.body;

    if (!housekeeper_id || !question_id || !user_answer) {
      return res.status(400).json({
        error: 'housekeeper_id, question_id, and user_answer are required'
      });
    }

    const result = await submitResponse({
      housekeeper_id,
      question_id,
      user_answer,
      session_id,
      time_taken_seconds
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({
      error: error.message || 'Failed to submit response'
    });
  }
});

// ========================================
// USER STATISTICS
// ========================================

/**
 * GET /api/quiz/universal/stats/:housekeeperId
 * Get overall statistics for a user
 */
router.get('/stats/:housekeeperId', async (req, res) => {
  try {
    const { housekeeperId } = req.params;

    const stats = await getUserStats(housekeeperId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      error: error.message || 'Failed to get user stats'
    });
  }
});

// ========================================
// ADMIN/DEBUG ENDPOINTS (Optional)
// ========================================

/**
 * GET /api/quiz/universal/questions
 * List all questions with filters and pagination (admin)
 *
 * Query params:
 * - question_type?: string
 * - category?: string
 * - difficulty_level?: string
 * - skip?: number
 * - take?: number (max: 100)
 */
router.get('/questions', async (req, res) => {
  try {
    const {
      question_type,
      category,
      difficulty_level,
      skill_category,
      skip = 0,
      take = 20
    } = req.query;

    const where = {};
    if (question_type) where.question_type = question_type;
    if (category) where.category = category;
    if (difficulty_level) where.difficulty_level = difficulty_level;
    if (skill_category) where.skill_category = skill_category;

    const [questions, total] = await Promise.all([
      prisma.universalQuizQuestion.findMany({
        where,
        skip: parseInt(skip),
        take: Math.min(parseInt(take), 100),
        orderBy: { created_at: 'desc' }
      }),
      prisma.universalQuizQuestion.count({ where })
    ]);

    res.json({
      success: true,
      questions,
      total,
      skip: parseInt(skip),
      take: parseInt(take)
    });
  } catch (error) {
    console.error('Error listing questions:', error);
    res.status(500).json({
      error: error.message || 'Failed to list questions'
    });
  }
});

/**
 * GET /api/quiz/universal/types
 * Get list of available question types and their counts
 */
router.get('/types', async (req, res) => {
  try {
    const types = await prisma.universalQuizQuestion.groupBy({
      by: ['question_type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const categories = await prisma.universalQuizQuestion.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const levels = await prisma.universalQuizQuestion.groupBy({
      by: ['difficulty_level'],
      _count: { id: true },
      orderBy: { difficulty_level: 'asc' }
    });

    res.json({
      success: true,
      question_types: types.map(t => ({
        type: t.question_type,
        count: t._count.id
      })),
      categories: categories.map(c => ({
        category: c.category,
        count: c._count.id
      })),
      difficulty_levels: levels.map(l => ({
        level: l.difficulty_level,
        count: l._count.id
      }))
    });
  } catch (error) {
    console.error('Error getting types:', error);
    res.status(500).json({
      error: error.message || 'Failed to get types'
    });
  }
});

/**
 * DELETE /api/quiz/universal/session/:sessionId (Admin only)
 * Delete a quiz session and all responses
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete all responses for this session
    await prisma.universalQuizResponse.deleteMany({
      where: { session_id: sessionId }
    });

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete session'
    });
  }
});

export default router;
