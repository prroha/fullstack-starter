"use client";

import { Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge, Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FeaturePanelProps {
  tier: string;
  features: string[];
  allFeatures: readonly {
    readonly slug: string;
    readonly name: string;
    readonly category: string;
  }[];
  className?: string;
}

export function FeaturePanel({
  tier,
  features,
  allFeatures,
  className,
}: FeaturePanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["auth", "ui"])
  );

  const enabledSet = new Set(features);

  // Feature type for grouping
  type FeatureItem = { slug: string; name: string; category: string };

  // Group features by category
  const groupedFeatures = allFeatures.reduce(
    (acc, feature) => {
      const category = feature.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ ...feature });
      return acc;
    },
    {} as Record<string, FeatureItem[]>
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categoryNames: Record<string, string> = {
    auth: "Authentication",
    security: "Security",
    payments: "Payments",
    storage: "Storage",
    comms: "Communications",
    ui: "UI Components",
    analytics: "Analytics",
    mobile: "Mobile",
    other: "Other",
  };

  return (
    <aside
      className={cn(
        "w-full lg:w-72 lg:border-l bg-muted/30 overflow-y-auto",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Active Features</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{tier} tier</Badge>
          <Badge variant="outline">{features.length} enabled</Badge>
        </div>
      </div>

      {/* Feature List */}
      <div className="p-2">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
          const isExpanded = expandedCategories.has(category);
          const enabledCount = categoryFeatures.filter((f) =>
            enabledSet.has(f.slug)
          ).length;

          return (
            <div key={category} className="mb-1">
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{categoryNames[category] || category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {enabledCount}/{categoryFeatures.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="ml-6 space-y-0.5 mt-1">
                  {categoryFeatures.map((feature) => {
                    const isEnabled = enabledSet.has(feature.slug);

                    return (
                      <div
                        key={feature.slug}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded text-sm",
                          isEnabled
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {isEnabled ? (
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className="truncate">{feature.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
