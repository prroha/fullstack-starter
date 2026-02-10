"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Feature, Module } from "@studio/shared";
import type {
  ClientFeature,
  ClientModule,
  ResolvedSelection,
  FeatureFilterOptions,
} from "./types";
import { FeatureRegistry, getFeatureRegistry, initializeRegistry } from "./registry";
import { DependencyResolver } from "./dependencies";
import { studioApi, StudioApiError } from "../api/studio-client";

/**
 * Hook for accessing and managing features
 */
export function useFeatures(initialFeatures?: Feature[], initialModules?: Module[]) {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures || []);
  const [modules, setModules] = useState<Module[]>(initialModules || []);
  const [loading, setLoading] = useState(!initialFeatures);
  const [error, setError] = useState<string | null>(null);

  const registry = useMemo(() => {
    if (features.length > 0 || modules.length > 0) {
      return initializeRegistry(features, modules);
    }
    return getFeatureRegistry();
  }, [features, modules]);

  // Fetch features if not provided
  useEffect(() => {
    if (!initialFeatures) {
      fetchFeatures();
    }
  }, [initialFeatures]);

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await studioApi.getFeatures();
      setFeatures(data.items || []);
      setModules(data.modules || []);
    } catch (err) {
      if (err instanceof StudioApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load features");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterFeatures = useCallback(
    (options: FeatureFilterOptions) => {
      return registry.filterFeatures(options);
    },
    [registry]
  );

  const searchFeatures = useCallback(
    (query: string) => {
      return registry.searchFeatures(query);
    },
    [registry]
  );

  return {
    features,
    modules,
    registry,
    loading,
    error,
    refetch: fetchFeatures,
    filterFeatures,
    searchFeatures,
    categories: registry.getCategories(),
    featureCount: registry.getFeatureCount(),
    moduleCount: registry.getModuleCount(),
  };
}

/**
 * Hook for managing modules with features
 */
export function useModules(
  features: Feature[],
  modules: Module[],
  selectedFeatures: string[] = [],
  tierIncluded: string[] = []
) {
  const clientModules = useMemo(() => {
    const featuresByModule = new Map<string, Feature[]>();
    const selectedSet = new Set([...selectedFeatures, ...tierIncluded]);

    // Group features by module
    for (const feature of features) {
      const moduleId = feature.moduleId;
      if (!featuresByModule.has(moduleId)) {
        featuresByModule.set(moduleId, []);
      }
      featuresByModule.get(moduleId)!.push(feature);
    }

    // Build client modules
    return modules.map((module): ClientModule => {
      const moduleFeatures = featuresByModule.get(module.id) || [];

      const clientFeatures: ClientFeature[] = moduleFeatures.map((feature) => {
        const isSelected = selectedSet.has(feature.slug);
        const isIncludedInTier = tierIncluded.includes(feature.slug);

        return {
          ...feature,
          isSelected,
          isIncludedInTier,
          isAutoSelected: false, // Will be set by resolver
          isLocked: isIncludedInTier,
          lockReason: isIncludedInTier ? "Included in tier" : undefined,
          dependents: [],
          conflictsWith: [],
          isAvailableInTier: true,
          effectivePrice: isIncludedInTier ? 0 : feature.price,
        };
      });

      const selectedCount = clientFeatures.filter((f) => f.isSelected).length;
      const selectedTotal = clientFeatures
        .filter((f) => f.isSelected && !f.isIncludedInTier)
        .reduce((sum, f) => sum + f.price, 0);

      return {
        ...module,
        features: clientFeatures,
        selectedCount,
        selectedTotal,
      };
    });
  }, [features, modules, selectedFeatures, tierIncluded]);

  return clientModules;
}

/**
 * Hook for feature selection with dependency resolution
 */
export function useFeatureSelection(
  features: Feature[],
  tierIncluded: string[] = []
) {
  const [userSelected, setUserSelected] = useState<string[]>([]);
  const [resolved, setResolved] = useState<ResolvedSelection | null>(null);

  const resolver = useMemo(() => {
    return new DependencyResolver(features);
  }, [features]);

  // Resolve selection whenever user selection or tier changes
  useEffect(() => {
    const result = resolver.resolveSelection(userSelected, tierIncluded);
    setResolved(result);
  }, [userSelected, tierIncluded, resolver]);

  const selectFeature = useCallback(
    (slug: string) => {
      // Check if can select
      const canSelectResult = resolver.canSelect(slug, [
        ...userSelected,
        ...tierIncluded,
      ]);

      if (!canSelectResult.canSelect) {
        return { success: false, reason: canSelectResult.reason };
      }

      setUserSelected((prev) => {
        if (prev.includes(slug)) return prev;
        return [...prev, slug];
      });

      return { success: true };
    },
    [resolver, userSelected, tierIncluded]
  );

  const deselectFeature = useCallback(
    (slug: string) => {
      // Check if can deselect
      const canDeselectResult = resolver.canDeselect(slug, userSelected);

      if (!canDeselectResult.canDeselect) {
        return { success: false, reason: canDeselectResult.reason };
      }

      // Get cascade deselections
      const cascade = resolver.getCascadeDeselect(slug, userSelected);

      setUserSelected((prev) => {
        return prev.filter((s) => s !== slug && !cascade.includes(s));
      });

      return { success: true, cascaded: cascade };
    },
    [resolver, userSelected]
  );

  const toggleFeature = useCallback(
    (slug: string) => {
      if (userSelected.includes(slug)) {
        return deselectFeature(slug);
      }
      return selectFeature(slug);
    },
    [userSelected, selectFeature, deselectFeature]
  );

  const setFeatures = useCallback((slugs: string[]) => {
    setUserSelected(slugs);
  }, []);

  const clearSelection = useCallback(() => {
    setUserSelected([]);
  }, []);

  const getDependencies = useCallback(
    (slug: string) => resolver.getDependencies(slug),
    [resolver]
  );

  const getDependents = useCallback(
    (slug: string) => resolver.getDependents(slug),
    [resolver]
  );

  const getConflicts = useCallback(
    (slug: string) => resolver.getConflicts(slug),
    [resolver]
  );

  return {
    // Selection state
    userSelected,
    resolved,
    allSelected: resolved?.selectedFeatures || [],
    autoSelected: resolved?.autoSelected || [],
    conflicts: resolved?.conflicts || [],
    isValid: resolved?.isValid ?? true,

    // Actions
    selectFeature,
    deselectFeature,
    toggleFeature,
    setFeatures,
    clearSelection,

    // Utilities
    getDependencies,
    getDependents,
    getConflicts,
    isSelected: (slug: string) =>
      resolved?.selectedFeatures.includes(slug) ?? false,
    isAutoSelected: (slug: string) =>
      resolved?.autoSelected.includes(slug) ?? false,
  };
}
