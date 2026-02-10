/**
 * Feature and Module types for the Studio platform.
 * Features are individual capabilities that can be added to a project.
 * Modules are logical groupings of related features.
 */

/**
 * A module representing a logical grouping of features.
 */
export interface Module {
  /** Unique module identifier (CUID) */
  id: string;
  /** URL-friendly unique identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Description of the module's purpose */
  description: string;
  /** Category for grouping (auth, security, payments, storage, comms, ui, analytics, mobile) */
  category: string;
  /** Lucide icon name for display */
  iconName?: string;
  /** Order for display sorting */
  displayOrder: number;
  /** Whether module is available */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Features belonging to this module */
  features?: FeatureSummary[];
}

/**
 * Abbreviated feature info for module listings.
 */
export interface FeatureSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  isActive: boolean;
}

/**
 * A feature representing an individual capability.
 */
export interface Feature {
  /** Unique feature identifier (CUID) */
  id: string;
  /** URL-friendly unique identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Description of the feature */
  description: string;
  /** Parent module ID */
  moduleId: string;
  /** Additional price for this feature (in cents, 0 = included in tier) */
  price: number;
  /** Minimum tier required (null = available in all tiers) */
  tier: string | null;
  /** Array of feature slugs this feature depends on */
  requires: string[];
  /** Array of feature slugs this feature conflicts with */
  conflicts: string[];
  /** File mapping configuration for code generation */
  fileMappings?: FileMappingConfig[];
  /** Schema mapping configuration for database models */
  schemaMappings?: SchemaMappingConfig[];
  /** Environment variables required by this feature */
  envVars?: EnvVarConfig[];
  /** NPM packages required by this feature */
  npmPackages?: NpmPackageConfig[];
  /** Lucide icon name for display */
  iconName?: string;
  /** Order for display sorting */
  displayOrder: number;
  /** Whether feature is available */
  isActive: boolean;
  /** Whether to show "NEW" badge */
  isNew: boolean;
  /** Whether to show "POPULAR" badge */
  isPopular: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Parent module info */
  module?: {
    id: string;
    name: string;
    slug: string;
    category: string;
  };
}

/**
 * Configuration for file mapping during code generation.
 */
export interface FileMappingConfig {
  /** Source file path in the feature template */
  source: string;
  /** Destination file path in the generated project */
  destination: string;
  /** Optional transformation to apply */
  transform?: string;
}

/**
 * Configuration for schema/model mapping during code generation.
 */
export interface SchemaMappingConfig {
  /** Model/table name */
  model: string;
  /** Source schema file path */
  source: string;
}

/**
 * Configuration for required environment variables.
 */
export interface EnvVarConfig {
  /** Environment variable name */
  key: string;
  /** Description of the variable's purpose */
  description: string;
  /** Whether this variable is required */
  required: boolean;
  /** Default value if not provided */
  default?: string;
}

/**
 * Configuration for required NPM packages.
 */
export interface NpmPackageConfig {
  /** Package name */
  name: string;
  /** Package version (semver) */
  version: string;
  /** Whether this is a dev dependency */
  dev?: boolean;
}

/**
 * Data required to create a new module.
 */
export interface CreateModuleData {
  slug: string;
  name: string;
  description: string;
  category: string;
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Data for updating an existing module.
 */
export interface UpdateModuleData extends Partial<CreateModuleData> {}

/**
 * Parameters for querying modules with filtering and pagination.
 */
export interface GetModulesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

/**
 * Data required to create a new feature.
 */
export interface CreateFeatureData {
  slug: string;
  name: string;
  description: string;
  moduleId: string;
  price?: number;
  tier?: string | null;
  requires?: string[];
  conflicts?: string[];
  fileMappings?: FileMappingConfig[];
  schemaMappings?: SchemaMappingConfig[];
  envVars?: EnvVarConfig[];
  npmPackages?: NpmPackageConfig[];
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
}

/**
 * Data for updating an existing feature.
 */
export interface UpdateFeatureData extends Partial<CreateFeatureData> {}

/**
 * Parameters for querying features with filtering and pagination.
 */
export interface GetFeaturesParams {
  page?: number;
  limit?: number;
  search?: string;
  moduleId?: string;
  tier?: string;
  isActive?: boolean;
  category?: string;
}

/**
 * Item for bulk price update operations.
 */
export interface BulkUpdatePriceItem {
  /** Feature ID */
  id: string;
  /** New price in cents */
  price: number;
}

/**
 * Statistics about feature usage.
 */
export interface FeatureStats {
  /** Feature slug */
  slug: string;
  /** Feature name */
  name: string;
  /** Feature price */
  price: number;
  /** Number of times purchased */
  purchaseCount: number;
  /** Percentage of orders including this feature */
  percentage: number;
}

/**
 * Available module categories.
 */
export type ModuleCategory =
  | "auth"
  | "security"
  | "payments"
  | "storage"
  | "comms"
  | "ui"
  | "analytics"
  | "mobile"
  | "infrastructure"
  | "integrations";
