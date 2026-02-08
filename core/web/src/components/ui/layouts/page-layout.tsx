"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "../icon-button";
import { Icon } from "../icon";

// =====================================================
// Types
// =====================================================

type SidebarPosition = "left" | "right";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main content */
  children: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional sidebar content */
  sidebar?: React.ReactNode;
  /** Sidebar position */
  sidebarPosition?: SidebarPosition;
  /** Sidebar width (CSS value) */
  sidebarWidth?: string;
  /** Whether sidebar can collapse on mobile */
  sidebarCollapsible?: boolean;
  /** If true, content spans full width (no max-width constraint) */
  fullWidth?: boolean;
  /** Additional classes for the main content area */
  contentClassName?: string;
  /** Whether header is sticky */
  stickyHeader?: boolean;
}

// =====================================================
// PageLayout Context
// =====================================================

interface PageLayoutContextValue {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarCollapsible: boolean;
}

const PageLayoutContext = React.createContext<PageLayoutContextValue | null>(null);

function usePageLayoutContext() {
  const context = React.useContext(PageLayoutContext);
  if (!context) {
    throw new Error("PageLayout sub-components must be used within a PageLayout");
  }
  return context;
}

// =====================================================
// Sidebar Toggle Button
// =====================================================

interface SidebarToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon when sidebar is open (default: hamburger menu) */
  openIcon?: React.ReactNode;
  /** Icon when sidebar is closed (default: close icon) */
  closeIcon?: React.ReactNode;
}

function SidebarToggle({
  className,
  openIcon,
  closeIcon,
  ...props
}: SidebarToggleProps) {
  const { isSidebarOpen, setIsSidebarOpen, sidebarCollapsible } = usePageLayoutContext();

  if (!sidebarCollapsible) return null;

  const defaultIcon = isSidebarOpen
    ? closeIcon || <Icon name="X" size="md" />
    : openIcon || <Icon name="Menu" size="md" />;

  return (
    <IconButton
      icon={defaultIcon}
      onClick={() => setIsSidebarOpen((prev) => !prev)}
      variant="ghost"
      size="md"
      className={cn("lg:hidden", className)}
      aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isSidebarOpen}
      aria-controls="page-layout-sidebar"
      {...props}
    />
  );
}
SidebarToggle.displayName = "SidebarToggle";

// =====================================================
// PageLayout Component
// =====================================================

function PageLayout({
  className,
  children,
  header,
  footer,
  sidebar,
  sidebarPosition = "left",
  sidebarWidth = "280px",
  sidebarCollapsible = false,
  fullWidth = false,
  contentClassName,
  stickyHeader = false,
  ...props
}: PageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Close sidebar on route change or screen resize to desktop
  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isSidebarOpen && sidebarCollapsible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSidebarOpen, sidebarCollapsible]);

  const contextValue = React.useMemo(
    () => ({
      isSidebarOpen,
      setIsSidebarOpen,
      sidebarCollapsible,
    }),
    [isSidebarOpen, sidebarCollapsible]
  );

  return (
    <PageLayoutContext.Provider value={contextValue}>
      <div
        className={cn("min-h-screen flex flex-col bg-background", className)}
        {...props}
      >
        {/* Header */}
        {header && (
          <header
            className={cn(
              "w-full bg-background z-40",
              stickyHeader && "sticky top-0"
            )}
          >
            {header}
          </header>
        )}

        {/* Main content area with sidebar */}
        <div className="flex-1 flex relative">
          {/* Sidebar */}
          {sidebar && (
            <>
              {/* Mobile overlay */}
              {sidebarCollapsible && isSidebarOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in-0 duration-200"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Sidebar container */}
              <aside
                id="page-layout-sidebar"
                role="navigation"
                aria-label="Main navigation"
                className={cn(
                  "bg-background border-border flex-shrink-0",
                  // Desktop: static sidebar
                  "hidden lg:block",
                  sidebarPosition === "left" ? "border-r" : "border-l order-last",
                  // Mobile: overlay sidebar
                  sidebarCollapsible && isSidebarOpen && "fixed inset-y-0 z-50 block lg:relative",
                  sidebarCollapsible && isSidebarOpen && sidebarPosition === "left" && "left-0 animate-in slide-in-from-left-0 duration-200",
                  sidebarCollapsible && isSidebarOpen && sidebarPosition === "right" && "right-0 animate-in slide-in-from-right-0 duration-200"
                )}
                style={{ width: sidebarWidth }}
              >
                <div
                  className={cn(
                    "h-full overflow-y-auto",
                    stickyHeader && "lg:sticky lg:top-0 lg:max-h-screen"
                  )}
                >
                  {sidebar}
                </div>
              </aside>
            </>
          )}

          {/* Main content */}
          <main
            className={cn(
              "flex-1 min-w-0",
              contentClassName
            )}
          >
            <div
              className={cn(
                "w-full h-full",
                !fullWidth && "max-w-7xl mx-auto"
              )}
            >
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        {footer && (
          <footer className="w-full bg-background">
            {footer}
          </footer>
        )}
      </div>
    </PageLayoutContext.Provider>
  );
}
PageLayout.displayName = "PageLayout";

// =====================================================
// Exports
// =====================================================

export { PageLayout, SidebarToggle, usePageLayoutContext };
export type { PageLayoutProps, SidebarPosition, SidebarToggleProps, PageLayoutContextValue };
