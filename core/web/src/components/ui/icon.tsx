import * as React from "react";
import { icons, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

// =====================================================
// Icon Component
// =====================================================

export type IconName = keyof typeof icons;

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export type IconColor =
  | "default"
  | "muted"
  | "primary"
  | "destructive"
  | "success"
  | "warning";

export interface IconProps extends Omit<LucideProps, "size" | "color"> {
  /** Lucide icon name */
  name: IconName;
  /** Size variant */
  size?: IconSize;
  /** Color variant */
  color?: IconColor;
  /** Additional CSS classes */
  className?: string;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = "md", color = "default", className, ...props }, ref) => {
    const LucideIcon = icons[name];

    if (!LucideIcon) {
      console.warn(`Icon "${name}" not found in Lucide icons`);
      return null;
    }

    const sizes: Record<IconSize, number> = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    };

    const colors: Record<IconColor, string> = {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      success: "text-green-500 dark:text-green-400",
      warning: "text-yellow-500 dark:text-yellow-400",
    };

    return (
      <LucideIcon
        ref={ref}
        size={sizes[size]}
        className={cn(colors[color], className)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Icon.displayName = "Icon";

export { Icon };
