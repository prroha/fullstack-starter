import { FastifyPluginAsync } from "fastify";
import { publicFeaturesRoutes } from "./features.routes.js";
import { publicTemplatesRoutes } from "./templates.routes.js";
import { publicPricingRoutes } from "./pricing.routes.js";
import previewRoutes from "./preview.routes.js";
import { checkoutRoutes } from "./checkout.routes.js";
import { publicOrdersRoutes } from "./orders.routes.js";
import { authRoutes } from "./auth.routes.js";

const publicRoutesPlugin: FastifyPluginAsync = async (fastify) => {
  // API info endpoint
  fastify.get("/", async (_req, reply) => {
    const info: Record<string, unknown> = {
      name: "Xitolaunch API",
      version: "1.0.0",
    };
    if (process.env.NODE_ENV !== "production") {
      info.endpoints = {
        features: "/api/features",
        templates: "/api/templates",
        pricing: "/api/pricing",
        preview: "/api/preview",
        checkout: "/api/checkout",
        orders: "/api/orders",
        auth: "/api/auth",
      };
    }
    return reply.send(info);
  });

  // Mount public routes (no authentication required)
  await fastify.register(publicFeaturesRoutes, { prefix: "/features" });
  await fastify.register(publicTemplatesRoutes, { prefix: "/templates" });
  await fastify.register(publicPricingRoutes, { prefix: "/pricing" });
  await fastify.register(previewRoutes, { prefix: "/preview" });
  await fastify.register(checkoutRoutes, { prefix: "/checkout" });
  await fastify.register(publicOrdersRoutes, { prefix: "/orders" });
  await fastify.register(authRoutes, { prefix: "/auth" });
};

export { publicRoutesPlugin as publicRoutes };
