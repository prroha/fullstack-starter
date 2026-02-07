-- Migration: Add Account Lockout Fields
-- Purpose: Brute force protection - lock accounts after repeated failed login attempts

-- Add lockout fields to users table
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "last_failed_login" TIMESTAMP(3);

-- Add index for efficient lockout queries (find locked accounts)
CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");
