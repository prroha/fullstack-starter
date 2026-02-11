"use client";

import { Check } from "lucide-react";
import { Badge, Icon } from "@/components/ui";
import type { IconName } from "@core/components/ui/icon";
import { useConfigurator } from "./context";
import { getTierIcon } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function TierSelector() {
  const { tiers, selectedTier, setTier, formatPrice } = useConfigurator();

  const sortedTiers = [...tiers].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Select pricing tier">
      {sortedTiers.map((tier) => {
        const isSelected = tier.slug === selectedTier;
        const iconName = getTierIcon(tier.slug) as IconName;

        return (
          <button
            key={tier.slug}
            onClick={() => setTier(tier.slug)}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${tier.name} tier, ${formatPrice(tier.price)}, ${tier.includedFeatures.length} features included`}
            className={cn(
              "w-full flex items-center gap-3 p-3 min-h-[60px] rounded-lg border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-transparent bg-background hover:border-muted-foreground/20"
            )}
          >
            {/* Selection Indicator */}
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>

            {/* Tier Icon */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isSelected ? "bg-primary/20" : "bg-muted"
              )}
            >
              <Icon
                name={iconName}
                size="sm"
                className={isSelected ? "text-primary" : "text-muted-foreground"}
                aria-hidden="true"
              />
            </div>

            {/* Tier Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{tier.name}</span>
                {tier.isPopular && (
                  <Badge variant="secondary" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {tier.includedFeatures.length} features included
              </span>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-semibold">{formatPrice(tier.price)}</div>
              {tier.compareAtPrice && tier.compareAtPrice > tier.price && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatPrice(tier.compareAtPrice)}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
