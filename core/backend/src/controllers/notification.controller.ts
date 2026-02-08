import { Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { successResponse, paginatedResponse } from "../utils/response";
import { z } from "zod";
import { AppRequest } from "../types";
import { NotificationType } from "@prisma/client";

// ============================================================================
// Validation Schemas
// ============================================================================

const getNotificationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  type: z.nativeEnum(NotificationType).optional(),
});

// ============================================================================
// Controller Class
// ============================================================================

class NotificationController {
  /**
   * Get all notifications for the authenticated user
   * GET /api/v1/notifications
   */
  async getAll(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const params = getNotificationsSchema.parse(req.query);
      const result = await notificationService.getAll({
        userId,
        ...params,
      });

      res.json(
        paginatedResponse(
          result.items,
          result.pagination.page,
          result.pagination.limit,
          result.pagination.total
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count for the authenticated user
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);

      res.json(successResponse({ count }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single notification
   * GET /api/v1/notifications/:id
   */
  async getById(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const notification = await notificationService.getById(id, userId);

      res.json(successResponse({ notification }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const notification = await notificationService.markAsRead(id, userId);

      res.json(successResponse({ notification }, "Notification marked as read"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAllAsRead(userId);

      res.json(successResponse(result, "All notifications marked as read"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/:id
   */
  async delete(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      await notificationService.delete(id, userId);

      res.json(successResponse(null, "Notification deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all notifications
   * DELETE /api/v1/notifications
   */
  async deleteAll(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.deleteAll(userId);

      res.json(successResponse(result, "All notifications deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const notificationController = new NotificationController();
