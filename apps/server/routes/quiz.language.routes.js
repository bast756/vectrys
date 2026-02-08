/**
 * VECTRYS - Language Quiz Routes
 * Quiz linguistique A1.1 → C2 avec ElevenLabs audio
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// GET /api/quiz/language/questions
// Récupérer des questions filtrées par niveau/catégorie
// ============================================================================
router.get('/questions', async (req, res) => {
  try {
    const {
      level,           // A1.1, A1.2, A2.1, etc.
      category,        // grammar, vocabulary, listening, speaking, reading
      difficulty,      // 1-5
      limit = '10',
      offset = '0',
      shuffle = 'true'
    } = req.query;

    // Construire les filtres
    const where = { active: true };

    if (level) where.level = level;
    if (category) where.category = category;
    if (difficulty) where.difficulty = parseInt(difficulty);

    // Récupérer le total pour pagination
    const total = await prisma.languageQuizQuestion.count({ where });

    // Récupérer les questions
    let questions = await prisma.languageQuizQuestion.findMany({
      where,
      select: {
        id: true,
        level: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_audio_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        // NE PAS envoyer correct_option au client !
        difficulty: true,
        xp_reward: true,
        tags: true,
        success_rate: true
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: shuffle === 'true' ? undefined : { created_at: 'desc' }
    });

    // Mélanger si demandé
    if (shuffle === 'true') {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching language questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/language/question/:id
// Récupérer une question spécifique (sans la réponse correcte)
// ============================================================================
router.get('/question/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.languageQuizQuestion.findUnique({
      where: { id },
      select: {
        id: true,
        level: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_audio_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        // NE PAS inclure correct_option
        explanation_text: false,
        explanation_audio: false,
        difficulty: true,
        xp_reward: true,
        tags: true,
        success_rate: true,
        times_shown: true,
        times_correct: true
      }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Incrémenter times_shown
    await prisma.languageQuizQuestion.update({
      where: { id },
      data: {
        times_shown: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/quiz/language/respond
// Soumettre une réponse à une question
// ============================================================================
router.post('/respond', async (req, res) => {
  try {
    const {
      housekeeper_id,
      question_id,
      selected_option,  // 'a', 'b', 'c', 'd'
      session_id,
      time_taken_seconds
    } = req.body;

    // Validation
    if (!housekeeper_id || !question_id || !selected_option) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: housekeeper_id, question_id, selected_option'
      });
    }

    if (!['a', 'b', 'c', 'd'].includes(selected_option.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'selected_option must be a, b, c, or d'
      });
    }

    // Récupérer la question avec la bonne réponse
    const question = await prisma.languageQuizQuestion.findUnique({
      where: { id: question_id }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Vérifier la réponse
    const is_correct = selected_option.toLowerCase() === question.correct_option.toLowerCase();
    const xp_earned = is_correct ? question.xp_reward : Math.floor(question.xp_reward * 0.3);

    // Vérifier si c'est une nouvelle tentative
    const previousAttempts = await prisma.languageQuizResponse.count({
      where: {
        housekeeper_id,
        question_id
      }
    });

    const attempt_number = previousAttempts + 1;

    // Récupérer la progression linguistique
    const languageProgress = await prisma.languageProgress.findUnique({
      where: { housekeeper_id }
    });

    if (!languageProgress) {
      return res.status(404).json({
        success: false,
        error: 'Language progress not found for this housekeeper'
      });
    }

    // Calculer si un badge est débloqué
    let badge_unlocked = null;
    const progressResponses = await prisma.languageQuizResponse.count({
      where: {
        housekeeper_id,
        is_correct: true
      }
    });

    // Logique simple de badges (à améliorer)
    if (is_correct) {
      if (progressResponses + 1 === 10) badge_unlocked = 'first_10_correct';
      if (progressResponses + 1 === 50) badge_unlocked = 'first_50_correct';
      if (progressResponses + 1 === 100) badge_unlocked = 'first_100_correct';
      if (progressResponses + 1 === 500) badge_unlocked = 'language_master';
    }

    // Créer la réponse dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer la réponse
      const response = await tx.languageQuizResponse.create({
        data: {
          housekeeper_id: languageProgress.id,
          question_id,
          selected_option: selected_option.toLowerCase(),
          is_correct,
          time_taken_seconds,
          session_id,
          attempt_number,
          xp_earned,
          badge_unlocked
        }
      });

      // 2. Mettre à jour les stats de la question
      if (is_correct) {
        await tx.languageQuizQuestion.update({
          where: { id: question_id },
          data: {
            times_correct: { increment: 1 },
            success_rate: {
              set: ((question.times_correct + 1) / question.times_shown * 100)
            }
          }
        });
      }

      // 3. Mettre à jour la progression du housekeeper
      const housekeeper = await tx.housekeeper.findUnique({
        where: { id: housekeeper_id }
      });

      await tx.housekeeper.update({
        where: { id: housekeeper_id },
        data: {
          total_xp: { increment: xp_earned },
          level: {
            set: Math.floor((housekeeper.total_xp + xp_earned) / 1000) + 1
          },
          badges: badge_unlocked
            ? {
                push: badge_unlocked
              }
            : undefined
        }
      });

      // 4. Mettre à jour les statistiques linguistiques
      const updateData = {
        total_quizzes: { increment: 1 },
        last_activity: new Date()
      };

      if (is_correct) {
        updateData.passed_quizzes = { increment: 1 };
      }

      // Mettre à jour les scores par catégorie
      const categoryScoreMap = {
        'listening': 'listening_score',
        'speaking': 'speaking_score',
        'reading': 'reading_score',
        'writing': 'writing_score'
      };

      const scoreField = categoryScoreMap[question.category];
      if (scoreField && is_correct) {
        updateData[scoreField] = { increment: 10 };
      }

      // Calculer le streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const lastActivity = languageProgress.last_activity;
      if (lastActivity) {
        const lastActivityDate = new Date(lastActivity);
        lastActivityDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lastActivityDate.getTime() === yesterday.getTime()) {
          // Continuer le streak
          updateData.current_streak = { increment: 1 };
          const newStreak = languageProgress.current_streak + 1;
          if (newStreak > languageProgress.longest_streak) {
            updateData.longest_streak = newStreak;
          }
        } else if (lastActivityDate.getTime() !== today.getTime()) {
          // Reset le streak
          updateData.current_streak = 1;
        }
      } else {
        updateData.current_streak = 1;
      }

      await tx.languageProgress.update({
        where: { id: languageProgress.id },
        data: updateData
      });

      return response;
    });

    // Retourner la réponse avec l'explication
    res.json({
      success: true,
      data: {
        response: {
          id: result.id,
          is_correct,
          selected_option: result.selected_option,
          correct_option: question.correct_option,
          xp_earned,
          badge_unlocked,
          attempt_number
        },
        explanation: {
          text: question.explanation_text,
          audio: question.explanation_audio
        },
        stats: {
          total_xp_gained: xp_earned,
          question_difficulty: question.difficulty,
          question_success_rate: question.success_rate
        }
      }
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/language/session/:id
// Récupérer les détails d'une session de quiz
// ============================================================================
router.get('/session/:id', async (req, res) => {
  try {
    const { id: session_id } = req.params;

    // Récupérer toutes les réponses de cette session
    const responses = await prisma.languageQuizResponse.findMany({
      where: { session_id },
      include: {
        question: {
          select: {
            id: true,
            level: true,
            category: true,
            difficulty: true,
            question_text: true,
            xp_reward: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quiz session not found'
      });
    }

    // Calculer les statistiques de la session
    const stats = {
      total_questions: responses.length,
      correct_answers: responses.filter(r => r.is_correct).length,
      incorrect_answers: responses.filter(r => !r.is_correct).length,
      accuracy: (responses.filter(r => r.is_correct).length / responses.length * 100).toFixed(1),
      total_xp_earned: responses.reduce((sum, r) => sum + r.xp_earned, 0),
      average_time: responses.filter(r => r.time_taken_seconds).length > 0
        ? (responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) /
           responses.filter(r => r.time_taken_seconds).length).toFixed(1)
        : null,
      categories: {}
    };

    // Stats par catégorie
    responses.forEach(r => {
      const cat = r.question.category;
      if (!stats.categories[cat]) {
        stats.categories[cat] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }
      stats.categories[cat].total++;
      if (r.is_correct) stats.categories[cat].correct++;
    });

    // Calculer l'accuracy par catégorie
    Object.keys(stats.categories).forEach(cat => {
      stats.categories[cat].accuracy = (
        stats.categories[cat].correct / stats.categories[cat].total * 100
      ).toFixed(1);
    });

    res.json({
      success: true,
      data: {
        session_id,
        housekeeper_id: responses[0].housekeeper_id,
        started_at: responses[0].created_at,
        ended_at: responses[responses.length - 1].created_at,
        stats,
        responses: responses.map(r => ({
          question_id: r.question_id,
          question_text: r.question.question_text,
          level: r.question.level,
          category: r.question.category,
          difficulty: r.question.difficulty,
          selected_option: r.selected_option,
          is_correct: r.is_correct,
          xp_earned: r.xp_earned,
          time_taken: r.time_taken_seconds,
          created_at: r.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching quiz session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/quiz/language/session/start
// Démarrer une nouvelle session de quiz
// ============================================================================
router.post('/session/start', async (req, res) => {
  try {
    const {
      housekeeper_id,
      level,
      category,
      question_count = 10,
      difficulty
    } = req.body;

    if (!housekeeper_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: housekeeper_id'
      });
    }

    // Vérifier que le housekeeper existe
    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeper_id },
      include: { language_progress: true }
    });

    if (!housekeeper) {
      return res.status(404).json({
        success: false,
        error: 'Housekeeper not found'
      });
    }

    // Construire les filtres pour les questions
    const where = { active: true };
    if (level) where.level = level;
    if (category) where.category = category;
    if (difficulty) where.difficulty = parseInt(difficulty);

    // Récupérer des questions aléatoires
    const allQuestions = await prisma.languageQuizQuestion.findMany({
      where,
      select: {
        id: true,
        level: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_audio_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        difficulty: true,
        xp_reward: true,
        tags: true
      }
    });

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No questions found matching criteria'
      });
    }

    // Mélanger et prendre question_count questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(question_count, allQuestions.length));

    // Générer un ID de session
    const session_id = `session_${Date.now()}_${housekeeper_id.substring(0, 8)}`;

    res.json({
      success: true,
      data: {
        session_id,
        housekeeper_id,
        filters: { level, category, difficulty },
        questions,
        total_questions: questions.length,
        total_xp_available: questions.reduce((sum, q) => sum + q.xp_reward, 0),
        started_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error starting quiz session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/language/stats/:userId
// Statistiques complètes d'un utilisateur
// ============================================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId: housekeeper_id } = req.params;

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeper_id },
      include: {
        language_progress: {
          include: {
            quiz_responses: {
              include: {
                question: {
                  select: {
                    level: true,
                    category: true,
                    difficulty: true,
                    xp_reward: true
                  }
                }
              },
              orderBy: { created_at: 'desc' }
            }
          }
        }
      }
    });

    if (!housekeeper) {
      return res.status(404).json({
        success: false,
        error: 'Housekeeper not found'
      });
    }

    const responses = housekeeper.language_progress.quiz_responses;

    // Stats globales
    const globalStats = {
      total_responses: responses.length,
      correct_responses: responses.filter(r => r.is_correct).length,
      incorrect_responses: responses.filter(r => !r.is_correct).length,
      accuracy: responses.length > 0
        ? (responses.filter(r => r.is_correct).length / responses.length * 100).toFixed(1)
        : 0,
      total_xp_earned: responses.reduce((sum, r) => sum + r.xp_earned, 0)
    };

    // Stats par niveau
    const byLevel = {};
    responses.forEach(r => {
      const level = r.question.level;
      if (!byLevel[level]) {
        byLevel[level] = { total: 0, correct: 0, xp: 0 };
      }
      byLevel[level].total++;
      if (r.is_correct) byLevel[level].correct++;
      byLevel[level].xp += r.xp_earned;
    });

    Object.keys(byLevel).forEach(level => {
      byLevel[level].accuracy = (byLevel[level].correct / byLevel[level].total * 100).toFixed(1);
    });

    // Stats par catégorie
    const byCategory = {};
    responses.forEach(r => {
      const cat = r.question.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, correct: 0, xp: 0 };
      }
      byCategory[cat].total++;
      if (r.is_correct) byCategory[cat].correct++;
      byCategory[cat].xp += r.xp_earned;
    });

    Object.keys(byCategory).forEach(cat => {
      byCategory[cat].accuracy = (byCategory[cat].correct / byCategory[cat].total * 100).toFixed(1);
    });

    // Activité récente (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = responses.filter(
      r => new Date(r.created_at) >= thirtyDaysAgo
    );

    res.json({
      success: true,
      data: {
        housekeeper: {
          id: housekeeper.id,
          name: `${housekeeper.first_name} ${housekeeper.last_name}`,
          current_level: housekeeper.current_level,
          total_xp: housekeeper.total_xp,
          level: housekeeper.level
        },
        global_stats: globalStats,
        by_level: byLevel,
        by_category: byCategory,
        recent_activity: {
          last_30_days: recentActivity.length,
          accuracy_last_30_days: recentActivity.length > 0
            ? (recentActivity.filter(r => r.is_correct).length / recentActivity.length * 100).toFixed(1)
            : 0
        },
        progression: housekeeper.language_progress
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
