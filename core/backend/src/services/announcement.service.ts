/**
 * Announcement Service
 *
 * Business logic for announcement management.
 */

import { db } from "../lib/db";
import { ApiError } from "../middleware/error.middleware";

// ============================================================================
// Types
// ============================================================================

export type AnnouncementType = "INFO" | "WARNING" | "SUCCESS" | "PROMO";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  type?: AnnouncementType;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
  isPinned?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
  isPinned?: boolean;
}

export interface GetAnnouncementsParams {
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Service Class
// ============================================================================

class AnnouncementService {
  /**
   * Get paginated list of announcements (admin)
   */
  async getAll(params: GetAnnouncementsParams = {}) {
    const { type, isActive, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
    ]);

    return { announcements, total, page, limit };
  }

  /**
   * Get announcement by ID
   */
  async getById(id: string) {
    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw ApiError.notFound("Announcement not found");
    }
    return announcement;
  }

  /**
   * Create announcement
   */
  async create(input: CreateAnnouncementInput) {
    return db.announcement.create({
      data: input,
    });
  }

  /**
   * Update announcement
   */
  async update(id: string, input: UpdateAnnouncementInput) {
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Announcement not found");
    }

    return db.announcement.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete announcement
   */
  async delete(id: string) {
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Announcement not found");
    }

    await db.announcement.delete({ where: { id } });
    return existing;
  }

  /**
   * Get active announcements (public)
   */
  async getActive() {
    const now = new Date();

    return db.announcement.findMany({
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
  }

  /**
   * Get all announcements for export
   */
  async getAllForExport() {
    return db.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const announcementService = new AnnouncementService();
