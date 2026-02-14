/*
  Warnings:

  - The primary key for the `call_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `call_suggestions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `call_transcripts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `business_embeddings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "call_suggestions" DROP CONSTRAINT "call_suggestions_session_id_fkey";

-- DropForeignKey
ALTER TABLE "call_transcripts" DROP CONSTRAINT "call_transcripts_session_id_fkey";

-- AlterTable
ALTER TABLE "call_sessions" DROP CONSTRAINT "call_sessions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "started_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "ended_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "call_suggestions" DROP CONSTRAINT "call_suggestions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "session_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "call_suggestions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "call_transcripts" DROP CONSTRAINT "call_transcripts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "session_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "call_transcripts_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "business_embeddings";

-- AddForeignKey
ALTER TABLE "call_transcripts" ADD CONSTRAINT "call_transcripts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_suggestions" ADD CONSTRAINT "call_suggestions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
