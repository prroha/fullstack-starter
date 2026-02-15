import { Router, Request } from "express";
import { settingController } from "../controllers/setting.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ============================================================================
// Public routes
// ============================================================================

router.get("/public", (req, res, next) =>
  settingController.getPublic(req as Request, res, next)
);

// ============================================================================
// Admin routes
// ============================================================================

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", (req, res, next) =>
  settingController.getAll(req as unknown as AuthenticatedRequest, res, next)
);

// Export settings (must be before /:key to avoid matching "export" as key)
router.get("/export", (req, res, next) =>
  settingController.exportSettings(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/:key", (req, res, next) =>
  settingController.getByKey(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/", (req, res, next) =>
  settingController.create(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/:key", (req, res, next) =>
  settingController.update(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/bulk", (req, res, next) =>
  settingController.bulkUpdate(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/:key", (req, res, next) =>
  settingController.delete(req as unknown as AuthenticatedRequest, res, next)
);

export default router;
