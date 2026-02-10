"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  PricingTier,
  PriceCalculation,
  BundleDiscount,
  Feature,
} from "@studio/shared";
import type { CartState, CartItem } from "./types";
import { PricingCalculator } from "./calculator";
import { getRecommendedTier } from "./tiers";
import { getSuggestedBundles } from "./bundles";
import { studioApi, StudioApiError } from "../api/studio-client";

/**
 * Hook for pricing calculations
 */
export function usePricing(
  features: Feature[],
  tiers: PricingTier[],
  bundles: BundleDiscount[] = []
) {
  const calculator = useMemo(() => {
    return new PricingCalculator(features, tiers, bundles);
  }, [features, tiers, bundles]);

  const calculatePrice = useCallback(
    (tierSlug: string, selectedFeatures: string[], couponCode?: string) => {
      try {
        return calculator.calculate({
          tier: tierSlug,
          selectedFeatures,
          couponCode,
        });
      } catch (err) {
        console.error("Price calculation error:", err);
        return null;
      }
    },
    [calculator]
  );

  const formatPrice = useCallback(
    (amountInCents: number, showCents: boolean = true) => {
      return PricingCalculator.formatPrice(amountInCents, "USD", showCents);
    },
    []
  );

  const getTierPrice = useCallback(
    (tierSlug: string) => {
      const tier = calculator.getTier(tierSlug);
      return tier?.price || 0;
    },
    [calculator]
  );

  const getFeaturePrice = useCallback(
    (featureSlug: string, tierSlug: string) => {
      const tier = calculator.getTier(tierSlug);
      if (tier?.includedFeatures.includes(featureSlug)) {
        return 0; // Included in tier
      }
      const feature = calculator.getFeature(featureSlug);
      return feature?.price || 0;
    },
    [calculator]
  );

  return {
    calculator,
    calculatePrice,
    formatPrice,
    getTierPrice,
    getFeaturePrice,
    allTiers: calculator.getAllTiers(),
  };
}

/**
 * Hook for managing cart state
 */
export function useCart(
  features: Feature[],
  tiers: PricingTier[],
  bundles: BundleDiscount[] = []
) {
  const [cart, setCart] = useState<CartState>({
    tier: null,
    templateId: null,
    features: [],
    couponCode: null,
    items: [],
    pricing: null,
  });

  const { calculatePrice, formatPrice } = usePricing(features, tiers, bundles);

  // Recalculate pricing when cart changes
  useEffect(() => {
    if (cart.tier) {
      const pricing = calculatePrice(
        cart.tier.slug,
        cart.features,
        cart.couponCode || undefined
      );

      const items = buildCartItems(cart.tier, cart.features, features, tiers);

      setCart((prev) => ({
        ...prev,
        items,
        pricing,
      }));
    }
  }, [cart.tier, cart.features, cart.couponCode, calculatePrice, features, tiers]);

  const setTier = useCallback((tier: PricingTier) => {
    setCart((prev) => ({
      ...prev,
      tier,
      // Clear features that are now included in tier
      features: prev.features.filter(
        (f) => !tier.includedFeatures.includes(f)
      ),
    }));
  }, []);

  const setTemplate = useCallback((templateId: string | null) => {
    setCart((prev) => ({
      ...prev,
      templateId,
    }));
  }, []);

  const addFeature = useCallback((featureSlug: string) => {
    setCart((prev) => {
      if (prev.features.includes(featureSlug)) return prev;
      if (prev.tier?.includedFeatures.includes(featureSlug)) return prev;
      return {
        ...prev,
        features: [...prev.features, featureSlug],
      };
    });
  }, []);

  const removeFeature = useCallback((featureSlug: string) => {
    setCart((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== featureSlug),
    }));
  }, []);

  const setFeatures = useCallback((featureSlugs: string[]) => {
    setCart((prev) => ({
      ...prev,
      features: featureSlugs,
    }));
  }, []);

  const setCoupon = useCallback((code: string | null) => {
    setCart((prev) => ({
      ...prev,
      couponCode: code,
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({
      tier: null,
      templateId: null,
      features: [],
      couponCode: null,
      items: [],
      pricing: null,
    });
  }, []);

  const getTotal = useCallback(() => {
    return cart.pricing?.total || 0;
  }, [cart.pricing]);

  const getSubtotal = useCallback(() => {
    return cart.pricing?.subtotal || 0;
  }, [cart.pricing]);

  const getDiscount = useCallback(() => {
    return cart.pricing?.totalDiscount || 0;
  }, [cart.pricing]);

  const isEmpty = cart.tier === null && cart.features.length === 0;
  const itemCount = cart.items.length;

  return {
    cart,
    setTier,
    setTemplate,
    addFeature,
    removeFeature,
    setFeatures,
    setCoupon,
    clearCart,
    getTotal,
    getSubtotal,
    getDiscount,
    formatPrice,
    isEmpty,
    itemCount,
  };
}

/**
 * Build cart items from selection
 */
function buildCartItems(
  tier: PricingTier,
  selectedFeatures: string[],
  allFeatures: Feature[],
  allTiers: PricingTier[]
): CartItem[] {
  const items: CartItem[] = [];
  const featureMap = new Map(allFeatures.map((f) => [f.slug, f]));

  // Add tier
  items.push({
    type: "tier",
    slug: tier.slug,
    name: tier.name,
    price: tier.price,
  });

  // Add selected features (not included in tier)
  for (const slug of selectedFeatures) {
    const feature = featureMap.get(slug);
    if (feature && !tier.includedFeatures.includes(slug)) {
      items.push({
        type: "feature",
        slug: feature.slug,
        name: feature.name,
        price: feature.price,
      });
    }
  }

  return items;
}

/**
 * Hook for tier comparison and recommendations
 */
export function useTierRecommendation(
  selectedFeatures: string[],
  tiers: PricingTier[]
) {
  const recommendedTier = useMemo(() => {
    return getRecommendedTier(selectedFeatures, tiers);
  }, [selectedFeatures, tiers]);

  const tierComparison = useMemo(() => {
    return tiers.map((tier) => {
      const includedCount = selectedFeatures.filter((f) =>
        tier.includedFeatures.includes(f)
      ).length;
      const addonCount = selectedFeatures.filter(
        (f) => !tier.includedFeatures.includes(f)
      ).length;

      return {
        tier,
        includedCount,
        addonCount,
        isRecommended: tier.slug === recommendedTier?.slug,
      };
    });
  }, [selectedFeatures, tiers, recommendedTier]);

  return {
    recommendedTier,
    tierComparison,
  };
}

/**
 * Hook for bundle suggestions
 */
export function useBundleSuggestions(
  selectedFeatures: string[],
  availableFeatures: Feature[],
  bundles: BundleDiscount[]
) {
  const suggestions = useMemo(() => {
    return getSuggestedBundles(selectedFeatures, availableFeatures, bundles);
  }, [selectedFeatures, availableFeatures, bundles]);

  return suggestions;
}

/**
 * Hook for fetching pricing tiers from the API
 */
export function usePricingTiers(initialTiers?: PricingTier[]) {
  const [tiers, setTiers] = useState<PricingTier[]>(initialTiers || []);
  const [loading, setLoading] = useState(!initialTiers);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialTiers) {
      fetchTiers();
    }
  }, [initialTiers]);

  const fetchTiers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await studioApi.getPricingTiers();
      setTiers(data.items || []);
    } catch (err) {
      if (err instanceof StudioApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pricing tiers");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    tiers,
    loading,
    error,
    refetch: fetchTiers,
  };
}

/**
 * Hook for server-side price calculation
 * Uses the backend API to calculate price with bundle discounts and coupons
 */
export function useServerPriceCalculation() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(
    async (
      tier: string,
      selectedFeatures: string[],
      options?: { templateId?: string; couponCode?: string }
    ) => {
      setCalculating(true);
      setError(null);

      try {
        const result = await studioApi.calculatePrice({
          tier,
          selectedFeatures,
          templateId: options?.templateId,
          couponCode: options?.couponCode,
        });
        return result;
      } catch (err) {
        if (err instanceof StudioApiError) {
          setError(err.message);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to calculate price"
          );
        }
        return null;
      } finally {
        setCalculating(false);
      }
    },
    []
  );

  return {
    calculatePrice,
    calculating,
    error,
  };
}
