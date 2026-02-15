"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

// ============================================================================
// Types
// ============================================================================

interface FeatureFlagContextValue {
  /** Selected tier slug */
  tier: string;
  /** All enabled features */
  features: Set<string>;
  /** Check if a feature is enabled */
  hasFeature: (featureSlug: string) => boolean;
  /** Check if tier is at least the specified tier */
  hasTier: (tierSlug: string) => boolean;
  /** Check if multiple features are all enabled */
  hasAllFeatures: (featureSlugs: string[]) => boolean;
  /** Check if any of the features are enabled */
  hasAnyFeature: (featureSlugs: string[]) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface FeatureFlagProviderProps {
  children: ReactNode;
  /** Array of enabled feature slugs */
  features: string[];
  /** Selected tier slug */
  tier: string;
}

const TIER_ORDER = ["basic", "starter", "pro", "business", "enterprise"];

export function FeatureFlagProvider({
  children,
  features,
  tier,
}: FeatureFlagProviderProps) {
  const value = useMemo((): FeatureFlagContextValue => {
    const featureSet = new Set(features);

    return {
      tier,
      features: featureSet,

      hasFeature: (featureSlug: string) => {
        return featureSet.has(featureSlug);
      },

      hasTier: (tierSlug: string) => {
        const currentIndex = TIER_ORDER.indexOf(tier);
        const requiredIndex = TIER_ORDER.indexOf(tierSlug);
        // If either tier is unknown, fall back to exact match
        if (currentIndex === -1 || requiredIndex === -1) {
          return tier === tierSlug;
        }
        return currentIndex >= requiredIndex;
      },

      hasAllFeatures: (featureSlugs: string[]) => {
        return featureSlugs.every((slug) => featureSet.has(slug));
      },

      hasAnyFeature: (featureSlugs: string[]) => {
        return featureSlugs.some((slug) => featureSet.has(slug));
      },
    };
  }, [features, tier]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within FeatureFlagProvider");
  }
  return context;
}

/**
 * Convenience hook to check a single feature
 */
export function useFeatureFlag(featureSlug: string): boolean {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(featureSlug);
}

/**
 * Convenience hook to check tier
 */
export function useTierCheck(tierSlug: string): boolean {
  const { hasTier } = useFeatureFlags();
  return hasTier(tierSlug);
}
