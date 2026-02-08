import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { db } from "../lib/db";
import { auditService } from "../services/audit.service";
import { exportService } from "../services/export.service";
import { successResponse, errorResponse, ErrorCodes, paginatedResponse } from "../utils/response";
import { z } from "zod";

// Validation schemas
const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const announcementController = {
  // ============================================================================
  // Admin endpoints
  // ============================================================================

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, isActive, page = "1", limit = "20" } = req.query;

      const where: Record<string, unknown> = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === "true";

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [announcements, total] = await Promise.all([
        db.announcement.findMany({
          where,
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          skip,
          take,
        }),
        db.announcement.count({ where }),
      ]);

      res.json(paginatedResponse(announcements, parseInt(page as string), take, total));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const announcement = await db.announcement.findUnique({ where: { id } });

      if (!announcement) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Announcement not found"));
      }

      res.json(successResponse({ announcement }));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = announcementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const announcement = await db.announcement.create({
        data: {
          ...parsed.data,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        },
      });

      await auditService.log({
        userId: req.user.userId,
        action: "CREATE",
        entity: "Announcement",
        entityId: announcement.id,
        changes: { new: parsed.data },
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
      const parsed = announcementSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid input"));
      }

      const existing = await db.announcement.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Announcement not found"));
      }

      const announcement = await db.announcement.update({
        where: { id },
        data: {
          ...parsed.data,
          startDate: parsed.data.startDate !== undefined
            ? (parsed.data.startDate ? new Date(parsed.data.startDate) : null)
            : undefined,
          endDate: parsed.data.endDate !== undefined
            ? (parsed.data.endDate ? new Date(parsed.data.endDate) : null)
            : undefined,
        },
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

      const existing = await db.announcement.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, "Announcement not found"));
      }

      await db.announcement.delete({ where: { id } });

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

  // ============================================================================
  // Public endpoints
  // ============================================================================

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();

      const announcements = await db.announcement.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } },
              ],
            },
          ],
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });

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
      const timestamp = new Date().toISOString().split("T")[0];

      const announcements = await db.announcement.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });

      const csv = exportService.exportToCsv(announcements, [
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
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="announcements-export-${timestamp}.csv"`
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};
