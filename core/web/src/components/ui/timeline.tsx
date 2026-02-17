"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type TimelineStatus = "success" | "warning" | "error" | "info" | "default";

export type TimelineSize = "sm" | "md" | "lg";

export interface TimelineItemData {
  /** Unique identifier for the item */
  id: string;
  /** Title of the timeline item */
  title: string;
  /** Description or subtitle */
  description?: string;
  /** Timestamp or date string */
  timestamp?: string;
  /** Status color */
  status?: TimelineStatus;
  /** Custom icon element */
  icon?: React.ReactNode;
  /** Custom content below the description */
  content?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Timeline items to display */
  items: TimelineItemData[];
  /** Alternating layout (items alternate left/right) */
  alternating?: boolean;
  /** Compact mode with reduced spacing */
  compact?: boolean;
  /** Size variant */
  size?: TimelineSize;
}

export interface TimelineItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** Title of the timeline item */
  title: string;
  /** Description or subtitle */
  description?: string;
  /** Timestamp or date string */
  timestamp?: string;
  /** Status color */
  status?: TimelineStatus;
  /** Custom icon element */
  icon?: React.ReactNode;
  /** Custom content below the description */
  content?: React.ReactNode;
  /** Whether this is the last item (hides connector) */
  isLast?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Size variant */
  size?: TimelineSize;
  /** Position for alternating layout */
  position?: "left" | "right";
}

// =====================================================
// Status Configuration
// =====================================================

const statusConfig: Record<
  TimelineStatus,
  { bgClass: string; borderClass: string; iconClass: string }
> = {
  success: {
    bgClass: "bg-success/10",
    borderClass: "border-success",
    iconClass: "text-success",
  },
  warning: {
    bgClass: "bg-warning/10",
    borderClass: "border-warning",
    iconClass: "text-warning",
  },
  error: {
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive",
    iconClass: "text-destructive",
  },
  info: {
    bgClass: "bg-primary/10",
    borderClass: "border-primary",
    iconClass: "text-primary",
  },
  default: {
    bgClass: "bg-muted",
    borderClass: "border-border",
    iconClass: "text-muted-foreground",
  },
};

const sizeConfig: Record<
  TimelineSize,
  { icon: string; spacing: string; text: string; timestamp: string }
> = {
  sm: {
    icon: "h-6 w-6",
    spacing: "gap-2 pb-4",
    text: "text-sm",
    timestamp: "text-xs",
  },
  md: {
    icon: "h-8 w-8",
    spacing: "gap-3 pb-6",
    text: "text-base",
    timestamp: "text-sm",
  },
  lg: {
    icon: "h-10 w-10",
    spacing: "gap-4 pb-8",
    text: "text-lg",
    timestamp: "text-base",
  },
};

// =====================================================
// Default Icon Component
// =====================================================

function DefaultIcon({ status, size }: { status: TimelineStatus; size: TimelineSize }) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size].icon;

  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center",
        sizeClass,
        config.bgClass,
        config.borderClass
      )}
    >
      <div
        className={cn(
          "rounded-full",
          size === "sm" ? "h-2 w-2" : size === "md" ? "h-2.5 w-2.5" : "h-3 w-3",
          status === "success" && "bg-success",
          status === "warning" && "bg-warning",
          status === "error" && "bg-destructive",
          status === "info" && "bg-primary",
          status === "default" && "bg-muted-foreground"
        )}
      />
    </div>
  );
}

// =====================================================
// Timeline Item Component
// =====================================================

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      className,
      title,
      description,
      timestamp,
      status = "default",
      icon,
      content,
      isLast = false,
      compact = false,
      size = "md",
      position,
      ...props
    },
    ref
  ) => {
    const sizeStyles = sizeConfig[size];
    const statusStyles = statusConfig[status];

    const iconElement = icon ? (
      <div
        className={cn(
          "rounded-full border-2 flex items-center justify-center flex-shrink-0",
          sizeStyles.icon,
          statusStyles.bgClass,
          statusStyles.borderClass,
          statusStyles.iconClass
        )}
      >
        {icon}
      </div>
    ) : (
      <DefaultIcon status={status} size={size} />
    );

    const contentElement = (
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className={cn("font-medium text-foreground", sizeStyles.text)}>
              {title}
            </h4>
            {description && (
              <p className={cn("text-muted-foreground mt-0.5", sizeStyles.timestamp)}>
                {description}
              </p>
            )}
          </div>
          {timestamp && (
            <span
              className={cn(
                "text-muted-foreground whitespace-nowrap flex-shrink-0",
                sizeStyles.timestamp
              )}
            >
              {timestamp}
            </span>
          )}
        </div>
        {content && <div className="mt-2">{content}</div>}
      </div>
    );

    // Alternating layout
    if (position === "right") {
      return (
        <div
          ref={ref}
          className={cn("flex", compact ? "pb-3" : sizeStyles.spacing, className)}
          {...props}
        >
          <div className="flex-1 text-right pr-4">{contentElement}</div>
          <div className="relative flex flex-col items-center">
            {iconElement}
            {!isLast && (
              <div className="absolute top-full w-0.5 h-full bg-border" />
            )}
          </div>
          <div className="flex-1" />
        </div>
      );
    }

    if (position === "left") {
      return (
        <div
          ref={ref}
          className={cn("flex", compact ? "pb-3" : sizeStyles.spacing, className)}
          {...props}
        >
          <div className="flex-1" />
          <div className="relative flex flex-col items-center">
            {iconElement}
            {!isLast && (
              <div className="absolute top-full w-0.5 h-full bg-border" />
            )}
          </div>
          <div className="flex-1 pl-4">{contentElement}</div>
        </div>
      );
    }

    // Default layout (left-aligned)
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          compact ? "pb-3 gap-2" : sizeStyles.spacing,
          className
        )}
        {...props}
      >
        <div className="relative flex flex-col items-center">
          {iconElement}
          {!isLast && (
            <div
              className={cn(
                "absolute w-0.5 bg-border",
                size === "sm" ? "top-6" : size === "md" ? "top-8" : "top-10",
                "h-full"
              )}
            />
          )}
        </div>
        {contentElement}
      </div>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

// =====================================================
// Timeline Component
// =====================================================

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      className,
      items,
      alternating = false,
      compact = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        role="list"
        {...props}
      >
        {items.map((item, index) => (
          <TimelineItem
            key={item.id}
            title={item.title}
            description={item.description}
            timestamp={item.timestamp}
            status={item.status}
            icon={item.icon}
            content={item.content}
            isLast={index === items.length - 1}
            compact={compact}
            size={size}
            position={alternating ? (index % 2 === 0 ? "left" : "right") : undefined}
            role="listitem"
          />
        ))}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

// =====================================================
// Exports
// =====================================================

export { Timeline, TimelineItem };
