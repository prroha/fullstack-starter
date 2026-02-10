/**
 * Feature Registry - Central catalog of all features and modules.
 * Provides methods for querying, filtering, and categorizing features.
 */

import type { Feature, Module, ModuleCategory } from "@studio/shared";
import type { FeatureCategoryInfo, FeatureFilterOptions } from "./types";

/**
 * Category metadata
 */
const categoryInfo: Record<ModuleCategory, { name: string; description: string; icon: string }> = {
  auth: {
    name: "Authentication",
    description: "User authentication and authorization features",
    icon: "Lock",
  },
  security: {
    name: "Security",
    description: "Security hardening and protection features",
    icon: "Shield",
  },
  payments: {
    name: "Payments",
    description: "Payment processing and billing features",
    icon: "CreditCard",
  },
  storage: {
    name: "Storage",
    description: "File upload and storage features",
    icon: "HardDrive",
  },
  comms: {
    name: "Communications",
    description: "Email, push, and real-time messaging",
    icon: "MessageSquare",
  },
  ui: {
    name: "UI Components",
    description: "User interface components and layouts",
    icon: "LayoutDashboard",
  },
  analytics: {
    name: "Analytics",
    description: "Analytics, reporting, and data export",
    icon: "ChartBar",
  },
  mobile: {
    name: "Mobile",
    description: "Flutter mobile app features",
    icon: "Smartphone",
  },
  infrastructure: {
    name: "Infrastructure",
    description: "DevOps and infrastructure features",
    icon: "Server",
  },
  integrations: {
    name: "Integrations",
    description: "Third-party service integrations",
    icon: "Plug",
  },
};

/**
 * Feature Registry class for managing features
 */
export class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  private modules: Map<string, Module> = new Map();
  private featuresByModule: Map<string, Feature[]> = new Map();
  private modulesByCategory: Map<ModuleCategory, Module[]> = new Map();

  constructor(features: Feature[] = [], modules: Module[] = []) {
    this.load(features, modules);
  }

  /**
   * Load features and modules into the registry
   */
  load(features: Feature[], modules: Module[]): void {
    // Clear existing data
    this.features.clear();
    this.modules.clear();
    this.featuresByModule.clear();
    this.modulesByCategory.clear();

    // Index modules
    for (const module of modules) {
      this.modules.set(module.slug, module);

      const category = module.category as ModuleCategory;
      if (!this.modulesByCategory.has(category)) {
        this.modulesByCategory.set(category, []);
      }
      this.modulesByCategory.get(category)!.push(module);
    }

    // Index features
    for (const feature of features) {
      this.features.set(feature.slug, feature);

      const moduleSlug = this.getModuleSlug(feature.moduleId);
      if (moduleSlug) {
        if (!this.featuresByModule.has(moduleSlug)) {
          this.featuresByModule.set(moduleSlug, []);
        }
        this.featuresByModule.get(moduleSlug)!.push(feature);
      }
    }
  }

  /**
   * Get module slug from module ID
   */
  private getModuleSlug(moduleId: string): string | null {
    for (const [slug, module] of this.modules) {
      if (module.id === moduleId) return slug;
    }
    return null;
  }

  /**
   * Get all features
   */
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  /**
   * Get all modules
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get feature by slug
   */
  getFeature(slug: string): Feature | undefined {
    return this.features.get(slug);
  }

  /**
   * Get module by slug
   */
  getModule(slug: string): Module | undefined {
    return this.modules.get(slug);
  }

  /**
   * Get features for a module
   */
  getFeaturesByModule(moduleSlug: string): Feature[] {
    return this.featuresByModule.get(moduleSlug) || [];
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): Module[] {
    return this.modulesByCategory.get(category) || [];
  }

  /**
   * Get all categories with metadata
   */
  getCategories(): FeatureCategoryInfo[] {
    const categories: FeatureCategoryInfo[] = [];

    for (const [slug, info] of Object.entries(categoryInfo)) {
      const modules = this.modulesByCategory.get(slug as ModuleCategory) || [];
      const featureCount = modules.reduce((sum, mod) => {
        return sum + (this.featuresByModule.get(mod.slug)?.length || 0);
      }, 0);

      if (modules.length > 0 || featureCount > 0) {
        categories.push({
          slug: slug as ModuleCategory,
          name: info.name,
          description: info.description,
          icon: info.icon,
          moduleCount: modules.length,
          featureCount,
        });
      }
    }

    return categories;
  }

  /**
   * Get category info by slug
   */
  getCategoryInfo(slug: ModuleCategory): FeatureCategoryInfo | null {
    const info = categoryInfo[slug];
    if (!info) return null;

    const modules = this.modulesByCategory.get(slug) || [];
    const featureCount = modules.reduce((sum, mod) => {
      return sum + (this.featuresByModule.get(mod.slug)?.length || 0);
    }, 0);

    return {
      slug,
      name: info.name,
      description: info.description,
      icon: info.icon,
      moduleCount: modules.length,
      featureCount,
    };
  }

  /**
   * Filter features based on options
   */
  filterFeatures(options: FeatureFilterOptions): Feature[] {
    let features = this.getAllFeatures();

    // Filter by search
    if (options.search) {
      const query = options.search.toLowerCase();
      features = features.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.slug.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (options.category && options.category !== "all") {
      const moduleSlugsByCategory = this.getModulesByCategory(options.category).map(
        (m) => m.slug
      );
      features = features.filter((f) => {
        const moduleSlug = this.getModuleSlug(f.moduleId);
        return moduleSlug && moduleSlugsByCategory.includes(moduleSlug);
      });
    }

    // Filter by tier
    if (options.tier) {
      features = features.filter(
        (f) => !f.tier || f.tier === options.tier || this.isTierIncluded(f.tier, options.tier!)
      );
    }

    return features;
  }

  /**
   * Check if a feature's tier is included in the selected tier
   */
  private isTierIncluded(featureTier: string, selectedTier: string): boolean {
    const tierOrder = ["basic", "starter", "pro", "business", "enterprise"];
    const featureIndex = tierOrder.indexOf(featureTier);
    const selectedIndex = tierOrder.indexOf(selectedTier);
    return selectedIndex >= featureIndex;
  }

  /**
   * Get features included in a tier
   */
  getFeaturesIncludedInTier(tierSlug: string, tierFeatures: string[]): Feature[] {
    return tierFeatures
      .map((slug) => this.features.get(slug))
      .filter((f): f is Feature => f !== undefined);
  }

  /**
   * Get add-on features (not included in tier)
   */
  getAddOnFeatures(tierFeatures: string[]): Feature[] {
    const tierSet = new Set(tierFeatures);
    return this.getAllFeatures().filter(
      (f) => !tierSet.has(f.slug) && f.isActive
    );
  }

  /**
   * Search features
   */
  searchFeatures(query: string): Feature[] {
    return this.filterFeatures({ search: query });
  }

  /**
   * Check if registry has data
   */
  isEmpty(): boolean {
    return this.features.size === 0;
  }

  /**
   * Get feature count
   */
  getFeatureCount(): number {
    return this.features.size;
  }

  /**
   * Get module count
   */
  getModuleCount(): number {
    return this.modules.size;
  }
}

/**
 * Create a singleton registry instance
 */
let registryInstance: FeatureRegistry | null = null;

export function getFeatureRegistry(): FeatureRegistry {
  if (!registryInstance) {
    registryInstance = new FeatureRegistry();
  }
  return registryInstance;
}

export function initializeRegistry(features: Feature[], modules: Module[]): FeatureRegistry {
  registryInstance = new FeatureRegistry(features, modules);
  return registryInstance;
}
