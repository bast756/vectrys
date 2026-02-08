/**
 * VECTRYS - Housekeeping Routes
 * Gestion des femmes de ménage et leur progression
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// POST /api/housekeeping/register
// Inscription d'une nouvelle femme de ménage
// ============================================================================
router.post('/register', async (req, res) => {
  try {
    const {
      company_id,
      first_name,
      last_name,
      email,
      phone,
      native_language,
      target_language = 'fr'
    } = req.body;

    // Validation
    if (!company_id || !first_name || !last_name || !email || !native_language) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_id, first_name, last_name, email, native_language'
      });
    }

    // Vérifier que la société existe
    const company = await prisma.housekeepingCompany.findUnique({
      where: { id: company_id }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'HousekeepingCompany not found'
      });
    }

    // Vérifier que l'email n'est pas déjà utilisé dans cette société
    const existing = await prisma.housekeeper.findUnique({
      where: {
        company_id_email: {
          company_id,
          email
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Housekeeper already registered with this email in this company'
      });
    }

    // Créer la femme de ménage avec sa progression initiale
    const housekeeper = await prisma.housekeeper.create({
      data: {
        company_id,
        first_name,
        last_name,
        email,
        phone,
        native_language,
        target_language,
        current_level: 'A1.1',
        total_xp: 0,
        level: 1,
        badges: [],
        avatar_customization: {
          skin_color: 'default',
          hair_style: 'default',
          outfit: 'uniform_blue'
        },
        // Créer automatiquement la progression linguistique
        language_progress: {
          create: {
            current_level: 'A1.1',
            total_lessons: 0,
            completed_lessons: 0,
            total_quizzes: 0,
            passed_quizzes: 0,
            listening_score: 0,
            speaking_score: 0,
            reading_score: 0,
            writing_score: 0,
            current_streak: 0,
            longest_streak: 0
          }
        }
      },
      include: {
        company: true,
        language_progress: true
      }
    });

    res.status(201).json({
      success: true,
      data: housekeeper,
      message: 'Housekeeper registered successfully'
    });

  } catch (error) {
    console.error('Error registering housekeeper:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/housekeeping/:id
// Récupérer le profil complet d'une femme de ménage
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            progression: true
          }
        },
        language_progress: {
          include: {
            quiz_responses: {
              take: 10,
              orderBy: { created_at: 'desc' },
              include: {
                question: {
                  select: {
                    level: true,
                    category: true,
                    difficulty: true
                  }
                }
              }
            },
            cleaning_responses: {
              take: 10,
              orderBy: { created_at: 'desc' },
              include: {
                question: {
                  select: {
                    category: true,
                    difficulty: true
                  }
                }
              }
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

    // Calculer des statistiques
    const progress = housekeeper.language_progress;
    const stats = {
      completion_rate: progress.total_lessons > 0
        ? (progress.completed_lessons / progress.total_lessons * 100).toFixed(1)
        : 0,
      quiz_success_rate: progress.total_quizzes > 0
        ? (progress.passed_quizzes / progress.total_quizzes * 100).toFixed(1)
        : 0,
      average_skill_score: (
        (progress.listening_score + progress.speaking_score +
         progress.reading_score + progress.writing_score) / 4
      ).toFixed(1),
      days_since_last_activity: progress.last_activity
        ? Math.floor((Date.now() - new Date(progress.last_activity).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    res.json({
      success: true,
      data: {
        ...housekeeper,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching housekeeper:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// PUT /api/housekeeping/:id
// Mettre à jour le profil d'une femme de ménage
// ============================================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Champs autorisés pour la mise à jour
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone',
      'native_language', 'target_language', 'active'
    ];

    // Filtrer et valider les champs
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const housekeeper = await prisma.housekeeper.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        language_progress: true
      }
    });

    res.json({
      success: true,
      data: housekeeper,
      message: 'Housekeeper updated successfully'
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Housekeeper not found'
      });
    }

    console.error('Error updating housekeeper:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/housekeeping/:id/progress
// Récupérer la progression détaillée (XP, badges, certifications)
// ============================================================================
router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        current_level: true,
        total_xp: true,
        level: true,
        badges: true,
        avatar_customization: true,
        language_progress: {
          include: {
            quiz_responses: {
              select: {
                is_correct: true,
                xp_earned: true,
                created_at: true,
                question: {
                  select: {
                    level: true,
                    category: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 50
            },
            cleaning_responses: {
              select: {
                is_correct: true,
                xp_earned: true,
                created_at: true,
                question: {
                  select: {
                    category: true
                  }
                }
              },
              orderBy: { created_at: 'desc' },
              take: 50
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

    const progress = housekeeper.language_progress;

    // Calculer XP par catégorie
    const xpByCategory = {};
    progress.quiz_responses.forEach(response => {
      const category = response.question.category;
      if (!xpByCategory[category]) {
        xpByCategory[category] = 0;
      }
      xpByCategory[category] += response.xp_earned;
    });

    // Calculer XP par niveau
    const xpByLevel = {};
    progress.quiz_responses.forEach(response => {
      const level = response.question.level;
      if (!xpByLevel[level]) {
        xpByLevel[level] = 0;
      }
      xpByLevel[level] += response.xp_earned;
    });

    // Progression vers le prochain niveau
    const xpForNextLevel = housekeeper.level * 1000; // 1000 XP par niveau
    const xpProgress = (housekeeper.total_xp % 1000) / 1000 * 100;

    // Graphique d'activité (7 derniers jours)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const activityByDay = last7Days.map(day => {
      const dayResponses = [
        ...progress.quiz_responses,
        ...progress.cleaning_responses
      ].filter(r => r.created_at.toISOString().startsWith(day));

      return {
        date: day,
        questions_answered: dayResponses.length,
        xp_earned: dayResponses.reduce((sum, r) => sum + r.xp_earned, 0)
      };
    });

    res.json({
      success: true,
      data: {
        housekeeper: {
          id: housekeeper.id,
          name: `${housekeeper.first_name} ${housekeeper.last_name}`,
          current_level: housekeeper.current_level,
          total_xp: housekeeper.total_xp,
          level: housekeeper.level,
          badges_count: Array.isArray(housekeeper.badges) ? housekeeper.badges.length : 0,
          badges: housekeeper.badges
        },
        progression: {
          current_level: progress.current_level,
          completed_lessons: progress.completed_lessons,
          total_lessons: progress.total_lessons,
          passed_quizzes: progress.passed_quizzes,
          total_quizzes: progress.total_quizzes,
          completion_rate: progress.total_lessons > 0
            ? (progress.completed_lessons / progress.total_lessons * 100).toFixed(1)
            : 0,
          quiz_success_rate: progress.total_quizzes > 0
            ? (progress.passed_quizzes / progress.total_quizzes * 100).toFixed(1)
            : 0
        },
        skills: {
          listening: progress.listening_score,
          speaking: progress.speaking_score,
          reading: progress.reading_score,
          writing: progress.writing_score,
          average: ((progress.listening_score + progress.speaking_score +
                     progress.reading_score + progress.writing_score) / 4).toFixed(1)
        },
        streak: {
          current: progress.current_streak,
          longest: progress.longest_streak,
          last_activity: progress.last_activity
        },
        certification: {
          certified_level: progress.certified_level,
          certification_date: progress.certification_date
        },
        xp_breakdown: {
          by_category: xpByCategory,
          by_level: xpByLevel,
          next_level: {
            current: housekeeper.level,
            next: housekeeper.level + 1,
            xp_required: xpForNextLevel,
            xp_current: housekeeper.total_xp % 1000,
            progress_percentage: xpProgress.toFixed(1)
          }
        },
        activity_chart: activityByDay
      }
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/housekeeping/:id/avatar
// Personnaliser l'avatar 3D
// ============================================================================
router.post('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar_customization } = req.body;

    if (!avatar_customization || typeof avatar_customization !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid avatar_customization object'
      });
    }

    // Valider les champs de customisation
    const validFields = [
      'skin_color', 'hair_style', 'hair_color', 'eye_color',
      'outfit', 'accessories', 'background', 'emote'
    ];

    const customization = {};
    for (const field of validFields) {
      if (avatar_customization[field] !== undefined) {
        customization[field] = avatar_customization[field];
      }
    }

    const housekeeper = await prisma.housekeeper.update({
      where: { id },
      data: {
        avatar_customization: customization
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_id: true,
        avatar_customization: true
      }
    });

    res.json({
      success: true,
      data: housekeeper,
      message: 'Avatar customized successfully'
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Housekeeper not found'
      });
    }

    console.error('Error customizing avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/housekeeping/company/:companyId
// Lister toutes les femmes de ménage d'une société
// ============================================================================
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { active, level, sort = 'name' } = req.query;

    // Construire les filtres
    const where = { company_id: companyId };

    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (level) {
      where.current_level = level;
    }

    // Déterminer le tri
    let orderBy = {};
    switch (sort) {
      case 'xp':
        orderBy = { total_xp: 'desc' };
        break;
      case 'level':
        orderBy = { level: 'desc' };
        break;
      case 'recent':
        orderBy = { created_at: 'desc' };
        break;
      case 'name':
      default:
        orderBy = { last_name: 'asc' };
    }

    const housekeepers = await prisma.housekeeper.findMany({
      where,
      orderBy,
      include: {
        language_progress: {
          select: {
            current_level: true,
            completed_lessons: true,
            total_lessons: true,
            passed_quizzes: true,
            total_quizzes: true,
            current_streak: true,
            certified_level: true
          }
        }
      }
    });

    // Calculer les statistiques de la société
    const companyStats = {
      total_housekeepers: housekeepers.length,
      active_housekeepers: housekeepers.filter(h => h.active).length,
      total_xp: housekeepers.reduce((sum, h) => sum + h.total_xp, 0),
      average_level: housekeepers.length > 0
        ? (housekeepers.reduce((sum, h) => sum + h.level, 0) / housekeepers.length).toFixed(1)
        : 0,
      certified_count: housekeepers.filter(h =>
        h.language_progress?.certified_level
      ).length,
      levels_distribution: {}
    };

    // Distribution par niveau
    housekeepers.forEach(h => {
      const level = h.current_level;
      if (!companyStats.levels_distribution[level]) {
        companyStats.levels_distribution[level] = 0;
      }
      companyStats.levels_distribution[level]++;
    });

    res.json({
      success: true,
      data: {
        company_id: companyId,
        stats: companyStats,
        housekeepers: housekeepers.map(h => ({
          id: h.id,
          name: `${h.first_name} ${h.last_name}`,
          email: h.email,
          phone: h.phone,
          native_language: h.native_language,
          target_language: h.target_language,
          current_level: h.current_level,
          total_xp: h.total_xp,
          level: h.level,
          badges_count: Array.isArray(h.badges) ? h.badges.length : 0,
          active: h.active,
          created_at: h.created_at,
          progress: h.language_progress ? {
            completion_rate: h.language_progress.total_lessons > 0
              ? (h.language_progress.completed_lessons / h.language_progress.total_lessons * 100).toFixed(1)
              : 0,
            quiz_success_rate: h.language_progress.total_quizzes > 0
              ? (h.language_progress.passed_quizzes / h.language_progress.total_quizzes * 100).toFixed(1)
              : 0,
            current_streak: h.language_progress.current_streak,
            certified: !!h.language_progress.certified_level
          } : null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching company housekeepers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// Gestion des erreurs Prisma
// ============================================================================
router.use((error, req, res, next) => {
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  next(error);
});

export default router;
