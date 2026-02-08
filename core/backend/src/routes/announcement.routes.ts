import { Router, Request } from "express";
import { announcementController } from "../controllers/announcement.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// ============================================================================
// Public routes
// ============================================================================

router.get("/active", (req, res, next) =>
  announcementController.getActive(req as Request, res, next)
);

// ============================================================================
// Admin routes
// ============================================================================

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", (req, res, next) =>
  announcementController.getAll(req as unknown as AuthenticatedRequest, res, next)
);

// Export announcements (must be before /:id to avoid matching "export" as id)
router.get("/export", (req, res, next) =>
  announcementController.exportAnnouncements(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/:id", (req, res, next) =>
  announcementController.getById(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/", (req, res, next) =>
  announcementController.create(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/:id", (req, res, next) =>
  announcementController.update(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/:id", (req, res, next) =>
  announcementController.delete(req as unknown as AuthenticatedRequest, res, next)
);

export default router;
