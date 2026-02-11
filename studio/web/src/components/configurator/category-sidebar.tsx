"use client";

import { useMemo } from "react";
import { Icon, Badge } from "@/components/ui";
import type { IconName } from "@core/components/ui/icon";
import { useConfigurator } from "./context";
import { cn } from "@/lib/utils";
import type { ModuleCategory } from "@studio/shared";

const categoryInfo: Record<ModuleCategory, { name: string; icon: IconName }> = {
  auth: { name: "Authentication", icon: "Lock" },
  security: { name: "Security", icon: "Shield" },
  payments: { name: "Payments", icon: "CreditCard" },
  storage: { name: "Storage", icon: "HardDrive" },
  comms: { name: "Communications", icon: "MessageSquare" },
  ui: { name: "UI Components", icon: "LayoutDashboard" },
  analytics: { name: "Analytics", icon: "ChartBar" },
  mobile: { name: "Mobile", icon: "Smartphone" },
  infrastructure: { name: "Infrastructure", icon: "Server" },
  integrations: { name: "Integrations", icon: "Plug" },
};

interface CategorySidebarProps {
  selectedCategory: ModuleCategory | "all";
  onSelectCategory: (category: ModuleCategory | "all") => void;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  const { modules, features, selectedFeatures, resolvedFeatures } = useConfigurator();

  // Group modules and features by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; selected: number }> = {};
    const selectedSet = new Set(resolvedFeatures?.selectedFeatures || []);

    // Get category from module
    const moduleCategories = new Map<string, string>();
    for (const module of modules) {
      moduleCategories.set(module.id, module.category);
    }

    // Count features per category
    for (const feature of features) {
      const category = moduleCategories.get(feature.moduleId) || "other";
      if (!counts[category]) {
        counts[category] = { total: 0, selected: 0 };
      }
      counts[category].total++;
      if (selectedSet.has(feature.slug)) {
        counts[category].selected++;
      }
    }

    return counts;
  }, [modules, features, resolvedFeatures]);

  const categories = Object.keys(categoryInfo) as ModuleCategory[];
  const totalSelected = resolvedFeatures?.selectedFeatures.length || 0;

  return (
    <aside
      className="w-full lg:w-64 lg:border-r bg-muted/30 p-4 overflow-y-auto"
      aria-label="Feature categories"
    >
      <h2
        id="category-heading"
        className="hidden lg:block font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4"
      >
        Categories
      </h2>

      <nav className="space-y-1" role="tablist" aria-labelledby="category-heading">
        {/* All Features */}
        <button
          onClick={() => onSelectCategory("all")}
          role="tab"
          aria-selected={selectedCategory === "all"}
          aria-controls="feature-list-panel"
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon name="Layers" size="sm" aria-hidden="true" />
            <span>All Features</span>
          </div>
          {totalSelected > 0 && (
            <Badge
              variant={selectedCategory === "all" ? "secondary" : "outline"}
              className="text-xs"
              aria-label={`${totalSelected} features selected`}
            >
              {totalSelected}
            </Badge>
          )}
        </button>

        {/* Category Items */}
        {categories.map((category) => {
          const info = categoryInfo[category];
          const counts = categoryCounts[category];

          if (!counts || counts.total === 0) return null;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              role="tab"
              aria-selected={selectedCategory === category}
              aria-controls="feature-list-panel"
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon name={info.icon} size="sm" aria-hidden="true" />
                <span>{info.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {counts.selected > 0 && (
                  <Badge
                    variant={
                      selectedCategory === category ? "secondary" : "default"
                    }
                    className="text-xs"
                    aria-label={`${counts.selected} selected`}
                  >
                    {counts.selected}
                  </Badge>
                )}
                <span
                  className={cn(
                    "text-xs",
                    selectedCategory === category
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                  aria-label={`of ${counts.total} total`}
                >
                  /{counts.total}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
