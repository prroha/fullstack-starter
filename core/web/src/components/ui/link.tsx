"use client";

import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

// =====================================================
// AppLink Component
// =====================================================

export interface AppLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** The URL to link to */
  href: string;
  /** Visual variant */
  variant?: "default" | "muted" | "primary" | "destructive";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Force external link behavior (opens in new tab) */
  external?: boolean;
  /** Underline behavior */
  underline?: "always" | "hover" | "none";
  /** Children elements */
  children: React.ReactNode;
}

const AppLink = React.forwardRef<HTMLAnchorElement, AppLinkProps>(
  (
    {
      className,
      href,
      variant = "default",
      size = "md",
      external,
      underline = "hover",
      children,
      ...props
    },
    ref
  ) => {
    // Detect external links automatically
    const isExternal =
      external ??
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:"));

    const variants = {
      default: "text-foreground hover:text-foreground/80",
      muted: "text-muted-foreground hover:text-muted-foreground/80",
      primary: "text-primary hover:text-primary/80",
      destructive: "text-destructive hover:text-destructive/80",
    };

    const sizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const underlines = {
      always: "underline underline-offset-4",
      hover: "hover:underline underline-offset-4",
      none: "no-underline",
    };

    const linkClasses = cn(
      "inline-flex items-center gap-1",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
      variants[variant],
      sizes[size],
      underlines[underline],
      className
    );

    // External links use regular anchor tag
    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          className={linkClasses}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }

    // Internal links use Next.js Link
    return (
      <NextLink ref={ref} href={href} className={linkClasses} {...props}>
        {children}
      </NextLink>
    );
  }
);
AppLink.displayName = "AppLink";

export { AppLink };
