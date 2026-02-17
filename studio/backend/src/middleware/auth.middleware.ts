import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: "user" | "admin";
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * Authenticate user from JWT token
 */
export async function authenticate(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    // Check cookie first (set by login endpoint), then Authorization header
    const cookieToken = req.cookies?.auth_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || headerToken;

    if (!token) {
      throw ApiError.unauthorized("No token provided");
    }

    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as {
      userId: string;
      role?: string;
    };

    const user = await prisma.studioUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, isBlocked: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (user.isBlocked) {
      throw ApiError.forbidden("Account is blocked");
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (payload.role as "user" | "admin") || "user",
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized("Invalid token");
    } else if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Token expired");
    }
    throw error;
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized("Not authenticated");
  }

  if (req.user.role !== "admin") {
    throw ApiError.forbidden("Admin access required");
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const cookieToken = req.cookies?.auth_token;
  const authHeader = req.headers.authorization;
  if (!cookieToken && !authHeader?.startsWith("Bearer ")) {
    return;
  }

  await authenticate(req, _reply);
}
