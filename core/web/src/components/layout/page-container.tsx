import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Page Container Component
// =====================================================

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  centered?: boolean;
}

function PageContainer({
  className,
  children,
  size = "lg",
  padding = "md",
  centered = true,
  ...props
}: PageContainerProps) {
  const sizes = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const paddings = {
    none: "",
    sm: "px-4 py-4",
    md: "px-4 py-8 md:px-6",
    lg: "px-4 py-12 md:px-8",
  };

  return (
    <div
      className={cn(
        "w-full",
        sizes[size],
        paddings[padding],
        centered && "mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =====================================================
// Main Container Component (for main content area)
// =====================================================

interface MainContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  fullHeight?: boolean;
}

function MainContainer({
  className,
  children,
  fullHeight = false,
  ...props
}: MainContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 w-full",
        fullHeight && "min-h-screen",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

// =====================================================
// Content Container Component (centered content)
// =====================================================

interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ContentContainer({
  className,
  children,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn("container mx-auto px-4 md:px-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { PageContainer, MainContainer, ContentContainer };
export type { PageContainerProps, MainContainerProps, ContentContainerProps };
