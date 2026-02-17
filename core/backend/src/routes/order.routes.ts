import { FastifyPluginAsync } from "fastify";
import { orderController } from "../controllers/order.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/preview.middleware.js";

// ============================================================================
// USER ROUTES (authenticated users can view their own orders)
// ============================================================================

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature Gate: Orders require payments.stripe feature
  fastify.addHook("preHandler", requireFeature("payments.stripe"));

  // Get user's own orders
  fastify.get("/", { preHandler: [authMiddleware] }, (req, reply) =>
    orderController.getUserOrders(req, reply)
  );

  // Get a specific order (user's own)
  fastify.get("/:id", { preHandler: [authMiddleware] }, (req, reply) =>
    orderController.getUserOrderById(req, reply)
  );
};

// ============================================================================
// ADMIN ROUTES (require admin role)
// ============================================================================

const adminOrderRoutes: FastifyPluginAsync = async (fastify) => {
  // Feature Gate: Admin orders require payments.stripe feature
  fastify.addHook("preHandler", requireFeature("payments.stripe"));

  // All admin routes require authentication and admin role
  fastify.addHook("preHandler", authMiddleware);
  fastify.addHook("preHandler", adminMiddleware);

  // Get order statistics (must be before /:id to avoid matching "stats" as id)
  fastify.get("/stats", (req, reply) =>
    orderController.getStats(req, reply)
  );

  // Export orders (must be before /:id to avoid matching "export" as id)
  fastify.get("/export", (req, reply) =>
    orderController.exportOrders(req, reply)
  );

  // Get all orders
  fastify.get("/", (req, reply) =>
    orderController.getAll(req, reply)
  );

  // Get order by ID
  fastify.get("/:id", (req, reply) =>
    orderController.getById(req, reply)
  );

  // Update order status
  fastify.patch("/:id/status", (req, reply) =>
    orderController.updateStatus(req, reply)
  );
};

export { orderRoutes, adminOrderRoutes };
