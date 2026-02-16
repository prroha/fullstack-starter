import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import supertest from "supertest";
import type { Express } from "express";
import {
  cleanDatabase,
  createTestUser,
  loginTestUser,
  disconnectTestDb,
} from "../setup/test-helpers.js";

let app: Express;

beforeAll(async () => {
  const { createApp } = await import("../../create-app.js");
  app = createApp();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectTestDb();
});

// ============================================================================
// Admin Access Control
// ============================================================================

describe("Admin routes access control", () => {
  it("should return 401 for unauthenticated requests to admin routes", async () => {
    const res = await supertest(app).get("/api/v1/admin/stats");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 403 for regular USER on admin routes", async () => {
    const user = await createTestUser({ role: "USER", password: "TestPass123" });
    const { accessToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await supertest(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ADMIN_REQUIRED");
  });

  it("should return 200 for ADMIN user on admin stats", async () => {
    const admin = await createTestUser({ role: "ADMIN", password: "AdminPass123" });
    const { accessToken } = await loginTestUser(app, admin.email, "AdminPass123");

    const res = await supertest(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("should return 200 for SUPER_ADMIN user on admin stats", async () => {
    const superAdmin = await createTestUser({ role: "SUPER_ADMIN", password: "SuperPass123" });
    const { accessToken } = await loginTestUser(app, superAdmin.email, "SuperPass123");

    const res = await supertest(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ============================================================================
// Admin Stats Shape
// ============================================================================

describe("GET /api/v1/admin/stats", () => {
  it("should return stats with expected shape", async () => {
    const admin = await createTestUser({ role: "ADMIN", password: "AdminPass123" });
    const { accessToken } = await loginTestUser(app, admin.email, "AdminPass123");

    const res = await supertest(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const { data } = res.body;
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

    const res = await supertest(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3); // admin + 2 users
  });

  it("should reject user listing for regular user", async () => {
    const user = await createTestUser({ password: "TestPass123" });
    const { accessToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await supertest(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });
});
