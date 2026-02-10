"use client";

import { Link, AlertTriangle, Info } from "lucide-react";
import { Badge, Tooltip } from "@/components/ui";
import { useConfigurator } from "./context";

interface DependencyBadgeProps {
  featureSlug: string;
  showTooltip?: boolean;
}

export function DependencyBadge({
  featureSlug,
  showTooltip = true,
}: DependencyBadgeProps) {
  const { getFeatureDependencies, getFeatureConflicts, features } = useConfigurator();

  const dependencies = getFeatureDependencies(featureSlug);
  const conflicts = getFeatureConflicts(featureSlug);

  // Get feature names for tooltips
  const getFeatureNames = (slugs: string[]) => {
    return slugs
      .map((slug) => {
        const feature = features.find((f) => f.slug === slug);
        return feature?.name || slug;
      })
      .join(", ");
  };

  if (dependencies.length === 0 && conflicts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {/* Dependencies */}
      {dependencies.length > 0 && (
        showTooltip ? (
          <Tooltip content={`Requires: ${getFeatureNames(dependencies)}`}>
            <Badge variant="outline" className="text-xs gap-1 cursor-help">
              <Link className="h-3 w-3" />
              {dependencies.length} {dependencies.length === 1 ? "dependency" : "dependencies"}
            </Badge>
          </Tooltip>
        ) : (
          <Badge variant="outline" className="text-xs gap-1">
            <Link className="h-3 w-3" />
            {dependencies.length}
          </Badge>
        )
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        showTooltip ? (
          <Tooltip content={`Conflicts with: ${getFeatureNames(conflicts)}`}>
            <Badge variant="destructive" className="text-xs gap-1 cursor-help">
              <AlertTriangle className="h-3 w-3" />
              {conflicts.length} {conflicts.length === 1 ? "conflict" : "conflicts"}
            </Badge>
          </Tooltip>
        ) : (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            {conflicts.length}
          </Badge>
        )
      )}
    </div>
  );
}

/**
 * Shows a info tooltip about feature relationships
 */
export function DependencyInfo({ featureSlug }: { featureSlug: string }) {
  const { getFeatureDependencies, getFeatureConflicts, features } = useConfigurator();

  const dependencies = getFeatureDependencies(featureSlug);
  const conflicts = getFeatureConflicts(featureSlug);

  const getFeatureNames = (slugs: string[]) => {
    return slugs.map((slug) => {
      const feature = features.find((f) => f.slug === slug);
      return feature?.name || slug;
    });
  };

  if (dependencies.length === 0 && conflicts.length === 0) {
    return null;
  }

  return (
    <div className="text-xs space-y-2">
      {dependencies.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Link className="h-3 w-3" />
            <span>Requires:</span>
          </div>
          <ul className="ml-4 space-y-0.5">
            {getFeatureNames(dependencies).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {conflicts.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-destructive mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Conflicts with:</span>
          </div>
          <ul className="ml-4 space-y-0.5 text-destructive">
            {getFeatureNames(conflicts).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
