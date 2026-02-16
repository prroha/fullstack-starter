/**
 * Integration Test Helpers
 *
 * Utilities for integration tests that interact with a real database.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import supertest from "supertest";
import type { Express } from "express";

// Dedicated Prisma client for test setup/teardown
// (separate from the app's client to avoid import side effects)
let testDb: PrismaClient | null = null;

export function getTestDb(): PrismaClient {
  if (!testDb) {
    testDb = new PrismaClient();
  }
  return testDb;
}

export async function disconnectTestDb(): Promise<void> {
  if (testDb) {
    await testDb.$disconnect();
    testDb = null;
  }
}

/**
 * Truncate all tables in the correct order (respecting FK constraints).
 * Call this in beforeEach() to ensure test isolation.
 */
export async function cleanDatabase(): Promise<void> {
  const db = getTestDb();

  // Delete in reverse dependency order
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.order.deleteMany();
  await db.session.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.emailVerificationToken.deleteMany();
  await db.faq.deleteMany();
  await db.faqCategory.deleteMany();
  await db.announcement.deleteMany();
  await db.setting.deleteMany();
  await db.contentPage.deleteMany();
  await db.coupon.deleteMany();
  await db.contactMessage.deleteMany();
  await db.user.deleteMany();
}

/**
 * Create a test user directly in the database.
 */
export async function createTestUser(overrides: {
  email?: string;
  password?: string;
  name?: string;
  role?: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive?: boolean;
  emailVerified?: boolean;
} = {}): Promise<{
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: string;
}> {
  const db = getTestDb();
  const password = overrides.password || "TestPass123";
  const passwordHash = await bcrypt.hash(password, 4); // Low rounds for speed

  const user = await db.user.create({
    data: {
      email: overrides.email || `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash,
      name: overrides.name ?? "Test User",
      role: overrides.role || "USER",
      isActive: overrides.isActive ?? true,
      emailVerified: overrides.emailVerified ?? false,
    },
  });

  return {
    id: user.id,
    email: user.email,
    password,
    name: user.name,
    role: user.role,
  };
}

/**
 * Log in a test user via the API and return tokens + cookies.
 */
export async function loginTestUser(
  app: Express,
  email: string,
  password: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  cookies: string[];
}> {
  const res = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email, password })
    .expect(200);

  const cookies = res.headers["set-cookie"] as string[] | undefined;

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    csrfToken: res.body.data.csrfToken,
    cookies: cookies || [],
  };
}

/**
 * Create a user, log them in, and return an authenticated supertest agent.
 */
export async function getAuthenticatedAgent(
  app: Express,
  userOverrides: Parameters<typeof createTestUser>[0] = {}
): Promise<{
  agent: supertest.Agent;
  user: Awaited<ReturnType<typeof createTestUser>>;
  tokens: Awaited<ReturnType<typeof loginTestUser>>;
}> {
  const user = await createTestUser(userOverrides);
  const tokens = await loginTestUser(app, user.email, user.password);

  const agent = supertest.agent(app);

  // Set cookies from login response
  for (const cookie of tokens.cookies) {
    agent.set("Cookie", cookie);
  }

  return { agent, user, tokens };
}
