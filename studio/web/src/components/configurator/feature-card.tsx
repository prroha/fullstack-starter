"use client";

import { useCallback } from "react";
import { Check, Lock, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent, Badge, Switch, Icon, Tooltip } from "@/components/ui";
import type { IconName } from "@core/components/ui/icon";
import { useConfigurator } from "./context";
import { cn } from "@/lib/utils";
import type { Feature } from "@studio/shared";

// Type guard to check if a string is a valid IconName
function isValidIconName(name: string | undefined | null): name is IconName {
  return typeof name === "string" && name.length > 0;
}

interface FeatureCardProps {
  feature: Feature;
  className?: string;
}

export function FeatureCard({ feature, className }: FeatureCardProps) {
  const {
    selectedTier,
    toggleFeature,
    isFeatureSelected,
    isFeatureIncludedInTier,
    isFeatureAutoSelected,
    getFeatureDependencies,
    getFeatureConflicts,
    formatPrice,
  } = useConfigurator();

  const isSelected = isFeatureSelected(feature.slug);
  const isIncluded = isFeatureIncludedInTier(feature.slug);
  const isAuto = isFeatureAutoSelected(feature.slug);
  const dependencies = getFeatureDependencies(feature.slug);
  const conflicts = getFeatureConflicts(feature.slug);

  const isLocked = isIncluded || isAuto;
  const effectivePrice = isIncluded ? 0 : feature.price;

  const handleToggle = useCallback(() => {
    if (isLocked) return;
    toggleFeature(feature.slug);
  }, [isLocked, toggleFeature, feature.slug]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isLocked) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFeature(feature.slug);
      }
    },
    [isLocked, toggleFeature, feature.slug]
  );

  return (
    <Card
      className={cn(
        "relative transition-all",
        isSelected && "ring-2 ring-primary",
        isLocked && "opacity-80",
        !isLocked && "cursor-pointer hover:shadow-md focus-within:ring-2 focus-within:ring-primary",
        className
      )}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isLocked}
      tabIndex={isLocked ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isSelected ? "bg-primary/20" : "bg-muted"
            )}
          >
            {isValidIconName(feature.iconName) ? (
              <Icon
                name={feature.iconName}
                size="sm"
                className={isSelected ? "text-primary" : "text-muted-foreground"}
              />
            ) : (
              <div className="h-4 w-4 rounded-sm bg-muted-foreground/30" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{feature.name}</h3>
              {feature.isNew && (
                <Badge variant="success" className="text-xs">New</Badge>
              )}
              {feature.isPopular && (
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {feature.description}
            </p>

            {/* Dependencies & Conflicts */}
            <div className="flex flex-wrap gap-1">
              {dependencies.length > 0 && (
                <Tooltip content={`Requires: ${dependencies.join(", ")}`}>
                  <Badge variant="outline" className="text-xs gap-1">
                    <LinkIcon className="h-3 w-3" />
                    {dependencies.length} deps
                  </Badge>
                </Tooltip>
              )}
              {conflicts.length > 0 && (
                <Tooltip content={`Conflicts: ${conflicts.join(", ")}`}>
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {conflicts.length} conflicts
                  </Badge>
                </Tooltip>
              )}
              {isIncluded && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Check className="h-3 w-3" />
                  Included
                </Badge>
              )}
              {isAuto && !isIncluded && (
                <Badge variant="outline" className="text-xs gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Required
                </Badge>
              )}
            </div>
          </div>

          {/* Price & Toggle */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              {effectivePrice > 0 ? (
                <span className="font-semibold">
                  {formatPrice(effectivePrice)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Included</span>
              )}
            </div>

            {isLocked ? (
              <div className="p-1">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={isSelected}
                  onChange={handleToggle}
                  aria-label={`Toggle ${feature.name}`}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
