"use client";

import type { ReactNode } from "react";
import { useFeatureFlags } from "./feature-flags";

// ============================================================================
// FeatureGate - Render content based on feature flag
// ============================================================================

interface FeatureGateProps {
  /** Feature slug to check */
  feature: string;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Optional fallback when feature is disabled */
  fallback?: ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const { hasFeature } = useFeatureFlags();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// TierGate - Render content based on tier level
// ============================================================================

interface TierGateProps {
  /** Minimum tier required */
  tier: string;
  /** Content to render when tier requirement is met */
  children: ReactNode;
  /** Optional fallback when tier requirement is not met */
  fallback?: ReactNode;
}

export function TierGate({ tier, children, fallback = null }: TierGateProps) {
  const { hasTier } = useFeatureFlags();

  if (hasTier(tier)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// MultiFeatureGate - Render content based on multiple features
// ============================================================================

interface MultiFeatureGateProps {
  /** Feature slugs to check */
  features: string[];
  /** Require all features (true) or any feature (false) */
  requireAll?: boolean;
  /** Content to render when condition is met */
  children: ReactNode;
  /** Optional fallback when condition is not met */
  fallback?: ReactNode;
}

export function MultiFeatureGate({
  features,
  requireAll = true,
  children,
  fallback = null,
}: MultiFeatureGateProps) {
  const { hasAllFeatures, hasAnyFeature } = useFeatureFlags();

  const isEnabled = requireAll
    ? hasAllFeatures(features)
    : hasAnyFeature(features);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// ============================================================================
// FeatureSwitch - Switch between components based on feature
// ============================================================================

interface FeatureSwitchCase {
  feature: string;
  render: ReactNode;
}

interface FeatureSwitchProps {
  /** Cases to check in order */
  cases: FeatureSwitchCase[];
  /** Default fallback if no case matches */
  default: ReactNode;
}

export function FeatureSwitch({
  cases,
  default: defaultCase,
}: FeatureSwitchProps) {
  const { hasFeature } = useFeatureFlags();

  for (const { feature, render } of cases) {
    if (hasFeature(feature)) {
      return <>{render}</>;
    }
  }

  return <>{defaultCase}</>;
}

// ============================================================================
// FeaturePlaceholder - Show placeholder for disabled features
// ============================================================================

interface FeaturePlaceholderProps {
  /** Feature slug */
  feature: string;
  /** Feature display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional tier required */
  tier?: string;
}

export function FeaturePlaceholder({
  feature,
  name,
  description,
  tier,
}: FeaturePlaceholderProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
      <div className="text-muted-foreground">
        <p className="font-medium">{name}</p>
        {description && <p className="text-sm mt-1">{description}</p>}
        {tier && (
          <p className="text-xs mt-2">
            Available in <span className="font-medium">{tier}</span> tier
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Utility component for conditional rendering with placeholder
// ============================================================================

interface FeatureWithPlaceholderProps {
  /** Feature slug */
  feature: string;
  /** Feature display name for placeholder */
  name: string;
  /** Content to render when enabled */
  children: ReactNode;
  /** Optional description for placeholder */
  description?: string;
  /** Optional tier for placeholder */
  tier?: string;
}

export function FeatureWithPlaceholder({
  feature,
  name,
  children,
  description,
  tier,
}: FeatureWithPlaceholderProps) {
  return (
    <FeatureGate
      feature={feature}
      fallback={
        <FeaturePlaceholder
          feature={feature}
          name={name}
          description={description}
          tier={tier}
        />
      }
    >
      {children}
    </FeatureGate>
  );
}
