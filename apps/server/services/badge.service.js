/**
 * Badge Service - Gère le déblocage et la validation des badges
 * @module services/badge.service
 */

import { calculateLevel } from './xp.service.js';

/**
 * Définition de tous les badges disponibles dans Vectrys Lingua
 */
const BADGE_DEFINITIONS = {
  // Badges XP & Niveau
  'first_steps': {
    id: 'first_steps',
    name: 'Premiers Pas',
    description: 'Gagnez vos 100 premiers XP',
    category: 'progression',
    rarity: 'common',
    requirement: { type: 'total_xp', value: 100 },
    icon: '👣',
    xp_reward: 50
  },
  'rising_star': {
    id: 'rising_star',
    name: 'Étoile Montante',
    description: 'Atteignez le niveau 5',
    category: 'progression',
    rarity: 'common',
    requirement: { type: 'level', value: 5 },
    icon: '⭐',
    xp_reward: 200
  },
  'dedicated_learner': {
    id: 'dedicated_learner',
    name: 'Apprenant Dévoué',
    description: 'Atteignez le niveau 10',
    category: 'progression',
    rarity: 'rare',
    requirement: { type: 'level', value: 10 },
    icon: '🎓',
    xp_reward: 500
  },
  'master_student': {
    id: 'master_student',
    name: 'Maître Étudiant',
    description: 'Atteignez le niveau 25',
    category: 'progression',
    rarity: 'epic',
    requirement: { type: 'level', value: 25 },
    icon: '👑',
    xp_reward: 1500
  },
  'legendary_scholar': {
    id: 'legendary_scholar',
    name: 'Érudit Légendaire',
    description: 'Atteignez le niveau 50',
    category: 'progression',
    rarity: 'legendary',
    requirement: { type: 'level', value: 50 },
    icon: '🏆',
    xp_reward: 5000
  },

  // Badges Quiz Langue
  'language_novice': {
    id: 'language_novice',
    name: 'Novice Linguistique',
    description: 'Répondez correctement à 10 questions de langue',
    category: 'language',
    rarity: 'common',
    requirement: { type: 'correct_answers', quiz_type: 'language', value: 10 },
    icon: '📚',
    xp_reward: 100
  },
  'polyglot': {
    id: 'polyglot',
    name: 'Polyglotte',
    description: 'Répondez correctement à 100 questions de langue',
    category: 'language',
    rarity: 'rare',
    requirement: { type: 'correct_answers', quiz_type: 'language', value: 100 },
    icon: '🗣️',
    xp_reward: 500
  },
  'linguistic_master': {
    id: 'linguistic_master',
    name: 'Maître Linguistique',
    description: 'Répondez correctement à 500 questions de langue',
    category: 'language',
    rarity: 'epic',
    requirement: { type: 'correct_answers', quiz_type: 'language', value: 500 },
    icon: '🎭',
    xp_reward: 2000
  },

  // Badges Streak (Série)
  'on_fire': {
    id: 'on_fire',
    name: 'En Feu',
    description: 'Obtenez une série de 10 bonnes réponses',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'max_streak', value: 10 },
    icon: '🔥',
    xp_reward: 150
  },
  'unstoppable': {
    id: 'unstoppable',
    name: 'Inarrêtable',
    description: 'Obtenez une série de 25 bonnes réponses',
    category: 'streak',
    rarity: 'rare',
    requirement: { type: 'max_streak', value: 25 },
    icon: '💥',
    xp_reward: 400
  },
  'perfect_streak': {
    id: 'perfect_streak',
    name: 'Série Parfaite',
    description: 'Obtenez une série de 50 bonnes réponses',
    category: 'streak',
    rarity: 'epic',
    requirement: { type: 'max_streak', value: 50 },
    icon: '⚡',
    xp_reward: 1000
  },

  // Badges Nettoyage
  'cleaning_rookie': {
    id: 'cleaning_rookie',
    name: 'Recrue du Nettoyage',
    description: 'Répondez correctement à 10 questions de nettoyage',
    category: 'cleaning',
    rarity: 'common',
    requirement: { type: 'correct_answers', quiz_type: 'cleaning', value: 10 },
    icon: '🧹',
    xp_reward: 100
  },
  'three_star_certified': {
    id: 'three_star_certified',
    name: 'Certifié 3 Étoiles',
    description: 'Obtenez la certification hôtel 3 étoiles',
    category: 'cleaning',
    rarity: 'rare',
    requirement: { type: 'certification', hotel_standard: '3-star' },
    icon: '⭐⭐⭐',
    xp_reward: 300
  },
  'four_star_certified': {
    id: 'four_star_certified',
    name: 'Certifié 4 Étoiles',
    description: 'Obtenez la certification hôtel 4 étoiles',
    category: 'cleaning',
    rarity: 'epic',
    requirement: { type: 'certification', hotel_standard: '4-star' },
    icon: '✨✨✨✨',
    xp_reward: 600
  },
  'five_star_certified': {
    id: 'five_star_certified',
    name: 'Certifié 5 Étoiles',
    description: 'Obtenez la certification hôtel 5 étoiles',
    category: 'cleaning',
    rarity: 'legendary',
    requirement: { type: 'certification', hotel_standard: '5-star' },
    icon: '💎💎💎💎💎',
    xp_reward: 1200
  },
  'luxury_expert': {
    id: 'luxury_expert',
    name: 'Expert Luxe',
    description: 'Obtenez la certification hôtel de luxe',
    category: 'cleaning',
    rarity: 'mythic',
    requirement: { type: 'certification', hotel_standard: 'luxury' },
    icon: '👑💎',
    xp_reward: 2500
  },

  // Badges Communication
  'communicator': {
    id: 'communicator',
    name: 'Communicateur',
    description: 'Complétez le module Introduction',
    category: 'communication',
    rarity: 'common',
    requirement: { type: 'module_complete', module: 'introduction' },
    icon: '💬',
    xp_reward: 150
  },
  'service_excellence': {
    id: 'service_excellence',
    name: 'Excellence de Service',
    description: 'Complétez le module Service avec 90%+',
    category: 'communication',
    rarity: 'rare',
    requirement: { type: 'module_score', module: 'service', score: 90 },
    icon: '🌟',
    xp_reward: 400
  },
  'conflict_resolver': {
    id: 'conflict_resolver',
    name: 'Résolveur de Conflits',
    description: 'Complétez Situations Délicates avec 85%+',
    category: 'communication',
    rarity: 'epic',
    requirement: { type: 'module_score', module: 'situations', score: 85 },
    icon: '🤝',
    xp_reward: 600
  },

  // Badges Quête Héroïque
  'darkness_survivor': {
    id: 'darkness_survivor',
    name: 'Survivant des Ténèbres',
    description: 'Complétez le Monde 1: L\'Arrivée',
    category: 'quest',
    rarity: 'rare',
    requirement: { type: 'world_complete', world: 1 },
    icon: '🌑',
    xp_reward: 500
  },
  'dawn_bringer': {
    id: 'dawn_bringer',
    name: 'Porteur d\'Aube',
    description: 'Complétez le Monde 3: L\'Aube',
    category: 'quest',
    rarity: 'epic',
    requirement: { type: 'world_complete', world: 3 },
    icon: '🌅',
    xp_reward: 1500
  },
  'freedom_champion': {
    id: 'freedom_champion',
    name: 'Champion de la Liberté',
    description: 'Complétez le Monde 5: Le Monde Libre',
    category: 'quest',
    rarity: 'mythic',
    requirement: { type: 'world_complete', world: 5 },
    icon: '🦅',
    xp_reward: 5000
  },
  'heritage_keeper': {
    id: 'heritage_keeper',
    name: 'Gardien du Patrimoine',
    description: 'Complétez la quête Héritage (transmission enfants)',
    category: 'quest',
    rarity: 'legendary',
    requirement: { type: 'quest_complete', quest_type: 'heritage' },
    icon: '👨‍👩‍👧‍👦',
    xp_reward: 3000
  },

  // Badges Marketplace
  'collector': {
    id: 'collector',
    name: 'Collectionneur',
    description: 'Possédez 10 items différents',
    category: 'marketplace',
    rarity: 'common',
    requirement: { type: 'items_owned', value: 10 },
    icon: '🎒',
    xp_reward: 200
  },
  'trader': {
    id: 'trader',
    name: 'Commerçant',
    description: 'Effectuez 5 trades réussis',
    category: 'marketplace',
    rarity: 'rare',
    requirement: { type: 'trades_completed', value: 5 },
    icon: '🤝',
    xp_reward: 350
  },
  'wealthy': {
    id: 'wealthy',
    name: 'Fortune',
    description: 'Accumulez 10,000 XP de richesse totale',
    category: 'marketplace',
    rarity: 'epic',
    requirement: { type: 'wealth_accumulated', value: 10000 },
    icon: '💰',
    xp_reward: 800
  },

  // Badges Sage (Professeur AI)
  'sage_student': {
    id: 'sage_student',
    name: 'Étudiant de Sage',
    description: 'Interagissez 10 fois avec Sage',
    category: 'sage',
    rarity: 'common',
    requirement: { type: 'sage_interactions', value: 10 },
    icon: '👨‍🏫',
    xp_reward: 100
  },
  'independent_learner': {
    id: 'independent_learner',
    name: 'Apprenant Autonome',
    description: 'Résolvez 20 questions sans utiliser Sage',
    category: 'sage',
    rarity: 'rare',
    requirement: { type: 'no_hints_streak', value: 20 },
    icon: '🧠',
    xp_reward: 450
  },

  // Badges Spaced Repetition
  'memory_master': {
    id: 'memory_master',
    name: 'Maître de la Mémoire',
    description: 'Complétez 50 révisions espacées avec succès',
    category: 'learning',
    rarity: 'rare',
    requirement: { type: 'spaced_repetitions', value: 50 },
    icon: '🧩',
    xp_reward: 500
  },

  // Badges Spéciaux
  'speed_demon': {
    id: 'speed_demon',
    name: 'Démon de Vitesse',
    description: 'Répondez à 10 questions en moins de 5 secondes chacune',
    category: 'special',
    rarity: 'epic',
    requirement: { type: 'speed_answers', count: 10, max_time: 5 },
    icon: '⚡',
    xp_reward: 700
  },
  'night_owl': {
    id: 'night_owl',
    name: 'Oiseau de Nuit',
    description: 'Complétez 20 sessions entre 22h et 6h',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'night_sessions', value: 20 },
    icon: '🦉',
    xp_reward: 300
  },
  'early_bird': {
    id: 'early_bird',
    name: 'Lève-Tôt',
    description: 'Complétez 20 sessions entre 6h et 8h',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'morning_sessions', value: 20 },
    icon: '🐤',
    xp_reward: 300
  },
  'perfectionist': {
    id: 'perfectionist',
    name: 'Perfectionniste',
    description: 'Obtenez 100% sur 10 sessions différentes',
    category: 'special',
    rarity: 'legendary',
    requirement: { type: 'perfect_sessions', value: 10 },
    icon: '💯',
    xp_reward: 1500
  }
};

/**
 * Vérifie quels badges doivent être débloqués selon les stats utilisateur
 * @param {Object} userStats - Statistiques complètes de l'utilisateur
 * @param {Array<string>} currentBadges - Badges déjà débloqués
 * @returns {Array<Object>} Liste des nouveaux badges à débloquer
 */
function checkBadgeUnlocks(userStats, currentBadges = []) {
  const newBadges = [];

  for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
    // Skip si déjà débloqué
    if (currentBadges.includes(badgeId)) continue;

    const req = badge.requirement;
    let shouldUnlock = false;

    switch (req.type) {
      case 'total_xp':
        shouldUnlock = userStats.total_xp >= req.value;
        break;

      case 'level':
        const currentLevel = calculateLevel(userStats.total_xp);
        shouldUnlock = currentLevel >= req.value;
        break;

      case 'correct_answers':
        if (req.quiz_type === 'language') {
          shouldUnlock = userStats.language_correct_answers >= req.value;
        } else if (req.quiz_type === 'cleaning') {
          shouldUnlock = userStats.cleaning_correct_answers >= req.value;
        }
        break;

      case 'max_streak':
        shouldUnlock = userStats.max_streak >= req.value;
        break;

      case 'certification':
        const certifications = userStats.certifications || [];
        shouldUnlock = certifications.includes(req.hotel_standard);
        break;

      case 'module_complete':
        const completedModules = userStats.communication_modules_completed || [];
        shouldUnlock = completedModules.includes(req.module);
        break;

      case 'module_score':
        const moduleScores = userStats.communication_module_scores || {};
        shouldUnlock = moduleScores[req.module] >= req.score;
        break;

      case 'world_complete':
        const completedWorlds = userStats.worlds_completed || [];
        shouldUnlock = completedWorlds.includes(req.world);
        break;

      case 'quest_complete':
        const completedQuests = userStats.quests_completed || [];
        shouldUnlock = completedQuests.some(q => q.type === req.quest_type);
        break;

      case 'items_owned':
        const inventory = userStats.inventory || [];
        shouldUnlock = inventory.length >= req.value;
        break;

      case 'trades_completed':
        shouldUnlock = (userStats.trades_completed || 0) >= req.value;
        break;

      case 'wealth_accumulated':
        shouldUnlock = (userStats.wealth_accumulated || 0) >= req.value;
        break;

      case 'sage_interactions':
        shouldUnlock = (userStats.sage_interactions || 0) >= req.value;
        break;

      case 'no_hints_streak':
        shouldUnlock = (userStats.no_hints_streak || 0) >= req.value;
        break;

      case 'spaced_repetitions':
        shouldUnlock = (userStats.spaced_repetitions_completed || 0) >= req.value;
        break;

      case 'speed_answers':
        const speedAnswers = userStats.speed_answers || [];
        const qualifyingAnswers = speedAnswers.filter(a => a.time <= req.max_time);
        shouldUnlock = qualifyingAnswers.length >= req.count;
        break;

      case 'night_sessions':
        shouldUnlock = (userStats.night_sessions || 0) >= req.value;
        break;

      case 'morning_sessions':
        shouldUnlock = (userStats.morning_sessions || 0) >= req.value;
        break;

      case 'perfect_sessions':
        shouldUnlock = (userStats.perfect_sessions || 0) >= req.value;
        break;

      default:
        shouldUnlock = false;
    }

    if (shouldUnlock) {
      newBadges.push({
        ...badge,
        unlocked_at: new Date()
      });
    }
  }

  return newBadges;
}

/**
 * Récupère un badge par son ID
 * @param {string} badgeId
 * @returns {Object|null} Badge ou null
 */
function getBadgeById(badgeId) {
  return BADGE_DEFINITIONS[badgeId] || null;
}

/**
 * Récupère tous les badges d'une catégorie
 * @param {string} category
 * @returns {Array<Object>} Liste des badges
 */
function getBadgesByCategory(category) {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.category === category);
}

/**
 * Récupère tous les badges d'une rareté
 * @param {string} rarity - common, rare, epic, legendary, mythic
 * @returns {Array<Object>} Liste des badges
 */
function getBadgesByRarity(rarity) {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.rarity === rarity);
}

/**
 * Calcule la progression vers un badge spécifique
 * @param {string} badgeId
 * @param {Object} userStats
 * @returns {Object} { badge, progress_percent, progress_current, progress_target, is_unlocked }
 */
function getBadgeProgress(badgeId, userStats) {
  const badge = BADGE_DEFINITIONS[badgeId];
  if (!badge) return null;

  const req = badge.requirement;
  let current = 0;
  let target = 0;

  switch (req.type) {
    case 'total_xp':
      current = userStats.total_xp;
      target = req.value;
      break;

    case 'level':
      current = calculateLevel(userStats.total_xp);
      target = req.value;
      break;

    case 'correct_answers':
      if (req.quiz_type === 'language') {
        current = userStats.language_correct_answers;
      } else if (req.quiz_type === 'cleaning') {
        current = userStats.cleaning_correct_answers;
      }
      target = req.value;
      break;

    case 'max_streak':
      current = userStats.max_streak;
      target = req.value;
      break;

    // Pour les badges certification, module, etc. (pas de progression continue)
    default:
      return {
        badge,
        progress_percent: 0,
        progress_current: 0,
        progress_target: 1,
        is_unlocked: false
      };
  }

  const percent = Math.min(100, Math.round((current / target) * 100));

  return {
    badge,
    progress_percent: percent,
    progress_current: current,
    progress_target: target,
    is_unlocked: current >= target
  };
}

/**
 * Calcule le total de XP bonus reçus des badges
 * @param {Array<string>} unlockedBadges - Liste des IDs de badges débloqués
 * @returns {number} Total XP bonus
 */
function calculateBadgeXPBonus(unlockedBadges) {
  return unlockedBadges.reduce((total, badgeId) => {
    const badge = BADGE_DEFINITIONS[badgeId];
    return total + (badge?.xp_reward || 0);
  }, 0);
}

/**
 * Obtient les badges recommandés à débloquer (proches du seuil)
 * @param {Object} userStats
 * @param {Array<string>} currentBadges
 * @param {number} limit - Nombre maximum de suggestions
 * @returns {Array<Object>} Badges recommandés avec progression
 */
function getSuggestedBadges(userStats, currentBadges = [], limit = 5) {
  const suggestions = [];

  for (const badgeId of Object.keys(BADGE_DEFINITIONS)) {
    if (currentBadges.includes(badgeId)) continue;

    const progress = getBadgeProgress(badgeId, userStats);
    if (!progress) continue;

    // Suggérer si progression > 50%
    if (progress.progress_percent >= 50 && progress.progress_percent < 100) {
      suggestions.push({
        ...progress,
        urgency: progress.progress_percent // Plus proche = plus urgent
      });
    }
  }

  // Trier par urgence (les plus proches en premier)
  return suggestions
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, limit);
}

/**
 * Statistiques globales des badges
 * @param {Array<string>} unlockedBadges
 * @returns {Object} Statistiques
 */
function getBadgeStatistics(unlockedBadges) {
  const total = Object.keys(BADGE_DEFINITIONS).length;
  const unlocked = unlockedBadges.length;

  const byCategory = {};
  const byRarity = {};

  for (const badgeId of unlockedBadges) {
    const badge = BADGE_DEFINITIONS[badgeId];
    if (!badge) continue;

    byCategory[badge.category] = (byCategory[badge.category] || 0) + 1;
    byRarity[badge.rarity] = (byRarity[badge.rarity] || 0) + 1;
  }

  return {
    total_badges: total,
    unlocked_badges: unlocked,
    locked_badges: total - unlocked,
    completion_percent: Math.round((unlocked / total) * 100),
    by_category: byCategory,
    by_rarity: byRarity,
    total_xp_from_badges: calculateBadgeXPBonus(unlockedBadges)
  };
}

export {
  BADGE_DEFINITIONS,
  checkBadgeUnlocks,
  getBadgeById,
  getBadgesByCategory,
  getBadgesByRarity,
  getBadgeProgress,
  calculateBadgeXPBonus,
  getSuggestedBadges,
  getBadgeStatistics
};
