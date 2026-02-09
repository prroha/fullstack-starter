/**
 * Announcement Controller
 *
 * Handles HTTP requests for announcement management.
 * Delegates business logic to announcementService.
 */

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { announcementService } from "../services/announcement.service";
import { auditService } from "../services/audit.service";
import { successResponse, paginatedResponse } from "../utils/response";
import { z } from "zod";
import { booleanFilterSchema, paginationSchema } from "../utils/validation-schemas";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers";

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

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = getAnnouncementsQuerySchema.parse(req.query);
      const result = await announcementService.getAll({
        type: query.type,
        isActive: query.isActive,
        page: query.page,
        limit: query.limit,
      });

      res.json(paginatedResponse(result.announcements, result.page, result.limit, result.total));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const announcement = await announcementService.getById(id);
      res.json(successResponse({ announcement }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateOrRespond(announcementSchema, req.body, res);
      if (!validated) return;

      const { startDate, endDate, ...rest } = validated;
      const announcement = await announcementService.create({
        ...rest,
        ...parseDateFields({ startDate, endDate }),
      });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Announcement",
        entityId: announcement.id,
        changes: { new: validated },
        req,
      });

      res.status(201).json(successResponse({ announcement }));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = validateOrRespond(announcementSchema.partial(), req.body, res);
      if (!validated) return;

      const existing = await announcementService.getById(id);

      const { startDate, endDate, ...rest } = validated;
      const announcement = await announcementService.update(id, {
        ...rest,
        ...parseDateFields({ startDate, endDate }),
      });

      await auditService.log({
        userId: req.user.userId,
        action: "UPDATE",
        entity: "Announcement",
        entityId: id,
        changes: { old: existing, new: announcement },
        req,
      });

      res.json(successResponse({ announcement }));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const existing = await announcementService.delete(id);

      await auditService.log({
        userId: req.user.userId,
        action: "DELETE",
        entity: "Announcement",
        entityId: id,
        changes: { old: existing },
        req,
      });

      res.json(successResponse({ message: "Announcement deleted" }));
    } catch (error) {
      next(error);
    }
  },

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const announcements = await announcementService.getActive();
      res.json(successResponse({ announcements }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Export all announcements as CSV (admin only)
   * GET /api/v1/admin/announcements/export
   */
  async exportAnnouncements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const announcements = await announcementService.getAllForExport();

      sendCsvExport(res, announcements, [
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
    } catch (error) {
      next(error);
    }
  },
};
