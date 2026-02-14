// ============================================================================
// VECTRYS — Embedding Service (OpenAI + pgvector)
// Generates embeddings and performs semantic search
// ============================================================================

import OpenAI from 'openai';
import prisma from '../config/prisma.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding vector for a given text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Float array of embedding dimensions
 */
async function generateEmbedding(text) {
  const cleanText = text.replace(/\n/g, ' ').trim();
  if (!cleanText) throw new Error('Empty text for embedding');

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanText,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Search for similar business embeddings using pgvector cosine distance
 * @param {string} queryText - The query to search for
 * @param {number} topK - Number of results to return
 * @param {number} threshold - Minimum similarity (0-1, higher = more similar)
 * @returns {Promise<Array>} - Matched embeddings with similarity scores
 */
async function searchSimilar(queryText, topK = 5, threshold = 0.7) {
  const queryEmbedding = await generateEmbedding(queryText);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      source_type,
      source_id,
      title,
      content,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM business_embeddings
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) >= $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, embeddingStr, threshold, topK);

  return results;
}

/**
 * Upsert a single embedding into business_embeddings
 * @param {Object} params
 * @param {string} params.sourceType - 'knowledge_base', 'property', 'service', 'faq'
 * @param {string} params.sourceId - Source record UUID
 * @param {string} params.title - Display title
 * @param {string} params.content - Full text content
 * @param {Object} [params.metadata] - Additional metadata
 */
async function upsertEmbedding({ sourceType, sourceId, title, content, metadata = {} }) {
  const embedding = await generateEmbedding(`${title}\n${content}`);
  const embeddingStr = `[${embedding.join(',')}]`;

  await prisma.$queryRawUnsafe(`
    INSERT INTO business_embeddings (source_type, source_id, title, content, embedding, metadata, updated_at)
    VALUES ($1, $2::uuid, $3, $4, $5::vector, $6::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING
  `, sourceType, sourceId, title, content, embeddingStr, JSON.stringify(metadata));

  // If source_id exists, update instead
  const existing = await prisma.$queryRawUnsafe(`
    SELECT id FROM business_embeddings WHERE source_type = $1 AND source_id = $2::uuid LIMIT 1
  `, sourceType, sourceId);

  if (existing.length > 1) {
    // Remove duplicates, keep latest
    await prisma.$queryRawUnsafe(`
      DELETE FROM business_embeddings
      WHERE source_type = $1 AND source_id = $2::uuid
      AND id != $3
    `, sourceType, sourceId, existing[0].id);
  }
}

/**
 * Upsert by source_type + source_id (idempotent)
 */
async function upsertBySource({ sourceType, sourceId, title, content, metadata = {} }) {
  const embedding = await generateEmbedding(`${title}\n${content}`);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Check if exists
  const existing = await prisma.$queryRawUnsafe(`
    SELECT id FROM business_embeddings WHERE source_type = $1 AND source_id = $2::uuid LIMIT 1
  `, sourceType, sourceId);

  if (existing.length > 0) {
    await prisma.$queryRawUnsafe(`
      UPDATE business_embeddings
      SET title = $1, content = $2, embedding = $3::vector, metadata = $4::jsonb, updated_at = NOW()
      WHERE id = $5
    `, title, content, embeddingStr, JSON.stringify(metadata), existing[0].id);
  } else {
    await prisma.$queryRawUnsafe(`
      INSERT INTO business_embeddings (source_type, source_id, title, content, embedding, metadata)
      VALUES ($1, $2::uuid, $3, $4, $5::vector, $6::jsonb)
    `, sourceType, sourceId, title, content, embeddingStr, JSON.stringify(metadata));
  }
}

export default {
  generateEmbedding,
  searchSimilar,
  upsertEmbedding,
  upsertBySource,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
