"use client";

import { cn } from "@/lib/utils";
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonTable,
  SkeletonText,
} from "@/components/ui/skeleton";

// =====================================================
// Composite Skeleton Components
// These match actual content layouts for smooth transitions
// =====================================================

interface CompositeSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// =====================================================
// User Card Skeleton
// =====================================================

interface SkeletonUserCardProps extends CompositeSkeletonProps {
  /** Card variant */
  variant?: "default" | "compact" | "detailed";
  /** Show action buttons */
  showActions?: boolean;
}

/**
 * Skeleton for user profile cards.
 * Matches the layout of actual user cards for smooth loading transitions.
 */
export function SkeletonUserCard({
  className,
  variant = "default",
  showActions = true,
  ...props
}: SkeletonUserCardProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-background",
          className
        )}
        {...props}
      >
        <SkeletonCircle size="sm" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-24" />
        </div>
        {showActions && <Skeleton className="h-6 w-6 rounded" />}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl border bg-background space-y-4",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-4">
          <SkeletonCircle size="xl" className="h-20 w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <SkeletonText lines={3} />
        {showActions && (
          <div className="flex gap-3 pt-2">
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-background",
        className
      )}
      {...props}
    >
      <SkeletonCircle size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      )}
    </div>
  );
}

// =====================================================
// Profile Page Skeleton
// =====================================================

interface SkeletonProfilePageProps extends CompositeSkeletonProps {
  /** Show cover photo */
  showCover?: boolean;
  /** Number of info sections */
  sections?: number;
}

/**
 * Skeleton for full profile pages.
 * Includes cover image, avatar, info sections, and activity feed.
 */
export function SkeletonProfilePage({
  className,
  showCover = true,
  sections = 2,
  ...props
}: SkeletonProfilePageProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Cover Photo */}
      {showCover && (
        <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
      )}

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start gap-6 px-4 md:px-0">
        <SkeletonCircle
          size="xl"
          className={cn(
            "h-28 w-28 md:h-36 md:w-36 border-4 border-background",
            showCover && "-mt-16 md:-mt-20"
          )}
        />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <SkeletonText lines={2} className="max-w-lg" />
          <div className="flex flex-wrap gap-3">
            <SkeletonButton size="md" />
            <SkeletonButton size="md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-6 px-4 md:px-0 py-4 border-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Sections */}
        <div className="lg:col-span-1 space-y-4">
          {Array.from({ length: sections }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl border bg-background space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl border bg-background space-y-4">
              <SkeletonAvatar size="md" withText />
              <SkeletonText lines={3} />
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Dashboard Skeleton (Enhanced)
// =====================================================

interface SkeletonDashboardEnhancedProps extends CompositeSkeletonProps {
  /** Number of stat cards */
  statsCount?: number;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Show chart placeholder */
  showChart?: boolean;
}

/**
 * Enhanced dashboard skeleton with configurable layout.
 */
export function SkeletonDashboardEnhanced({
  className,
  statsCount = 4,
  showSidebar = true,
  showChart = true,
  ...props
}: SkeletonDashboardEnhancedProps) {
  return (
    <div className={cn("min-h-screen bg-muted/30", className)} {...props}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-4">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <SkeletonCircle size="sm" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="hidden lg:block w-64 border-r bg-background min-h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t bg-background">
              <SkeletonAvatar size="sm" withText />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <SkeletonButton size="md" />
              <SkeletonButton size="md" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className={cn(
            "grid gap-4",
            `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(statsCount, 4)}`
          )}>
            {Array.from({ length: statsCount }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border bg-background space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-8 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts/Data Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {showChart && (
              <div className="xl:col-span-2 p-6 rounded-xl border bg-background space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            )}
            <div className={cn(
              "p-6 rounded-xl border bg-background space-y-4",
              !showChart && "xl:col-span-3"
            )}>
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonCircle size="sm" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-6 rounded-xl border bg-background space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <SkeletonButton size="md" />
              </div>
            </div>
            <SkeletonTable rows={5} columns={5} showHeader />
          </div>
        </main>
      </div>
    </div>
  );
}

// =====================================================
// Form Skeleton (Enhanced)
// =====================================================

interface SkeletonFormEnhancedProps extends CompositeSkeletonProps {
  /** Number of field groups */
  fieldGroups?: number;
  /** Show section headers */
  showSectionHeaders?: boolean;
  /** Form layout */
  layout?: "vertical" | "horizontal" | "grid";
}

/**
 * Enhanced form skeleton with configurable layout.
 */
export function SkeletonFormEnhanced({
  className,
  fieldGroups = 2,
  showSectionHeaders = true,
  layout = "vertical",
  ...props
}: SkeletonFormEnhancedProps) {
  const renderFieldGroup = (index: number, fieldsCount: number = 3) => (
    <div key={index} className="space-y-4">
      {showSectionHeaders && (
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      <div className={cn(
        layout === "grid" && "grid grid-cols-1 md:grid-cols-2 gap-6",
        layout === "vertical" && "space-y-4",
        layout === "horizontal" && "flex flex-wrap gap-6"
      )}>
        {Array.from({ length: fieldsCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "space-y-2",
              layout === "horizontal" && "flex-1 min-w-[200px]"
            )}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-8", className)} {...props}>
      {Array.from({ length: fieldGroups }).map((_, i) => renderFieldGroup(i))}

      {/* Textarea Field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <SkeletonButton size="md" />
        <SkeletonButton size="md" width="full" className="max-w-[120px]" />
      </div>
    </div>
  );
}

// =====================================================
// Product Card Skeleton
// =====================================================

interface SkeletonProductCardProps extends CompositeSkeletonProps {
  /** Card variant */
  variant?: "default" | "horizontal" | "minimal";
  /** Show quick actions */
  showActions?: boolean;
}

/**
 * Skeleton for e-commerce product cards.
 */
export function SkeletonProductCard({
  className,
  variant = "default",
  showActions = true,
  ...props
}: SkeletonProductCardProps) {
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "flex gap-4 p-4 rounded-xl border bg-background",
          className
        )}
        {...props}
      >
        <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-20" />
            {showActions && <SkeletonButton size="sm" />}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-xl border bg-background overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="relative">
        <Skeleton className="aspect-square w-full" />
        {showActions && (
          <div className="absolute top-2 right-2 space-y-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {showActions && <SkeletonButton size="sm" />}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Comment/Message Skeleton
// =====================================================

interface SkeletonCommentProps extends CompositeSkeletonProps {
  /** Show reply button */
  showReply?: boolean;
  /** Number of nested replies */
  replyCount?: number;
}

/**
 * Skeleton for comments or messages.
 */
export function SkeletonComment({
  className,
  showReply = true,
  replyCount = 0,
  ...props
}: SkeletonCommentProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex gap-3">
        <SkeletonCircle size="md" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <SkeletonText lines={2} />
          {showReply && (
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          )}
        </div>
      </div>
      {replyCount > 0 && (
        <div className="ml-12 space-y-4">
          {Array.from({ length: replyCount }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <SkeletonCircle size="sm" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <SkeletonText lines={1} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Notification Skeleton
// =====================================================

export function SkeletonNotification({
  className,
  ...props
}: CompositeSkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50",
        className
      )}
      {...props}
    >
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-2 w-2 rounded-full" />
    </div>
  );
}

// =====================================================
// Search Results Skeleton
// =====================================================

interface SkeletonSearchResultsProps extends CompositeSkeletonProps {
  /** Number of results */
  resultsCount?: number;
  /** Show filters sidebar */
  showFilters?: boolean;
}

/**
 * Skeleton for search results page.
 */
export function SkeletonSearchResults({
  className,
  resultsCount = 5,
  showFilters = true,
  ...props
}: SkeletonSearchResultsProps) {
  return (
    <div className={cn("flex gap-6", className)} {...props}>
      {showFilters && (
        <aside className="hidden lg:block w-64 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
      )}
      <div className="flex-1 space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        {/* Results List */}
        <div className="space-y-4">
          {Array.from({ length: resultsCount }).map((_, i) => (
            <SkeletonCard key={i} variant="horizontal" />
          ))}
        </div>
        {/* Pagination */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Admin Page Skeleton (Reusable for admin loading states)
// =====================================================

interface SkeletonAdminPageProps extends CompositeSkeletonProps {
  /** Page title width */
  titleWidth?: string;
  /** Page description width */
  descriptionWidth?: string;
  /** Header action buttons */
  headerActions?: number;
  /** Number of filter inputs */
  filterCount?: number;
  /** Show table content */
  showTable?: boolean;
  /** Table rows */
  tableRows?: number;
  /** Table columns */
  tableColumns?: number;
  /** Custom content instead of table */
  customContent?: React.ReactNode;
}

/**
 * Reusable skeleton for admin pages with configurable layout.
 * Eliminates duplication across admin loading screens.
 */
export function SkeletonAdminPage({
  className,
  titleWidth = "w-48",
  descriptionWidth = "w-64",
  headerActions = 1,
  filterCount = 3,
  showTable = true,
  tableRows = 8,
  tableColumns = 5,
  customContent,
  ...props
}: SkeletonAdminPageProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className={cn("h-10", titleWidth)} />
          <Skeleton className={cn("h-4", descriptionWidth)} />
        </div>
        {headerActions > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: headerActions }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      {filterCount > 0 && (
        <div className="flex gap-4">
          {Array.from({ length: filterCount }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-10", i === 0 ? "flex-1" : "w-32")}
            />
          ))}
        </div>
      )}

      {/* Content */}
      {customContent ?? (
        showTable && (
          <div className="rounded-lg border bg-card p-6">
            <SkeletonTable rows={tableRows} columns={tableColumns} />
          </div>
        )
      )}
    </div>
  );
}

// =====================================================
// Settings Page Skeleton
// =====================================================

interface SkeletonSettingsPageProps extends CompositeSkeletonProps {
  /** Number of setting sections */
  sections?: number;
  /** Fields per section */
  fieldsPerSection?: number;
}

/**
 * Skeleton for settings pages with multiple form sections.
 */
export function SkeletonSettingsPage({
  className,
  sections = 3,
  fieldsPerSection = 3,
  ...props
}: SkeletonSettingsPageProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Sections */}
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-4 pt-2">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
