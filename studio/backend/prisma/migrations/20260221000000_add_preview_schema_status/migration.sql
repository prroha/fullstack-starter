-- CreateEnum
CREATE TYPE "PreviewSchemaStatus" AS ENUM ('PENDING', 'PROVISIONING', 'READY', 'FAILED', 'DROPPED');

-- AlterTable
ALTER TABLE "preview_sessions"
ADD COLUMN "schemaName" TEXT,
ADD COLUMN "schemaStatus" "PreviewSchemaStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "preview_sessions_schemaStatus_idx" ON "preview_sessions"("schemaStatus");
