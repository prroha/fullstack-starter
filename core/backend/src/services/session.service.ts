import crypto from "crypto";
import { db } from "../lib/db.js";
import { ApiError } from "../middleware/error.middleware.js";
import { ErrorCodes } from "../utils/response.js";
import { logger } from "../lib/logger.js";

// ua-parser-js is MIT licensed - we'll use a simple implementation for now
// to avoid adding a dependency. For production, consider using ua-parser-js.

interface DeviceInfo {
  browser: string | null;
  os: string | null;
  deviceName: string | null;
}

interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SessionResponse {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

// Refresh token expiry in milliseconds (30 days)
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Parse user agent string to extract device info
 * Simple implementation - for production, use ua-parser-js
 */
function parseUserAgent(userAgent?: string): DeviceInfo {
  if (!userAgent) {
    return { browser: null, os: null, deviceName: null };
  }

  let browser: string | null = null;
  let os: string | null = null;
  let deviceName: string | null = null;

  // Parse browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : "Chrome";
  } else if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : "Safari";
  } else if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : "Edge";
  } else if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    const match = userAgent.match(/(?:OPR|Opera)\/(\d+)/);
    browser = match ? `Opera ${match[1]}` : "Opera";
  }

  // Parse OS
  if (userAgent.includes("Windows NT 10") || userAgent.includes("Windows NT 11")) {
    os = "Windows";
  } else if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS X")) {
    os = "macOS";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  }

  // Parse device type
  if (userAgent.includes("iPhone")) {
    deviceName = "iPhone";
  } else if (userAgent.includes("iPad")) {
    deviceName = "iPad";
  } else if (userAgent.includes("Android")) {
    if (userAgent.includes("Mobile")) {
      deviceName = "Android Phone";
    } else {
      deviceName = "Android Tablet";
    }
  } else if (userAgent.includes("Windows") || userAgent.includes("Mac") || userAgent.includes("Linux")) {
    deviceName = "Desktop";
  }

  // Combine for a friendly name
  if (!deviceName && browser && os) {
    deviceName = `${browser} on ${os}`;
  }

  return { browser, os, deviceName };
}

/**
 * Hash a refresh token for secure storage
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

class SessionService {
  /**
   * Create a new session for a user
   */
  async createSession(input: CreateSessionInput): Promise<string> {
    const { userId, refreshToken, ipAddress, userAgent } = input;

    const refreshTokenHash = hashToken(refreshToken);
    const deviceInfo = parseUserAgent(userAgent);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    const session = await db.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceName: deviceInfo.deviceName,
        expiresAt,
      },
    });

    logger.info("Session created", { userId, sessionId: session.id, deviceName: deviceInfo.deviceName });

    return session.visibleId;
  }

  /**
   * Update session's lastActiveAt timestamp
   */
  async updateSessionActivity(refreshToken: string): Promise<void> {
    const refreshTokenHash = hashToken(refreshToken);

    await db.session.updateMany({
      where: { refreshTokenHash },
      data: { lastActiveAt: new Date() },
    });
  }

  /**
   * Find session by refresh token
   */
  async findSessionByRefreshToken(refreshToken: string) {
    const refreshTokenHash = hashToken(refreshToken);

    return db.session.findFirst({
      where: {
        refreshTokenHash,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Delete session by refresh token (logout)
   */
  async deleteSessionByRefreshToken(refreshToken: string): Promise<void> {
    const refreshTokenHash = hashToken(refreshToken);

    await db.session.deleteMany({
      where: { refreshTokenHash },
    });

    logger.info("Session deleted by refresh token");
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, currentRefreshToken?: string): Promise<SessionResponse[]> {
    const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    const sessions = await db.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.visibleId,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      isCurrent: currentTokenHash ? session.refreshTokenHash === currentTokenHash : false,
    }));
  }

  /**
   * Revoke a specific session by visible ID
   */
  async revokeSession(userId: string, sessionVisibleId: string): Promise<void> {
    const session = await db.session.findUnique({
      where: { visibleId: sessionVisibleId },
    });

    if (!session) {
      throw ApiError.notFound("Session not found", ErrorCodes.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw ApiError.forbidden("Cannot revoke another user's session", ErrorCodes.FORBIDDEN);
    }

    await db.session.delete({
      where: { visibleId: sessionVisibleId },
    });

    logger.info("Session revoked", { userId, sessionId: sessionVisibleId });
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeAllOtherSessions(userId: string, currentRefreshToken: string): Promise<number> {
    const currentTokenHash = hashToken(currentRefreshToken);

    const result = await db.session.deleteMany({
      where: {
        userId,
        refreshTokenHash: { not: currentTokenHash },
      },
    });

    logger.info("All other sessions revoked", { userId, count: result.count });

    return result.count;
  }

  /**
   * Clean up expired sessions (can be run as a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await db.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info("Cleaned up expired sessions", { count: result.count });
    }

    return result.count;
  }

  /**
   * Delete all sessions for a user (e.g., on password change)
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    await db.session.deleteMany({
      where: { userId },
    });

    logger.info("All user sessions deleted", { userId });
  }
}

export const sessionService = new SessionService();

// Export types
export type { SessionResponse, CreateSessionInput };
