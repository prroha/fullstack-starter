/**
 * Tier Utilities - Helper functions for working with pricing tiers.
 */

import type { PricingTier, PricingTierSlug } from "@studio/shared";

/**
 * Tier order for comparison
 */
export const TIER_ORDER: PricingTierSlug[] = [
  "basic",
  "starter",
  "pro",
  "business",
  "enterprise",
];

/**
 * Default tier colors
 */
export const TIER_COLORS: Record<PricingTierSlug, string> = {
  basic: "gray",
  starter: "blue",
  pro: "purple",
  business: "orange",
  enterprise: "red",
};

/**
 * Tier display info
 */
export const TIER_INFO: Record<
  PricingTierSlug,
  { name: string; description: string; icon: string }
> = {
  basic: {
    name: "Basic",
    description: "For developers starting simple projects",
    icon: "Package",
  },
  starter: {
    name: "Starter",
    description: "For apps that need user accounts",
    icon: "Rocket",
  },
  pro: {
    name: "Pro",
    description: "For business applications",
    icon: "Zap",
  },
  business: {
    name: "Business",
    description: "For SaaS and commercial products",
    icon: "Building",
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale applications",
    icon: "Shield",
  },
};

/**
 * Get tier index for comparison
 */
export function getTierIndex(tierSlug: string): number {
  const index = TIER_ORDER.indexOf(tierSlug as PricingTierSlug);
  return index === -1 ? 0 : index;
}

/**
 * Compare two tiers
 * Returns:
 *  - negative if tier1 < tier2
 *  - 0 if tier1 === tier2
 *  - positive if tier1 > tier2
 */
export function compareTiers(tier1: string, tier2: string): number {
  return getTierIndex(tier1) - getTierIndex(tier2);
}

/**
 * Check if tier1 is at least tier2
 */
export function isTierAtLeast(tier1: string, tier2: string): boolean {
  return getTierIndex(tier1) >= getTierIndex(tier2);
}

/**
 * Check if tier1 is higher than tier2
 */
export function isTierHigher(tier1: string, tier2: string): boolean {
  return getTierIndex(tier1) > getTierIndex(tier2);
}

/**
 * Get tier display name
 */
export function getTierName(tierSlug: string): string {
  return TIER_INFO[tierSlug as PricingTierSlug]?.name || tierSlug;
}

/**
 * Get tier description
 */
export function getTierDescription(tierSlug: string): string {
  return TIER_INFO[tierSlug as PricingTierSlug]?.description || "";
}

/**
 * Get tier icon
 */
export function getTierIcon(tierSlug: string): string {
  return TIER_INFO[tierSlug as PricingTierSlug]?.icon || "Package";
}

/**
 * Get tier color
 */
export function getTierColor(tierSlug: string): string {
  return TIER_COLORS[tierSlug as PricingTierSlug] || "gray";
}

/**
 * Get the next tier up
 */
export function getNextTier(currentTier: string): PricingTierSlug | null {
  const index = getTierIndex(currentTier);
  if (index < TIER_ORDER.length - 1) {
    return TIER_ORDER[index + 1];
  }
  return null;
}

/**
 * Get the previous tier
 */
export function getPreviousTier(currentTier: string): PricingTierSlug | null {
  const index = getTierIndex(currentTier);
  if (index > 0) {
    return TIER_ORDER[index - 1];
  }
  return null;
}

/**
 * Get features gained by upgrading from one tier to another
 */
export function getUpgradeFeatures(
  fromTier: PricingTier,
  toTier: PricingTier
): string[] {
  const fromSet = new Set(fromTier.includedFeatures);
  return toTier.includedFeatures.filter((f) => !fromSet.has(f));
}

/**
 * Calculate upgrade price
 */
export function calculateUpgradePrice(
  fromTier: PricingTier,
  toTier: PricingTier
): number {
  return toTier.price - fromTier.price;
}

/**
 * Get recommended tier based on selected features
 */
export function getRecommendedTier(
  selectedFeatures: string[],
  tiers: PricingTier[]
): PricingTier | null {
  const selectedSet = new Set(selectedFeatures);

  // Sort tiers by display order
  const sortedTiers = [...tiers].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  // Find the cheapest tier that includes all selected features
  for (const tier of sortedTiers) {
    const tierFeatures = new Set(tier.includedFeatures);
    const allIncluded = selectedFeatures.every((f) => tierFeatures.has(f));
    if (allIncluded) {
      return tier;
    }
  }

  // If no tier includes all features, return the highest tier
  return sortedTiers[sortedTiers.length - 1] || null;
}

/**
 * Get tier comparison data
 */
export function getTierComparison(tiers: PricingTier[]): {
  tier: PricingTier;
  savings: number;
  monthlyEquivalent: number;
}[] {
  return tiers.map((tier) => ({
    tier,
    savings: tier.compareAtPrice ? tier.compareAtPrice - tier.price : 0,
    monthlyEquivalent: Math.round(tier.price / 12),
  }));
}
