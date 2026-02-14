// ============================================================================
// VECTRYS — Embedding Pipeline Service
// Syncs KnowledgeBase entries (and other business data) to pgvector embeddings
// ============================================================================

import prisma from '../config/prisma.js';
import embeddingService from './embedding.service.js';

/**
 * Sync all KnowledgeBaseEntry records to business_embeddings
 * @returns {Promise<{synced: number, errors: number}>}
 */
async function syncAllEmbeddings() {
  const entries = await prisma.knowledgeBaseEntry.findMany({
    where: { active: true },
  });

  let synced = 0;
  let errors = 0;

  for (const entry of entries) {
    try {
      const content = `Question: ${entry.question}\nRéponse: ${entry.answer}`;
      const metadata = {
        category: entry.category,
        type: entry.type,
        language: entry.language,
        tags: entry.tags,
        priority: entry.priority,
      };

      await embeddingService.upsertBySource({
        sourceType: 'knowledge_base',
        sourceId: entry.id,
        title: entry.question,
        content,
        metadata,
      });

      synced++;
      console.log(`[Embedding Pipeline] Synced KB entry: ${entry.id} — "${entry.question.substring(0, 50)}..."`);
    } catch (err) {
      errors++;
      console.error(`[Embedding Pipeline] Error syncing KB entry ${entry.id}:`, err.message);
    }
  }

  console.log(`[Embedding Pipeline] Complete: ${synced} synced, ${errors} errors out of ${entries.length} total`);
  return { synced, errors, total: entries.length };
}

/**
 * Sync a single entry to business_embeddings
 * @param {string} sourceType - 'knowledge_base', 'property', 'service', 'faq'
 * @param {string} sourceId - Source UUID
 * @param {string} title - Entry title/question
 * @param {string} content - Full text content
 * @param {Object} [metadata] - Additional metadata
 */
async function syncSingleEntry(sourceType, sourceId, title, content, metadata = {}) {
  await embeddingService.upsertBySource({
    sourceType,
    sourceId,
    title,
    content,
    metadata,
  });

  console.log(`[Embedding Pipeline] Synced single: ${sourceType}/${sourceId}`);
}

/**
 * Get stats on current embeddings
 */
async function getStats() {
  const results = await prisma.$queryRawUnsafe(`
    SELECT source_type, COUNT(*) as count
    FROM business_embeddings
    GROUP BY source_type
    ORDER BY count DESC
  `);

  const total = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total FROM business_embeddings
  `);

  return {
    total: Number(total[0]?.total || 0),
    bySource: results.map(r => ({ source_type: r.source_type, count: Number(r.count) })),
  };
}

export default {
  syncAllEmbeddings,
  syncSingleEntry,
  getStats,
};
