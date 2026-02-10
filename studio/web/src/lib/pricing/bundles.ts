/**
 * Bundle Utilities - Handles bundle discount logic.
 */

import type { BundleDiscount, Feature } from "@studio/shared";

/**
 * Default bundle definitions based on FEATURE_REGISTRY.md
 */
export const DEFAULT_BUNDLES: Omit<BundleDiscount, "id">[] = [
  {
    name: "Auth Bundle",
    description: "Social Login + MFA + Magic Link",
    type: "fixed",
    value: 18_00, // $18 savings in cents
    requiredFeatures: ["auth.social", "auth.mfa", "auth.magicLink"],
    isActive: true,
  },
  {
    name: "Communication Bundle",
    description: "Email + Push + Real-time",
    type: "fixed",
    value: 18_00, // $18 savings
    requiredFeatures: ["comms.email", "comms.push", "comms.realtime"],
    isActive: true,
  },
  {
    name: "Security Bundle",
    description: "Advanced Rate Limit + Audit + RBAC",
    type: "fixed",
    value: 18_00, // $18 savings
    requiredFeatures: ["security.rateLimitAdv", "security.audit", "security.rbac"],
    isActive: true,
  },
  {
    name: "5+ Features",
    description: "Discount when selecting 5+ add-on features",
    type: "percentage",
    value: 10, // 10% off
    minFeatures: 5,
    isActive: true,
  },
  {
    name: "10+ Features",
    description: "Discount when selecting 10+ add-on features",
    type: "percentage",
    value: 15, // 15% off
    minFeatures: 10,
    isActive: true,
  },
];

/**
 * Check if a bundle is applicable to current selection
 */
export function isBundleApplicable(
  bundle: BundleDiscount,
  selectedFeatures: string[],
  tierSlug: string,
  subtotal: number
): boolean {
  const selectedSet = new Set(selectedFeatures);

  // Check tier applicability
  if (
    bundle.applicableTiers &&
    bundle.applicableTiers.length > 0 &&
    !bundle.applicableTiers.includes(tierSlug)
  ) {
    return false;
  }

  // Check minimum features
  if (bundle.minFeatures && selectedFeatures.length < bundle.minFeatures) {
    return false;
  }

  // Check minimum amount
  if (bundle.minAmount && subtotal < bundle.minAmount) {
    return false;
  }

  // Check required features
  if (bundle.requiredFeatures && bundle.requiredFeatures.length > 0) {
    const hasAll = bundle.requiredFeatures.every((f) => selectedSet.has(f));
    if (!hasAll) {
      return false;
    }
  }

  // Check dates
  const now = new Date();
  if (bundle.startsAt && new Date(bundle.startsAt) > now) {
    return false;
  }
  if (bundle.expiresAt && new Date(bundle.expiresAt) < now) {
    return false;
  }

  return true;
}

/**
 * Calculate discount amount for a bundle
 */
export function calculateBundleDiscount(
  bundle: BundleDiscount,
  subtotal: number
): number {
  if (bundle.type === "percentage") {
    return Math.round(subtotal * (bundle.value / 100));
  }
  return bundle.value;
}

/**
 * Get suggested bundles based on current selection
 */
export function getSuggestedBundles(
  selectedFeatures: string[],
  availableFeatures: Feature[],
  bundles: BundleDiscount[]
): {
  bundle: BundleDiscount;
  missingFeatures: string[];
  potentialSavings: number;
}[] {
  const selectedSet = new Set(selectedFeatures);
  const suggestions: {
    bundle: BundleDiscount;
    missingFeatures: string[];
    potentialSavings: number;
  }[] = [];

  for (const bundle of bundles) {
    if (!bundle.requiredFeatures || bundle.requiredFeatures.length === 0) {
      continue;
    }

    const missing = bundle.requiredFeatures.filter((f) => !selectedSet.has(f));

    // If missing only 1-2 features, suggest the bundle
    if (missing.length > 0 && missing.length <= 2) {
      // Verify missing features exist
      const missingExist = missing.every((f) =>
        availableFeatures.some((af) => af.slug === f)
      );

      if (missingExist) {
        suggestions.push({
          bundle,
          missingFeatures: missing,
          potentialSavings: bundle.value,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Get progress towards a bundle
 */
export function getBundleProgress(
  bundle: BundleDiscount,
  selectedFeatures: string[]
): {
  matched: number;
  total: number;
  percentage: number;
  remaining: string[];
} {
  if (!bundle.requiredFeatures || bundle.requiredFeatures.length === 0) {
    // For min-features bundles
    if (bundle.minFeatures) {
      const matched = Math.min(selectedFeatures.length, bundle.minFeatures);
      return {
        matched,
        total: bundle.minFeatures,
        percentage: Math.round((matched / bundle.minFeatures) * 100),
        remaining: [],
      };
    }
    return { matched: 0, total: 0, percentage: 100, remaining: [] };
  }

  const selectedSet = new Set(selectedFeatures);
  const matched = bundle.requiredFeatures.filter((f) => selectedSet.has(f));
  const remaining = bundle.requiredFeatures.filter((f) => !selectedSet.has(f));

  return {
    matched: matched.length,
    total: bundle.requiredFeatures.length,
    percentage: Math.round(
      (matched.length / bundle.requiredFeatures.length) * 100
    ),
    remaining,
  };
}

/**
 * Sort bundles by potential value
 */
export function sortBundlesByValue(
  bundles: BundleDiscount[],
  subtotal: number
): BundleDiscount[] {
  return [...bundles].sort((a, b) => {
    const valueA = calculateBundleDiscount(a, subtotal);
    const valueB = calculateBundleDiscount(b, subtotal);
    return valueB - valueA;
  });
}
