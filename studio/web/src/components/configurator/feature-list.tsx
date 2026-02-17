"use client";

import { useMemo, useState } from "react";
import { SearchInput, Select, Badge } from "@/components/ui";
import { FeatureCard } from "./feature-card";
import { useConfigurator } from "./context";
import type { ModuleCategory } from "@studio/shared";

interface FeatureListProps {
  category: ModuleCategory | "all";
}

type SortOption = "name" | "price-asc" | "price-desc" | "popular";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Popular First" },
];

export function FeatureList({ category }: FeatureListProps) {
  const { features, modules, isFeatureIncludedInTier } = useConfigurator();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showIncluded, setShowIncluded] = useState(true);

  // Group features by module
  const groupedFeatures = useMemo(() => {
    // Build module lookup
    const moduleById = new Map(modules.map((m) => [m.id, m]));
    const moduleCategories = new Map(modules.map((m) => [m.id, m.category]));

    // Filter features
    let filtered = features.filter((f) => {
      // Category filter
      if (category !== "all") {
        const featureCategory = moduleCategories.get(f.moduleId);
        if (featureCategory !== category) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !f.name.toLowerCase().includes(query) &&
          !f.description.toLowerCase().includes(query) &&
          !f.slug.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Included filter
      if (!showIncluded && isFeatureIncludedInTier(f.slug)) {
        return false;
      }

      return true;
    });

    // Sort features
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "popular":
          // Popular first, then by display order
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.displayOrder - b.displayOrder;
        default:
          return 0;
      }
    });

    // Group by module
    const groups = new Map<string, typeof filtered>();
    for (const feature of filtered) {
      const module = moduleById.get(feature.moduleId);
      const groupKey = module?.slug || "other";
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(feature);
    }

    // Convert to array with module info
    return Array.from(groups.entries()).map(([moduleSlug, features]) => {
      const module = modules.find((m) => m.slug === moduleSlug);
      return {
        module,
        moduleSlug,
        moduleName: module?.name || "Other",
        features,
      };
    });
  }, [
    features,
    modules,
    category,
    searchQuery,
    sortBy,
    showIncluded,
    isFeatureIncludedInTier,
  ]);

  const totalFeatures = groupedFeatures.reduce(
    (sum, g) => sum + g.features.length,
    0
  );

  return (
    <div
      className="flex-1 overflow-y-auto p-4 md:p-6"
      id="feature-list-panel"
      role="tabpanel"
      aria-label={category === "all" ? "All features" : `${category} features`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {category === "all" ? "All Features" : `${category} Features`}
        </h2>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search features..."
              debounceDelay={200}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              className="w-full sm:w-40"
            />
            <button
              onClick={() => setShowIncluded(!showIncluded)}
              aria-pressed={showIncluded}
              aria-label={showIncluded ? "Showing all features, click to show add-ons only" : "Showing add-ons only, click to show all features"}
              className={`px-4 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                showIncluded
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {showIncluded ? "Showing All" : "Add-ons Only"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {totalFeatures === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            No features found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedFeatures.map(({ moduleSlug, moduleName, module, features }) => (
            <div key={moduleSlug}>
              {/* Module Header */}
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold">{moduleName}</h3>
                <Badge variant="outline" className="text-xs">
                  {features.length} features
                </Badge>
              </div>

              {/* Feature Grid */}
              <div
                className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2"
                role="listbox"
                aria-label={`${moduleName} features`}
                aria-multiselectable="true"
              >
                {features.map((feature) => (
                  <FeatureCard key={feature.slug} feature={feature} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
