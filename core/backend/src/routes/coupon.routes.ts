import { Router, Request } from "express";
import { couponController } from "../controllers/coupon.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/preview.middleware.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ============================================================================
// Feature Gate: Coupons require payments.stripe feature
// ============================================================================
router.use(requireFeature("payments.stripe"));

// ============================================================================
// Public routes
// ============================================================================

router.post("/validate", (req, res, next) =>
  couponController.validateCoupon(req as Request, res, next)
);

// ============================================================================
// Admin routes
// ============================================================================

router.use(authMiddleware);
router.use(adminMiddleware);

// Get all coupons with pagination and filters
router.get("/", (req, res, next) =>
  couponController.getAll(req as unknown as AuthenticatedRequest, res, next)
);

// Export coupons (must be before /:id to avoid matching "export" as id)
router.get("/export", (req, res, next) =>
  couponController.exportCoupons(req as unknown as AuthenticatedRequest, res, next)
);

// Get single coupon by ID
router.get("/:id", (req, res, next) =>
  couponController.getById(req as unknown as AuthenticatedRequest, res, next)
);

// Create new coupon
router.post("/", (req, res, next) =>
  couponController.create(req as unknown as AuthenticatedRequest, res, next)
);

// Update coupon
router.patch("/:id", (req, res, next) =>
  couponController.update(req as unknown as AuthenticatedRequest, res, next)
);

// Delete coupon
router.delete("/:id", (req, res, next) =>
  couponController.delete(req as unknown as AuthenticatedRequest, res, next)
);

// Increment usage count (called after successful purchase)
router.post("/increment-usage", (req, res, next) =>
  couponController.incrementUsage(req as unknown as AuthenticatedRequest, res, next)
);

export default router;
