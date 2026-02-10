/**
 * Pricing and tier-related types for the Studio platform.
 * These types define pricing structures, bundles, and discounts.
 */

/**
 * Standard pricing tier slugs.
 */
export type PricingTierSlug =
  | "basic"
  | "starter"
  | "pro"
  | "business"
  | "enterprise";

/**
 * A pricing tier representing a product level.
 */
export interface PricingTier {
  /** Unique tier identifier (CUID) */
  id: string;
  /** URL-friendly unique identifier */
  slug: PricingTierSlug | string;
  /** Display name */
  name: string;
  /** Description of what's included */
  description: string;
  /** Price in cents */
  price: number;
  /** Compare-at price for showing savings (in cents) */
  compareAtPrice?: number;
  /** Array of feature slugs included in this tier */
  includedFeatures: string[];
  /** Whether this tier is marked as popular/recommended */
  isPopular: boolean;
  /** Order for display sorting */
  displayOrder: number;
  /** Theme color for the tier */
  color?: string;
  /** Whether tier is available for purchase */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Configuration for a pricing tier (for setup/editing).
 */
export interface TierConfig {
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  includedFeatures: string[];
  isPopular?: boolean;
  displayOrder?: number;
  color?: string;
  isActive?: boolean;
}

/**
 * Data required to create a new pricing tier.
 */
export interface CreatePricingTierData {
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  includedFeatures?: string[];
  isPopular?: boolean;
  displayOrder?: number;
  color?: string;
  isActive?: boolean;
}

/**
 * Data for updating an existing pricing tier.
 */
export interface UpdatePricingTierData extends Partial<CreatePricingTierData> {}

/**
 * Parameters for querying pricing tiers.
 */
export interface GetPricingTiersParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Bundle discount configuration.
 */
export interface BundleDiscount {
  /** Unique discount identifier */
  id: string;
  /** Name of the bundle discount */
  name: string;
  /** Description */
  description?: string;
  /** Type of discount */
  type: "percentage" | "fixed";
  /** Discount value (percentage 0-100 or fixed amount in cents) */
  value: number;
  /** Minimum number of features required */
  minFeatures?: number;
  /** Minimum purchase amount required (in cents) */
  minAmount?: number;
  /** Specific feature combinations that trigger this discount */
  requiredFeatures?: string[];
  /** Tiers this discount applies to (empty = all) */
  applicableTiers?: string[];
  /** Whether discount is active */
  isActive: boolean;
  /** Start date */
  startsAt?: string;
  /** End date */
  expiresAt?: string;
}

/**
 * Calculated pricing for a configuration.
 */
export interface PriceCalculation {
  /** Base price from tier */
  tierPrice: number;
  /** Total price of additional features */
  featuresPrice: number;
  /** Subtotal before discounts */
  subtotal: number;
  /** Bundle discounts applied */
  bundleDiscounts: AppliedDiscount[];
  /** Coupon discount if applied */
  couponDiscount?: AppliedDiscount;
  /** Total discount amount */
  totalDiscount: number;
  /** Tax amount */
  tax: number;
  /** Final total */
  total: number;
  /** Currency code */
  currency: string;
}

/**
 * A discount that has been applied to the order.
 */
export interface AppliedDiscount {
  /** Discount identifier */
  id: string;
  /** Name of the discount */
  name: string;
  /** Type of discount */
  type: "percentage" | "fixed" | "bundle" | "coupon";
  /** Original discount value */
  value: number;
  /** Calculated discount amount in cents */
  amount: number;
}

/**
 * Input for calculating price.
 */
export interface PriceCalculationInput {
  /** Selected tier slug */
  tier: string;
  /** Selected template ID (optional) */
  templateId?: string;
  /** Array of selected feature slugs */
  selectedFeatures: string[];
  /** Coupon code (optional) */
  couponCode?: string;
}

/**
 * Tier comparison data for pricing page.
 */
export interface TierComparison {
  /** Tier information */
  tier: PricingTier;
  /** Features included with status */
  features: TierFeatureStatus[];
  /** Monthly equivalent price (for annual billing) */
  monthlyEquivalent?: number;
  /** Savings compared to buying features individually */
  savings?: number;
}

/**
 * Feature status within a tier.
 */
export interface TierFeatureStatus {
  /** Feature slug */
  slug: string;
  /** Feature name */
  name: string;
  /** Whether feature is included in the tier */
  included: boolean;
  /** Whether feature is available as add-on */
  availableAsAddon: boolean;
  /** Add-on price if available (in cents) */
  addonPrice?: number;
}

/**
 * Volume discount configuration.
 */
export interface VolumeDiscount {
  /** Minimum quantity threshold */
  minQuantity: number;
  /** Discount percentage */
  discountPercent: number;
}

/**
 * Pricing summary for display.
 */
export interface PricingSummary {
  /** Selected tier */
  tierName: string;
  /** Tier price */
  tierPrice: number;
  /** Number of add-on features */
  addonCount: number;
  /** Add-on features total */
  addonTotal: number;
  /** Discount applied */
  discount: number;
  /** Discount description */
  discountDescription?: string;
  /** Final total */
  total: number;
  /** Formatted total string */
  formattedTotal: string;
}
