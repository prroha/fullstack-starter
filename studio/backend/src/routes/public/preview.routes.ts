/**
 * Preview Session Routes
 * Manages preview sessions for the configurator
 */

import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../../config/db.js";
import { validateRequest } from "../../middleware/validate.middleware.js";

const router = Router();

// Rate limiter for session creation: 100 requests per hour per IP
const createSessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per IP
  message: {
    success: false,
    error: "Too many preview sessions created. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token format validation middleware
// Token must be at least 20 characters, alphanumeric with dashes
const TOKEN_REGEX = /^[a-zA-Z0-9-]{20,}$/;

const validateTokenFormat = (req: Request<{ token: string }>, res: Response, next: NextFunction): void => {
  const { token } = req.params;

  if (!token || !TOKEN_REGEX.test(token)) {
    res.status(400).json({
      success: false,
      error: "Invalid token format. Token must be at least 20 characters and contain only alphanumeric characters and dashes.",
    });
    return;
  }

  next();
};

// Schema for creating a preview session
const createPreviewSessionSchema = z.object({
  body: z.object({
    selectedFeatures: z.array(z.string().max(100)).max(200),
    tier: z.string().max(50),
    templateSlug: z.string().max(100).optional(),
  }),
});

// POST /api/preview/sessions - Create a new preview session
router.post(
  "/sessions",
  createSessionLimiter,
  validateRequest(createPreviewSessionSchema),
  async (req, res, next) => {
    try {
      const { selectedFeatures, tier, templateSlug } = req.body;

      // Session expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const session = await prisma.previewSession.create({
        data: {
          sessionToken: crypto.randomBytes(24).toString('base64url'),
          selectedFeatures,
          tier,
          templateSlug,
          expiresAt,
        },
      });

      // Generate preview URL using the server-configured frontend origin,
      // falling back to the studio web app default
      const frontendOrigin =
        process.env.CORS_ORIGIN ||
        "http://localhost:3002";
      const previewUrl = `${frontendOrigin}/preview?preview=${session.sessionToken}`;

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          sessionToken: session.sessionToken,
          previewUrl,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/preview/sessions/:token - Get session configuration
router.get<{ token: string }>("/sessions/:token", validateTokenFormat, async (req, res, next) => {
  try {
    const { token } = req.params;

    const session = await prisma.previewSession.findUnique({
      where: { sessionToken: token },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: "Preview session not found",
      });
      return;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      res.status(410).json({
        success: false,
        error: "Preview session has expired",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        selectedFeatures: session.selectedFeatures,
        tier: session.tier,
        templateSlug: session.templateSlug,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/preview/sessions/:token - Delete a session
router.delete<{ token: string }>("/sessions/:token", validateTokenFormat, async (req, res, next) => {
  try {
    const { token } = req.params;

    await prisma.previewSession.delete({
      where: { sessionToken: token },
    });

    res.json({
      success: true,
      message: "Preview session deleted",
    });
  } catch (error: unknown) {
    // Handle "record not found" gracefully (already deleted or expired)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      res.json({
        success: true,
        message: "Preview session already deleted",
      });
      return;
    }
    next(error);
  }
});

export default router;
