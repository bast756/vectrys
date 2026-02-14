-- AI Call Assistant Migration
-- Includes: pgvector extension, call session tables, business embeddings

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Call Sessions
CREATE TABLE "call_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "platform" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "call_sessions_user_id_idx" ON "call_sessions"("user_id");

-- Call Transcripts
CREATE TABLE "call_transcripts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "speaker" TEXT NOT NULL DEFAULT 'unknown',
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "timestamp_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "call_transcripts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "call_transcripts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "call_transcripts_session_id_idx" ON "call_transcripts"("session_id");

-- Call Suggestions
CREATE TABLE "call_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "trigger_text" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "sources" JSONB,
    "was_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "call_suggestions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "call_suggestions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "call_suggestions_session_id_idx" ON "call_suggestions"("session_id");

-- Business Embeddings (pgvector)
CREATE TABLE "business_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_type" VARCHAR(50) NOT NULL,
    "source_id" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "business_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_embeddings_source" ON "business_embeddings"("source_type");
CREATE INDEX "idx_embeddings_vector" ON "business_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
