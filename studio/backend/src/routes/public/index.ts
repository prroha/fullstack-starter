import { Router } from "express";
import { publicFeaturesRoutes } from "./features.routes.js";
import { publicTemplatesRoutes } from "./templates.routes.js";
import { publicPricingRoutes } from "./pricing.routes.js";
import { publicPreviewRoutes } from "./preview.routes.js";
import { checkoutRoutes } from "./checkout.routes.js";
import { publicOrdersRoutes } from "./orders.routes.js";
import { authRoutes } from "./auth.routes.js";

const router = Router();

// API info endpoint
router.get("/", (_req, res) => {
  res.json({
    name: "Starter Studio API",
    version: "1.0.0",
    endpoints: {
      features: "/api/features",
      templates: "/api/templates",
      pricing: "/api/pricing",
      preview: "/api/preview",
      checkout: "/api/checkout",
      orders: "/api/orders",
      auth: "/api/auth",
    },
  });
});

// Mount public routes (no authentication required)
router.use("/features", publicFeaturesRoutes);
router.use("/templates", publicTemplatesRoutes);
router.use("/pricing", publicPricingRoutes);
router.use("/preview", publicPreviewRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", publicOrdersRoutes);
router.use("/auth", authRoutes);

export { router as publicRoutes };
