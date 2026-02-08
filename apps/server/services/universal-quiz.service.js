import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 🎯 Universal Quiz Service
 *
 * Logique métier pour le système de quiz universel
 * - Sélection intelligente de questions
 * - Validation des réponses (incluant fuzzy match pour dictée)
 * - Calcul XP adaptatif
 * - Tracking progression
 */

// ========================================
// XP CALCULATION - Basé sur difficulté
// ========================================
const XP_BASE = {
  'A1.0': 10,
  'A1.1': 12,
  'A1.2': 15,
  'A2.1': 18,
  'A2.2': 20,
  'B1.1': 25,
  'B1.2': 30,
  'B2.1': 35,
  'B2.2': 40,
  'C1.1': 50,
  'C1.2': 60,
  'C2': 80
};

const QUESTION_TYPE_MULTIPLIERS = {
  'ALPHABET': 0.8,           // Plus simple
  'AUDIO_TO_IMAGE': 1.0,     // Basique
  'TEXT_TO_IMAGE': 1.0,
  'IMAGE_TO_TEXT': 1.2,      // Requiert vocabulaire
  'COLOR_DESCRIPTION': 1.0,
  'MATCHING': 1.3,           // Multiple items
  'AUDIO_TO_TEXT': 1.5,      // Dictée difficile
  'GENDER_SELECTION': 1.1,
  'CONJUGATION': 1.4,        // Grammaire complexe
  'FILL_BLANK': 1.3
};

/**
 * Calculate XP earned for a question
 */
function calculateQuestionXP(question, isCorrect, timeTakenSeconds = null) {
  const baseXP = XP_BASE[question.difficulty_level] || 15;
  const typeMultiplier = QUESTION_TYPE_MULTIPLIERS[question.question_type] || 1.0;

  let xp = Math.round(baseXP * typeMultiplier);

  // Bonus si correct
  if (isCorrect) {
    // Speed bonus (si répondu en moins de 10s)
    if (timeTakenSeconds && timeTakenSeconds < 10) {
      xp = Math.round(xp * 1.2);
    }
  } else {
    // Partial XP si incorrect (encouragement)
    xp = Math.round(xp * 0.3);
  }

  return xp;
}

// ========================================
// FUZZY MATCHING - Pour dictée (AUDIO_TO_TEXT)
// ========================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Normalize text for comparison (lowercase, remove punctuation)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;!?'"]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if user answer matches expected answer (with fuzzy logic)
 */
function checkFuzzyMatch(userAnswer, expectedAnswer, minSimilarity = 0.8) {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedExpected = normalizeText(expectedAnswer);

  // Exact match
  if (normalizedUser === normalizedExpected) {
    return { match: true, similarity: 1.0, method: 'exact' };
  }

  // Fuzzy match
  const similarity = similarityRatio(normalizedUser, normalizedExpected);
  const match = similarity >= minSimilarity;

  return { match, similarity, method: 'fuzzy' };
}

// ========================================
// QUESTION VALIDATION
// ========================================

/**
 * Validate user answer for any question type
 */
function validateAnswer(question, userAnswer) {
  const questionType = question.question_type;
  const correctAnswer = question.correct_answer;

  switch (questionType) {
    case 'ALPHABET':
    case 'AUDIO_TO_IMAGE':
    case 'TEXT_TO_IMAGE':
    case 'IMAGE_TO_TEXT':
    case 'COLOR_DESCRIPTION':
    case 'GENDER_SELECTION':
    case 'CONJUGATION':
    case 'FILL_BLANK':
      // Simple ID comparison
      return {
        isCorrect: userAnswer.id === correctAnswer.id,
        correctAnswer: correctAnswer,
        method: 'id_match'
      };

    case 'AUDIO_TO_TEXT':
      // Fuzzy text matching
      const options = question.options;
      const expectedAnswer = options.expected_answer || correctAnswer.text;
      const minSimilarity = options.min_similarity || 0.8;
      const fuzzyMatch = options.fuzzy_match !== false;

      if (fuzzyMatch) {
        const result = checkFuzzyMatch(userAnswer.text, expectedAnswer, minSimilarity);
        return {
          isCorrect: result.match,
          correctAnswer: { text: expectedAnswer },
          similarity: result.similarity,
          method: result.method
        };
      } else {
        // Exact match required
        return {
          isCorrect: normalizeText(userAnswer.text) === normalizeText(expectedAnswer),
          correctAnswer: { text: expectedAnswer },
          method: 'exact'
        };
      }

    case 'MATCHING':
      // Check if all pairs match
      const userMatches = userAnswer.matches || [];
      const correctMatches = correctAnswer.matches || [];

      const allCorrect = correctMatches.every(correctPair =>
        userMatches.includes(correctPair)
      );

      return {
        isCorrect: allCorrect && userMatches.length === correctMatches.length,
        correctAnswer: correctAnswer,
        partialScore: userMatches.filter(um => correctMatches.includes(um)).length,
        totalPairs: correctMatches.length,
        method: 'pair_matching'
      };

    default:
      throw new Error(`Unknown question type: ${questionType}`);
  }
}

// ========================================
// ADAPTIVE QUESTION SELECTION
// ========================================

/**
 * Get recommended difficulty level for user based on performance
 */
async function getRecommendedLevel(housekeeperId) {
  // Get recent performance (last 20 responses)
  const recentResponses = await prisma.universalQuizResponse.findMany({
    where: { housekeeper_id: housekeeperId },
    orderBy: { created_at: 'desc' },
    take: 20,
    include: { question: true }
  });

  if (recentResponses.length === 0) {
    return 'A1.0'; // Default for new users
  }

  // Calculate accuracy
  const correctCount = recentResponses.filter(r => r.is_correct).length;
  const accuracy = correctCount / recentResponses.length;

  // Get current average level
  const levelValues = {
    'A1.0': 1, 'A1.1': 2, 'A1.2': 3,
    'A2.1': 4, 'A2.2': 5,
    'B1.1': 6, 'B1.2': 7,
    'B2.1': 8, 'B2.2': 9,
    'C1.1': 10, 'C1.2': 11, 'C2': 12
  };

  const reverseLevelMap = Object.fromEntries(
    Object.entries(levelValues).map(([k, v]) => [v, k])
  );

  const avgLevelValue = recentResponses.reduce((sum, r) => {
    return sum + (levelValues[r.question.difficulty_level] || 1);
  }, 0) / recentResponses.length;

  // Adaptive logic
  let recommendedLevelValue = Math.round(avgLevelValue);

  if (accuracy > 0.8) {
    // User is doing well, increase difficulty
    recommendedLevelValue = Math.min(12, recommendedLevelValue + 1);
  } else if (accuracy < 0.5) {
    // User struggling, decrease difficulty
    recommendedLevelValue = Math.max(1, recommendedLevelValue - 1);
  }

  return reverseLevelMap[recommendedLevelValue] || 'A1.1';
}

/**
 * Select next question intelligently
 */
async function selectNextQuestion(housekeeperId, filters = {}) {
  const {
    questionType,
    category,
    subcategory,
    skillCategory,
    count = 1,
    excludeIds = []
  } = filters;

  // Get recommended level if not specified
  let difficultyLevel = filters.difficultyLevel;
  if (!difficultyLevel) {
    difficultyLevel = await getRecommendedLevel(housekeeperId);
  }

  // Get questions user hasn't seen recently (last 50)
  const recentQuestionIds = await prisma.universalQuizResponse.findMany({
    where: { housekeeper_id: housekeeperId },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: { question_id: true }
  }).then(responses => responses.map(r => r.question_id));

  // Build query filters
  const where = {
    id: { notIn: [...recentQuestionIds, ...excludeIds] }
  };

  if (questionType) where.question_type = questionType;
  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (skillCategory) where.skill_category = skillCategory;

  // Get questions at recommended level, or adjacent levels if not enough
  const levels = [difficultyLevel];
  const levelOrder = ['A1.0', 'A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2'];
  const currentIndex = levelOrder.indexOf(difficultyLevel);

  if (currentIndex > 0) levels.push(levelOrder[currentIndex - 1]); // Previous level
  if (currentIndex < levelOrder.length - 1) levels.push(levelOrder[currentIndex + 1]); // Next level

  where.difficulty_level = { in: levels };

  // Get questions
  const questions = await prisma.universalQuizQuestion.findMany({
    where,
    take: count * 3, // Get more than needed for randomization
    orderBy: { times_shown: 'asc' } // Prioritize less-shown questions
  });

  // Shuffle and limit
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * Create a new quiz session
 */
async function createQuizSession(housekeeperId, sessionConfig = {}) {
  const {
    questionCount = 10,
    questionType,
    category,
    difficultyLevel,
    skillCategory
  } = sessionConfig;

  // Select questions
  const questions = await selectNextQuestion(housekeeperId, {
    questionType,
    category,
    difficultyLevel,
    skillCategory,
    count: questionCount
  });

  if (questions.length === 0) {
    throw new Error('No questions available with the specified filters');
  }

  // Calculate total XP available
  const totalXPAvailable = questions.reduce((sum, q) => {
    return sum + calculateQuestionXP(q, true); // Max XP if all correct
  }, 0);

  const sessionId = `session_${Date.now()}_${housekeeperId}`;

  return {
    session_id: sessionId,
    housekeeper_id: housekeeperId,
    questions: questions.map(q => ({
      id: q.id,
      question_type: q.question_type,
      difficulty_level: q.difficulty_level,
      category: q.category,
      skill_category: q.skill_category
    })),
    total_questions: questions.length,
    total_xp_available: totalXPAvailable,
    started_at: new Date()
  };
}

/**
 * Get full question data (for rendering)
 */
async function getQuestionById(questionId) {
  const question = await prisma.universalQuizQuestion.findUnique({
    where: { id: questionId }
  });

  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  // Increment times_shown
  await prisma.universalQuizQuestion.update({
    where: { id: questionId },
    data: { times_shown: { increment: 1 } }
  });

  // Return question WITHOUT correct_answer (security)
  const { correct_answer, ...questionWithoutAnswer } = question;

  return questionWithoutAnswer;
}

/**
 * Submit and validate a response
 */
async function submitResponse(responseData) {
  const {
    housekeeper_id,
    question_id,
    user_answer,
    session_id,
    time_taken_seconds
  } = responseData;

  // Get question with correct answer
  const question = await prisma.universalQuizQuestion.findUnique({
    where: { id: question_id }
  });

  if (!question) {
    throw new Error(`Question not found: ${question_id}`);
  }

  // Validate answer
  const validation = validateAnswer(question, user_answer);

  // Calculate XP
  const xpEarned = calculateQuestionXP(question, validation.isCorrect, time_taken_seconds);

  // Save response
  const response = await prisma.universalQuizResponse.create({
    data: {
      housekeeper_id,
      question_id,
      user_answer,
      is_correct: validation.isCorrect,
      session_id,
      time_taken_seconds,
      xp_earned: xpEarned
    }
  });

  // Update question stats
  await prisma.universalQuizQuestion.update({
    where: { id: question_id },
    data: {
      times_correct: validation.isCorrect
        ? { increment: 1 }
        : undefined
    }
  });

  // Update housekeeper XP and level
  const housekeeper = await prisma.housekeeper.findUnique({
    where: { id: housekeeper_id }
  });

  if (housekeeper) {
    const newTotalXP = housekeeper.total_xp + xpEarned;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP = 1 level

    await prisma.housekeeper.update({
      where: { id: housekeeper_id },
      data: {
        total_xp: newTotalXP,
        level: newLevel
      }
    });
  }

  // Return response with explanation
  return {
    response_id: response.id,
    is_correct: validation.isCorrect,
    correct_answer: validation.correctAnswer,
    xp_earned: xpEarned,
    similarity: validation.similarity, // For dictée
    method: validation.method,
    explanation: {
      text: question.explanation_text,
      audio_url: question.explanation_audio_url
    },
    partial_score: validation.partialScore, // For matching
    total_pairs: validation.totalPairs
  };
}

/**
 * Get session statistics
 */
async function getSessionStats(sessionId) {
  const responses = await prisma.universalQuizResponse.findMany({
    where: { session_id: sessionId },
    include: { question: true }
  });

  if (responses.length === 0) {
    return null;
  }

  const totalQuestions = responses.length;
  const correctCount = responses.filter(r => r.is_correct).length;
  const totalXP = responses.reduce((sum, r) => sum + r.xp_earned, 0);
  const accuracy = (correctCount / totalQuestions) * 100;

  // Breakdown by category
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

  // Breakdown by skill
  const bySkill = {};
  responses.forEach(r => {
    const skill = r.question.skill_category;
    if (!bySkill[skill]) {
      bySkill[skill] = { total: 0, correct: 0, xp: 0 };
    }
    bySkill[skill].total++;
    if (r.is_correct) bySkill[skill].correct++;
    bySkill[skill].xp += r.xp_earned;
  });

  return {
    session_id: sessionId,
    total_questions: totalQuestions,
    correct_count: correctCount,
    incorrect_count: totalQuestions - correctCount,
    accuracy: Math.round(accuracy * 10) / 10,
    total_xp_earned: totalXP,
    breakdown_by_category: byCategory,
    breakdown_by_skill: bySkill,
    responses: responses.map(r => ({
      question_id: r.question_id,
      question_type: r.question.question_type,
      is_correct: r.is_correct,
      xp_earned: r.xp_earned,
      time_taken: r.time_taken_seconds
    }))
  };
}

/**
 * Get user overall stats
 */
async function getUserStats(housekeeperId) {
  const responses = await prisma.universalQuizResponse.findMany({
    where: { housekeeper_id: housekeeperId },
    include: { question: true }
  });

  const housekeeper = await prisma.housekeeper.findUnique({
    where: { id: housekeeperId }
  });

  if (!housekeeper) {
    throw new Error(`Housekeeper not found: ${housekeeperId}`);
  }

  const totalQuestions = responses.length;
  const correctCount = responses.filter(r => r.is_correct).length;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // By question type
  const byType = {};
  responses.forEach(r => {
    const type = r.question.question_type;
    if (!byType[type]) {
      byType[type] = { total: 0, correct: 0, accuracy: 0 };
    }
    byType[type].total++;
    if (r.is_correct) byType[type].correct++;
  });

  Object.keys(byType).forEach(type => {
    byType[type].accuracy = Math.round((byType[type].correct / byType[type].total) * 100);
  });

  // By level
  const byLevel = {};
  responses.forEach(r => {
    const level = r.question.difficulty_level;
    if (!byLevel[level]) {
      byLevel[level] = { total: 0, correct: 0, accuracy: 0 };
    }
    byLevel[level].total++;
    if (r.is_correct) byLevel[level].correct++;
  });

  Object.keys(byLevel).forEach(level => {
    byLevel[level].accuracy = Math.round((byLevel[level].correct / byLevel[level].total) * 100);
  });

  // Recent activity (last 10)
  const recentActivity = responses
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(r => ({
      question_type: r.question.question_type,
      category: r.question.category,
      difficulty_level: r.question.difficulty_level,
      is_correct: r.is_correct,
      xp_earned: r.xp_earned,
      created_at: r.created_at
    }));

  return {
    housekeeper_id: housekeeperId,
    level: housekeeper.level,
    total_xp: housekeeper.total_xp,
    total_questions_answered: totalQuestions,
    total_correct: correctCount,
    total_incorrect: totalQuestions - correctCount,
    overall_accuracy: Math.round(accuracy * 10) / 10,
    breakdown_by_type: byType,
    breakdown_by_level: byLevel,
    recent_activity: recentActivity,
    recommended_level: await getRecommendedLevel(housekeeperId)
  };
}

export {
  calculateQuestionXP,
  checkFuzzyMatch,
  validateAnswer,
  selectNextQuestion,
  createQuizSession,
  getQuestionById,
  submitResponse,
  getSessionStats,
  getUserStats,
  getRecommendedLevel
};
