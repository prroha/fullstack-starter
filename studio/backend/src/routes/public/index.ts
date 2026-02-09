import { Router } from "express";
// Public routes will include: auth, features, templates, pricing, preview, checkout

const router = Router();

// Placeholder for public routes
router.get("/", (_req, res) => {
  res.json({
    name: "Starter Studio API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      features: "/api/features",
      templates: "/api/templates",
      pricing: "/api/pricing",
      preview: "/api/preview",
      checkout: "/api/checkout",
    },
  });
});

export { router as publicRoutes };
