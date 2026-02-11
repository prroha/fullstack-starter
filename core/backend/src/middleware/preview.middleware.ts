/**
 * Feature Configuration Middleware
 *
 * Provides feature configuration for the application.
 *
 * In preview mode (PREVIEW_MODE=true):
 * - Loads full preview middleware from _preview/ directory
 * - Fetches feature config from Studio API based on preview session
 *
 * In production/downloaded apps:
 * - Uses no-op middleware (all features enabled)
 * - The _preview/ directory is excluded from downloads
 *
 * Note: The starter-config.json reading is handled at the route level,
 * not in middleware, for downloaded apps.
 */

import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger.js";

// Types for the feature configuration system
export interface PreviewConfig {
  isPreview: boolean;
  sessionToken: string | null;
  enabledFeatures: string[];
  tier: string | null;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      previewConfig: PreviewConfig;
    }
  }
}

// Check if preview mode is enabled
const PREVIEW_MODE = process.env.PREVIEW_MODE === "true";

/**
 * Default config for non-preview mode
 * All features are enabled when not in preview
 */
const defaultConfig: PreviewConfig = {
  isPreview: false,
  sessionToken: null,
  enabledFeatures: [],
  tier: null,
};

/**
 * No-op middleware for production/downloaded apps
 * Simply sets default config (all features enabled) and continues
 */
function noopMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.previewConfig = defaultConfig;
  next();
}

// Initialize with no-op middleware
let _previewMiddleware: (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void> = noopMiddleware;

let _requireFeature = (_featureSlug: string) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // In non-preview mode, all features are enabled
    return next();
  };
};

let _isFeatureEnabled = (_req: Request, _featureSlug: string): boolean => {
  // In non-preview mode, all features are enabled
  return true;
};

// Load full preview middleware if in preview mode
if (PREVIEW_MODE) {
  try {
    // Dynamic require to avoid bundling preview code in production
    const previewModule = require("./_preview/preview.middleware");
    _previewMiddleware = previewModule.previewMiddleware;
    _requireFeature = previewModule.requireFeature;
    _isFeatureEnabled = previewModule.isFeatureEnabled;
    logger.info("Preview mode enabled - feature flags active");
  } catch {
    logger.warn("Preview middleware not available - running in production mode");
  }
}

// Export the middleware and helpers
export const previewMiddleware = _previewMiddleware;
export const requireFeature = _requireFeature;
export const isFeatureEnabled = _isFeatureEnabled;

/**
 * Starter Configuration Interface
 * Represents the configuration generated when downloading a starter
 */
export interface StarterConfig {
  tier: string;
  template: string | null;
  features: string[];
  generatedAt: string;
}

// Cached starter config
let _starterConfig: StarterConfig | null | undefined = undefined;

/**
 * Gets the starter configuration from starter-config.json
 * This file is generated when a user downloads a starter from the Studio
 * Returns null if the file doesn't exist (development mode)
 */
export function getStarterConfig(): StarterConfig | null {
  // Return cached value if already loaded
  if (_starterConfig !== undefined) {
    return _starterConfig;
  }

  try {
    // Look for starter-config.json in the project root
    const configPath = path.join(process.cwd(), "starter-config.json");

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf-8");
      _starterConfig = JSON.parse(configContent) as StarterConfig;
      logger.info(`Loaded starter config: ${_starterConfig.tier} tier with ${_starterConfig.features.length} features`);
      return _starterConfig;
    }
  } catch (error) {
    logger.warn("Failed to load starter-config.json", { error: String(error) });
  }

  // No config file - development mode
  _starterConfig = null;
  return null;
}
