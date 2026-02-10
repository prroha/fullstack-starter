import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// Parameter validation schemas
const sessionIdParamSchema = z.object({
  id: z.string().uuid(),
});

const tierParamSchema = z.object({
  tier: z.string().min(1).max(50).regex(/^[a-z0-9-_]+$/),
});

// Request body validation schemas
const createSessionSchema = z.object({
  tier: z.string().min(1).max(50),
  features: z.array(z.string().max(100)).max(100),
  templateId: z.string().max(100).optional(),
});

const updateSessionSchema = z.object({
  duration: z.number().int().min(0).max(86400).optional(), // Max 24 hours in seconds
  pageViews: z.number().int().min(0).max(10000).optional(),
});

/**
 * POST /api/preview/session
 * Create a preview session (for analytics tracking)
 * Note: Consider adding rate limiting middleware to prevent abuse
 */
router.post("/session", async (req, res, next) => {
  try {
    // Validate request body
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }
    const input = parseResult.data;

    // Generate a unique session ID
    const sessionId = `preview_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Create preview session record
    const session = await prisma.previewSession.create({
      data: {
        sessionId,
        tier: input.tier,
        selectedFeatures: input.features,
        templateId: input.templateId,
      },
    });

    sendSuccess(res, {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
    }, "Preview session created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/preview/session/:id
 * Update preview session (end session, track duration)
 */
router.patch("/session/:id", async (req, res, next) => {
  try {
    // Validate session ID parameter
    const paramResult = sessionIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    // Validate request body
    const parseResult = updateSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }
    const input = parseResult.data;

    // Check if session exists before updating
    const existingSession = await prisma.previewSession.findUnique({
      where: { id: paramResult.data.id },
    });

    if (!existingSession) {
      throw ApiError.notFound("Preview session");
    }

    const session = await prisma.previewSession.update({
      where: { id: paramResult.data.id },
      data: {
        lastActivityAt: new Date(),
        duration: input.duration,
        pageViews: input.pageViews,
      },
    });

    sendSuccess(res, {
      sessionId: session.sessionId,
      duration: session.duration,
    }, "Preview session updated");
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/preview/config/:tier
 * Get preview configuration for a tier
 */
router.get("/config/:tier", async (req, res, next) => {
  try {
    // Validate tier parameter
    const paramResult = tierParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const tier = await prisma.pricingTier.findFirst({
      where: {
        slug: paramResult.data.tier,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        includedFeatures: true,
      },
    });

    if (!tier) {
      // Return default config for unknown tier
      sendSuccess(res, {
        tier: paramResult.data.tier,
        features: [],
        modules: [],
      });
      return;
    }

    // Get feature details
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: tier.includedFeatures },
        isActive: true,
      },
      select: {
        slug: true,
        name: true,
        iconName: true,
        module: {
          select: {
            category: true,
            name: true,
          },
        },
      },
    });

    // Group by category
    const byCategory: Record<string, typeof features> = {};
    for (const feature of features) {
      const category = feature.module?.category || "other";
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(feature);
    }

    sendSuccess(res, {
      tier: tier.slug,
      tierName: tier.name,
      features: features.map((f) => ({
        slug: f.slug,
        name: f.name,
        category: f.module?.category,
      })),
      byCategory,
    });
  } catch (error) {
    next(error);
  }
});

export { router as publicPreviewRoutes };
