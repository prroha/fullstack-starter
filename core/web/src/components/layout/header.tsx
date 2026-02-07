"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =====================================================
// Header Component
// =====================================================

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
  bordered?: boolean;
}

function Header({
  className,
  logo,
  logoHref = "/",
  nav,
  actions,
  sticky = true,
  bordered = true,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn(
        "w-full bg-background z-40",
        sticky && "sticky top-0",
        bordered && "border-b border-border",
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo ? (
              <Link href={logoHref} className="flex items-center">
                {logo}
              </Link>
            ) : (
              <Link
                href={logoHref}
                className="text-xl font-bold text-foreground hover:text-foreground/80 transition-colors"
              >
                Logo
              </Link>
            )}
          </div>

          {/* Navigation */}
          {nav && (
            <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
              {nav}
            </nav>
          )}

          {/* Actions (user menu, buttons, etc.) */}
          {actions && (
            <div className="flex items-center gap-4">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}

// =====================================================
// Header Nav Link Component
// =====================================================

interface HeaderNavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

function HeaderNavLink({
  href,
  children,
  active = false,
  className,
}: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors",
        "hover:text-foreground",
        active
          ? "text-foreground"
          : "text-muted-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

// =====================================================
// Header User Menu Placeholder
// =====================================================

interface HeaderUserMenuProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onSignOut?: () => void;
  className?: string;
}

function HeaderUserMenu({
  user,
  onSignOut,
  className,
}: HeaderUserMenuProps) {
  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "h-9 px-4 py-2",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || "User avatar"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </span>
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {user.name || user.email}
        </span>
      </div>
      {onSignOut && (
        <button
          onClick={onSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign Out
        </button>
      )}
    </div>
  );
}

export { Header, HeaderNavLink, HeaderUserMenu };
export type { HeaderProps, HeaderNavLinkProps, HeaderUserMenuProps };
