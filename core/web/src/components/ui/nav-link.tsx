"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppLink, type AppLinkProps } from "./link";

// =====================================================
// Types
// =====================================================

export type NavLinkVariant = "sidebar" | "topnav" | "mobile";

export interface NavLinkProps extends Omit<AppLinkProps, "variant" | "underline" | "children"> {
  /** Navigation link variant */
  variant?: NavLinkVariant;
  /** Icon to display before label */
  icon?: React.ReactNode;
  /** Label text */
  label: string;
  /** Exact path matching (default: false for prefix matching) */
  exact?: boolean;
  /** Optional children to render after label */
  children?: React.ReactNode;
}

// =====================================================
// NavLink Component
// =====================================================

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    {
      className,
      href,
      variant = "sidebar",
      icon,
      label,
      exact = false,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();

    // Determine if this link is active
    const isActive = exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

    const variants = {
      sidebar: cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md",
        "text-sm font-medium",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      ),
      topnav: cn(
        "inline-flex items-center gap-1.5 px-3 py-2",
        "text-sm font-medium",
        isActive
          ? "text-foreground border-b-2 border-primary"
          : "text-muted-foreground hover:text-foreground"
      ),
      mobile: cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "text-base font-medium",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-accent"
      ),
    };

    return (
      <AppLink
        ref={ref}
        href={href}
        underline="none"
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variants[variant],
          className
        )}
        aria-current={isActive ? "page" : undefined}
        {...props}
      >
        {icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </AppLink>
    );
  }
);
NavLink.displayName = "NavLink";

export { NavLink };
