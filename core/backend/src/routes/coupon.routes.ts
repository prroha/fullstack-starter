import { FastifyPluginAsync } from "fastify";
import { couponController } from "../controllers/coupon.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/preview.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // Feature Gate: Coupons require payments.stripe feature
  // ============================================================================
  fastify.addHook("preHandler", requireFeature("payments.stripe"));

  // ============================================================================
  // Public routes
  // ============================================================================

  fastify.post("/validate", (req, reply) =>
    couponController.validateCoupon(req, reply)
  );

  // ============================================================================
  // Admin routes (nested plugin for scoped middleware)
  // ============================================================================

  await fastify.register(async (admin) => {
    admin.addHook("preHandler", authMiddleware);
    admin.addHook("preHandler", adminMiddleware);

    // Get all coupons with pagination and filters
    admin.get("/", (req, reply) =>
      couponController.getAll(req, reply)
    );

    // Export coupons (must be before /:id to avoid matching "export" as id)
    admin.get("/export", (req, reply) =>
      couponController.exportCoupons(req, reply)
    );

    // Get single coupon by ID
    admin.get("/:id", (req, reply) =>
      couponController.getById(req, reply)
    );

    // Create new coupon
    admin.post("/", (req, reply) =>
      couponController.create(req, reply)
    );

    // Update coupon
    admin.patch("/:id", (req, reply) =>
      couponController.update(req, reply)
    );

    // Delete coupon
    admin.delete("/:id", (req, reply) =>
      couponController.delete(req, reply)
    );

    // Increment usage count (called after successful purchase)
    admin.post("/increment-usage", (req, reply) =>
      couponController.incrementUsage(req, reply)
    );
  });
};

export default routePlugin;
