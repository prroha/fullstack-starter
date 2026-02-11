/**
 * Pricing Calculator - Calculates prices based on configuration.
 * Handles tier pricing, add-on features, discounts, and bundles.
 */

import type {
  Feature,
  PricingTier,
  PriceCalculation,
  PriceCalculationInput,
  AppliedDiscount,
  BundleDiscount,
} from "@studio/shared";
import type { BundleMatch } from "./types";
import { formatPrice, formatDetailedPrice } from "./utils";

/**
 * Pricing Calculator class
 */
export class PricingCalculator {
  private features: Map<string, Feature> = new Map();
  private tiers: Map<string, PricingTier> = new Map();
  private bundles: BundleDiscount[] = [];
  private taxRate: number = 0;

  constructor(
    features: Feature[] = [],
    tiers: PricingTier[] = [],
    bundles: BundleDiscount[] = [],
    taxRate: number = 0
  ) {
    this.setData(features, tiers, bundles, taxRate);
  }

  /**
   * Set calculator data
   */
  setData(
    features: Feature[],
    tiers: PricingTier[],
    bundles: BundleDiscount[],
    taxRate: number = 0
  ): void {
    this.features.clear();
    this.tiers.clear();

    for (const feature of features) {
      this.features.set(feature.slug, feature);
    }

    for (const tier of tiers) {
      this.tiers.set(tier.slug, tier);
    }

    this.bundles = bundles.filter((b) => b.isActive);
    this.taxRate = taxRate;
  }

  /**
   * Calculate price for a configuration
   */
  calculate(input: PriceCalculationInput): PriceCalculation {
    const tier = this.tiers.get(input.tier);
    if (!tier) {
      throw new Error(`Tier "${input.tier}" not found`);
    }

    // Calculate tier price
    const tierPrice = tier.price;

    // Calculate features price (only for features not included in tier)
    const tierIncludedSet = new Set(tier.includedFeatures);
    let featuresPrice = 0;

    for (const slug of input.selectedFeatures) {
      if (!tierIncludedSet.has(slug)) {
        const feature = this.features.get(slug);
        if (feature) {
          featuresPrice += feature.price;
        }
      }
    }

    // Calculate subtotal
    const subtotal = tierPrice + featuresPrice;

    // Calculate bundle discounts
    const bundleDiscounts = this.calculateBundleDiscounts(
      input.selectedFeatures,
      subtotal,
      tier.slug
    );

    // Calculate total discount from bundles
    const bundleDiscountTotal = bundleDiscounts.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // Apply coupon (placeholder - would need coupon validation)
    let couponDiscount: AppliedDiscount | undefined;
    if (input.couponCode) {
      // Coupon validation would happen here
      // For now, we'll skip coupon logic
    }

    // Calculate total discount
    const totalDiscount =
      bundleDiscountTotal + (couponDiscount?.amount || 0);

    // Calculate tax on discounted amount
    const taxableAmount = subtotal - totalDiscount;
    const tax = Math.round(taxableAmount * this.taxRate);

    // Calculate final total
    const total = taxableAmount + tax;

    return {
      tierPrice,
      featuresPrice,
      subtotal,
      bundleDiscounts,
      couponDiscount,
      totalDiscount,
      tax,
      total,
      currency: "USD",
    };
  }

  /**
   * Calculate applicable bundle discounts
   */
  private calculateBundleDiscounts(
    selectedFeatures: string[],
    subtotal: number,
    tierSlug: string
  ): AppliedDiscount[] {
    const discounts: AppliedDiscount[] = [];
    const selectedSet = new Set(selectedFeatures);

    for (const bundle of this.bundles) {
      // Check if bundle applies to this tier
      if (
        bundle.applicableTiers &&
        bundle.applicableTiers.length > 0 &&
        !bundle.applicableTiers.includes(tierSlug)
      ) {
        continue;
      }

      // Check if meets minimum features requirement
      if (bundle.minFeatures && selectedFeatures.length < bundle.minFeatures) {
        continue;
      }

      // Check if meets minimum amount requirement
      if (bundle.minAmount && subtotal < bundle.minAmount) {
        continue;
      }

      // Check if has required features
      if (bundle.requiredFeatures && bundle.requiredFeatures.length > 0) {
        const hasAll = bundle.requiredFeatures.every((f) => selectedSet.has(f));
        if (!hasAll) {
          continue;
        }
      }

      // Check date validity
      const now = new Date();
      if (bundle.startsAt && new Date(bundle.startsAt) > now) {
        continue;
      }
      if (bundle.expiresAt && new Date(bundle.expiresAt) < now) {
        continue;
      }

      // Calculate discount amount
      let amount = 0;
      if (bundle.type === "percentage") {
        amount = Math.round(subtotal * (bundle.value / 100));
      } else {
        amount = bundle.value;
      }

      discounts.push({
        id: bundle.id,
        name: bundle.name,
        type: "bundle",
        value: bundle.value,
        amount,
      });
    }

    return discounts;
  }

  /**
   * Find applicable bundles for current selection
   */
  findApplicableBundles(
    selectedFeatures: string[],
    tierSlug: string
  ): BundleMatch[] {
    const matches: BundleMatch[] = [];
    const selectedSet = new Set(selectedFeatures);

    for (const bundle of this.bundles) {
      // Check tier applicability
      if (
        bundle.applicableTiers &&
        bundle.applicableTiers.length > 0 &&
        !bundle.applicableTiers.includes(tierSlug)
      ) {
        continue;
      }

      // Check required features
      if (bundle.requiredFeatures && bundle.requiredFeatures.length > 0) {
        const matched = bundle.requiredFeatures.filter((f) => selectedSet.has(f));
        if (matched.length === bundle.requiredFeatures.length) {
          matches.push({
            bundle,
            matchedFeatures: matched,
            discount: bundle.value,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Get estimated savings from bundles
   */
  getEstimatedSavings(selectedFeatures: string[], tierSlug: string): number {
    const bundles = this.findApplicableBundles(selectedFeatures, tierSlug);
    return bundles.reduce((sum, b) => sum + b.discount, 0);
  }

  /**
   * Calculate price difference between two configurations
   */
  calculateDifference(
    config1: PriceCalculationInput,
    config2: PriceCalculationInput
  ): number {
    const price1 = this.calculate(config1);
    const price2 = this.calculate(config2);
    return price2.total - price1.total;
  }

  /**
   * Get tier by slug
   */
  getTier(slug: string): PricingTier | undefined {
    return this.tiers.get(slug);
  }

  /**
   * Get all tiers
   */
  getAllTiers(): PricingTier[] {
    return Array.from(this.tiers.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  /**
   * Get feature by slug
   */
  getFeature(slug: string): Feature | undefined {
    return this.features.get(slug);
  }

  /**
   * Format price for display
   * @deprecated Use formatPrice or formatDetailedPrice from ./utils instead
   */
  static formatPrice(
    amountInCents: number,
    currency: string = "USD",
    showCents: boolean = true
  ): string {
    return showCents
      ? formatDetailedPrice(amountInCents, { currency })
      : formatPrice(amountInCents, { currency });
  }

  /**
   * Calculate monthly equivalent for annual pricing
   */
  static calculateMonthlyEquivalent(annualPrice: number): number {
    return Math.round(annualPrice / 12);
  }
}
