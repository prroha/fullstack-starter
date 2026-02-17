import { FastifyPluginAsync } from "fastify";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { ordersRoutes } from "./orders.routes.js";
import { templatesRoutes } from "./templates.routes.js";
import { modulesRoutes } from "./modules.routes.js";
import { featuresRoutes } from "./features.routes.js";
import { customersRoutes } from "./customers.routes.js";
import { licensesRoutes } from "./licenses.routes.js";
import { couponsRoutes } from "./coupons.routes.js";
import { pricingRoutes } from "./pricing.routes.js";
import { analyticsRoutes } from "./analytics.routes.js";
import { settingsRoutes } from "./settings.routes.js";
import { uploadsRoutes } from "./uploads.routes.js";
import { generationRoutes } from "./generation.routes.js";

const adminRoutesPlugin: FastifyPluginAsync = async (fastify) => {
  // All admin routes require authentication and admin role
  fastify.addHook("preHandler", authenticate);
  fastify.addHook("preHandler", requireAdmin);

  // Admin routes
  await fastify.register(dashboardRoutes, { prefix: "/dashboard" });
  await fastify.register(ordersRoutes, { prefix: "/orders" });
  await fastify.register(templatesRoutes, { prefix: "/templates" });
  await fastify.register(modulesRoutes, { prefix: "/modules" });
  await fastify.register(featuresRoutes, { prefix: "/features" });
  await fastify.register(customersRoutes, { prefix: "/customers" });
  await fastify.register(licensesRoutes, { prefix: "/licenses" });
  await fastify.register(couponsRoutes, { prefix: "/coupons" });
  await fastify.register(pricingRoutes, { prefix: "/pricing" });
  await fastify.register(analyticsRoutes, { prefix: "/analytics" });
  await fastify.register(settingsRoutes, { prefix: "/settings" });
  await fastify.register(uploadsRoutes, { prefix: "/uploads" });
  await fastify.register(generationRoutes, { prefix: "/generate" });
};

export { adminRoutesPlugin as adminRoutes };
