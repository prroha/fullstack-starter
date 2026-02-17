"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Bell,
  AlertCircle,
  WifiOff,
  Inbox,
  FileQuestion,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

// =====================================================
// Empty State Types
// =====================================================

type EmptyStateVariant =
  | "noData"
  | "noResults"
  | "noNotifications"
  | "error"
  | "offline";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Descriptive text */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Predefined variant with built-in styling */
  variant?: EmptyStateVariant;
  /** Additional CSS classes */
  className?: string;
  /** Custom illustration component */
  illustration?: React.ReactNode;
}

// =====================================================
// Variant Configurations
// =====================================================

const variantConfigs: Record<
  EmptyStateVariant,
  {
    icon: LucideIcon;
    iconClassName: string;
    containerClassName: string;
  }
> = {
  noData: {
    icon: Inbox,
    iconClassName: "text-muted-foreground",
    containerClassName: "",
  },
  noResults: {
    icon: Search,
    iconClassName: "text-muted-foreground",
    containerClassName: "",
  },
  noNotifications: {
    icon: Bell,
    iconClassName: "text-muted-foreground",
    containerClassName: "",
  },
  error: {
    icon: AlertCircle,
    iconClassName: "text-destructive",
    containerClassName: "bg-destructive/5 border-destructive/20",
  },
  offline: {
    icon: WifiOff,
    iconClassName: "text-warning",
    containerClassName: "bg-warning/5 border-warning/20",
  },
};

// =====================================================
// Empty State Component
// =====================================================

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant,
  className,
  illustration,
}: EmptyStateProps) {
  const config = variant ? variantConfigs[variant] : null;
  const Icon = icon || config?.icon || Inbox;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-lg border border-border",
        "min-h-[200px] text-center",
        config?.containerClassName,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-4">{illustration}</div>
      ) : (
        <div
          className={cn(
            "w-16 h-16 mb-4 rounded-full flex items-center justify-center",
            "bg-muted dark:bg-muted/50"
          )}
        >
          <Icon
            className={cn("w-8 h-8", config?.iconClassName || "text-muted-foreground")}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "ghost"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Preset Empty States
// =====================================================

interface PresetEmptyStateProps {
  /** Primary action */
  action?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Custom search query for search empty states */
  searchQuery?: string;
}

/**
 * Empty state for user lists
 */
function EmptyUsers({
  action,
  secondaryAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="There are no users to display yet. When users sign up, they will appear here."
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

/**
 * Empty state for search results
 */
function EmptySearch({
  action,
  secondaryAction,
  className,
  searchQuery,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      variant="noResults"
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search or filters.`
          : "We couldn't find what you're looking for. Try adjusting your search or filters."
      }
      action={
        action || {
          label: "Clear search",
          onClick: () => {},
          variant: "outline",
        }
      }
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

/**
 * Empty state for notifications
 */
function EmptyNotifications({
  action,
  secondaryAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Bell}
      variant="noNotifications"
      title="You're all caught up!"
      description="No new notifications right now. We'll let you know when something important happens."
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

/**
 * Generic empty state for lists
 */
function EmptyList({
  action,
  secondaryAction,
  className,
  title = "Nothing here yet",
  description = "This list is empty. Add some items to get started.",
}: PresetEmptyStateProps & { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={FolderOpen}
      variant="noData"
      title={title}
      description={description}
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

/**
 * Empty state for file/document lists
 */
function EmptyFiles({
  action,
  secondaryAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileQuestion}
      variant="noData"
      title="No files yet"
      description="Upload files to see them here. Drag and drop or click to browse."
      action={
        action || {
          label: "Upload files",
          onClick: () => {},
        }
      }
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

/**
 * Empty state for offline/connection issues
 */
function OfflineState({
  action,
  className,
}: Omit<PresetEmptyStateProps, "secondaryAction">) {
  return (
    <EmptyState
      icon={WifiOff}
      variant="offline"
      title="No internet connection"
      description="Please check your connection and try again. Your changes will sync once you're back online."
      action={
        action || {
          label: "Try again",
          onClick: () => window.location.reload(),
          variant: "outline",
        }
      }
      className={className}
    />
  );
}

/**
 * Empty state for error scenarios
 */
function ErrorState({
  action,
  className,
  title = "Something went wrong",
  description = "We encountered an error loading this content. Please try again.",
}: Omit<PresetEmptyStateProps, "secondaryAction"> & {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      variant="error"
      title={title}
      description={description}
      action={
        action || {
          label: "Retry",
          onClick: () => window.location.reload(),
          variant: "outline",
        }
      }
      className={className}
    />
  );
}

// =====================================================
// Exports
// =====================================================

export {
  EmptyState,
  EmptyUsers,
  EmptySearch,
  EmptyNotifications,
  EmptyList,
  EmptyFiles,
  OfflineState,
  ErrorState,
};

export type { EmptyStateProps, EmptyStateAction, EmptyStateVariant };
