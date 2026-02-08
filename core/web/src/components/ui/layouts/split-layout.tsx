"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type SplitRatio = "50/50" | "60/40" | "70/30" | "40/60" | "30/70" | "auto";
type GapSize = "none" | "sm" | "md" | "lg";
type MobileBreakpoint = "sm" | "md" | "lg";

interface SplitLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the left panel */
  left: React.ReactNode;
  /** Content for the right panel */
  right: React.ReactNode;
  /** Split ratio between panels */
  ratio?: SplitRatio;
  /** Gap size between panels */
  gap?: GapSize;
  /** Show vertical divider line between panels */
  divider?: boolean;
  /** Swap left/right order on mobile */
  reverseOnMobile?: boolean;
  /** Stack panels vertically on mobile */
  stackOnMobile?: boolean;
  /** Breakpoint at which to apply mobile layout */
  mobileBreakpoint?: MobileBreakpoint;
  /** Minimum height of the layout */
  minHeight?: string;
  /** Additional classes for the left panel */
  leftClassName?: string;
  /** Additional classes for the right panel */
  rightClassName?: string;
}

interface ResizableSplitLayoutProps extends Omit<SplitLayoutProps, "ratio"> {
  /** Initial split ratio (percentage for left panel, 0-100) */
  initialRatio?: number;
  /** Minimum width for left panel (in pixels) */
  minLeftWidth?: number;
  /** Minimum width for right panel (in pixels) */
  minRightWidth?: number;
  /** Callback when ratio changes */
  onRatioChange?: (ratio: number) => void;
}

// =====================================================
// Constants
// =====================================================

const ratioClasses: Record<SplitRatio, { left: string; right: string }> = {
  "50/50": { left: "flex-1", right: "flex-1" },
  "60/40": { left: "flex-[3]", right: "flex-[2]" },
  "70/30": { left: "flex-[7]", right: "flex-[3]" },
  "40/60": { left: "flex-[2]", right: "flex-[3]" },
  "30/70": { left: "flex-[3]", right: "flex-[7]" },
  auto: { left: "flex-shrink-0", right: "flex-1" },
};

// Content-first spacing: tighter gaps
const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  sm: "gap-2",   // 8px (unchanged)
  md: "gap-3",   // 12px (was 16px)
  lg: "gap-6",   // 24px (was 32px)
};

const mobileBreakpointClasses: Record<MobileBreakpoint, { stack: string; row: string }> = {
  sm: { stack: "flex-col sm:flex-row", row: "flex-row" },
  md: { stack: "flex-col md:flex-row", row: "flex-row" },
  lg: { stack: "flex-col lg:flex-row", row: "flex-row" },
};

const reverseClasses: Record<MobileBreakpoint, string> = {
  sm: "flex-col-reverse sm:flex-row",
  md: "flex-col-reverse md:flex-row",
  lg: "flex-col-reverse lg:flex-row",
};

// =====================================================
// SplitLayout Component
// =====================================================

function SplitLayout({
  className,
  left,
  right,
  ratio = "50/50",
  gap = "sm", // Content-first: tighter default gap
  divider = false,
  reverseOnMobile = false,
  stackOnMobile = true,
  mobileBreakpoint = "md",
  minHeight,
  leftClassName,
  rightClassName,
  style,
  ...props
}: SplitLayoutProps) {
  const getFlexDirection = () => {
    if (!stackOnMobile) {
      return mobileBreakpointClasses[mobileBreakpoint].row;
    }
    if (reverseOnMobile) {
      return reverseClasses[mobileBreakpoint];
    }
    return mobileBreakpointClasses[mobileBreakpoint].stack;
  };

  const getLeftPanelClasses = () => {
    if (stackOnMobile) {
      // On mobile when stacked, panels take full width
      const breakpointPrefix = mobileBreakpoint;
      return cn(
        "w-full",
        `${breakpointPrefix}:w-auto`,
        ratioClasses[ratio].left
      );
    }
    return ratioClasses[ratio].left;
  };

  const getRightPanelClasses = () => {
    if (stackOnMobile) {
      const breakpointPrefix = mobileBreakpoint;
      return cn(
        "w-full",
        `${breakpointPrefix}:w-auto`,
        ratioClasses[ratio].right
      );
    }
    return ratioClasses[ratio].right;
  };

  return (
    <div
      className={cn(
        "flex w-full",
        getFlexDirection(),
        gapClasses[gap],
        className
      )}
      style={{ minHeight, ...style }}
      {...props}
    >
      {/* Left Panel */}
      <div
        className={cn(
          "relative",
          getLeftPanelClasses(),
          leftClassName
        )}
      >
        {left}
      </div>

      {/* Divider */}
      {divider && (
        <div
          className={cn(
            "flex-shrink-0",
            stackOnMobile
              ? `hidden ${mobileBreakpoint}:block w-px bg-border self-stretch`
              : "w-px bg-border self-stretch"
          )}
          aria-hidden="true"
        />
      )}

      {/* Right Panel */}
      <div
        className={cn(
          "relative",
          getRightPanelClasses(),
          rightClassName
        )}
      >
        {right}
      </div>
    </div>
  );
}

// =====================================================
// ResizableSplitLayout Component
// =====================================================

function ResizableSplitLayout({
  className,
  left,
  right,
  initialRatio = 50,
  gap = "none",
  divider = true,
  reverseOnMobile = false,
  stackOnMobile = true,
  mobileBreakpoint = "md",
  minHeight,
  leftClassName,
  rightClassName,
  minLeftWidth = 200,
  minRightWidth = 200,
  onRatioChange,
  style,
  ...props
}: ResizableSplitLayoutProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const leftPanelRef = React.useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = React.useState(initialRatio);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Breakpoint values in pixels
  const breakpointValues: Record<MobileBreakpoint, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
  };

  // Check if we're at desktop breakpoint
  React.useEffect(() => {
    function checkBreakpoint() {
      setIsDesktop(window.innerWidth >= breakpointValues[mobileBreakpoint]);
    }

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, [mobileBreakpoint]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate new ratio
      let newRatio = (mouseX / containerWidth) * 100;

      // Apply constraints
      const minLeftRatio = (minLeftWidth / containerWidth) * 100;
      const maxLeftRatio = 100 - (minRightWidth / containerWidth) * 100;

      newRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio));
      newRatio = Math.round(newRatio * 10) / 10; // Round to 1 decimal

      setRatio(newRatio);
      onRatioChange?.(newRatio);
    },
    [isDragging, minLeftWidth, minRightWidth, onRatioChange]
  );

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle touch events for mobile
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const touchX = touch.clientX - containerRect.left;

      let newRatio = (touchX / containerWidth) * 100;
      const minLeftRatio = (minLeftWidth / containerWidth) * 100;
      const maxLeftRatio = 100 - (minRightWidth / containerWidth) * 100;

      newRatio = Math.max(minLeftRatio, Math.min(maxLeftRatio, newRatio));
      newRatio = Math.round(newRatio * 10) / 10;

      setRatio(newRatio);
      onRatioChange?.(newRatio);
    },
    [isDragging, minLeftWidth, minRightWidth, onRatioChange]
  );

  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const getFlexDirection = () => {
    if (!stackOnMobile) {
      return mobileBreakpointClasses[mobileBreakpoint].row;
    }
    if (reverseOnMobile) {
      return reverseClasses[mobileBreakpoint];
    }
    return mobileBreakpointClasses[mobileBreakpoint].stack;
  };

  // Calculate left panel styles based on breakpoint
  const getLeftPanelStyle = (): React.CSSProperties => {
    if (stackOnMobile && !isDesktop) {
      return {}; // Full width on mobile, controlled by CSS classes
    }
    return {
      width: `${ratio}%`,
      flexShrink: 0,
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex w-full",
        getFlexDirection(),
        gapClasses[gap],
        className
      )}
      style={{ minHeight, ...style }}
      {...props}
    >
      {/* Left Panel */}
      <div
        ref={leftPanelRef}
        className={cn(
          "relative overflow-hidden",
          stackOnMobile && `w-full ${mobileBreakpoint}:w-auto`,
          leftClassName
        )}
        style={getLeftPanelStyle()}
      >
        {left}
      </div>

      {/* Resizable Divider */}
      {divider && (
        <div
          className={cn(
            "flex-shrink-0 relative group",
            stackOnMobile
              ? `hidden ${mobileBreakpoint}:flex items-center justify-center w-1`
              : "flex items-center justify-center w-1",
            "cursor-col-resize hover:bg-primary/10 transition-colors",
            isDragging && "bg-primary/20"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={ratio}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              const newRatio = Math.max(
                (minLeftWidth / (containerRef.current?.offsetWidth || 1000)) * 100,
                ratio - 5
              );
              setRatio(newRatio);
              onRatioChange?.(newRatio);
            } else if (e.key === "ArrowRight") {
              const newRatio = Math.min(
                100 - (minRightWidth / (containerRef.current?.offsetWidth || 1000)) * 100,
                ratio + 5
              );
              setRatio(newRatio);
              onRatioChange?.(newRatio);
            }
          }}
        >
          {/* Visual divider line */}
          <div
            className={cn(
              "absolute inset-y-0 w-px bg-border",
              "group-hover:bg-primary/50 transition-colors",
              isDragging && "bg-primary"
            )}
          />
          {/* Drag handle indicator */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-1 h-8 rounded-full",
              "bg-muted-foreground/20 group-hover:bg-primary/50 transition-colors",
              isDragging && "bg-primary"
            )}
          />
        </div>
      )}

      {/* Right Panel */}
      <div
        className={cn(
          "relative flex-1 min-w-0 overflow-hidden",
          stackOnMobile && `w-full ${mobileBreakpoint}:w-auto`,
          rightClassName
        )}
      >
        {right}
      </div>
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export { SplitLayout, ResizableSplitLayout };
export type { SplitLayoutProps, ResizableSplitLayoutProps, SplitRatio, GapSize, MobileBreakpoint };
