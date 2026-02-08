import { Router, Request } from "express";
import { contentController } from "../controllers/content.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// ============================================================================
// Public routes
// ============================================================================

router.get("/page/:slug", (req, res, next) =>
  contentController.getBySlug(req as Request, res, next)
);

// ============================================================================
// Admin routes
// ============================================================================

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", (req, res, next) =>
  contentController.getAll(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/:id", (req, res, next) =>
  contentController.getById(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/", (req, res, next) =>
  contentController.create(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/:id", (req, res, next) =>
  contentController.update(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/:id", (req, res, next) =>
  contentController.delete(req as unknown as AuthenticatedRequest, res, next)
);

export default router;
