import { Router } from "express";
import { publicFeaturesRoutes } from "./features.routes.js";
import { publicTemplatesRoutes } from "./templates.routes.js";
import { publicPricingRoutes } from "./pricing.routes.js";
import { publicPreviewRoutes } from "./preview.routes.js";

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
    },
  });
});

// Mount public routes (no authentication required)
router.use("/features", publicFeaturesRoutes);
router.use("/templates", publicTemplatesRoutes);
router.use("/pricing", publicPricingRoutes);
router.use("/preview", publicPreviewRoutes);

export { router as publicRoutes };
