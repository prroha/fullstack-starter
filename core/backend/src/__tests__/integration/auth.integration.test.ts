import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import supertest from "supertest";
import type { Express } from "express";
import {
  cleanDatabase,
  createTestUser,
  loginTestUser,
  getTestDb,
  disconnectTestDb,
} from "../setup/test-helpers.js";

let app: Express;

beforeAll(async () => {
  // Dynamic import to ensure env vars are set before config loads
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
// Registration
// ============================================================================

describe("POST /api/v1/auth/register", () => {
  it("should register a new user with valid data", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        name: "New User",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe("newuser@example.com");
    expect(res.body.data.user.name).toBe("New User");
    expect(res.body.data.user.role).toBe("USER");
    // Password hash should never be returned
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should return 409 when registering with an existing email", async () => {
    await createTestUser({ email: "existing@example.com" });

    const res = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "existing@example.com",
        password: "SecurePass123",
        name: "Duplicate User",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ALREADY_EXISTS");
  });

  it("should return 400 for invalid email format", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "not-an-email",
        password: "SecurePass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for password shorter than 8 characters", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "valid@example.com",
        password: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should normalize email to lowercase", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "UpperCase@Example.COM",
        password: "SecurePass123",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("uppercase@example.com");
  });
});

// ============================================================================
// Login
// ============================================================================

describe("POST /api/v1/auth/login", () => {
  it("should login with valid credentials and return tokens", async () => {
    const user = await createTestUser({
      email: "login@example.com",
      password: "TestPass123",
    });

    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: "TestPass123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.csrfToken).toBeDefined();
  });

  it("should set httpOnly cookies on login", async () => {
    const user = await createTestUser({ password: "TestPass123" });

    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "TestPass123" });

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    expect(cookieStr).toContain("accessToken=");
    expect(cookieStr).toContain("refreshToken=");
  });

  it("should return 401 for wrong password", async () => {
    const user = await createTestUser({ password: "TestPass123" });

    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "WrongPassword1" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 401 for non-existent email", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "nonexistent@example.com", password: "TestPass123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 403 for deactivated user", async () => {
    const user = await createTestUser({
      password: "TestPass123",
      isActive: false,
    });

    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "TestPass123" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should create a session in the database on login", async () => {
    const user = await createTestUser({ password: "TestPass123" });

    await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "TestPass123" })
      .expect(200);

    const db = getTestDb();
    const sessions = await db.session.findMany({
      where: { userId: user.id },
    });
    expect(sessions.length).toBe(1);
  });
});

// ============================================================================
// Authenticated Access (GET /auth/me)
// ============================================================================

describe("GET /api/v1/auth/me", () => {
  it("should return user data with valid access token", async () => {
    const user = await createTestUser({ password: "TestPass123" });
    const { accessToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await supertest(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it("should return 401 without a token", async () => {
    const res = await supertest(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("should return 401 with an invalid token", async () => {
    const res = await supertest(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token-value");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("should return 401 with malformed Authorization header", async () => {
    const res = await supertest(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "NotBearer token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// Token Refresh
// ============================================================================

describe("POST /api/v1/auth/refresh", () => {
  it("should return new tokens with a valid refresh token", async () => {
    const user = await createTestUser({ password: "TestPass123" });
    const { refreshToken } = await loginTestUser(app, user.email, "TestPass123");

    const res = await supertest(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(user.email);
  });

  it("should return error with an invalid refresh token", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "invalid-refresh-token" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 without a refresh token", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/refresh")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// Logout
// ============================================================================

describe("POST /api/v1/auth/logout", () => {
  it("should clear cookies and delete session", async () => {
    const user = await createTestUser({ password: "TestPass123" });
    const { refreshToken, cookies } = await loginTestUser(app, user.email, "TestPass123");

    // Verify session exists before logout
    const db = getTestDb();
    const sessionsBefore = await db.session.findMany({ where: { userId: user.id } });
    expect(sessionsBefore.length).toBe(1);

    const res = await supertest(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify session deleted
    const sessionsAfter = await db.session.findMany({ where: { userId: user.id } });
    expect(sessionsAfter.length).toBe(0);
  });
});

// ============================================================================
// Password Change
// ============================================================================

describe("POST /api/v1/auth/change-password", () => {
  it("should change password with correct current password", async () => {
    const user = await createTestUser({ password: "OldPass123" });
    const { accessToken, csrfToken, cookies } = await loginTestUser(app, user.email, "OldPass123");

    const res = await supertest(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookies)
      .set("X-CSRF-Token", csrfToken)
      .send({
        currentPassword: "OldPass123",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow login with new password after change", async () => {
    const user = await createTestUser({ password: "OldPass123" });
    const { accessToken, csrfToken, cookies } = await loginTestUser(app, user.email, "OldPass123");

    await supertest(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookies)
      .set("X-CSRF-Token", csrfToken)
      .send({
        currentPassword: "OldPass123",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      })
      .expect(200);

    // Login with new password should work
    const loginRes = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "NewPass456" });

    expect(loginRes.status).toBe(200);
  });

  it("should reject password change with wrong current password", async () => {
    const user = await createTestUser({ password: "OldPass123" });
    const { accessToken, csrfToken, cookies } = await loginTestUser(app, user.email, "OldPass123");

    const res = await supertest(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookies)
      .set("X-CSRF-Token", csrfToken)
      .send({
        currentPassword: "WrongPass999",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject password change without authentication", async () => {
    const res = await supertest(app)
      .post("/api/v1/auth/change-password")
      .send({
        currentPassword: "OldPass123",
        newPassword: "NewPass456",
        confirmPassword: "NewPass456",
      });

    // CSRF middleware blocks unauthenticated POST requests with 403
    // before auth middleware runs — both are valid rejection paths
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// Full Auth Flow (end-to-end)
// ============================================================================

describe("Full auth flow", () => {
  it("should support register → login → access → logout", async () => {
    // Register
    const registerRes = await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        email: "flow@example.com",
        password: "FlowPass123",
        name: "Flow User",
      });
    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "flow@example.com", password: "FlowPass123" });
    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = loginRes.body.data;
    const cookies = loginRes.headers["set-cookie"];

    // Access protected route
    const meRes = await supertest(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe("flow@example.com");

    // Logout
    const logoutRes = await supertest(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);
  });
});
