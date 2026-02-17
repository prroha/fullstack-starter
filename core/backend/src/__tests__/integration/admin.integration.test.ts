import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  cleanDatabase,
  createTestUser,
  loginTestUser,
  createAuthHeaders,
  disconnectTestDb,
} from "../setup/test-helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  const { createApp } = await import("../../create-app.js");
  app = await createApp();
  await app.ready();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await app.close();
  await disconnectTestDb();
});

// ============================================================================
// Admin Access Control
// ============================================================================

describe("Admin routes access control", () => {
  it("should return 401 for unauthenticated requests to admin routes", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/stats",
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
  });

  it("should return 403 for regular USER on admin routes", async () => {
    const user = await createTestUser({ role: "USER", password: "TestPass123" });
    const { accessToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/stats",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("ADMIN_REQUIRED");
  });

  it("should return 200 for ADMIN user on admin stats", async () => {
    const admin = await createTestUser({ role: "ADMIN", password: "AdminPass123" });
    const { accessToken } = await loginTestUser(app, admin.email, "AdminPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/stats",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it("should return 200 for SUPER_ADMIN user on admin stats", async () => {
    const superAdmin = await createTestUser({ role: "SUPER_ADMIN", password: "SuperPass123" });
    const { accessToken } = await loginTestUser(app, superAdmin.email, "SuperPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/stats",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });
});

// ============================================================================
// Admin Stats Shape
// ============================================================================

describe("GET /api/v1/admin/stats", () => {
  it("should return stats with expected shape", async () => {
    const admin = await createTestUser({ role: "ADMIN", password: "AdminPass123" });
    const { accessToken } = await loginTestUser(app, admin.email, "AdminPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/stats",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const { data } = JSON.parse(res.payload);
    expect(data.users).toBeDefined();
    expect(typeof data.users.total).toBe("number");
    expect(typeof data.users.active).toBe("number");
  });
});

// ============================================================================
// Admin User Management
// ============================================================================

describe("GET /api/v1/admin/users", () => {
  it("should list users for admin", async () => {
    const admin = await createTestUser({ role: "ADMIN", password: "AdminPass123" });
    await createTestUser({ email: "user1@example.com" });
    await createTestUser({ email: "user2@example.com" });
    const { accessToken } = await loginTestUser(app, admin.email, "AdminPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(3); // admin + 2 users
  });

  it("should reject user listing for regular user", async () => {
    const user = await createTestUser({ password: "TestPass123" });
    const { accessToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users",
      headers: createAuthHeaders(accessToken),
    });

    expect(res.statusCode).toBe(403);
  });
});
