/**
 * XP Service - Calcule les points d'expérience et gère les niveaux
 * @module services/xp.service
 */

/**
 * Calcule les XP gagnés selon la difficulté et la performance
 * @param {Object} params
 * @param {string} params.difficulty - Niveau de difficulté (A1.1 à C2)
 * @param {boolean} params.isCorrect - Réponse correcte ou non
 * @param {number} params.timeSpent - Temps en secondes
 * @param {number} params.streak - Série actuelle de bonnes réponses
 * @param {boolean} params.firstAttempt - Premier essai ou pas
 * @returns {number} Points XP gagnés
 */
function calculateXP({ difficulty, isCorrect, timeSpent, streak = 0, firstAttempt = true }) {
  if (!isCorrect) return 0;

  // Base XP selon difficulté CECRL
  const baseXP = {
    'A1.1': 10,
    'A1.2': 15,
    'A2.1': 20,
    'A2.2': 25,
    'B1.1': 30,
    'B1.2': 35,
    'B2.1': 40,
    'B2.2': 45,
    'C1': 50,
    'C2': 60
  };

  let xp = baseXP[difficulty] || 10;

  // Bonus premier essai (+50%)
  if (firstAttempt) {
    xp *= 1.5;
  }

  // Bonus streak (série de bonnes réponses)
  if (streak >= 5 && streak < 10) {
    xp *= 1.2; // +20%
  } else if (streak >= 10 && streak < 20) {
    xp *= 1.4; // +40%
  } else if (streak >= 20) {
    xp *= 1.6; // +60%
  }

  // Bonus vitesse (réponse rapide)
  const expectedTime = {
    'A1.1': 30, 'A1.2': 25, 'A2.1': 20, 'A2.2': 18,
    'B1.1': 15, 'B1.2': 13, 'B2.1': 12, 'B2.2': 10,
    'C1': 9, 'C2': 8
  };

  const expected = expectedTime[difficulty] || 20;
  if (timeSpent <= expected * 0.7) {
    xp *= 1.3; // +30% si très rapide
  } else if (timeSpent <= expected) {
    xp *= 1.15; // +15% si rapide
  }

  return Math.round(xp);
}

/**
 * Calcule le niveau actuel selon les XP totaux
 * Formule: 1000 XP par niveau
 * @param {number} totalXP - Points XP totaux
 * @returns {number} Niveau actuel
 */
function calculateLevel(totalXP) {
  return Math.floor(totalXP / 1000) + 1;
}

/**
 * Calcule les XP nécessaires pour le prochain niveau
 * @param {number} currentLevel - Niveau actuel
 * @returns {number} XP requis pour level up
 */
function xpForNextLevel(currentLevel) {
  return currentLevel * 1000;
}

/**
 * Calcule la progression vers le prochain niveau (%)
 * @param {number} totalXP - XP totaux
 * @param {number} currentLevel - Niveau actuel
 * @returns {number} Pourcentage (0-100)
 */
function calculateLevelProgress(totalXP, currentLevel) {
  const xpInCurrentLevel = totalXP % 1000;
  return Math.round((xpInCurrentLevel / 1000) * 100);
}

/**
 * Vérifie si un level up a eu lieu
 * @param {number} oldXP - XP avant action
 * @param {number} newXP - XP après action
 * @returns {Object} { leveledUp: boolean, oldLevel: number, newLevel: number }
 */
function checkLevelUp(oldXP, newXP) {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel
  };
}

/**
 * Calcule XP pour quiz communication (présentation propriétaires)
 * @param {Object} params
 * @param {string} params.moduleType - Type de module (introduction, service, situations, attentes)
 * @param {number} params.score - Score obtenu (0-100)
 * @param {number} params.timeSpent - Temps passé en secondes
 * @returns {number} XP gagnés
 */
function calculateCommunicationXP({ moduleType, score, timeSpent }) {
  const baseXP = {
    'introduction': 25,
    'service': 30,
    'situations': 35,
    'attentes': 40
  };

  let xp = baseXP[moduleType] || 25;

  // Bonus selon le score
  if (score >= 90) {
    xp *= 2.0; // Score excellent
  } else if (score >= 80) {
    xp *= 1.5; // Bon score
  } else if (score >= 70) {
    xp *= 1.2; // Score acceptable
  } else if (score >= 60) {
    xp *= 1.0; // Score minimum
  } else {
    xp *= 0.5; // Score faible mais effort reconnu
  }

  return Math.round(xp);
}

/**
 * Calcule XP pour quiz nettoyage (certification hôtelière)
 * @param {Object} params
 * @param {string} params.hotelStandard - Standard hôtel (3-star, 4-star, 5-star, luxury)
 * @param {boolean} params.isCorrect - Réponse correcte
 * @param {boolean} params.isCertification - Question de certification
 * @returns {number} XP gagnés
 */
function calculateCleaningXP({ hotelStandard, isCorrect, isCertification = false }) {
  if (!isCorrect) return 0;

  const baseXP = {
    '3-star': 15,
    '4-star': 25,
    '5-star': 35,
    'luxury': 50
  };

  let xp = baseXP[hotelStandard] || 15;

  // Bonus certification (+100%)
  if (isCertification) {
    xp *= 2.0;
  }

  return Math.round(xp);
}

/**
 * Calcule XP pour achat marketplace (engagement économique)
 * @param {number} itemPrice - Prix de l'item en XP
 * @returns {number} XP bonus (5% du prix dépensé)
 */
function calculateMarketplaceXP(itemPrice) {
  // Bonus de 5% des XP dépensés pour encourager économie
  return Math.round(itemPrice * 0.05);
}

/**
 * Calcule XP pour trade P2P (interaction sociale)
 * @param {number} tradeValue - Valeur du trade en XP
 * @returns {number} XP bonus
 */
function calculateTradeXP(tradeValue) {
  // Bonus de 10% de la valeur pour encourager échanges
  return Math.round(tradeValue * 0.1);
}

/**
 * Calcule XP pour quête héroïque (Hero Quest)
 * @param {Object} params
 * @param {number} params.worldLevel - Monde (1-5)
 * @param {string} params.questType - Type (main, side, boss, heritage)
 * @param {number} params.completion - Pourcentage complétion (0-100)
 * @returns {number} XP gagnés
 */
function calculateQuestXP({ worldLevel, questType, completion }) {
  const baseXP = {
    1: 100,  // Monde 1: L'Arrivée
    2: 200,  // Monde 2: Premières Lueurs
    3: 400,  // Monde 3: L'Aube
    4: 800,  // Monde 4: Le Jour
    5: 1500  // Monde 5: Le Monde Libre
  };

  let xp = baseXP[worldLevel] || 100;

  // Multiplicateur selon type de quête
  const typeMultiplier = {
    'main': 1.0,      // Quête principale
    'side': 0.6,      // Quête secondaire
    'boss': 2.5,      // Boss battle
    'heritage': 3.0   // Quête héritage (transmission enfants)
  };

  xp *= (typeMultiplier[questType] || 1.0);

  // Ajuster selon complétion
  xp *= (completion / 100);

  return Math.round(xp);
}

/**
 * Calcule XP pour interaction avec Sage (professeur AI)
 * @param {Object} params
 * @param {number} params.hintsUsed - Nombre d'indices utilisés
 * @param {boolean} params.solvedAfterHint - A résolu après l'indice
 * @returns {number} XP gagnés (réduit si trop d'indices)
 */
function calculateSageInteractionXP({ hintsUsed, solvedAfterHint }) {
  let xp = 5; // Base pour interaction

  if (solvedAfterHint) {
    xp += 10; // Bonus résolution
  }

  // Pénalité si trop d'indices (encourage autonomie)
  if (hintsUsed > 3) {
    xp *= 0.5;
  } else if (hintsUsed > 1) {
    xp *= 0.8;
  }

  return Math.round(xp);
}

/**
 * Calcule XP pour mode spaced repetition
 * @param {Object} params
 * @param {number} params.intervalDays - Intervalle en jours (1, 3, 7, 14, 30)
 * @param {boolean} params.remembered - A bien mémorisé
 * @returns {number} XP gagnés
 */
function calculateSpacedRepetitionXP({ intervalDays, remembered }) {
  if (!remembered) return 0;

  const xpByInterval = {
    1: 5,    // Jour 1
    3: 10,   // Jour 3
    7: 20,   // Semaine 1
    14: 35,  // Semaine 2
    30: 50   // Mois 1
  };

  return xpByInterval[intervalDays] || 5;
}

/**
 * Calcule XP pour double traduction
 * @param {Object} params
 * @param {string} params.nativeLanguage - Langue native (ar, es, pt, pl, ro, ru, zh, en)
 * @param {string} params.direction - Direction (native_to_french, french_to_native)
 * @param {boolean} params.isCorrect - Réponse correcte
 * @returns {number} XP gagnés
 */
function calculateDoubleTranslationXP({ nativeLanguage, direction, isCorrect }) {
  if (!isCorrect) return 0;

  let xp = 20; // Base

  // Bonus pour traduction vers français (plus difficile)
  if (direction === 'native_to_french') {
    xp *= 1.3;
  }

  // Bonus pour langues avec alphabets différents
  const complexLanguages = ['ar', 'ru', 'zh'];
  if (complexLanguages.includes(nativeLanguage)) {
    xp *= 1.4;
  }

  return Math.round(xp);
}

/**
 * Calcule XP pour dictée vocale
 * @param {Object} params
 * @param {number} params.pronunciationScore - Score prononciation (0-100)
 * @param {number} params.attempts - Nombre de tentatives
 * @returns {number} XP gagnés
 */
function calculateVoiceDictationXP({ pronunciationScore, attempts }) {
  let xp = 15; // Base

  // Bonus selon score prononciation
  if (pronunciationScore >= 90) {
    xp *= 2.0; // Excellent
  } else if (pronunciationScore >= 80) {
    xp *= 1.5; // Très bien
  } else if (pronunciationScore >= 70) {
    xp *= 1.2; // Bien
  }

  // Pénalité tentatives multiples
  if (attempts > 3) {
    xp *= 0.7;
  } else if (attempts > 1) {
    xp *= 0.9;
  }

  return Math.round(xp);
}

/**
 * Système de multiplicateur de XP global
 * Appliqué selon événements spéciaux, achievements, etc.
 * @param {number} baseXP - XP de base
 * @param {Object} multipliers
 * @param {number} multipliers.eventBonus - Bonus événement (ex: 1.5 = +50%)
 * @param {number} multipliers.premiumBonus - Bonus premium (ex: 1.25 = +25%)
 * @param {number} multipliers.weekendBonus - Bonus weekend (ex: 1.2 = +20%)
 * @returns {number} XP final avec multiplicateurs
 */
function applyXPMultipliers(baseXP, multipliers = {}) {
  let finalXP = baseXP;

  if (multipliers.eventBonus) {
    finalXP *= multipliers.eventBonus;
  }

  if (multipliers.premiumBonus) {
    finalXP *= multipliers.premiumBonus;
  }

  if (multipliers.weekendBonus) {
    finalXP *= multipliers.weekendBonus;
  }

  return Math.round(finalXP);
}

export {
  // Core XP functions
  calculateXP,
  calculateLevel,
  xpForNextLevel,
  calculateLevelProgress,
  checkLevelUp,

  // Specialized XP calculations
  calculateCommunicationXP,
  calculateCleaningXP,
  calculateMarketplaceXP,
  calculateTradeXP,
  calculateQuestXP,
  calculateSageInteractionXP,
  calculateSpacedRepetitionXP,
  calculateDoubleTranslationXP,
  calculateVoiceDictationXP,

  // Multipliers
  applyXPMultipliers
};
