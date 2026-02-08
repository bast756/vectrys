/**
 * VECTRYS - Cleaning Quiz Routes
 * Quiz connaissances ménage professionnel avec certifications
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// GET /api/quiz/cleaning/questions
// Récupérer des questions de ménage filtrées
// ============================================================================
router.get('/questions', async (req, res) => {
  try {
    const {
      category,        // products, techniques, safety, standards, time_management
      difficulty,      // 1-5
      hotel_standard,  // 3-star, 4-star, 5-star, luxury
      required_for_cert, // true/false
      limit = '10',
      offset = '0',
      shuffle = 'true'
    } = req.query;

    // Construire les filtres
    const where = { active: true };

    if (category) where.category = category;
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (hotel_standard) where.hotel_standard = hotel_standard;
    if (required_for_cert !== undefined) {
      where.required_for_cert = required_for_cert === 'true';
    }

    // Total pour pagination
    const total = await prisma.cleaningQuizQuestion.count({ where });

    // Récupérer les questions
    let questions = await prisma.cleaningQuizQuestion.findMany({
      where,
      select: {
        id: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_image_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        // NE PAS envoyer correct_option
        difficulty: true,
        xp_reward: true,
        tags: true,
        required_for_cert: true,
        hotel_standard: true,
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
    console.error('Error fetching cleaning questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/cleaning/question/:id
// Récupérer une question spécifique
// ============================================================================
router.get('/question/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.cleaningQuizQuestion.findUnique({
      where: { id },
      select: {
        id: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_image_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        difficulty: true,
        xp_reward: true,
        tags: true,
        required_for_cert: true,
        hotel_standard: true,
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
    await prisma.cleaningQuizQuestion.update({
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
// POST /api/quiz/cleaning/respond
// Soumettre une réponse à une question de ménage
// ============================================================================
router.post('/respond', async (req, res) => {
  try {
    const {
      housekeeper_id,
      question_id,
      selected_option,
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

    // Récupérer la question
    const question = await prisma.cleaningQuizQuestion.findUnique({
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

    // Tentatives précédentes
    const previousAttempts = await prisma.cleaningQuizResponse.count({
      where: {
        housekeeper_id,
        question_id
      }
    });

    const attempt_number = previousAttempts + 1;

    // Récupérer la progression
    const languageProgress = await prisma.languageProgress.findUnique({
      where: { housekeeper_id }
    });

    if (!languageProgress) {
      return res.status(404).json({
        success: false,
        error: 'Language progress not found'
      });
    }

    // Badges spécifiques au ménage
    let badge_unlocked = null;
    const cleaningResponses = await prisma.cleaningQuizResponse.count({
      where: {
        housekeeper_id,
        is_correct: true
      }
    });

    if (is_correct) {
      if (cleaningResponses + 1 === 10) badge_unlocked = 'cleaning_novice';
      if (cleaningResponses + 1 === 50) badge_unlocked = 'cleaning_expert';
      if (cleaningResponses + 1 === 100) badge_unlocked = 'cleaning_master';

      // Badges par catégorie
      if (question.category === 'safety' && cleaningResponses + 1 >= 20) {
        badge_unlocked = 'safety_champion';
      }
      if (question.hotel_standard === 'luxury' && cleaningResponses + 1 >= 30) {
        badge_unlocked = 'luxury_specialist';
      }
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer la réponse
      const response = await tx.cleaningQuizResponse.create({
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

      // 2. Mettre à jour stats question
      if (is_correct) {
        await tx.cleaningQuizQuestion.update({
          where: { id: question_id },
          data: {
            times_correct: { increment: 1 },
            success_rate: {
              set: ((question.times_correct + 1) / question.times_shown * 100)
            }
          }
        });
      }

      // 3. Mettre à jour housekeeper XP
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

      // 4. Mettre à jour progression
      await tx.languageProgress.update({
        where: { id: languageProgress.id },
        data: {
          last_activity: new Date()
        }
      });

      return response;
    });

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
          video: question.explanation_video
        },
        question_metadata: {
          category: question.category,
          difficulty: question.difficulty,
          hotel_standard: question.hotel_standard,
          required_for_cert: question.required_for_cert
        }
      }
    });

  } catch (error) {
    console.error('Error submitting cleaning response:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/cleaning/certification
// Questions requises pour la certification
// ============================================================================
router.get('/certification', async (req, res) => {
  try {
    const {
      hotel_standard = '4-star',
      shuffle = 'true'
    } = req.query;

    // Récupérer toutes les questions de certification
    let questions = await prisma.cleaningQuizQuestion.findMany({
      where: {
        required_for_cert: true,
        hotel_standard: {
          in: [hotel_standard, null] // Inclure questions générales
        },
        active: true
      },
      select: {
        id: true,
        category: true,
        subcategory: true,
        question_text: true,
        question_image_url: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        difficulty: true,
        xp_reward: true,
        hotel_standard: true,
        tags: true
      }
    });

    if (shuffle === 'true') {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Grouper par catégorie
    const byCategory = {};
    questions.forEach(q => {
      if (!byCategory[q.category]) {
        byCategory[q.category] = [];
      }
      byCategory[q.category].push(q);
    });

    res.json({
      success: true,
      data: {
        hotel_standard,
        total_questions: questions.length,
        passing_score: 80, // 80% requis pour certification
        questions,
        by_category: byCategory,
        estimated_duration_minutes: questions.length * 2 // 2 min par question
      }
    });

  } catch (error) {
    console.error('Error fetching certification questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/quiz/cleaning/stats/:userId
// Statistiques ménage d'un utilisateur
// ============================================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId: housekeeper_id } = req.params;

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeper_id },
      include: {
        language_progress: {
          include: {
            cleaning_responses: {
              include: {
                question: {
                  select: {
                    category: true,
                    difficulty: true,
                    hotel_standard: true,
                    required_for_cert: true,
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

    const responses = housekeeper.language_progress.cleaning_responses;

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

    // Progression certification
    const certResponses = responses.filter(r => r.question.required_for_cert);
    const certCorrect = certResponses.filter(r => r.is_correct).length;
    const certAccuracy = certResponses.length > 0
      ? (certCorrect / certResponses.length * 100).toFixed(1)
      : 0;

    const certificationProgress = {
      questions_completed: certResponses.length,
      questions_correct: certCorrect,
      accuracy: certAccuracy,
      ready_for_cert: parseFloat(certAccuracy) >= 80,
      passing_threshold: 80
    };

    // Standards hôteliers
    const byHotelStandard = {};
    responses.forEach(r => {
      if (r.question.hotel_standard) {
        const std = r.question.hotel_standard;
        if (!byHotelStandard[std]) {
          byHotelStandard[std] = { total: 0, correct: 0 };
        }
        byHotelStandard[std].total++;
        if (r.is_correct) byHotelStandard[std].correct++;
      }
    });

    Object.keys(byHotelStandard).forEach(std => {
      byHotelStandard[std].accuracy = (
        byHotelStandard[std].correct / byHotelStandard[std].total * 100
      ).toFixed(1);
    });

    res.json({
      success: true,
      data: {
        housekeeper: {
          id: housekeeper.id,
          name: `${housekeeper.first_name} ${housekeeper.last_name}`,
          total_xp: housekeeper.total_xp,
          level: housekeeper.level
        },
        global_stats: globalStats,
        by_category: byCategory,
        by_hotel_standard: byHotelStandard,
        certification: certificationProgress
      }
    });

  } catch (error) {
    console.error('Error fetching cleaning stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/quiz/cleaning/validate-cert
// Valider une tentative de certification
// ============================================================================
router.post('/validate-cert', async (req, res) => {
  try {
    const {
      housekeeper_id,
      session_id,
      hotel_standard = '4-star'
    } = req.body;

    if (!housekeeper_id || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: housekeeper_id, session_id'
      });
    }

    // Récupérer toutes les réponses de la session
    const sessionResponses = await prisma.cleaningQuizResponse.findMany({
      where: {
        housekeeper_id,
        session_id
      },
      include: {
        question: {
          select: {
            required_for_cert: true,
            hotel_standard: true
          }
        }
      }
    });

    if (sessionResponses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No responses found for this session'
      });
    }

    // Vérifier que toutes les questions sont de certification
    const certResponses = sessionResponses.filter(r => r.question.required_for_cert);

    if (certResponses.length < 20) { // Minimum 20 questions
      return res.status(400).json({
        success: false,
        error: 'Insufficient certification questions answered (minimum 20 required)'
      });
    }

    // Calculer le score
    const correctCount = certResponses.filter(r => r.is_correct).length;
    const accuracy = (correctCount / certResponses.length * 100);
    const passed = accuracy >= 80;

    // Si passé, mettre à jour la certification
    if (passed) {
      const languageProgress = await prisma.languageProgress.findUnique({
        where: { housekeeper_id }
      });

      await prisma.languageProgress.update({
        where: { id: languageProgress.id },
        data: {
          certified_level: hotel_standard,
          certification_date: new Date()
        }
      });

      // Ajouter badge de certification
      await prisma.housekeeper.update({
        where: { id: housekeeper_id },
        data: {
          badges: {
            push: `certified_${hotel_standard.replace('-', '_')}`
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        session_id,
        hotel_standard,
        total_questions: certResponses.length,
        correct_answers: correctCount,
        accuracy: accuracy.toFixed(1),
        passed,
        passing_threshold: 80,
        certificate_awarded: passed,
        certification_level: passed ? hotel_standard : null,
        certification_date: passed ? new Date() : null,
        badge_unlocked: passed ? `certified_${hotel_standard.replace('-', '_')}` : null
      }
    });

  } catch (error) {
    console.error('Error validating certification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
