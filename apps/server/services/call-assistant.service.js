// ============================================================================
// VECTRYS — Call Assistant Service (Orchestrator)
// Manages call sessions, question detection, AI suggestion generation
// + Smart AI context (FATE, Interlocutor Detection, Doublespeak)
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/prisma.js';
import embeddingService from './embedding.service.js';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_CALL_ASSIST || process.env.ANTHROPIC_API_KEY });

// ─── QUESTION DETECTION ─────────────────────────────────────

const QUESTION_KEYWORDS = [
  // French question patterns
  'c\'est quoi', 'qu\'est-ce que', 'qu\'est-ce qu', 'comment', 'pourquoi',
  'combien', 'quand', 'où', 'quel', 'quelle', 'quels', 'quelles',
  'est-ce que', 'est-ce qu', 'pouvez-vous', 'peux-tu', 'savez-vous',
  'je voudrais savoir', 'j\'aimerais savoir', 'dites-moi',
  // English question patterns
  'what is', 'what are', 'how does', 'how do', 'how much', 'how many',
  'when', 'where', 'why', 'can you', 'could you', 'do you',
  // VECTRYS business keywords
  'vectrys', 'check-in', 'checkin', 'check-out', 'checkout',
  'ménage', 'housekeeping', 'nettoyage', 'cleaning',
  'réservation', 'reservation', 'booking',
  'prix', 'tarif', 'cost', 'price', 'pricing',
  'service', 'prestation',
  'conciergerie', 'property management',
  'plateforme', 'platform', 'application', 'app',
  'formation', 'training', 'quiz',
  'sms', 'notification',
  'data', 'données', 'analytics',
];

// Common transcription corrections
const TRANSCRIPTION_FIXES = [
  [/\bvector[sy]?\b/gi, 'VECTRYS'],
  [/\bvectrice?\b/gi, 'VECTRYS'],
  [/\bvectr[iy]x?\b/gi, 'VECTRYS'],
];

/**
 * Fix common transcription errors (e.g. "Vector" → "VECTRYS")
 */
function fixTranscription(text) {
  let fixed = text;
  for (const [pattern, replacement] of TRANSCRIPTION_FIXES) {
    fixed = fixed.replace(pattern, replacement);
  }
  return fixed;
}

/**
 * Detect if text contains a question related to VECTRYS business
 * @param {string} text - Transcript text to analyze
 * @returns {boolean}
 */
function detectQuestion(text) {
  const lower = text.toLowerCase().trim();

  // Check for question mark
  const hasQuestionMark = lower.includes('?');

  // Check for question keywords
  const hasQuestionKeyword = QUESTION_KEYWORDS.some(kw => lower.includes(kw));

  // Must have a question indicator AND some minimum length
  return (hasQuestionMark || hasQuestionKeyword) && lower.length > 15;
}

// ─── INTERLOCUTOR DETECTION ─────────────────────────────────

const INTERLOCUTOR_KEYWORDS = {
  journalist: ['article', 'média', 'publication', 'interview', 'rédaction', 'presse', 'journal', 'reporter', 'media', 'press'],
  investor: ['levée', 'seed', 'série a', 'série b', 'valorisation', 'roi', 'cap table', 'investissement', 'fonds', 'fundraising', 'burn rate', 'runway', 'equity', 'dilution'],
  pdg: ['notre entreprise', 'notre société', 'direction', 'board', 'conseil', 'mon entreprise', 'notre groupe', 'comité', 'stratégie groupe'],
  prospect: ['intéressé', 'tarif', 'démonstration', 'essai', 'offre', 'devis', 'proposal', 'demo', 'pricing', 'essayer'],
};

/**
 * Detect interlocutor type from accumulated transcript
 * @param {string} transcriptText - Accumulated transcript text
 * @returns {'journalist' | 'investor' | 'pdg' | 'prospect' | 'unknown'}
 */
function detectInterlocutor(transcriptText) {
  const lower = transcriptText.toLowerCase();
  const scores = {};

  for (const [type, keywords] of Object.entries(INTERLOCUTOR_KEYWORDS)) {
    scores[type] = keywords.reduce((score, kw) => {
      const matches = (lower.match(new RegExp(kw, 'gi')) || []).length;
      return score + matches;
    }, 0);
  }

  const maxType = Object.entries(scores).reduce((best, [type, score]) =>
    score > best.score ? { type, score } : best,
    { type: 'unknown', score: 0 }
  );

  return maxType.score >= 2 ? maxType.type : 'unknown';
}

// ─── SMART SYSTEM PROMPT (FATE + Interlocutor + Doublespeak) ─

/**
 * Build a dynamic system prompt based on user role, interlocutor type, FATE profile
 * @param {Object} context
 * @param {string} [context.userRole] - 'ceo', 'manager', 'employee'
 * @param {string} [context.interlocutorType] - 'journalist', 'investor', 'pdg', 'prospect', 'unknown'
 * @param {string} [context.fateProfile] - 'F', 'A', 'T', 'E'
 * @returns {string}
 */
function buildSystemPrompt({ userRole, interlocutorType, fateProfile } = {}) {
  let prompt = `Tu es l'assistant intelligent de VECTRYS, une startup de conciergerie et property management.
Tu aides pendant les appels en fournissant des réponses précises et concises.

Règles:
- Réponds en français, de manière claire et professionnelle
- Sois concis: l'utilisateur doit pouvoir lire ta réponse rapidement pendant l'appel
- Utilise les données du contexte fourni quand disponibles
- Si tu n'as pas assez d'informations, dis-le clairement
- Formate ta réponse avec des bullet points si pertinent
- Ne commence pas par "Bien sûr" ou "Voici" — va droit au but`;

  // Role-based context
  if (userRole === 'ceo') {
    prompt += `\n\nCONTEXTE UTILISATEUR: L'utilisateur est le CEO/fondateur de VECTRYS.
Les conversations portent souvent sur: investisseurs, levée de fonds, vision stratégique,
partenariats, presse. Adapte ton langage au niveau C-level.
Mets en avant la vision, les métriques clés et le positionnement stratégique.`;
  } else if (userRole === 'manager') {
    prompt += `\n\nCONTEXTE UTILISATEUR: L'utilisateur est un manager/responsable d'équipe.
Focus sur: coordination, suivi des objectifs, reporting, gestion opérationnelle.`;
  } else {
    prompt += `\n\nCONTEXTE UTILISATEUR: L'utilisateur est un commercial/employé en prospection.
Focus sur: argumentaire commercial, objections clients, tarification, features produit.`;
  }

  // Interlocutor type adaptation
  if (interlocutorType === 'journalist') {
    prompt += `\nINTERLOCUTEUR: Journaliste — Réponses PR-friendly, storytelling, impact sociétal.
Mets en avant: mission, innovation, impact. Évite le jargon technique excessif.`;
  } else if (interlocutorType === 'investor') {
    prompt += `\nINTERLOCUTEUR: Investisseur — Métriques, traction, TAM/SAM/SOM, unit economics.
Parle en termes de: marché adressable, croissance MoM, LTV/CAC, runway.`;
  } else if (interlocutorType === 'pdg') {
    prompt += `\nINTERLOCUTEUR: PDG/Décideur — ROI, efficacité opérationnelle, avantage concurrentiel.
Mets en avant: gains de temps, réduction des coûts, intégration facile, références clients.`;
  } else if (interlocutorType === 'prospect') {
    prompt += `\nINTERLOCUTEUR: Prospect — Argumentaire commercial, bénéfices concrets, cas d'usage.
Mets en avant: fonctionnalités clés, différenciation, témoignages, tarification.`;
  }

  // FATE behavioral profiling
  if (fateProfile) {
    const fateDescriptions = {
      F: 'FOCUS (F) — Profil analytique, axé sur les faits et les données. Privilégie les arguments rationnels, les chiffres précis, les études de cas.',
      A: 'AUTHORITY (A) — Profil autoritaire, décideur rapide. Sois direct, concis, montre les résultats et le leadership.',
      T: 'TRIBE (T) — Profil relationnel, axé sur le collectif. Mets en avant l\'équipe, la communauté, les valeurs partagées.',
      E: 'EMOTION (E) — Profil émotionnel, sensible au storytelling. Utilise des anecdotes, de l\'empathie, une approche personnalisée.',
    };
    prompt += `\nPROFIL FATE: ${fateDescriptions[fateProfile] || fateProfile} — Adapte le ton et les arguments au profil comportemental.`;
  }

  // Doublespeak / Novlang — defensive mode
  prompt += `\n\nMODE DÉFENSIF (novlang):
Si la question est intrusive (valorisation exacte, CA exact, données confidentielles, stratégie interne,
failles techniques, salaires, parts des associés, concurrence directe), utilise le doublespeak:
- Reformule de manière corporate et positive
- Redirige vers la vision et la mission
- Ne mens jamais mais reste évasif sur les chiffres sensibles
- Utilise des formulations comme "Nous sommes en phase d'accélération" au lieu de donner le CA exact
- "Notre valorisation reflète la confiance de nos partenaires" au lieu du chiffre
- "Nous investissons massivement dans la R&D" au lieu de détailler les coûts
- Signale dans ta réponse [MODE DÉFENSIF] quand tu utilises cette stratégie`;

  return prompt;
}

// ─── SESSION MANAGEMENT ─────────────────────────────────────

/**
 * Start a new call session
 * @param {string} userId - User/founder ID
 * @param {string} [platform] - "meet", "zoom", "teams"
 * @param {string} [employeeId] - Employee ID if authenticated
 * @returns {Promise<Object>} - Created session
 */
async function startSession(userId, platform, employeeId) {
  const session = await prisma.callSession.create({
    data: {
      user_id: userId,
      employee_id: employeeId || null,
      platform: platform || null,
      status: 'active',
    },
  });

  console.log(`[Call Assistant] Session started: ${session.id}`);
  return session;
}

/**
 * End a call session
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
async function endSession(sessionId) {
  const session = await prisma.callSession.update({
    where: { id: sessionId },
    data: {
      status: 'ended',
      ended_at: new Date(),
    },
  });

  console.log(`[Call Assistant] Session ended: ${sessionId}`);
  return session;
}

/**
 * Get session by ID with transcripts and suggestions
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
async function getSession(sessionId) {
  return prisma.callSession.findUnique({
    where: { id: sessionId },
    include: {
      transcripts: { orderBy: { timestamp_ms: 'asc' } },
      suggestions: { orderBy: { created_at: 'asc' } },
    },
  });
}

/**
 * List sessions for a user
 * @param {string} userId
 * @param {number} [limit=20]
 * @returns {Promise<Array>}
 */
async function listSessions(userId, limit = 20) {
  return prisma.callSession.findMany({
    where: { user_id: userId },
    orderBy: { started_at: 'desc' },
    take: limit,
    include: {
      _count: {
        select: { transcripts: true, suggestions: true },
      },
    },
  });
}

// ─── TRANSCRIPT PROCESSING ──────────────────────────────────

/**
 * Process and store a transcript segment
 * @param {string} sessionId
 * @param {string} text - Transcribed text
 * @param {string} speaker - "me", "guest", "unknown"
 * @param {number} timestampMs - Offset from session start
 * @param {number} [confidence] - Deepgram confidence score
 * @returns {Promise<{transcript: Object, isQuestion: boolean}>}
 */
async function processTranscript(sessionId, text, speaker, timestampMs, confidence) {
  const transcript = await prisma.callTranscript.create({
    data: {
      session_id: sessionId,
      speaker,
      text,
      confidence,
      timestamp_ms: timestampMs,
    },
  });

  const isQuestion = detectQuestion(text);

  return { transcript, isQuestion };
}

// ─── AI SUGGESTION GENERATION ───────────────────────────────

/**
 * Generate an AI suggestion based on a detected question
 * Uses pgvector semantic search + Claude streaming
 * @param {string} sessionId
 * @param {string} questionText - The question that triggered the suggestion
 * @param {Function} onChunk - Callback for each streaming token: (text) => void
 * @param {Object} [context] - Smart AI context
 * @param {string} [context.userRole] - 'ceo', 'manager', 'employee'
 * @param {string} [context.interlocutorType] - 'journalist', 'investor', 'pdg', 'prospect'
 * @param {string} [context.fateProfile] - 'F', 'A', 'T', 'E'
 * @returns {Promise<Object>} - Complete suggestion record
 */
async function generateSuggestion(sessionId, questionText, onChunk, context = {}) {
  // 1. Semantic search for relevant context
  let sources = [];
  try {
    sources = await embeddingService.searchSimilar(questionText, 5, 0.5);
  } catch (err) {
    console.error('[Call Assistant] Embedding search error:', err.message);
  }

  // 2. Build context from matched KB entries
  let contextBlock = '';
  if (sources.length > 0) {
    contextBlock = sources
      .map((s, i) => `[Source ${i + 1}] ${s.title}\n${s.content}`)
      .join('\n\n');
  }

  // 3. Build smart system prompt
  const systemPrompt = buildSystemPrompt(context);

  const userMessage = contextBlock
    ? `Question posée pendant l'appel: "${questionText}"\n\nContexte VECTRYS pertinent:\n${contextBlock}\n\nDonne une réponse que je peux utiliser pendant l'appel.`
    : `Question posée pendant l'appel: "${questionText}"\n\nJe n'ai pas de contexte spécifique dans la base de connaissances. Donne une réponse générale basée sur ce que tu sais de la conciergerie et du property management.`;

  // 4. Stream Claude response
  let fullSuggestion = '';

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      const text = event.delta.text;
      fullSuggestion += text;
      if (onChunk) onChunk(text);
    }
  }

  // 5. Store suggestion in DB
  const suggestion = await prisma.callSuggestion.create({
    data: {
      session_id: sessionId,
      trigger_text: questionText,
      suggestion: fullSuggestion,
      sources: sources.length > 0
        ? sources.map(s => ({ id: s.id, title: s.title, similarity: s.similarity, source_type: s.source_type }))
        : null,
    },
  });

  return suggestion;
}

export default {
  fixTranscription,
  detectQuestion,
  detectInterlocutor,
  buildSystemPrompt,
  startSession,
  endSession,
  getSession,
  listSessions,
  processTranscript,
  generateSuggestion,
};
