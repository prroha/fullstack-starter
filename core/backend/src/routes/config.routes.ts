/**
 * Config Routes
 *
 * Exposes application configuration to the frontend.
 * In deployed mode, reads from starter-config.json to provide
 * feature flags and tier information.
 */

import { Router, Request, Response } from "express";
import { getStarterConfig } from "../middleware/preview.middleware";

const router = Router();

/**
 * GET /api/config
 *
 * Returns the application configuration including enabled features.
 * This is used by the frontend to determine which features are available.
 */
router.get("/", (_req: Request, res: Response) => {
  const starterConfig = getStarterConfig();

  if (starterConfig) {
    // Return config from starter-config.json
    res.json({
      success: true,
      data: {
        tier: starterConfig.tier,
        template: starterConfig.template,
        features: starterConfig.features,
        generatedAt: starterConfig.generatedAt,
      },
    });
  } else {
    // No starter config - development mode
    res.json({
      success: true,
      data: {
        tier: null,
        template: null,
        features: [], // Empty means all features enabled
        generatedAt: null,
      },
    });
  }
});

/**
 * GET /api/config/features
 *
 * Returns just the list of enabled features.
 */
router.get("/features", (_req: Request, res: Response) => {
  const starterConfig = getStarterConfig();

  res.json({
    success: true,
    data: starterConfig?.features || [],
  });
});

/**
 * GET /api/config/features/:slug
 *
 * Check if a specific feature is enabled.
 */
router.get("/features/:slug", (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const starterConfig = getStarterConfig();

  // If no config, all features are enabled (development mode)
  const isEnabled = starterConfig
    ? starterConfig.features.includes(slug)
    : true;

  res.json({
    success: true,
    data: {
      slug,
      enabled: isEnabled,
    },
  });
});

export default router;
