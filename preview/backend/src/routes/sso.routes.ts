/**
 * SSO Routes — Automatic login from Studio → Preview
 *
 * Flow:
 * 1. Studio creates preview session + SSO JWT signed with shared JWT_SECRET
 * 2. Studio opens preview URL: {PREVIEW_URL}?session={token}&sso={jwt}
 * 3. Preview frontend calls POST /api/v1/auth/sso with the JWT
 * 4. This route validates the JWT, creates a demo user in the preview schema, returns auth cookie
 */

import crypto from "crypto";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env.js";

/**
 * Derive signing secret for access tokens — matches core/backend/src/utils/jwt.ts getSecret().
 * Uses HMAC-SHA256 with the base JWT_SECRET and token type as key material.
 */
function getAccessTokenSecret(): string {
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update("access")
    .digest("hex");
}

const ssoBodySchema = z.object({
  ssoToken: z.string().min(1),
});

interface SsoJwtPayload {
  sessionToken: string;
  tier: string;
  audience: string;
  iat?: number;
  exp?: number;
}

// Cache the demo password hash — computed once on first SSO request, reused thereafter.
// This avoids running bcrypt (~100ms) on every request.
let cachedDemoHash: string | null = null;
async function getDemoPasswordHash(): Promise<string> {
  if (!cachedDemoHash) {
    cachedDemoHash = await bcrypt.hash("preview-demo-password", 10);
  }
  return cachedDemoHash;
}

const ssoRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/auth/sso
   *
   * Validates an SSO JWT from Studio and creates/returns a demo user session.
   * Requires X-Preview-Session header (handled by tenant middleware → req.db).
   */
  fastify.post("/auth/sso", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = ssoBodySchema.parse(req.body);

    // Validate SSO JWT
    let payload: SsoJwtPayload;
    try {
      payload = jwt.verify(body.ssoToken, env.JWT_SECRET) as SsoJwtPayload;
    } catch {
      return reply.code(401).send({
        success: false,
        error: { message: "Invalid or expired SSO token", code: "INVALID_SSO_TOKEN" },
      });
    }

    // Verify the audience claim
    if (payload.audience !== "preview-sso") {
      return reply.code(401).send({
        success: false,
        error: { message: "Invalid SSO token audience", code: "INVALID_SSO_TOKEN" },
      });
    }

    // Verify the session token matches the one in the X-Preview-Session header (timing-safe)
    const expectedToken = req.previewSession?.token;
    if (
      !expectedToken ||
      expectedToken.length !== payload.sessionToken.length ||
      !crypto.timingSafeEqual(
        Buffer.from(payload.sessionToken),
        Buffer.from(expectedToken),
      )
    ) {
      return reply.code(401).send({
        success: false,
        error: { message: "SSO token does not match preview session", code: "SESSION_MISMATCH" },
      });
    }

    const db = req.db;
    if (!db) {
      return reply.code(503).send({
        success: false,
        error: { message: "Preview schema not ready", code: "SCHEMA_NOT_READY" },
      });
    }

    // Create or find demo user in the preview schema (upsert for race-safety)
    const demoEmail = "demo@preview.local";
    const user = await db.user.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        email: demoEmail,
        password: await getDemoPasswordHash(),
        name: "Demo User",
        role: "ADMIN",
        isActive: true,
        emailVerified: true,
      },
    });

    // Generate access token using the same derived secret as core auth middleware
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, type: "access" },
      getAccessTokenSecret(),
      { expiresIn: "4h" },
    );

    // Set httpOnly cookie (same pattern as core auth)
    reply.setCookie("access_token", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 4 * 60 * 60, // 4 hours
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  });
};

export default ssoRoutes;
