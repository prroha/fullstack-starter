"use client";

/**
 * Preview Context
 *
 * Provides feature flag functionality for preview mode.
 * When in preview mode, only selected features are enabled.
 *
 * This file is located in _preview/ directory and is excluded from user downloads.
 * In preview mode (NEXT_PUBLIC_PREVIEW_MODE=true), this context is loaded dynamically.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { FeatureFlagsContext, FeatureFlagsContextValue } from "../feature-flags";

interface PreviewConfig {
  isPreview: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  enabledFeatures: string[];
  tier: string | null;
  templateSlug: string | null;
  error: string | null;
}

interface PreviewContextValue extends PreviewConfig {
  isFeatureEnabled: (featureSlug: string) => boolean;
  hasAnyFeature: (featureSlugs: string[]) => boolean;
  hasAllFeatures: (featureSlugs: string[]) => boolean;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

const STUDIO_API_URL = process.env.NEXT_PUBLIC_STUDIO_API_URL || "http://localhost:8001";

interface PreviewProviderProps {
  children: ReactNode;
}

export function PreviewProvider({ children }: PreviewProviderProps) {
  const [config, setConfig] = useState<PreviewConfig>({
    isPreview: false,
    isLoading: true,
    sessionToken: null,
    enabledFeatures: [],
    tier: null,
    templateSlug: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreviewConfig() {
      // Check for preview token in URL
      const params = new URLSearchParams(window.location.search);
      const previewToken = params.get("preview");

      if (!previewToken) {
        setConfig(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Clean the preview token from URL after reading
      window.history.replaceState({}, '', window.location.pathname);

      try {
        const response = await fetch(
          `${STUDIO_API_URL}/api/preview/sessions/${previewToken}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setConfig(prev => ({
            ...prev,
            isLoading: false,
            error: "Preview session not found or expired"
          }));
          return;
        }

        const data = await response.json();

        if (data.success) {
          setConfig({
            isPreview: true,
            isLoading: false,
            sessionToken: previewToken,
            enabledFeatures: data.data.selectedFeatures,
            tier: data.data.tier,
            templateSlug: data.data.templateSlug,
            error: null,
          });

          // Store in sessionStorage for persistence during navigation
          sessionStorage.setItem("previewToken", previewToken);
          sessionStorage.setItem("previewConfig", JSON.stringify(data.data));
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setConfig(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to load preview config"
        }));
      }
    }

    // Check sessionStorage first for existing preview
    const storedToken = sessionStorage.getItem("previewToken");
    const storedConfig = sessionStorage.getItem("previewConfig");

    if (storedToken && storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setConfig({
          isPreview: true,
          isLoading: false,
          sessionToken: storedToken,
          enabledFeatures: parsed.selectedFeatures,
          tier: parsed.tier,
          templateSlug: parsed.templateSlug,
          error: null,
        });
        return;
      } catch {
        // Invalid stored config, reload from API
      }
    }

    loadPreviewConfig();

    return () => controller.abort();
  }, []);

  const isFeatureEnabled = useCallback((featureSlug: string): boolean => {
    // When not in preview mode, all features are enabled
    if (!config.isPreview) return true;
    return config.enabledFeatures.includes(featureSlug);
  }, [config.isPreview, config.enabledFeatures]);

  const hasAnyFeature = useCallback((featureSlugs: string[]): boolean => {
    if (!config.isPreview) return true;
    return featureSlugs.some(slug => config.enabledFeatures.includes(slug));
  }, [config.isPreview, config.enabledFeatures]);

  const hasAllFeatures = useCallback((featureSlugs: string[]): boolean => {
    if (!config.isPreview) return true;
    return featureSlugs.every(slug => config.enabledFeatures.includes(slug));
  }, [config.isPreview, config.enabledFeatures]);

  const value: PreviewContextValue = useMemo(() => ({
    ...config,
    isFeatureEnabled,
    hasAnyFeature,
    hasAllFeatures,
  }), [config, isFeatureEnabled, hasAnyFeature, hasAllFeatures]);

  // Create a compatible value for FeatureFlagsContext
  const featureFlagsValue: FeatureFlagsContextValue = useMemo(() => ({
    isPreview: config.isPreview,
    isLoading: config.isLoading,
    isFeatureEnabled,
    hasAnyFeature,
    hasAllFeatures,
  }), [config.isPreview, config.isLoading, isFeatureEnabled, hasAnyFeature, hasAllFeatures]);

  return (
    <PreviewContext.Provider value={value}>
      <FeatureFlagsContext.Provider value={featureFlagsValue}>
        {children}
      </FeatureFlagsContext.Provider>
    </PreviewContext.Provider>
  );
}

/**
 * Hook to access preview context
 */
export function usePreview(): PreviewContextValue {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(featureSlug: string): boolean {
  const { isFeatureEnabled, isLoading } = usePreview();
  // Return true while loading to avoid flash
  if (isLoading) return true;
  return isFeatureEnabled(featureSlug);
}
