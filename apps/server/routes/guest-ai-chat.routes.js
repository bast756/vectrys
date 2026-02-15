/**
 * VECTRYS — Guest AI Chat + Knowledge Base + Travel Notes Routes
 *
 * Routes pour :
 *   1. Chat IA Concierge (voyageur ↔ Claude Sonnet 4.5 avec RAG)
 *   2. Knowledge Base CRUD (manager/owner alimente la base)
 *   3. Notes & Carnet de Voyage (voyageur garde ses souvenirs)
 *
 * @module routes/guest-ai-chat.routes
 * @version 1.0.0
 */

import { Router } from 'express';
import prisma from '../config/prisma.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// ─── Claude API Client ───────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ════════════════════════════════════════════════════════════════
// 1. CHAT IA CONCIERGE — Voyageur pose une question
// ════════════════════════════════════════════════════════════════

/**
 * POST /ai/chat
 * Body: { message, reservationId, language?, conversationHistory? }
 * Auth: Guest JWT
 */
router.post('/ai/chat', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const { message, reservationId, language = 'fr', conversationHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    // 1. Contexte réservation + propriété
    const reservation = reservationId
      ? await prisma.reservation.findFirst({
          where: { id: reservationId, guestId },
          include: {
            property: {
              include: { services: true, transportPoints: true, checklistItems: true },
            },
          },
        })
      : null;

    const property = reservation?.property || null;

    // 2. RAG — Recherche articles Knowledge Base pertinents
    const propertyId = property?.id || null;
    const kbArticles = await searchKnowledgeBase(message, propertyId, language);

    // 3. Construction du prompt système
    const systemPrompt = buildGuestChatSystemPrompt({
      property,
      reservation,
      kbArticles,
      language,
    });

    // 4. Messages pour Claude
    const claudeMessages = [
      ...conversationHistory.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // 5. Appel Claude Sonnet 4.5
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0]?.text || '';

    // 6. Stockage en base
    const conversationId = await getOrCreateConversationId(guestId, reservationId);

    await prisma.guestMessage.createMany({
      data: [
        {
          reservationId: reservationId || null,
          senderId: guestId,
          conversationId,
          senderType: 'GUEST',
          content: message,
        },
        {
          reservationId: reservationId || null,
          senderId: null,
          conversationId,
          senderType: 'AI',
          content: assistantMessage,
        },
      ],
    });

    // 7. Update stats articles utilisés
    if (kbArticles.length > 0) {
      await prisma.knowledgeBaseEntry.updateMany({
        where: { id: { in: kbArticles.map((a) => a.id) } },
        data: { views: { increment: 1 } },
      });
    }

    // 8. Suggestions de follow-up
    const suggestions = generateFollowUpSuggestions(kbArticles, property, language);

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        suggestions,
        articlesUsed: kbArticles.map((a) => ({ id: a.id, title: a.title || a.question })),
        conversationId,
      },
    });
  } catch (err) {
    console.error('[Guest AI Chat] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur du chat IA' });
  }
});

/**
 * POST /ai/chat/stream
 * Même chose mais en Server-Sent Events (streaming)
 */
router.post('/ai/chat/stream', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const { message, reservationId, language = 'fr', conversationHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    // Headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reservation = reservationId
      ? await prisma.reservation.findFirst({
          where: { id: reservationId, guestId },
          include: { property: { include: { services: true } } },
        })
      : null;

    const property = reservation?.property || null;
    const kbArticles = await searchKnowledgeBase(message, property?.id, language);
    const systemPrompt = buildGuestChatSystemPrompt({ property, reservation, kbArticles, language });

    const claudeMessages = [
      ...conversationHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Streaming Claude
    let fullResponse = '';

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: claudeMessages,
    });

    stream.on('text', (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
    });

    stream.on('end', async () => {
      const conversationId = await getOrCreateConversationId(guestId, reservationId);
      await prisma.guestMessage.createMany({
        data: [
          { reservationId: reservationId || null, senderId: guestId, conversationId, senderType: 'GUEST', content: message },
          { reservationId: reservationId || null, senderId: null, conversationId, senderType: 'AI', content: fullResponse },
        ],
      });

      const suggestions = generateFollowUpSuggestions(kbArticles, property, language);
      res.write(`data: ${JSON.stringify({ type: 'done', suggestions })}\n\n`);
      res.end();
    });

    stream.on('error', (err) => {
      console.error('[Guest AI Stream] Error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Erreur IA' })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('[Guest AI Chat Stream] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur du chat IA' });
  }
});

/**
 * GET /ai/chat/history
 * Historique des conversations IA du guest
 */
router.get('/ai/chat/history', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const { reservationId, limit = 50 } = req.query;

    const where = { senderType: { in: ['GUEST', 'AI'] } };
    if (reservationId) {
      where.reservationId = reservationId;
    }
    // Find messages where the guest is the sender OR AI responses in their conversation
    where.OR = [
      { senderId: guestId },
      { senderType: 'AI', conversationId: { not: null } },
    ];

    const messages = await prisma.guestMessage.findMany({
      where: {
        OR: [
          { senderId: guestId, senderType: 'GUEST' },
          { senderType: 'AI' },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      select: {
        id: true,
        senderType: true,
        content: true,
        createdAt: true,
        conversationId: true,
      },
    });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('[Guest AI History] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur historique' });
  }
});

// ════════════════════════════════════════════════════════════════
// 2. KNOWLEDGE BASE — Manager alimente la base de connaissances
// ════════════════════════════════════════════════════════════════

/**
 * GET /knowledge/articles
 */
router.get('/knowledge/articles', async (req, res) => {
  try {
    const { propertyId, category, status = 'published' } = req.query;

    const where = {};
    if (propertyId) where.propertyId = propertyId;
    if (category) where.category = category;
    if (status) where.status = status;

    const articles = await prisma.knowledgeBaseEntry.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { views: 'desc' }, { updated_at: 'desc' }],
    });

    res.json({ success: true, data: articles });
  } catch (err) {
    console.error('[KB List] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur listing articles' });
  }
});

/**
 * POST /knowledge/articles
 */
router.post('/knowledge/articles', async (req, res) => {
  try {
    const { propertyId, title, emoji, description, content, keywords, category, photos, steps } = req.body;

    if (!propertyId || !title || !content) {
      return res.status(400).json({ success: false, error: 'propertyId, title et content requis' });
    }

    const article = await prisma.knowledgeBaseEntry.create({
      data: {
        propertyId,
        type: 'property_specific',
        category: category || 'general',
        question: title, // map title → question (legacy field)
        answer: content, // map content → answer (legacy field)
        title,
        emoji: emoji || '📖',
        description: description || '',
        content,
        keywords: keywords || [],
        photos: photos || [],
        steps: steps || [],
        status: 'published',
        views: 0,
        autoResolved: 0,
        pinned: false,
      },
    });

    res.status(201).json({ success: true, data: article });
  } catch (err) {
    console.error('[KB Create] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur création article' });
  }
});

/**
 * PUT /knowledge/articles/:id
 */
router.put('/knowledge/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, emoji, description, content, keywords, category, photos, steps, status, pinned } = req.body;

    const data = {};
    if (title !== undefined) { data.title = title; data.question = title; }
    if (content !== undefined) { data.content = content; data.answer = content; }
    if (emoji !== undefined) data.emoji = emoji;
    if (description !== undefined) data.description = description;
    if (keywords !== undefined) data.keywords = keywords;
    if (category !== undefined) data.category = category;
    if (photos !== undefined) data.photos = photos;
    if (steps !== undefined) data.steps = steps;
    if (status !== undefined) data.status = status;
    if (pinned !== undefined) data.pinned = pinned;

    const article = await prisma.knowledgeBaseEntry.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: article });
  } catch (err) {
    console.error('[KB Update] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur modification article' });
  }
});

/**
 * DELETE /knowledge/articles/:id
 */
router.delete('/knowledge/articles/:id', async (req, res) => {
  try {
    await prisma.knowledgeBaseEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Article supprimé' });
  } catch (err) {
    console.error('[KB Delete] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur suppression' });
  }
});

/**
 * GET /knowledge/stats
 */
router.get('/knowledge/stats', async (req, res) => {
  try {
    const { propertyId } = req.query;
    const where = propertyId ? { propertyId } : {};

    const [totalArticles, totalViews, topArticles, unansweredCount] = await Promise.all([
      prisma.knowledgeBaseEntry.count({ where }),
      prisma.knowledgeBaseEntry.aggregate({ where, _sum: { views: true } }),
      prisma.knowledgeBaseEntry.findMany({
        where,
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, title: true, question: true, emoji: true, views: true, autoResolved: true },
      }),
      prisma.guestMessage.count({
        where: { senderType: 'AI', content: { contains: 'contacter votre hôte' } },
      }),
    ]);

    const autoResolvedAgg = await prisma.knowledgeBaseEntry.aggregate({ where, _sum: { autoResolved: true } });
    const autoResolveRate = totalViews._sum.views > 0
      ? Math.round((autoResolvedAgg._sum.autoResolved / totalViews._sum.views) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalArticles,
        totalViews: totalViews._sum.views || 0,
        autoResolveRate,
        unansweredQuestions: unansweredCount,
        topArticles: topArticles.map(a => ({ ...a, title: a.title || a.question })),
      },
    });
  } catch (err) {
    console.error('[KB Stats] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur stats' });
  }
});

// ════════════════════════════════════════════════════════════════
// 3. NOTES & CARNET DE VOYAGE — Voyageur
// ════════════════════════════════════════════════════════════════

/**
 * GET /travel-journal
 */
router.get('/travel-journal', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const { type, reservationId } = req.query;

    const where = { guestId };
    if (type) where.type = type;
    if (reservationId) where.reservationId = reservationId;

    const entries = await prisma.travelJournalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reservation: {
          select: {
            id: true, code: true, checkIn: true, checkOut: true, status: true,
            property: { select: { id: true, name: true, city: true, country: true, imageUrls: true } },
          },
        },
      },
    });

    res.json({ success: true, data: entries });
  } catch (err) {
    console.error('[Travel Journal List] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur carnet de voyage' });
  }
});

/**
 * POST /travel-journal
 */
router.post('/travel-journal', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const { type = 'note', title, content, emoji = '📝', mood, photos = [], reservationId, location, tags = [] } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Contenu requis' });
    }

    const entry = await prisma.travelJournalEntry.create({
      data: {
        guestId,
        reservationId: reservationId || null,
        type,
        title: title || '',
        content,
        emoji,
        mood: mood || null,
        photos,
        location: location || undefined,
        tags,
        pinned: false,
      },
      include: {
        reservation: {
          select: {
            id: true, code: true, checkIn: true, checkOut: true,
            property: { select: { name: true, city: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('[Travel Journal Create] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur création' });
  }
});

/**
 * PATCH /travel-journal/:id
 */
router.patch('/travel-journal/:id', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const existing = await prisma.travelJournalEntry.findFirst({ where: { id: req.params.id, guestId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Entrée non trouvée' });

    const { title, content, emoji, mood, photos, location, tags, pinned, type } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (emoji !== undefined) data.emoji = emoji;
    if (mood !== undefined) data.mood = mood;
    if (photos !== undefined) data.photos = photos;
    if (location !== undefined) data.location = location;
    if (tags !== undefined) data.tags = tags;
    if (pinned !== undefined) data.pinned = pinned;
    if (type !== undefined) data.type = type;

    const entry = await prisma.travelJournalEntry.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: entry });
  } catch (err) {
    console.error('[Travel Journal Update] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur modification' });
  }
});

/**
 * DELETE /travel-journal/:id
 */
router.delete('/travel-journal/:id', async (req, res) => {
  try {
    const guestId = req.guest.id;
    const existing = await prisma.travelJournalEntry.findFirst({ where: { id: req.params.id, guestId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Entrée non trouvée' });

    await prisma.travelJournalEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Entrée supprimée' });
  } catch (err) {
    console.error('[Travel Journal Delete] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur suppression' });
  }
});

/**
 * GET /travel-journal/trips
 */
router.get('/travel-journal/trips', async (req, res) => {
  try {
    const guestId = req.guest.id;

    const reservations = await prisma.reservation.findMany({
      where: { guestId },
      orderBy: { checkIn: 'desc' },
      include: {
        property: { select: { id: true, name: true, city: true, country: true, imageUrls: true } },
        _count: { select: { ratings: true } },
      },
    });

    const tripsWithStats = await Promise.all(
      reservations.map(async (r) => {
        const notesCount = await prisma.travelJournalEntry.count({
          where: { guestId, reservationId: r.id },
        });
        return {
          id: r.id, code: r.code, property: r.property,
          checkIn: r.checkIn, checkOut: r.checkOut,
          status: r.status, guestCount: r.guestCount,
          notesCount, hasRating: r._count.ratings > 0,
        };
      })
    );

    res.json({ success: true, data: tripsWithStats });
  } catch (err) {
    console.error('[Travel Journal Trips] Error:', err);
    res.status(500).json({ success: false, error: 'Erreur listing séjours' });
  }
});

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

async function searchKnowledgeBase(query, propertyId, language = 'fr') {
  const searchTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (searchTerms.length === 0) return [];

  const where = { status: 'published', ...(propertyId && { propertyId }) };

  const articles = await prisma.knowledgeBaseEntry.findMany({
    where,
    select: {
      id: true, title: true, question: true, emoji: true, description: true,
      content: true, answer: true, keywords: true, photos: true, steps: true, category: true,
    },
  });

  const scored = articles
    .map((article) => {
      let score = 0;
      const articleTitle = article.title || article.question || '';
      const articleContent = article.content || article.answer || '';
      const articleText = `${articleTitle} ${article.description || ''} ${articleContent}`.toLowerCase();
      const keywordsLower = (article.keywords || []).map((k) => k.toLowerCase());

      for (const term of searchTerms) {
        if (keywordsLower.some((k) => k.includes(term))) score += 10;
        if (articleTitle.toLowerCase().includes(term)) score += 5;
        if (articleText.includes(term)) score += 2;
      }

      return { ...article, title: articleTitle, content: articleContent, relevanceScore: score };
    })
    .filter((a) => a.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);

  return scored;
}

function buildGuestChatSystemPrompt({ property, reservation, kbArticles, language }) {
  const lang = language === 'fr' ? 'français' : 'English';

  let prompt = `Tu es l'assistant IA concierge de VECTRYS, une plateforme de gestion de locations courte durée.
Tu réponds en ${lang}, de manière chaleureuse, concise et utile.
Tu es le premier point de contact du voyageur. Ton rôle :
- Répondre aux questions sur le logement, les équipements, le quartier
- Donner des recommandations personnalisées (restaurants, activités, transports)
- Aider avec les procédures (check-in, check-out, signalement de problème)
- Traduire si le voyageur parle une autre langue

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT sur la base des informations dont tu disposes ci-dessous
- Si tu ne sais pas, propose de contacter l'hôte directement (ne fabrique pas de réponse)
- Sois concis : max 3-4 phrases pour les réponses simples
- Utilise des emojis avec parcimonie pour un ton chaleureux
- Ne partage jamais d'informations sensibles (codes d'accès) sauf si explicitement dans la KB`;

  if (property) {
    prompt += `\n\n--- INFORMATIONS LOGEMENT ---
Nom : ${property.name}
Adresse : ${property.address}, ${property.city} ${property.zipCode || ''}, ${property.country}
WiFi : ${property.wifiName || 'Non renseigné'} / ${property.wifiPassword || 'Non renseigné'}
Check-in : ${property.checkInTime || '15:00'} | Check-out : ${property.checkOutTime || '11:00'}`;

    if (property.houseRules) {
      prompt += `\nRèglement : ${JSON.stringify(property.houseRules)}`;
    }
  }

  if (reservation) {
    prompt += `\n\n--- RÉSERVATION EN COURS ---
Dates : ${reservation.checkIn} → ${reservation.checkOut}
Voyageurs : ${reservation.guestCount}
Statut : ${reservation.status}`;
  }

  if (kbArticles?.length > 0) {
    prompt += '\n\n--- BASE DE CONNAISSANCES (articles pertinents) ---';
    for (const article of kbArticles) {
      prompt += `\n\n📖 ${article.emoji} ${article.title}`;
      if (article.description) prompt += `\n${article.description}`;
      prompt += `\n${article.content}`;
      if (article.steps?.length > 0) {
        prompt += '\nÉtapes :';
        article.steps.forEach((step, i) => {
          prompt += `\n  ${i + 1}. ${step}`;
        });
      }
    }
  }

  return prompt;
}

function generateFollowUpSuggestions(kbArticles, property, language = 'fr') {
  const suggestions = [];

  const defaultSuggestions = language === 'fr'
    ? [
        '📶 Comment se connecter au WiFi ?',
        '🔑 Comment accéder au logement ?',
        '🍽️ Restaurants recommandés ?',
        '🚇 Comment se déplacer ?',
        '🧹 Où jeter les poubelles ?',
        '🆘 Un problème dans le logement',
      ]
    : [
        '📶 How to connect to WiFi?',
        '🔑 How to access the property?',
        '🍽️ Recommended restaurants?',
        '🚇 How to get around?',
        '🧹 Where to take the trash?',
        '🆘 Report an issue',
      ];

  if (kbArticles.length > 0) {
    for (const a of kbArticles.slice(0, 3)) {
      suggestions.push(`${a.emoji} ${a.title}`);
    }
  }

  while (suggestions.length < 4) {
    const next = defaultSuggestions.find((s) => !suggestions.includes(s));
    if (next) suggestions.push(next);
    else break;
  }

  return suggestions.slice(0, 6);
}

async function getOrCreateConversationId(guestId, reservationId) {
  if (reservationId) {
    const existing = await prisma.guestMessage.findFirst({
      where: { senderId: guestId, senderType: 'GUEST', conversationId: { not: null } },
      select: { conversationId: true },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.conversationId) return existing.conversationId;
  }

  const crypto = await import('crypto');
  return crypto.randomUUID();
}

export default router;
