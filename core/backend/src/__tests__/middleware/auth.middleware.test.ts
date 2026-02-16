import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response, NextFunction } from "express";
import {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware,
  optionalAuthMiddleware,
} from "../../middleware/auth.middleware.js";
import { AppRequest, AuthenticatedRequest } from "../../types/index.js";

// Mock dependencies
vi.mock("../../utils/jwt.js", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("../../lib/db.js", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../lib/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { verifyToken } from "../../utils/jwt.js";
import { db } from "../../lib/db.js";

const mockVerifyToken = vi.mocked(verifyToken);
const mockFindUnique = vi.mocked(db.user.findUnique);

function createMockReq(overrides: Partial<AppRequest> = {}): AppRequest {
  return {
    cookies: {},
    headers: {},
    ...overrides,
  } as AppRequest;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockNext(): NextFunction {
  return vi.fn();
}

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayload = { userId: "user-123", email: "test@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authMiddleware", () => {
  it("should return 401 AUTH_REQUIRED when no token provided", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "AUTH_REQUIRED" }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 AUTH_REQUIRED for empty string token", async () => {
    const req = createMockReq({ cookies: { accessToken: "  " } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "AUTH_REQUIRED" }),
      })
    );
  });

  it("should attach user and call next() for valid token + active user", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue(mockUser as Awaited<ReturnType<typeof db.user.findUnique>>);

    const req = createMockReq({ cookies: { accessToken: "valid-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toEqual(mockPayload);
    expect((req as AuthenticatedRequest).dbUser).toEqual(mockUser);
  });

  it("should return 401 TOKEN_EXPIRED for expired token", async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Token expired");
    });

    const req = createMockReq({ cookies: { accessToken: "expired-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "TOKEN_EXPIRED" }),
      })
    );
  });

  it("should return 401 INVALID_TOKEN for invalid token", async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = createMockReq({ cookies: { accessToken: "bad-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INVALID_TOKEN" }),
      })
    );
  });

  it("should return 401 USER_NOT_FOUND when user does not exist", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue(null);

    const req = createMockReq({ cookies: { accessToken: "valid-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "USER_NOT_FOUND" }),
      })
    );
  });

  it("should return 403 USER_DEACTIVATED for inactive user", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue({
      ...mockUser,
      isActive: false,
    } as Awaited<ReturnType<typeof db.user.findUnique>>);

    const req = createMockReq({ cookies: { accessToken: "valid-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "USER_DEACTIVATED" }),
      })
    );
  });

  it("should prefer cookie token over Authorization header", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue(mockUser as Awaited<ReturnType<typeof db.user.findUnique>>);

    const req = createMockReq({
      cookies: { accessToken: "cookie-token" },
      headers: { authorization: "Bearer header-token" },
    });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(mockVerifyToken).toHaveBeenCalledWith("cookie-token");
  });

  it("should fall back to Authorization header when no cookie", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue(mockUser as Awaited<ReturnType<typeof db.user.findUnique>>);

    const req = createMockReq({
      cookies: {},
      headers: { authorization: "Bearer header-token" },
    });
    const res = createMockRes();
    const next = createMockNext();

    await authMiddleware(req, res, next);

    expect(mockVerifyToken).toHaveBeenCalledWith("header-token");
  });
});

describe("adminMiddleware", () => {
  it("should call next() for ADMIN user", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = { ...mockUser, role: "ADMIN" } as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should call next() for SUPER_ADMIN user", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = { ...mockUser, role: "SUPER_ADMIN" } as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 for regular USER", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = mockUser as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when no user attached", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("superAdminMiddleware", () => {
  it("should call next() for SUPER_ADMIN user", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = { ...mockUser, role: "SUPER_ADMIN" } as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await superAdminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 for ADMIN user", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = { ...mockUser, role: "ADMIN" } as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await superAdminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 for regular USER", async () => {
    const req = createMockReq() as AuthenticatedRequest;
    req.user = mockPayload;
    req.dbUser = mockUser as AuthenticatedRequest["dbUser"];
    const res = createMockRes();
    const next = createMockNext();

    await superAdminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("optionalAuthMiddleware", () => {
  it("should attach user when valid token provided", async () => {
    mockVerifyToken.mockReturnValue(mockPayload as ReturnType<typeof verifyToken>);
    mockFindUnique.mockResolvedValue(mockUser as Awaited<ReturnType<typeof db.user.findUnique>>);

    const req = createMockReq({ cookies: { accessToken: "valid-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toEqual(mockPayload);
  });

  it("should call next() without user when no token", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("should call next() without user when token is invalid", async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = createMockReq({ cookies: { accessToken: "bad-token" } });
    const res = createMockRes();
    const next = createMockNext();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
