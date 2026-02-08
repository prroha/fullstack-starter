"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "../icon-button";
import { Icon } from "../icon";
import { AppLink } from "../link";

// =====================================================
// Types
// =====================================================

interface DashboardLayoutProps {
  /** Main content area */
  children: React.ReactNode;
  /** Sidebar content (typically navigation) */
  sidebar: React.ReactNode;
  /** Optional top header/navbar */
  header?: React.ReactNode;
  /** Sidebar width when expanded (default: '260px') */
  sidebarWidth?: string;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Callback for collapse toggle */
  onSidebarToggle?: () => void;
  /** Width when collapsed (default: '64px') */
  collapsedWidth?: string;
  /** Additional CSS classes */
  className?: string;
  /** Mobile menu state */
  showMobileMenu?: boolean;
  /** Callback for mobile menu toggle */
  onMobileMenuToggle?: () => void;
}

// =====================================================
// Dashboard Layout Component
// =====================================================

function DashboardLayout({
  children,
  sidebar,
  header,
  sidebarWidth = "240px", // Content-first: tighter sidebar (was 260px)
  sidebarCollapsed = false,
  onSidebarToggle,
  collapsedWidth = "64px",
  className,
  showMobileMenu = false,
  onMobileMenuToggle,
}: DashboardLayoutProps) {
  // Handle escape key to close mobile menu
  React.useEffect(() => {
    if (!showMobileMenu) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onMobileMenuToggle?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMobileMenu, onMobileMenuToggle]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (showMobileMenu) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showMobileMenu]);

  const currentSidebarWidth = sidebarCollapsed ? collapsedWidth : sidebarWidth;

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Skip to main content link for accessibility */}
      <AppLink
        href="#dashboard-main-content"
        underline="none"
        className={cn(
          "sr-only focus:not-sr-only",
          "fixed top-2 left-1/2 -translate-x-1/2 z-[60]",
          "px-4 py-2 rounded-md",
          "bg-primary text-primary-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        Skip to main content
      </AppLink>

      {/* Mobile Menu Button - Only visible on mobile */}
      <IconButton
        icon={<Icon name={showMobileMenu ? "X" : "Menu"} size="sm" />}
        onClick={onMobileMenuToggle}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden shadow-sm"
        aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={showMobileMenu}
        aria-controls="dashboard-mobile-sidebar"
      />

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in-0 duration-200"
          onClick={onMobileMenuToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 z-30 h-screen",
          "hidden md:flex flex-col",
          "bg-card border-r border-border",
          "transition-[width] duration-300 ease-in-out"
        )}
        style={{ width: currentSidebarWidth }}
      >
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {sidebar}
        </div>

        {/* Collapse Toggle Button - Enhanced visibility */}
        {onSidebarToggle && (
          <IconButton
            icon={<Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size="xs" />}
            onClick={onSidebarToggle}
            variant="outline"
            size="xs"
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2",
              "rounded-full shadow-md hover:shadow-lg hover:scale-110",
              "transition-all"
            )}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
        )}
      </aside>

      {/* Sidebar - Mobile (Drawer) */}
      <aside
        id="dashboard-mobile-sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-[280px]",
          "flex md:hidden flex-col",
          "bg-card border-r border-border",
          "transition-transform duration-300 ease-in-out",
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Sidebar Header with Close Button */}
        <div className="flex items-center justify-end p-4 border-b border-border">
          <IconButton
            icon={<Icon name="X" size="sm" />}
            onClick={onMobileMenuToggle}
            variant="ghost"
            size="sm"
            aria-label="Close menu"
          />
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "min-h-screen flex flex-col",
          "transition-[margin] duration-300 ease-in-out",
          // Mobile: no margin, Desktop: margin for sidebar
          "ml-0 md:ml-[var(--dashboard-sidebar-width)]"
        )}
        style={
          {
            "--dashboard-sidebar-width": currentSidebarWidth,
          } as React.CSSProperties
        }
      >
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-20 bg-background border-b border-border">
            {header}
          </header>
        )}

        {/* Main Content - Scrollable */}
        <main id="dashboard-main-content" className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// =====================================================
// Dashboard Sidebar Component (Optional Helper)
// =====================================================

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Logo or branding element */
  logo?: React.ReactNode;
  /** Footer content (e.g., user menu, settings) */
  footer?: React.ReactNode;
}

function DashboardSidebar({
  children,
  logo,
  footer,
  className,
  ...props
}: DashboardSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {/* Logo/Branding - Content-first: tighter padding */}
      {logo && (
        <div className="flex-shrink-0 px-3 py-3 border-b border-border">
          {logo}
        </div>
      )}

      {/* Navigation Content - Content-first: tighter padding */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">{children}</nav>

      {/* Footer - Content-first: tighter padding */}
      {footer && (
        <div className="flex-shrink-0 px-3 py-3 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Dashboard Nav Item Component (Optional Helper)
// =====================================================

interface DashboardNavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Whether the item is currently active */
  active?: boolean;
  /** Whether sidebar is collapsed (for tooltip behavior) */
  collapsed?: boolean;
  /** Render as a link instead of button */
  href?: string;
}

function DashboardNavItem({
  children,
  icon,
  active = false,
  collapsed = false,
  className,
  href,
  ...props
}: DashboardNavItemProps) {
  // Content-first: tighter nav item spacing
  const baseClasses = cn(
    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md",
    "text-sm font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    collapsed && "justify-center px-2",
    className
  );

  // Extract text content for tooltip when collapsed
  const textContent = typeof children === "string" ? children : "";

  const content = (
    <>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!collapsed && <span className="truncate">{children}</span>}
    </>
  );

  // Common props for tooltip when collapsed
  const tooltipProps = collapsed && textContent ? { title: textContent } : {};

  if (href) {
    return (
      <AppLink
        href={href}
        underline="none"
        className={baseClasses}
        aria-current={active ? "page" : undefined}
        {...tooltipProps}
      >
        {content}
      </AppLink>
    );
  }

  return (
    <button
      type="button"
      className={baseClasses}
      aria-current={active ? "true" : undefined}
      {...tooltipProps}
      {...props}
    >
      {content}
    </button>
  );
}

// =====================================================
// Dashboard Header Component (Optional Helper)
// =====================================================

interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Left-aligned content (e.g., page title, breadcrumbs) */
  left?: React.ReactNode;
  /** Right-aligned content (e.g., actions, user menu) */
  right?: React.ReactNode;
}

function DashboardHeader({
  children,
  left,
  right,
  className,
  ...props
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        // Content-first: tighter header height and padding (was h-16 px-4 md:px-6)
        "flex items-center justify-between h-14 px-3 md:px-4",
        className
      )}
      {...props}
    >
      {left && <div className="flex items-center gap-3">{left}</div>}
      <div className="flex-1">{children}</div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export {
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
  DashboardHeader,
};
export type {
  DashboardLayoutProps,
  DashboardSidebarProps,
  DashboardNavItemProps,
  DashboardHeaderProps,
};
