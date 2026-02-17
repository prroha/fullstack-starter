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
 */

import { FastifyRequest, FastifyReply } from "fastify";
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
 */
async function noopMiddleware(req: FastifyRequest): Promise<void> {
  req.previewConfig = defaultConfig;
}

// Initialize with no-op middleware
let _previewMiddleware: (
  req: FastifyRequest,
  reply: FastifyReply
) => void | Promise<void> = noopMiddleware;

let _requireFeature = (_featureSlug: string) => {
  return async (_req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // In non-preview mode, all features are enabled
  };
};

let _isFeatureEnabled = (_req: FastifyRequest, _featureSlug: string): boolean => {
  // In non-preview mode, all features are enabled
  return true;
};

// Load full preview middleware if in preview mode
if (PREVIEW_MODE) {
  try {
    // Dynamic import to avoid bundling preview code in production
    const previewModule = await import("./_preview/preview.middleware.js");
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
 */
export function getStarterConfig(): StarterConfig | null {
  if (_starterConfig !== undefined) {
    return _starterConfig;
  }

  try {
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

  _starterConfig = null;
  return null;
}
