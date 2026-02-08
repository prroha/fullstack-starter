import { cn } from "@/lib/utils";

// =====================================================
// Base Skeleton Component
// =====================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /** Animation type: pulse (default) or shimmer */
  animation?: "pulse" | "shimmer";
}

/**
 * Base skeleton component with configurable animation.
 * Supports both pulse and shimmer animations.
 */
export function Skeleton({
  className,
  animation = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        animation === "pulse" && "animate-pulse",
        animation === "shimmer" &&
          "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// =====================================================
// Text Skeletons
// =====================================================

interface SkeletonTextProps extends SkeletonProps {
  /** Number of lines to render */
  lines?: number;
  /** Gap between lines */
  gap?: "sm" | "md" | "lg";
  /** Whether the last line should be shorter */
  lastLineShort?: boolean;
}

/**
 * Skeleton for text content with support for multiple lines.
 */
export function SkeletonText({
  className,
  lines = 1,
  gap = "sm",
  lastLineShort = true,
  ...props
}: SkeletonTextProps) {
  const gapClass = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4",
  }[gap];

  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
  }

  return (
    <div className={cn(gapClass, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            lastLineShort && i === lines - 1 ? "w-3/4" : "w-full"
          )}
          {...props}
        />
      ))}
    </div>
  );
}

// =====================================================
// Avatar Skeletons
// =====================================================

interface SkeletonAvatarProps extends SkeletonProps {
  /** Avatar size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Avatar shape */
  shape?: "circle" | "square";
  /** Include name and subtitle placeholders */
  withText?: boolean;
}

/**
 * Skeleton for avatar with optional text placeholders.
 */
export function SkeletonAvatar({
  className,
  size = "md",
  shape = "circle",
  withText = false,
  ...props
}: SkeletonAvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size];

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";

  if (!withText) {
    return (
      <Skeleton className={cn(sizeClasses, shapeClass, className)} {...props} />
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <Skeleton className={cn(sizeClasses, shapeClass)} />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Alias for circle avatar skeleton.
 */
export function SkeletonCircle({
  className,
  ...props
}: Omit<SkeletonAvatarProps, "shape">) {
  return <SkeletonAvatar className={className} shape="circle" {...props} />;
}

// =====================================================
// Button Skeleton
// =====================================================

interface SkeletonButtonProps extends SkeletonProps {
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Button width */
  width?: "auto" | "full";
}

/**
 * Skeleton for button elements.
 */
export function SkeletonButton({
  className,
  size = "md",
  width = "auto",
  ...props
}: SkeletonButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  }[size];

  return (
    <Skeleton
      className={cn(
        sizeClasses,
        width === "full" && "w-full",
        "rounded-md",
        className
      )}
      {...props}
    />
  );
}

// =====================================================
// Image Skeleton
// =====================================================

interface SkeletonImageProps extends SkeletonProps {
  /** Aspect ratio */
  aspectRatio?: "square" | "video" | "portrait" | "wide";
}

/**
 * Skeleton for image placeholders with aspect ratio support.
 */
export function SkeletonImage({
  className,
  aspectRatio = "video",
  ...props
}: SkeletonImageProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[2/1]",
  }[aspectRatio];

  return (
    <Skeleton
      className={cn("w-full", aspectClasses, className)}
      {...props}
    />
  );
}

// =====================================================
// Card Skeleton
// =====================================================

interface SkeletonCardProps extends SkeletonProps {
  /** Card variant */
  variant?: "default" | "horizontal" | "compact";
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  textLines?: number;
}

/**
 * Skeleton for card components with configurable layout.
 */
export function SkeletonCard({
  className,
  variant = "default",
  showImage = true,
  textLines = 2,
  ...props
}: SkeletonCardProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("flex gap-4", className)} {...props}>
        {showImage && <Skeleton className="h-24 w-24 rounded-md flex-shrink-0" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <SkeletonText lines={textLines} className="w-full" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {showImage && <Skeleton className="h-32 w-full rounded-md" />}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {showImage && <Skeleton className="h-40 w-full rounded-md" />}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={textLines} />
      </div>
    </div>
  );
}

// =====================================================
// Table Skeleton
// =====================================================

interface SkeletonTableProps extends SkeletonProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Column width distribution */
  columnWidths?: string[];
}

/**
 * Skeleton for table components.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  columnWidths,
  className,
  ...props
}: SkeletonTableProps) {
  const getColumnWidth = (index: number) => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index];
    }
    return "flex-1";
  };

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-6", getColumnWidth(i))}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", getColumnWidth(colIndex))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// List Skeleton
// =====================================================

interface SkeletonListProps extends SkeletonProps {
  /** Number of items */
  items?: number;
  /** List item variant */
  variant?: "default" | "simple" | "detailed";
  /** Show separator between items */
  showSeparator?: boolean;
}

/**
 * Skeleton for list components.
 */
export function SkeletonList({
  items = 5,
  variant = "default",
  showSeparator = false,
  className,
  ...props
}: SkeletonListProps) {
  const renderItem = (index: number) => {
    if (variant === "simple") {
      return (
        <div className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      );
    }

    if (variant === "detailed") {
      return (
        <div className="flex items-start gap-4 p-4">
          <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    );
  };

  return (
    <div
      className={cn(
        showSeparator ? "divide-y" : "space-y-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i}>{renderItem(i)}</div>
      ))}
    </div>
  );
}

// =====================================================
// Page-Level Skeletons
// =====================================================

export function SkeletonPage({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("min-h-screen p-8 space-y-8", className)} {...props}>
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("min-h-screen", className)} {...props}>
      {/* Top Nav */}
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-4 gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r min-h-[calc(100vh-4rem)] p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 rounded-lg border space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Charts/Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="p-6 rounded-lg border space-y-4">
              <Skeleton className="h-6 w-32" />
              <SkeletonTable rows={4} columns={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6 max-w-md", className)} {...props}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonProfile({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {/* Header */}
      <div className="flex items-center gap-6">
        <SkeletonCircle size="xl" className="h-24 w-24" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-6 rounded-lg border">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 p-6 rounded-lg border">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonAuth({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md space-y-6 p-8 rounded-xl border bg-background">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <SkeletonForm />
        <div className="flex items-center gap-4">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
