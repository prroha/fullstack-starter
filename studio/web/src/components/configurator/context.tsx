"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Feature, Module, PricingTier, PriceCalculation, Template } from "@studio/shared";
import type { ResolvedSelection } from "@/lib/features";
import { DependencyResolver } from "@/lib/features";
import { PricingCalculator } from "@/lib/pricing";

// ============================================================================
// Types
// ============================================================================

interface ConfiguratorState {
  // Data
  features: Feature[];
  modules: Module[];
  tiers: PricingTier[];
  templates: Template[];

  // Selection
  selectedTier: string;
  selectedFeatures: string[];
  selectedTemplate: string | null;

  // Resolved state
  resolvedFeatures: ResolvedSelection | null;
  pricing: PriceCalculation | null;

  // UI state
  loading: boolean;
  error: string | null;
}

type ConfiguratorAction =
  | { type: "SET_DATA"; payload: { features: Feature[]; modules: Module[]; tiers: PricingTier[]; templates: Template[] } }
  | { type: "SET_TIER"; payload: string }
  | { type: "SELECT_FEATURE"; payload: string }
  | { type: "DESELECT_FEATURE"; payload: string }
  | { type: "TOGGLE_FEATURE"; payload: string }
  | { type: "SET_FEATURES"; payload: string[] }
  | { type: "SET_TEMPLATE"; payload: string | null }
  | { type: "SET_RESOLVED"; payload: ResolvedSelection }
  | { type: "SET_PRICING"; payload: PriceCalculation | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };

interface ConfiguratorContextValue extends ConfiguratorState {
  // Actions
  setTier: (tierSlug: string) => void;
  selectFeature: (featureSlug: string) => void;
  deselectFeature: (featureSlug: string) => void;
  toggleFeature: (featureSlug: string) => void;
  setFeatures: (featureSlugs: string[]) => void;
  setTemplate: (templateSlug: string | null) => void;
  reset: () => void;

  // Computed
  isFeatureSelected: (featureSlug: string) => boolean;
  isFeatureIncludedInTier: (featureSlug: string) => boolean;
  isFeatureAutoSelected: (featureSlug: string) => boolean;
  getFeatureDependencies: (featureSlug: string) => string[];
  getFeatureConflicts: (featureSlug: string) => string[];
  getTierIncludedFeatures: () => string[];
  getCurrentTier: () => PricingTier | undefined;
  getAddOnCount: () => number;
  formatPrice: (amountInCents: number) => string;
}

// ============================================================================
// Context
// ============================================================================

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

// ============================================================================
// Reducer
// ============================================================================

const initialState: ConfiguratorState = {
  features: [],
  modules: [],
  tiers: [],
  templates: [],
  selectedTier: "starter",
  selectedFeatures: [],
  selectedTemplate: null,
  resolvedFeatures: null,
  pricing: null,
  loading: true,
  error: null,
};

function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction
): ConfiguratorState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        ...action.payload,
        loading: false,
      };

    case "SET_TIER":
      return {
        ...state,
        selectedTier: action.payload,
        // Clear features that are now included in the new tier
        selectedFeatures: state.selectedFeatures.filter((f) => {
          const tier = state.tiers.find((t) => t.slug === action.payload);
          return tier ? !tier.includedFeatures.includes(f) : true;
        }),
      };

    case "SELECT_FEATURE":
      if (state.selectedFeatures.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedFeatures: [...state.selectedFeatures, action.payload],
      };

    case "DESELECT_FEATURE":
      return {
        ...state,
        selectedFeatures: state.selectedFeatures.filter(
          (f) => f !== action.payload
        ),
      };

    case "TOGGLE_FEATURE":
      return {
        ...state,
        selectedFeatures: state.selectedFeatures.includes(action.payload)
          ? state.selectedFeatures.filter((f) => f !== action.payload)
          : [...state.selectedFeatures, action.payload],
      };

    case "SET_FEATURES":
      return {
        ...state,
        selectedFeatures: action.payload,
      };

    case "SET_TEMPLATE":
      return {
        ...state,
        selectedTemplate: action.payload,
      };

    case "SET_RESOLVED":
      return {
        ...state,
        resolvedFeatures: action.payload,
      };

    case "SET_PRICING":
      return {
        ...state,
        pricing: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "RESET":
      return {
        ...initialState,
        features: state.features,
        modules: state.modules,
        tiers: state.tiers,
        templates: state.templates,
        loading: false,
      };

    default:
      return state;
  }
}

// ============================================================================
// Provider
// ============================================================================

interface ConfiguratorProviderProps {
  children: ReactNode;
  initialData?: {
    features: Feature[];
    modules: Module[];
    tiers: PricingTier[];
    templates: Template[];
  };
}

export function ConfiguratorProvider({
  children,
  initialData,
}: ConfiguratorProviderProps) {
  const [state, dispatch] = useReducer(
    configuratorReducer,
    initialData
      ? {
          ...initialState,
          ...initialData,
          loading: false,
        }
      : initialState
  );

  // Create resolver and calculator
  const resolver = new DependencyResolver(state.features);
  const calculator = new PricingCalculator(state.features, state.tiers, []);

  // Fetch data if not provided
  useEffect(() => {
    if (!initialData && state.features.length === 0) {
      fetchData();
    }
  }, [initialData, state.features.length]);

  // Resolve features and calculate pricing when selection changes
  useEffect(() => {
    if (state.features.length === 0 || state.tiers.length === 0) return;

    const currentTier = state.tiers.find((t) => t.slug === state.selectedTier);
    if (!currentTier) return;

    // Resolve dependencies
    const resolved = resolver.resolveSelection(
      state.selectedFeatures,
      currentTier.includedFeatures
    );
    dispatch({ type: "SET_RESOLVED", payload: resolved });

    // Calculate pricing
    try {
      const pricing = calculator.calculate({
        tier: state.selectedTier,
        selectedFeatures: resolved.selectedFeatures,
      });
      dispatch({ type: "SET_PRICING", payload: pricing });
    } catch (err) {
      console.error("Pricing calculation error:", err);
    }
  }, [
    state.selectedTier,
    state.selectedFeatures,
    state.features,
    state.tiers,
    resolver,
    calculator,
  ]);

  const fetchData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const [featuresRes, tiersRes, templatesRes] = await Promise.all([
        fetch("/api/features"),
        fetch("/api/pricing/tiers"),
        fetch("/api/templates"),
      ]);

      if (!featuresRes.ok || !tiersRes.ok || !templatesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const featuresData = await featuresRes.json();
      const tiersData = await tiersRes.json();
      const templatesData = await templatesRes.json();

      dispatch({
        type: "SET_DATA",
        payload: {
          features: featuresData.data?.items || [],
          modules: featuresData.data?.modules || [],
          tiers: tiersData.data?.items || [],
          templates: templatesData.data?.items || [],
        },
      });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Failed to load data",
      });
    }
  };

  // ============================================================================
  // Actions
  // ============================================================================

  const setTier = useCallback((tierSlug: string) => {
    dispatch({ type: "SET_TIER", payload: tierSlug });
  }, []);

  const selectFeature = useCallback((featureSlug: string) => {
    dispatch({ type: "SELECT_FEATURE", payload: featureSlug });
  }, []);

  const deselectFeature = useCallback((featureSlug: string) => {
    dispatch({ type: "DESELECT_FEATURE", payload: featureSlug });
  }, []);

  const toggleFeature = useCallback((featureSlug: string) => {
    dispatch({ type: "TOGGLE_FEATURE", payload: featureSlug });
  }, []);

  const setFeatures = useCallback((featureSlugs: string[]) => {
    dispatch({ type: "SET_FEATURES", payload: featureSlugs });
  }, []);

  const setTemplate = useCallback((templateSlug: string | null) => {
    dispatch({ type: "SET_TEMPLATE", payload: templateSlug });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ============================================================================
  // Computed
  // ============================================================================

  const isFeatureSelected = useCallback(
    (featureSlug: string) => {
      return (
        state.resolvedFeatures?.selectedFeatures.includes(featureSlug) ?? false
      );
    },
    [state.resolvedFeatures]
  );

  const isFeatureIncludedInTier = useCallback(
    (featureSlug: string) => {
      const tier = state.tiers.find((t) => t.slug === state.selectedTier);
      return tier?.includedFeatures.includes(featureSlug) ?? false;
    },
    [state.tiers, state.selectedTier]
  );

  const isFeatureAutoSelected = useCallback(
    (featureSlug: string) => {
      return state.resolvedFeatures?.autoSelected.includes(featureSlug) ?? false;
    },
    [state.resolvedFeatures]
  );

  const getFeatureDependencies = useCallback(
    (featureSlug: string) => {
      return resolver.getDependencies(featureSlug);
    },
    [resolver]
  );

  const getFeatureConflicts = useCallback(
    (featureSlug: string) => {
      return resolver.getConflicts(featureSlug);
    },
    [resolver]
  );

  const getTierIncludedFeatures = useCallback(() => {
    const tier = state.tiers.find((t) => t.slug === state.selectedTier);
    return tier?.includedFeatures ?? [];
  }, [state.tiers, state.selectedTier]);

  const getCurrentTier = useCallback(() => {
    return state.tiers.find((t) => t.slug === state.selectedTier);
  }, [state.tiers, state.selectedTier]);

  const getAddOnCount = useCallback(() => {
    return state.selectedFeatures.length;
  }, [state.selectedFeatures]);

  const formatPrice = useCallback((amountInCents: number) => {
    return PricingCalculator.formatPrice(amountInCents);
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ConfiguratorContextValue = {
    ...state,
    setTier,
    selectFeature,
    deselectFeature,
    toggleFeature,
    setFeatures,
    setTemplate,
    reset,
    isFeatureSelected,
    isFeatureIncludedInTier,
    isFeatureAutoSelected,
    getFeatureDependencies,
    getFeatureConflicts,
    getTierIncludedFeatures,
    getCurrentTier,
    getAddOnCount,
    formatPrice,
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error("useConfigurator must be used within ConfiguratorProvider");
  }
  return context;
}
