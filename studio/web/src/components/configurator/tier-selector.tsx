"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { useConfigurator } from "./context";
import { cn } from "@/lib/utils";

export function TierSelector() {
  const { tiers, selectedTier, setTier, formatPrice } = useConfigurator();

  const sortedTiers = [...tiers].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-1.5" role="radiogroup" aria-label="Select pricing tier">
      {sortedTiers.map((tier) => {
        const isSelected = tier.slug === selectedTier;

        return (
          <button
            key={tier.slug}
            onClick={() => setTier(tier.slug)}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${tier.name} tier, ${formatPrice(tier.price)}, ${tier.includedFeatures.length} features included`}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-transparent bg-background hover:border-muted-foreground/20"
            )}
          >
            {/* Selection Indicator */}
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="h-2.5 w-2.5" />}
            </div>

            {/* Tier Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{tier.name}</span>
                {tier.isPopular && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Popular
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {tier.includedFeatures.length} features
              </span>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">{formatPrice(tier.price)}</div>
              {tier.compareAtPrice && tier.compareAtPrice > tier.price && (
                <div className="text-[10px] text-muted-foreground line-through">
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
