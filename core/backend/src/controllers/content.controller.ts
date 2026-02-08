/**
 * Content Controller
 *
 * Handles HTTP requests for CMS content page management.
 * Delegates business logic to contentService.
 */

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { contentService } from "../services/content.service";
import { auditService } from "../services/audit.service";
import { successResponse, paginatedResponse } from "../utils/response";
import { z } from "zod";
import { slugSchema, seoMetaSchema, booleanFilterSchema, paginationSchema } from "../utils/validation-schemas";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers";

// ============================================================================
// Validation Schemas
// ============================================================================

const contentPageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  metaTitle: z.string().max(60).nullable().optional(),
  metaDesc: z.string().max(160).nullable().optional(),
  isPublished: z.boolean().optional(),
});

const getContentPagesQuerySchema = paginationSchema.extend({
  isPublished: booleanFilterSchema,
});

// ============================================================================
// Controller
// ============================================================================

export const contentController = {
  // ==========================================================================
  // Admin endpoints
  // ==========================================================================

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = getContentPagesQuerySchema.parse(req.query);
      const result = await contentService.getAll({
        isPublished: query.isPublished,
        page: query.page,
        limit: query.limit,
      });

      res.json(paginatedResponse(result.pages, result.page, result.limit, result.total));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const page = await contentService.getById(id);
      res.json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(contentPageSchema, req.body, res);
      if (!validated) return;

      const page = await contentService.create(validated);

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "ContentPage",
        entityId: page.id,
        changes: { new: { slug: validated.slug, title: validated.title } },
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
      const validated = validateOrRespond(contentPageSchema.partial(), req.body, res);
      if (!validated) return;

      const existing = await contentService.getById(id);
      const page = await contentService.update(id, validated);

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
      const existing = await contentService.delete(id);

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

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;
      const page = await contentService.getBySlug(slug);
      res.json(successResponse({ page }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Export all content pages as CSV (admin only)
   * GET /api/v1/admin/content/export
   */
  async exportContentPages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pages = await contentService.getAllForExport();

      sendCsvExport(res, pages, [
        { header: "ID", accessor: "id" },
        { header: "Slug", accessor: "slug" },
        { header: "Title", accessor: "title" },
        { header: "Content", accessor: "content" },
        { header: "Meta Title", accessor: (item) => item.metaTitle || "" },
        { header: "Meta Description", accessor: (item) => item.metaDesc || "" },
        { header: "Published", accessor: "isPublished" },
        { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
        { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
      ], { filenamePrefix: "content-pages-export" });
    } catch (error) {
      next(error);
    }
  },
};
