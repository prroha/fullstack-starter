/**
 * Client-side pricing types.
 * Extends shared types with client-specific properties.
 */

import type {
  PricingTier,
  PriceCalculation,
  AppliedDiscount,
  BundleDiscount,
  PricingTierSlug,
} from "@studio/shared";

export type { PricingTier, PriceCalculation, AppliedDiscount, BundleDiscount, PricingTierSlug };

/**
 * Client-side tier with selection state
 */
export interface ClientPricingTier extends PricingTier {
  /** Whether tier is currently selected */
  isSelected: boolean;
  /** Monthly equivalent for comparison */
  monthlyEquivalent?: number;
  /** Savings compared to buying features individually */
  savings?: number;
  /** Features count */
  featureCount: number;
}

/**
 * Cart item
 */
export interface CartItem {
  type: "tier" | "feature" | "template";
  slug: string;
  name: string;
  price: number;
  isIncluded?: boolean;
  quantity?: number;
}

/**
 * Cart state
 */
export interface CartState {
  tier: PricingTier | null;
  templateId: string | null;
  features: string[];
  couponCode: string | null;
  items: CartItem[];
  pricing: PriceCalculation | null;
}

/**
 * Price display format
 */
export interface PriceDisplay {
  amount: number;
  formatted: string;
  currency: string;
  originalAmount?: number;
  discountPercent?: number;
}

/**
 * Bundle match result
 */
export interface BundleMatch {
  bundle: BundleDiscount;
  matchedFeatures: string[];
  discount: number;
}
