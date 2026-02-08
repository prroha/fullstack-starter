import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Container Component
// =====================================================

type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type ContainerPadding = "none" | "sm" | "md" | "lg";
type ContainerElement = "div" | "section" | "main" | "article";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size?: ContainerSize;
  padding?: ContainerPadding;
  centered?: boolean;
  as?: ContainerElement;
}

function Container({
  className,
  children,
  size = "lg",
  padding = "md",
  centered = true,
  as: Component = "div",
  ...props
}: ContainerProps) {
  const sizes: Record<ContainerSize, string> = {
    sm: "max-w-screen-sm", // 640px
    md: "max-w-screen-md", // 768px
    lg: "max-w-screen-lg", // 1024px
    xl: "max-w-screen-xl", // 1280px
    "2xl": "max-w-screen-2xl", // 1536px
    full: "", // no max-width
  };

  // Content-first spacing: tighter horizontal padding
  const paddings: Record<ContainerPadding, string> = {
    none: "",
    sm: "px-3 sm:px-4",        // 12px / 16px (was 16px / 24px)
    md: "px-3 sm:px-4 lg:px-6", // 12px / 16px / 24px (was 16px / 24px / 32px)
    lg: "px-4 sm:px-6 lg:px-8", // 16px / 24px / 32px (was 16px / 32px / 48px)
  };

  return (
    <Component
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
    </Component>
  );
}

Container.displayName = "Container";

export { Container };
export type { ContainerProps, ContainerSize, ContainerPadding, ContainerElement };
