"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderSearch } from "@/components/search";
import { AppLink, Avatar, Button, Text } from "@/components/ui";

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
  showThemeToggle?: boolean;
  showSearch?: boolean;
}

function Header({
  className,
  logo,
  logoHref = "/",
  nav,
  actions,
  sticky = true,
  bordered = true,
  showThemeToggle = true,
  showSearch = false,
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
              <AppLink href={logoHref} underline="none" className="flex items-center">
                {logo}
              </AppLink>
            ) : (
              <AppLink
                href={logoHref}
                underline="none"
                className="text-xl font-bold"
              >
                Logo
              </AppLink>
            )}
          </div>

          {/* Navigation */}
          {nav && (
            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-6 flex-1 justify-center"
            >
              {nav}
            </nav>
          )}

          {/* Actions (search, user menu, buttons, theme toggle, etc.) */}
          <div className="flex items-center gap-2">
            {showSearch && <HeaderSearch />}
            {showThemeToggle && <ThemeToggle variant="dropdown" size="sm" />}
            {actions && (
              <div className="flex items-center gap-4">{actions}</div>
            )}
          </div>
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
    <AppLink
      href={href}
      variant={active ? "default" : "muted"}
      size="sm"
      underline="none"
      className={cn("font-medium", className)}
    >
      {children}
    </AppLink>
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
      <AppLink
        href="/login"
        underline="none"
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "h-8 px-3",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        Sign In
      </AppLink>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Avatar
          src={user.avatar}
          name={user.name || user.email || "User"}
          alt={user.name || "User avatar"}
          size="sm"
        />
        <Text size="sm" className="font-medium hidden sm:inline">
          {user.name || user.email}
        </Text>
      </div>
      {onSignOut && (
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          Sign Out
        </Button>
      )}
    </div>
  );
}

export { Header, HeaderNavLink, HeaderUserMenu };
export type { HeaderProps, HeaderNavLinkProps, HeaderUserMenuProps };
