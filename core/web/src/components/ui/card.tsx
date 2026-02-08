import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Card Component
// =====================================================

type CardVariant = "default" | "outline" | "elevated" | "ghost";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: CardVariant;
  /** Whether the card is interactive (adds hover effects) */
  interactive?: boolean;
  /** Padding size for the card */
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, padding = "none", children, ...props }, ref) => {
    const variants: Record<CardVariant, string> = {
      default: "bg-card text-card-foreground border border-border shadow-sm",
      outline: "bg-transparent border border-border",
      elevated: "bg-card text-card-foreground shadow-lg border-0",
      ghost: "bg-transparent border-0 shadow-none",
    };

    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl",
          variants[variant],
          paddings[padding],
          interactive && "transition-shadow hover:shadow-md cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

// =====================================================
// CardHeader Component
// =====================================================

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border below the header */
  bordered?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1.5 px-4 py-3",
          bordered && "border-b border-border",
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

// =====================================================
// CardTitle Component
// =====================================================

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** HTML element to render (h1-h6) */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("text-lg font-semibold leading-tight text-foreground", className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

// =====================================================
// CardDescription Component
// =====================================================

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

// =====================================================
// CardContent Component
// =====================================================

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-4 py-3", className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = "CardContent";

// =====================================================
// CardFooter Component
// =====================================================

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border above the footer */
  bordered?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center px-4 py-3",
          bordered && "border-t border-border",
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

// =====================================================
// Exports
// =====================================================

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type {
  CardProps,
  CardVariant,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
};
