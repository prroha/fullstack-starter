/**
 * Content Controller
 *
 * Handles HTTP requests for CMS content page management.
 * Delegates business logic to contentService.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/index.js";
import { contentService } from "../services/content.service.js";
import { auditService } from "../services/audit.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";
import { z } from "zod";
import { slugSchema, booleanFilterSchema, paginationSchema } from "../utils/validation-schemas.js";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers.js";

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

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const query = getContentPagesQuerySchema.parse(req.query);
    const result = await contentService.getAll({
      isPublished: query.isPublished,
      page: query.page,
      limit: query.limit,
    });

    return reply.send(paginatedResponse(result.pages, result.page, result.limit, result.total));
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const page = await contentService.getById(id);
    return reply.send(successResponse({ page }));
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(contentPageSchema, req.body, reply);
    if (!validated) return;

    const page = await contentService.create(validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "ContentPage",
      entityId: page.id,
      changes: { new: { slug: validated.slug, title: validated.title } },
      req,
    });

    return reply.code(201).send(successResponse({ page }));
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const validated = validateOrRespond(contentPageSchema.partial(), req.body, reply);
    if (!validated) return;

    const existing = await contentService.getById(id);
    const page = await contentService.update(id, validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "ContentPage",
      entityId: id,
      changes: {
        old: { slug: existing.slug, title: existing.title },
        new: { slug: page.slug, title: page.title },
      },
      req,
    });

    return reply.send(successResponse({ page }));
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const existing = await contentService.delete(id);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "ContentPage",
      entityId: id,
      changes: { old: { slug: existing.slug, title: existing.title } },
      req,
    });

    return reply.send(successResponse({ message: "Page deleted" }));
  },

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getBySlug(req: FastifyRequest, reply: FastifyReply) {
    const slug = (req.params as Record<string, string>).slug;
    const page = await contentService.getBySlug(slug);
    return reply.send(successResponse({ page }));
  },

  /**
   * Export all content pages as CSV (admin only)
   * GET /api/v1/admin/content/export
   */
  async exportContentPages(req: FastifyRequest, reply: FastifyReply) {
    const pages = await contentService.getAllForExport();

    sendCsvExport(reply, pages, [
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
  },
};
