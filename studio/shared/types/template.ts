/**
 * Template-related types for the Studio platform.
 * Templates are pre-configured bundles of features that customers can purchase.
 */

/**
 * A template representing a pre-configured feature bundle.
 */
export interface Template {
  /** Unique template identifier (CUID) */
  id: string;
  /** URL-friendly unique identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Full description (supports markdown) */
  description: string;
  /** Brief description for cards/lists */
  shortDescription?: string;
  /** Price in cents */
  price: number;
  /** Original/compare-at price for displaying savings (in cents) */
  compareAtPrice?: number;
  /** Minimum tier required to access this template */
  tier: string;
  /** Array of feature IDs/slugs included in this template */
  includedFeatures: string[];
  /** URL to template preview image */
  previewImageUrl?: string;
  /** URL to live preview of the template */
  previewUrl?: string;
  /** Lucide icon name for display */
  iconName?: string;
  /** Theme color (hex or named) */
  color?: string;
  /** Order for display sorting */
  displayOrder: number;
  /** Whether template is available for purchase */
  isActive: boolean;
  /** Whether to feature this template prominently */
  isFeatured: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Number of orders for this template (computed) */
  orderCount?: number;
  /** Aggregate statistics for this template */
  stats?: TemplateStats;
}

/**
 * Aggregate statistics for a template.
 */
export interface TemplateStats {
  /** Total number of orders */
  totalOrders: number;
  /** Total revenue generated (in cents) */
  totalRevenue: number;
}

/**
 * Summary of top-performing templates.
 */
export interface TopTemplate {
  templateId: string | null;
  _count: { id: number };
  _sum: { total: number | null };
}

/**
 * Data required to create a new template.
 */
export interface CreateTemplateData {
  /** URL-friendly unique identifier */
  slug: string;
  /** Display name */
  name: string;
  /** Full description */
  description: string;
  /** Brief description */
  shortDescription?: string;
  /** Price in cents */
  price: number;
  /** Compare-at price in cents */
  compareAtPrice?: number;
  /** Minimum tier required */
  tier: string;
  /** Array of included feature IDs */
  includedFeatures: string[];
  /** Preview image URL */
  previewImageUrl?: string;
  /** Live preview URL */
  previewUrl?: string;
  /** Lucide icon name */
  iconName?: string;
  /** Theme color */
  color?: string;
  /** Display order */
  displayOrder?: number;
  /** Whether template is active */
  isActive?: boolean;
  /** Whether template is featured */
  isFeatured?: boolean;
}

/**
 * Data for updating an existing template.
 * All fields are optional.
 */
export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

/**
 * Parameters for querying templates with filtering and pagination.
 */
export interface GetTemplatesParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search by name or description */
  search?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by featured status */
  isFeatured?: boolean;
  /** Filter by tier */
  tier?: string;
}

/**
 * Data for reordering templates.
 */
export interface ReorderTemplateItem {
  /** Template ID */
  id: string;
  /** New display order */
  displayOrder: number;
}
