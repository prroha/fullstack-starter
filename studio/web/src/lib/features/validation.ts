/**
 * Configuration Validator - Validates feature configurations.
 * Ensures selections are valid before checkout.
 */

import type { Feature, PricingTier } from "@studio/shared";
import type { ResolvedSelection, FeatureConflict } from "./types";
import { DependencyResolver } from "./dependencies";

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  type: "missing_dependency" | "conflict" | "tier_required" | "invalid_feature";
  message: string;
  featureSlug?: string;
  relatedSlugs?: string[];
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: "unused_dependency" | "recommended_feature" | "upgrade_suggestion";
  message: string;
  featureSlug?: string;
  suggestion?: string;
}

/**
 * Configuration Validator class
 */
export class ConfigurationValidator {
  private features: Map<string, Feature> = new Map();
  private dependencyResolver: DependencyResolver;

  constructor(features: Feature[] = []) {
    for (const feature of features) {
      this.features.set(feature.slug, feature);
    }
    this.dependencyResolver = new DependencyResolver(features);
  }

  /**
   * Update features
   */
  updateFeatures(features: Feature[]): void {
    this.features.clear();
    for (const feature of features) {
      this.features.set(feature.slug, feature);
    }
    this.dependencyResolver.updateFeatures(features);
  }

  /**
   * Validate a configuration
   */
  validate(
    selectedFeatures: string[],
    tier: PricingTier
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for invalid features
    for (const slug of selectedFeatures) {
      const feature = this.features.get(slug);
      if (!feature) {
        errors.push({
          type: "invalid_feature",
          message: `Feature "${slug}" does not exist`,
          featureSlug: slug,
        });
        continue;
      }

      // Check tier requirements
      if (feature.tier && !this.isTierSufficient(feature.tier, tier.slug)) {
        errors.push({
          type: "tier_required",
          message: `${feature.name} requires ${feature.tier} tier or higher`,
          featureSlug: slug,
        });
      }
    }

    // Check dependencies and conflicts
    const resolved = this.dependencyResolver.resolveSelection(
      selectedFeatures,
      tier.includedFeatures
    );

    // Add missing dependency errors
    for (const slug of selectedFeatures) {
      const missing = this.dependencyResolver.getMissingDependencies(
        slug,
        [...selectedFeatures, ...tier.includedFeatures]
      );

      for (const dep of missing) {
        if (!resolved.autoSelected.includes(dep)) {
          const feature = this.features.get(slug);
          const depFeature = this.features.get(dep);
          errors.push({
            type: "missing_dependency",
            message: `${feature?.name || slug} requires ${depFeature?.name || dep}`,
            featureSlug: slug,
            relatedSlugs: [dep],
          });
        }
      }
    }

    // Add conflict errors
    for (const conflict of resolved.conflicts) {
      errors.push({
        type: "conflict",
        message: conflict.message,
        featureSlug: conflict.feature,
        relatedSlugs: [conflict.conflictsWith],
      });
    }

    // Add warnings for recommendations
    warnings.push(...this.getRecommendations(selectedFeatures, tier));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a tier is sufficient for a feature
   */
  private isTierSufficient(requiredTier: string, selectedTier: string): boolean {
    const tierOrder = ["basic", "starter", "pro", "business", "enterprise"];
    const requiredIndex = tierOrder.indexOf(requiredTier);
    const selectedIndex = tierOrder.indexOf(selectedTier);
    return selectedIndex >= requiredIndex;
  }

  /**
   * Get recommendations for the current configuration
   */
  private getRecommendations(
    selectedFeatures: string[],
    tier: PricingTier
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const selectedSet = new Set([...selectedFeatures, ...tier.includedFeatures]);

    // Check for commonly paired features
    const featurePairs: Array<[string, string, string]> = [
      ["auth.basic", "security.csrf", "CSRF protection is recommended with authentication"],
      ["payments.subscription", "comms.email", "Email notifications are recommended for subscriptions"],
      ["auth.basic", "comms.email", "Email is recommended for password reset functionality"],
      ["ui.admin", "analytics.basic", "Analytics is recommended for admin dashboards"],
    ];

    for (const [feature1, feature2, message] of featurePairs) {
      if (selectedSet.has(feature1) && !selectedSet.has(feature2)) {
        const f2 = this.features.get(feature2);
        warnings.push({
          type: "recommended_feature",
          message,
          featureSlug: feature2,
          suggestion: `Add ${f2?.name || feature2}`,
        });
      }
    }

    // Suggest tier upgrades if they would save money
    const tierOrder = ["basic", "starter", "pro", "business", "enterprise"];
    const currentTierIndex = tierOrder.indexOf(tier.slug);

    if (currentTierIndex < tierOrder.length - 1) {
      // Calculate add-on cost
      let addonCost = 0;
      for (const slug of selectedFeatures) {
        const feature = this.features.get(slug);
        if (feature && !tier.includedFeatures.includes(slug)) {
          addonCost += feature.price;
        }
      }

      // If addons are expensive, suggest upgrade
      if (addonCost > 100_00) { // $100 in cents
        warnings.push({
          type: "upgrade_suggestion",
          message: "You might save money by upgrading your tier",
          suggestion: `Consider the ${tierOrder[currentTierIndex + 1]} tier`,
        });
      }
    }

    return warnings;
  }

  /**
   * Quick validation check (just checks if valid, no details)
   */
  isValid(selectedFeatures: string[], tier: PricingTier): boolean {
    return this.validate(selectedFeatures, tier).isValid;
  }

  /**
   * Get minimum tier required for features
   */
  getMinimumTier(selectedFeatures: string[]): string {
    const tierOrder = ["basic", "starter", "pro", "business", "enterprise"];
    let minIndex = 0;

    for (const slug of selectedFeatures) {
      const feature = this.features.get(slug);
      if (feature?.tier) {
        const tierIndex = tierOrder.indexOf(feature.tier);
        if (tierIndex > minIndex) {
          minIndex = tierIndex;
        }
      }
    }

    return tierOrder[minIndex];
  }
}
