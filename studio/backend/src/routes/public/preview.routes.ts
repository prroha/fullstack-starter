/**
 * Preview Session Routes
 * Manages preview sessions for the configurator
 */

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
    selectedFeatures: z.array(z.string()).min(1),
    tier: z.string(),
    templateSlug: z.string().optional(),
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
          selectedFeatures,
          tier,
          templateSlug,
          expiresAt,
        },
      });

      // Generate preview URL
      const previewBaseUrl = process.env.PREVIEW_APP_URL || "http://localhost:3000";
      const previewUrl = `${previewBaseUrl}?preview=${session.sessionToken}`;

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
  } catch (error) {
    next(error);
  }
});

export default router;
