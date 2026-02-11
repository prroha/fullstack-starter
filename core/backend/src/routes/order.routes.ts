import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { requireFeature } from "../middleware/preview.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// ============================================================================
// Feature Gate: Orders require payments.stripe feature
// ============================================================================
router.use(requireFeature("payments.stripe"));

// ============================================================================
// USER ROUTES (authenticated users can view their own orders)
// ============================================================================

// Get user's own orders
router.get("/", authMiddleware, (req, res, next) =>
  orderController.getUserOrders(req as unknown as AuthenticatedRequest, res, next)
);

// Get a specific order (user's own)
router.get("/:id", authMiddleware, (req, res, next) =>
  orderController.getUserOrderById(req as unknown as AuthenticatedRequest, res, next)
);

// ============================================================================
// ADMIN ROUTES (require admin role)
// ============================================================================

const adminRouter = Router();

// Feature Gate: Admin orders require payments.stripe feature
adminRouter.use(requireFeature("payments.stripe"));

// All admin routes require authentication and admin role
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Get order statistics (must be before /:id to avoid matching "stats" as id)
adminRouter.get("/stats", (req, res, next) =>
  orderController.getStats(req as unknown as AuthenticatedRequest, res, next)
);

// Export orders (must be before /:id to avoid matching "export" as id)
adminRouter.get("/export", (req, res, next) =>
  orderController.exportOrders(req as unknown as AuthenticatedRequest, res, next)
);

// Get all orders
adminRouter.get("/", (req, res, next) =>
  orderController.getAll(req as unknown as AuthenticatedRequest, res, next)
);

// Get order by ID
adminRouter.get("/:id", (req, res, next) =>
  orderController.getById(req as unknown as AuthenticatedRequest, res, next)
);

// Update order status
adminRouter.patch("/:id/status", (req, res, next) =>
  orderController.updateStatus(req as unknown as AuthenticatedRequest, res, next)
);

export { router as orderRoutes, adminRouter as adminOrderRoutes };
