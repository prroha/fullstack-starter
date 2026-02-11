"use client";

/**
 * Conditional Render Component
 *
 * A flexible component for conditionally rendering content based on feature flags,
 * user permissions, or any boolean conditions.
 *
 * This component is included in downloaded apps and can be used by developers
 * to conditionally enable/disable features in their own applications.
 */

import { ReactNode } from "react";

interface ConditionalRenderProps {
  /**
   * Condition(s) that must be met to render children.
   * Can be a single boolean, an array of booleans, or function(s) returning booleans.
   */
  when: boolean | boolean[] | (() => boolean) | (() => boolean)[];
  /**
   * How to evaluate multiple conditions:
   * - "all": All conditions must be true (AND)
   * - "any": At least one condition must be true (OR)
   * Default: "all"
   */
  mode?: "all" | "any";
  /**
   * Content to show when condition(s) are not met
   */
  fallback?: ReactNode;
  /**
   * Content to show when condition(s) are met
   */
  children: ReactNode;
}

/**
 * Evaluates a condition, handling both boolean values and functions
 */
function evaluateCondition(condition: boolean | (() => boolean)): boolean {
  return typeof condition === "function" ? condition() : condition;
}

/**
 * Conditionally render content based on one or more conditions.
 *
 * @example
 * // Single condition
 * <ConditionalRender when={isLoggedIn}>
 *   <Dashboard />
 * </ConditionalRender>
 *
 * @example
 * // Multiple conditions with AND logic (default)
 * <ConditionalRender when={[isLoggedIn, hasPermission]} mode="all">
 *   <AdminPanel />
 * </ConditionalRender>
 *
 * @example
 * // Multiple conditions with OR logic
 * <ConditionalRender when={[isAdmin, isModerator]} mode="any">
 *   <ModTools />
 * </ConditionalRender>
 *
 * @example
 * // With fallback content
 * <ConditionalRender when={isPremium} fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </ConditionalRender>
 *
 * @example
 * // With function conditions (lazy evaluation)
 * <ConditionalRender when={() => checkExpensiveCondition()}>
 *   <ExpensiveComponent />
 * </ConditionalRender>
 */
export function ConditionalRender({
  when,
  mode = "all",
  fallback = null,
  children,
}: ConditionalRenderProps) {
  const conditions = Array.isArray(when) ? when : [when];

  const isEnabled =
    mode === "all"
      ? conditions.every(evaluateCondition)
      : conditions.some(evaluateCondition);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Renders children only when all conditions are met (AND logic)
 * Shorthand for <ConditionalRender mode="all" ... />
 */
export function ShowWhenAll({
  when,
  fallback = null,
  children,
}: Omit<ConditionalRenderProps, "mode">) {
  return (
    <ConditionalRender when={when} mode="all" fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Renders children when any condition is met (OR logic)
 * Shorthand for <ConditionalRender mode="any" ... />
 */
export function ShowWhenAny({
  when,
  fallback = null,
  children,
}: Omit<ConditionalRenderProps, "mode">) {
  return (
    <ConditionalRender when={when} mode="any" fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Renders children only when condition is false
 * Useful for showing content when something is NOT available
 */
export function HideWhen({
  when,
  children,
}: {
  when: boolean | (() => boolean);
  children: ReactNode;
}) {
  const shouldHide = evaluateCondition(when);
  return shouldHide ? null : <>{children}</>;
}
