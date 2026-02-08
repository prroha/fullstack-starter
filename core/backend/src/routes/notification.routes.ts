import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/notifications
 * Get all notifications for the authenticated user (paginated)
 * Query params: page, limit, read (true/false), type
 */
router.get(
  "/",
  (req, res, next) => notificationController.getAll(req, res, next)
);

/**
 * GET /api/v1/notifications/unread-count
 * Get the count of unread notifications
 */
router.get(
  "/unread-count",
  (req, res, next) => notificationController.getUnreadCount(req, res, next)
);

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.patch(
  "/read-all",
  (req, res, next) => notificationController.markAllAsRead(req, res, next)
);

/**
 * GET /api/v1/notifications/:id
 * Get a single notification
 */
router.get(
  "/:id",
  (req, res, next) => notificationController.getById(req, res, next)
);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
router.patch(
  "/:id/read",
  (req, res, next) => notificationController.markAsRead(req, res, next)
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification
 */
router.delete(
  "/:id",
  (req, res, next) => notificationController.delete(req, res, next)
);

/**
 * DELETE /api/v1/notifications
 * Delete all notifications for the authenticated user
 */
router.delete(
  "/",
  (req, res, next) => notificationController.deleteAll(req, res, next)
);

export default router;
