/**
 * Client-side feature types for the configurator.
 * Extends shared types with client-specific properties.
 */

import type {
  Feature as BaseFeature,
  Module as BaseModule,
  ModuleCategory,
} from "@studio/shared";

/**
 * Client-side feature with resolved state
 */
export interface ClientFeature extends BaseFeature {
  /** Whether feature is currently selected */
  isSelected: boolean;
  /** Whether feature is auto-included by tier */
  isIncludedInTier: boolean;
  /** Whether feature is auto-selected due to dependency */
  isAutoSelected: boolean;
  /** Whether feature is locked (can't be deselected) */
  isLocked: boolean;
  /** Reason for being locked */
  lockReason?: string;
  /** Features that depend on this feature */
  dependents: string[];
  /** Resolved conflicts with selected features */
  conflictsWith: string[];
  /** Whether feature is available in current tier */
  isAvailableInTier: boolean;
  /** Effective price (0 if included in tier) */
  effectivePrice: number;
}

/**
 * Client-side module with features
 */
export interface ClientModule extends BaseModule {
  /** Features in this module */
  features: ClientFeature[];
  /** Number of selected features */
  selectedCount: number;
  /** Total price of selected features */
  selectedTotal: number;
}

/**
 * Feature selection state
 */
export interface FeatureSelectionState {
  /** Map of feature slug to selected state */
  selected: Record<string, boolean>;
  /** Features auto-selected due to dependencies */
  autoSelected: string[];
  /** Features locked and can't be deselected */
  locked: string[];
  /** Current conflicts */
  conflicts: FeatureConflict[];
}

/**
 * Conflict between features
 */
export interface FeatureConflict {
  /** Feature causing conflict */
  feature: string;
  /** Feature conflicting with */
  conflictsWith: string;
  /** Human-readable message */
  message: string;
}

/**
 * Resolved selection result
 */
export interface ResolvedSelection {
  /** All selected features (user + auto) */
  selectedFeatures: string[];
  /** User-selected features */
  userSelected: string[];
  /** Auto-selected due to dependencies */
  autoSelected: string[];
  /** Features included in tier */
  tierIncluded: string[];
  /** Active conflicts */
  conflicts: FeatureConflict[];
  /** Whether selection is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
}

/**
 * Feature category with metadata
 */
export interface FeatureCategoryInfo {
  slug: ModuleCategory;
  name: string;
  description: string;
  icon: string;
  moduleCount: number;
  featureCount: number;
}

/**
 * Feature filter options
 */
export interface FeatureFilterOptions {
  search?: string;
  category?: ModuleCategory | "all";
  tier?: string;
  showIncluded?: boolean;
  showAddons?: boolean;
}

export type { ModuleCategory };
