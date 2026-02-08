import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { db } from "../lib/db";
import { auditService } from "../services/audit.service";
import { successResponse, errorResponse, ErrorCodes, paginatedResponse } from "../utils/response";
import { z } from "zod";

// Validation schemas
const contentPageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  metaTitle: z.string().max(60).nullable().optional(),
  metaDesc: z.string().max(160).nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const contentController = {
  // ============================================================================
  // Admin endpoints
  // ============================================================================

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { isPublished, page = "1", limit = "20" } = req.query;

      const where: Record<string, unknown> = {};
      if (isPublished !== undefined) where.isPublished = isPublished === "true";

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [pages, total] = await Promise.all([
        db.contentPage.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take,
        }),
        db.contentPage.count({ where }),
      ]);

      res.json(paginatedResponse(pages, parseInt(page as string), take, total));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const page = await db.contentPage.findUnique({ where: { id } });

      if (!page) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Page not found"));
      }

      res.json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = contentPageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      // Check if slug already exists
      const existing = await db.contentPage.findUnique({ where: { slug: parsed.data.slug } });
      if (existing) {
        return res.status(409).json(errorResponse(ErrorCodes.CONFLICT, "Slug already exists"));
      }

      const page = await db.contentPage.create({ data: parsed.data });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "ContentPage",
        entityId: page.id,
        changes: { new: { slug: parsed.data.slug, title: parsed.data.title } },
        req,
      });

      res.status(201).json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = contentPageSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const existing = await db.contentPage.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Page not found"));
      }

      // If changing slug, check for conflicts
      if (parsed.data.slug && parsed.data.slug !== existing.slug) {
        const slugExists = await db.contentPage.findUnique({ where: { slug: parsed.data.slug } });
        if (slugExists) {
          return res.status(409).json(errorResponse(ErrorCodes.CONFLICT, "Slug already exists"));
        }
      }

      const page = await db.contentPage.update({
        where: { id },
        data: parsed.data,
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "ContentPage",
        entityId: id,
        changes: {
          old: { slug: existing.slug, title: existing.title },
          new: { slug: page.slug, title: page.title },
        },
        req,
      });

      res.json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await db.contentPage.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Page not found"));
      }

      await db.contentPage.delete({ where: { id } });

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "ContentPage",
        entityId: id,
        changes: { old: { slug: existing.slug, title: existing.title } },
        req,
      });

      res.json(successResponse({ message: "Page deleted" }));
    } catch (error) {
      next(error);
    }
  },

  // ============================================================================
  // Public endpoints
  // ============================================================================

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;

      const page = await db.contentPage.findUnique({
        where: { slug },
        select: {
          slug: true,
          title: true,
          content: true,
          metaTitle: true,
          metaDesc: true,
          updatedAt: true,
        },
      });

      if (!page) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Page not found"));
      }

      res.json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },
};
