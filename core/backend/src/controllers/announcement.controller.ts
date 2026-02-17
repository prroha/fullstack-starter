/**
 * Announcement Controller
 *
 * Handles HTTP requests for announcement management.
 * Delegates business logic to announcementService.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/index.js";
import { announcementService } from "../services/announcement.service.js";
import { auditService } from "../services/audit.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";
import { z } from "zod";
import { booleanFilterSchema, paginationSchema } from "../utils/validation-schemas.js";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

const getAnnouncementsQuerySchema = paginationSchema.extend({
  type: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  isActive: booleanFilterSchema,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse date strings to Date objects for database
 */
function parseDateFields(data: {
  startDate?: string | null;
  endDate?: string | null;
}): { startDate?: Date | null; endDate?: Date | null } {
  const result: { startDate?: Date | null; endDate?: Date | null } = {};

  if (data.startDate !== undefined) {
    result.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.endDate !== undefined) {
    result.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  return result;
}

// ============================================================================
// Controller
// ============================================================================

export const announcementController = {
  // ==========================================================================
  // Admin endpoints
  // ==========================================================================

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const query = getAnnouncementsQuerySchema.parse(req.query);
    const result = await announcementService.getAll({
      type: query.type,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
    });

    return reply.send(paginatedResponse(result.announcements, result.page, result.limit, result.total));
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const announcement = await announcementService.getById(id);
    return reply.send(successResponse({ announcement }));
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(announcementSchema, req.body, reply);
    if (!validated) return;

    const { startDate, endDate, ...rest } = validated;
    const announcement = await announcementService.create({
      ...rest,
      ...parseDateFields({ startDate, endDate }),
    });

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "Announcement",
      entityId: announcement.id,
      changes: { new: validated },
      req,
    });

    return reply.code(201).send(successResponse({ announcement }));
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const validated = validateOrRespond(announcementSchema.partial(), req.body, reply);
    if (!validated) return;

    const existing = await announcementService.getById(id);

    const { startDate, endDate, ...rest } = validated;
    const announcement = await announcementService.update(id, {
      ...rest,
      ...parseDateFields({ startDate, endDate }),
    });

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Announcement",
      entityId: id,
      changes: { old: existing, new: announcement },
      req,
    });

    return reply.send(successResponse({ announcement }));
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const existing = await announcementService.delete(id);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "Announcement",
      entityId: id,
      changes: { old: existing },
      req,
    });

    return reply.send(successResponse({ message: "Announcement deleted" }));
  },

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getActive(req: FastifyRequest, reply: FastifyReply) {
    const announcements = await announcementService.getActive();
    return reply.send(successResponse({ announcements }));
  },

  /**
   * Export all announcements as CSV (admin only)
   * GET /api/v1/admin/announcements/export
   */
  async exportAnnouncements(req: FastifyRequest, reply: FastifyReply) {
    const announcements = await announcementService.getAllForExport();

    sendCsvExport(reply, announcements, [
      { header: "ID", accessor: "id" },
      { header: "Title", accessor: "title" },
      { header: "Content", accessor: "content" },
      { header: "Type", accessor: "type" },
      { header: "Start Date", accessor: (item) => item.startDate?.toISOString() || "" },
      { header: "End Date", accessor: (item) => item.endDate?.toISOString() || "" },
      { header: "Active", accessor: "isActive" },
      { header: "Pinned", accessor: "isPinned" },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "announcements-export" });
  },
};
