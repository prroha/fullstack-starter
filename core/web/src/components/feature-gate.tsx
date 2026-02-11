"use client";

/**
 * Feature Gate Component
 *
 * Conditionally renders children based on feature flags.
 * Works in both preview mode (checks against enabled features) and
 * production mode (all features enabled by default).
 *
 * This component is included in downloaded apps and can be used by developers
 * to conditionally enable/disable features in their own applications.
 */

import { ReactNode } from "react";
import { useFeatureFlags } from "@/lib/feature-flags";

interface FeatureGateProps {
  /** Feature slug(s) required to show children */
  feature: string | string[];
  /** Require all features (AND) or any feature (OR). Default: "any" */
  mode?: "all" | "any";
  /** Content to show when feature is disabled */
  fallback?: ReactNode;
  /** Content to show while loading (defaults to null to prevent content flash) */
  loadingFallback?: ReactNode;
  /** Children to show when feature is enabled */
  children: ReactNode;
}

export function FeatureGate({
  feature,
  mode = "any",
  fallback = null,
  loadingFallback = null,
  children
}: FeatureGateProps) {
  const { hasAnyFeature, hasAllFeatures, isLoading } = useFeatureFlags();

  // Show loading fallback while loading to prevent content flash
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  const features = Array.isArray(feature) ? feature : [feature];

  const isEnabled = mode === "all"
    ? hasAllFeatures(features)
    : hasAnyFeature(features);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that shows content only when NOT in preview mode
 * Useful for hiding "Buy Now" buttons in preview
 */
export function NonPreviewOnly({ children }: { children: ReactNode }) {
  const { isPreview, isLoading } = useFeatureFlags();

  if (isLoading || isPreview) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Component that shows content only in preview mode
 * Useful for showing preview banners
 */
export function PreviewOnly({ children }: { children: ReactNode }) {
  const { isPreview, isLoading } = useFeatureFlags();

  if (isLoading || !isPreview) {
    return null;
  }

  return <>{children}</>;
}
