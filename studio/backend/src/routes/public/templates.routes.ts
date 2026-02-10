import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// Query parameter validation schemas
const listTemplatesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().max(100).optional(),
});

const slugParamSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_.]+$/),
});

/**
 * GET /api/templates
 * List all active templates
 */
router.get("/", async (req, res, next) => {
  try {
    // Validate query parameters
    const queryResult = listTemplatesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw ApiError.validation(queryResult.error.flatten().fieldErrors);
    }
    const { search } = queryResult.data;
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPopular: "desc" }, { displayOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          price: true,
          compareAtPrice: true,
          includedFeatures: true,
          baseTier: true,
          iconName: true,
          imageUrl: true,
          displayOrder: true,
          isPopular: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.template.count({ where }),
    ]);

    sendPaginated(res, templates, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:slug
 * Get single template by slug with full feature details
 */
router.get("/:slug", async (req, res, next) => {
  try {
    // Validate slug parameter
    const paramResult = slugParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const template = await prisma.template.findFirst({
      where: {
        slug: paramResult.data.slug,
        isActive: true,
      },
    });

    if (!template) {
      throw ApiError.notFound("Template");
    }

    // Get feature details for included features
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: template.includedFeatures },
        isActive: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            iconName: true,
          },
        },
      },
    });

    // Get base tier info
    const baseTier = await prisma.pricingTier.findFirst({
      where: {
        slug: template.baseTier,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        includedFeatures: true,
      },
    });

    sendSuccess(res, {
      ...template,
      features,
      baseTierInfo: baseTier,
    });
  } catch (error) {
    next(error);
  }
});

export { router as publicTemplatesRoutes };
