"use client";

import { Tag, Percent, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Divider, Badge } from "@/components/ui";
import { useConfigurator } from "./context";

interface PriceBreakdownProps {
  showDetails?: boolean;
}

export function PriceBreakdown({ showDetails = true }: PriceBreakdownProps) {
  const {
    pricing,
    selectedFeatures,
    resolvedFeatures,
    features,
    getCurrentTier,
    isFeatureIncludedInTier,
    formatPrice,
  } = useConfigurator();

  const currentTier = getCurrentTier();

  if (!pricing || !currentTier) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select a tier to see pricing breakdown.
        </CardContent>
      </Card>
    );
  }

  // Get add-on features with prices
  const addOnFeatures = selectedFeatures
    .filter((slug) => !isFeatureIncludedInTier(slug))
    .map((slug) => {
      const feature = features.find((f) => f.slug === slug);
      return feature;
    })
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  // Get auto-selected features (dependencies)
  const autoFeatures = (resolvedFeatures?.autoSelected || [])
    .map((slug) => features.find((f) => f.slug === slug))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{currentTier.name} Tier</div>
            <div className="text-sm text-muted-foreground">
              {currentTier.includedFeatures.length} features included
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatPrice(pricing.tierPrice)}</div>
            {currentTier.compareAtPrice && currentTier.compareAtPrice > pricing.tierPrice && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(currentTier.compareAtPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Add-on Features */}
        {showDetails && addOnFeatures.length > 0 && (
          <>
            <Divider />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Add-on Features ({addOnFeatures.length})
              </div>
              <div className="space-y-2">
                {addOnFeatures.map((feature) => (
                  <div key={feature.slug} className="flex justify-between text-sm">
                    <span>{feature.name}</span>
                    <span>{formatPrice(feature.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Auto-selected Features (Dependencies) */}
        {showDetails && autoFeatures.length > 0 && (
          <>
            <Divider />
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                Required Dependencies ({autoFeatures.length})
                <Badge variant="outline" className="text-xs">Auto-added</Badge>
              </div>
              <div className="space-y-2">
                {autoFeatures.map((feature) => (
                  <div key={feature.slug} className="flex justify-between text-sm text-muted-foreground">
                    <span>{feature.name}</span>
                    <span>{isFeatureIncludedInTier(feature.slug) ? "Included" : formatPrice(feature.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(pricing.subtotal)}</span>
        </div>

        {/* Discounts */}
        {pricing.bundleDiscounts.length > 0 && (
          <div className="space-y-2">
            {pricing.bundleDiscounts.map((discount) => (
              <div key={discount.id} className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  {discount.type === "percentage" ? (
                    <Percent className="h-4 w-4" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                  {discount.name}
                </span>
                <span>-{formatPrice(discount.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {pricing.couponDiscount && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              {pricing.couponDiscount.name}
            </span>
            <span>-{formatPrice(pricing.couponDiscount.amount)}</span>
          </div>
        )}

        {/* Total Savings */}
        {pricing.totalDiscount > 0 && (
          <>
            <Divider />
            <div className="flex justify-between text-green-600 font-medium">
              <span>You Save</span>
              <span>-{formatPrice(pricing.totalDiscount)}</span>
            </div>
          </>
        )}

        {/* Tax */}
        {pricing.tax > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatPrice(pricing.tax)}</span>
          </div>
        )}

        <Divider />

        {/* Total */}
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>{formatPrice(pricing.total)}</span>
        </div>

        {/* One-time Payment Note */}
        <p className="text-xs text-muted-foreground text-center">
          One-time payment. Lifetime access to code.
        </p>
      </CardContent>
    </Card>
  );
}
