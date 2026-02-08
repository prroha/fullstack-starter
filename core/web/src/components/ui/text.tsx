import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Text Component
// =====================================================

export type TextVariant = "body" | "caption" | "overline" | "code";
export type TextSize = "xs" | "sm" | "md" | "lg";
export type TextColor = "default" | "muted" | "primary" | "destructive";
export type TextElement = "p" | "span" | "div";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Typography variant */
  variant?: TextVariant;
  /** Size variant */
  size?: TextSize;
  /** Color variant */
  color?: TextColor;
  /** HTML element to render */
  as?: TextElement;
  /** Children elements */
  children: React.ReactNode;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      variant = "body",
      size = "md",
      color = "default",
      as: Component = "p",
      children,
      ...props
    },
    ref
  ) => {
    const variants: Record<TextVariant, string> = {
      body: "font-normal",
      caption: "font-normal",
      overline: "font-medium uppercase tracking-wide",
      code: "font-mono bg-muted px-1.5 py-0.5 rounded",
    };

    const sizes: Record<TextSize, string> = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    // Overline is always smaller
    const effectiveSize = variant === "overline" ? "text-xs" : sizes[size];
    // Caption defaults to smaller if no size specified
    const captionSize = variant === "caption" && size === "md" ? "text-sm" : effectiveSize;

    const colors: Record<TextColor, string> = {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
    };

    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          variants[variant],
          variant === "overline" ? "text-xs" : captionSize,
          colors[color],
          className
        ),
        ...props,
      },
      children
    );
  }
);
Text.displayName = "Text";

export { Text };
