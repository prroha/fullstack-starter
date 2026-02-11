"use client";

/**
 * Feature Flags
 *
 * Provides feature flag functionality for the application.
 * In preview mode (NEXT_PUBLIC_PREVIEW_MODE=true), loads from _preview/preview-context.
 * In production/downloaded apps, provides stub functions that enable all features.
 *
 * This allows the same code to work in both environments without modification.
 */

import { createContext, useContext, ReactNode } from "react";

// Check if preview mode is enabled
const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

export interface FeatureFlagsContextValue {
  isPreview: boolean;
  isLoading: boolean;
  isFeatureEnabled: (featureSlug: string) => boolean;
  hasAnyFeature: (featureSlugs: string[]) => boolean;
  hasAllFeatures: (featureSlugs: string[]) => boolean;
}

/**
 * Default context value for production/downloaded apps
 * All features are enabled by default
 */
const defaultContextValue: FeatureFlagsContextValue = {
  isPreview: false,
  isLoading: false,
  isFeatureEnabled: () => true,
  hasAnyFeature: () => true,
  hasAllFeatures: () => true,
};

export const FeatureFlagsContext = createContext<FeatureFlagsContextValue>(defaultContextValue);

// Load preview provider at module level if in preview mode
// This avoids conditional requires at runtime
let PreviewProviderComponent: React.ComponentType<{ children: ReactNode }> | null = null;

if (PREVIEW_MODE) {
  try {
    // Dynamic import at module initialization
    const previewModule = require("@/lib/_preview/preview-context");
    PreviewProviderComponent = previewModule.PreviewProvider;
  } catch {
    // Preview module not available
  }
}

/**
 * Feature Flags Provider
 *
 * In preview mode: Loads full preview context from _preview/
 * In production: Uses default context (all features enabled)
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // Use preview provider if available and in preview mode
  if (PreviewProviderComponent) {
    return <PreviewProviderComponent>{children}</PreviewProviderComponent>;
  }

  // In production or if preview module is not available
  return (
    <FeatureFlagsContext.Provider value={defaultContextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags
 * Works in both preview and production modes
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  // Always call useContext unconditionally
  return useContext(FeatureFlagsContext);
}

/**
 * Backwards-compatible alias for usePreview
 * This allows existing code to continue working
 */
export const usePreview = useFeatureFlags;

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(featureSlug: string): boolean {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  // Return true while loading to avoid flash
  if (isLoading) return true;
  return isFeatureEnabled(featureSlug);
}
