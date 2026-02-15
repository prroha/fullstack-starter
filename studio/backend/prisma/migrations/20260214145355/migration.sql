/*
  Warnings:

  - You are about to drop the column `duration` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityAt` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `pageViews` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `preview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `preview_sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionToken]` on the table `preview_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `preview_sessions` table without a default value. This is not possible if the table is not empty.
  - The required column `sessionToken` was added to the `preview_sessions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `tier` on table `preview_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "preview_sessions_sessionId_key";

-- AlterTable
ALTER TABLE "preview_sessions" DROP COLUMN "duration",
DROP COLUMN "lastActivityAt",
DROP COLUMN "pageViews",
DROP COLUMN "sessionId",
DROP COLUMN "templateId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sessionToken" TEXT NOT NULL,
ADD COLUMN     "templateSlug" TEXT,
ALTER COLUMN "tier" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "preview_sessions_sessionToken_key" ON "preview_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "preview_sessions_sessionToken_idx" ON "preview_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "preview_sessions_expiresAt_idx" ON "preview_sessions"("expiresAt");
