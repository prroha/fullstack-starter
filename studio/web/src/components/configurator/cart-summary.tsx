"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Tag, Sparkles } from "lucide-react";
import { Button, Divider } from "@/components/ui";
import { useConfigurator } from "./context";
import { TierSelector } from "./tier-selector";
import { API_CONFIG } from "@/lib/constants";

export function CartSummary() {
  const {
    selectedTier,
    selectedFeatures,
    selectedTemplate,
    templates,
    resolvedFeatures,
    pricing,
    getCurrentTier,
    formatPrice,
  } = useConfigurator();

  const [isCreatingPreview, setIsCreatingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const template = templates.find((t) => t.slug === selectedTemplate);

  const handlePreview = useCallback(async () => {
    setIsCreatingPreview(true);
    setPreviewError(null);

    try {
      // Create backend session for analytics/sharing (non-blocking failure)
      let sessionToken: string | null = null;
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/preview/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedFeatures,
            tier: selectedTier,
            templateSlug: template?.slug,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.sessionToken) {
            sessionToken = data.data.sessionToken;
          }
        }
      } catch {
        // Backend session is optional — preview works without it
      }

      // Construct preview URL on the frontend (avoids broken backend URL defaults)
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const params = new URLSearchParams();
      if (sessionToken) {
        params.set("preview", sessionToken);
      } else {
        // Fallback: pass config directly via URL params
        params.set("tier", selectedTier);
        if (selectedFeatures.length > 0) {
          params.set("features", selectedFeatures.join(","));
        }
        if (template?.slug) {
          params.set("template", template.slug);
        }
      }

      const previewUrl = `${origin}/preview?${params.toString()}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to create preview:", err);
      setPreviewError("Failed to create preview. Please try again.");
    } finally {
      setIsCreatingPreview(false);
    }
  }, [selectedFeatures, selectedTier, template?.slug]);

  const currentTier = getCurrentTier();
  const tierIncluded = currentTier?.includedFeatures.length || 0;
  const addOns = selectedFeatures.length;
  const autoSelected = resolvedFeatures?.autoSelected.length || 0;
  const totalSelected = resolvedFeatures?.selectedFeatures.length || 0;
  const hasConflicts = (resolvedFeatures?.conflicts.length || 0) > 0;

  return (
    <aside
      className="w-full lg:w-80 lg:border-l bg-muted/30 p-4 overflow-y-auto flex flex-col"
      aria-label="Cart summary"
    >
      {/* Tier Selector */}
      <section className="mb-4" aria-labelledby="tier-section-heading">
        <h2
          id="tier-section-heading"
          className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2"
        >
          Select Tier
        </h2>
        <TierSelector />
      </section>

      <Divider />

      {/* Selection Summary */}
      <section className="py-3" aria-labelledby="selection-section-heading">
        <h2
          id="selection-section-heading"
          className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2"
        >
          Your Selection
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tier Features</span>
            <span>{tierIncluded}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add-ons</span>
            <span>{addOns}</span>
          </div>
          {autoSelected > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-selected (deps)</span>
              <span className="text-muted-foreground">{autoSelected}</span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Total Features</span>
            <span>{totalSelected}</span>
          </div>
        </div>

        {/* Conflicts Warning */}
        {hasConflicts && (
          <div
            className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-destructive font-medium">
              {resolvedFeatures?.conflicts.length} conflict(s) detected
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Please resolve conflicts before proceeding.
            </p>
          </div>
        )}
      </section>

      <Divider />

      {/* Pricing Breakdown */}
      <section className="py-3 flex-1" aria-labelledby="pricing-section-heading">
        <h2
          id="pricing-section-heading"
          className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2"
        >
          Pricing
        </h2>

        {pricing ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {currentTier?.name} Tier
              </span>
              <span>{formatPrice(pricing.tierPrice)}</span>
            </div>

            {pricing.featuresPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-on Features</span>
                <span>{formatPrice(pricing.featuresPrice)}</span>
              </div>
            )}

            <Divider className="my-2" />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(pricing.subtotal)}</span>
            </div>

            {/* Discounts */}
            {pricing.bundleDiscounts.length > 0 && (
              <>
                {pricing.bundleDiscounts.map((discount) => (
                  <div key={discount.id} className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {discount.name}
                    </span>
                    <span>-{formatPrice(discount.amount)}</span>
                  </div>
                ))}
              </>
            )}

            {pricing.totalDiscount > 0 && (
              <>
                <Divider className="my-2" />
                <div className="flex justify-between text-green-600">
                  <span>Total Savings</span>
                  <span>-{formatPrice(pricing.totalDiscount)}</span>
                </div>
              </>
            )}

            {pricing.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(pricing.tax)}</span>
              </div>
            )}

            <Divider className="my-2" />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a tier to see pricing.
          </p>
        )}
      </section>

      {/* Actions */}
      <nav className="space-y-2 pt-4 border-t" aria-label="Cart actions">
        <Button
          variant="secondary"
          className="w-full"
          disabled={hasConflicts || isCreatingPreview}
          isLoading={isCreatingPreview}
          onClick={handlePreview}
          aria-describedby={previewError ? "preview-error" : undefined}
        >
          {!isCreatingPreview && <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
          {isCreatingPreview ? "Creating Preview..." : "Preview App"}
        </Button>
        {previewError && (
          <p id="preview-error" className="text-xs text-destructive text-center" role="alert">
            {previewError}
          </p>
        )}
        <Button asChild variant="default" className="w-full" disabled={hasConflicts}>
          <Link href="/checkout" aria-label="Proceed to checkout">
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </nav>
    </aside>
  );
}
