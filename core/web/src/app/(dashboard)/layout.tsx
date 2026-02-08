"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Spinner,
  Button,
  AppLink,
  NavLink,
  IconButton,
  Icon,
  Text,
  MenuItem,
} from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications";
import { EmailVerificationBanner } from "@/components/shared";

// =====================================================
// Navigation Configuration
// =====================================================

const userNavItems = [
  { href: "/dashboard", label: "Home", iconName: "House" as const, exact: true },
  { href: "/dashboard/profile", label: "Profile", iconName: "User" as const },
  { href: "/dashboard/notifications", label: "Notifications", iconName: "Bell" as const },
  { href: "/dashboard/settings", label: "Settings", iconName: "Settings" as const },
];

// =====================================================
// User Dashboard Layout
// =====================================================

/**
 * User dashboard layout for authenticated regular users.
 * Provides a consistent navigation experience with header and sidebar.
 */
export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isEmailVerified, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <Text color="muted">Loading...</Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Email Verification Banner */}
      {!isEmailVerified && <EmailVerificationBanner email={user?.email ?? undefined} />}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <IconButton
            icon={<Icon name={isMobileMenuOpen ? "X" : "Menu"} size="sm" />}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            size="sm"
            className="md:hidden -ml-2 mr-2"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          />

          {/* Logo */}
          <AppLink href="/dashboard" underline="none" className="flex items-center gap-2">
            <Icon name="Layers" size="md" />
            <span className="font-semibold hidden sm:inline">My App</span>
          </AppLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {userNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<Icon name={item.iconName} size="sm" />}
                variant="topnav"
                exact={item.exact}
              />
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle variant="dropdown" size="sm" />
            <NotificationBell />

            {/* User info (hidden on small screens) */}
            <Text size="sm" color="muted" className="hidden lg:inline max-w-[150px] truncate">
              {user?.name || user?.email}
            </Text>

            {/* Logout button (desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2"
            >
              <Icon name="LogOut" size="sm" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64",
          "bg-background border-r",
          "transform transition-transform duration-200 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col h-full p-4">
          <div className="flex-1 space-y-1">
            {userNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<Icon name={item.iconName} size="sm" />}
                variant="mobile"
                exact={item.exact}
              />
            ))}
          </div>

          {/* Mobile user info and logout */}
          <div className="border-t pt-4 space-y-3">
            <div className="px-3 py-2">
              <Text size="sm" className="font-medium truncate">
                {user?.name || "User"}
              </Text>
              <Text size="xs" color="muted" className="truncate">
                {user?.email}
              </Text>
            </div>
            <MenuItem
              icon={<Icon name="LogOut" size="sm" />}
              label="Logout"
              onClick={handleLogout}
              destructive
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="container px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Text size="sm" color="muted">
              &copy; {new Date().getFullYear()} My App. All rights reserved.
            </Text>
            <div className="flex items-center gap-4">
              <AppLink href="/terms" variant="muted" size="sm">
                Terms
              </AppLink>
              <AppLink href="/privacy" variant="muted" size="sm">
                Privacy
              </AppLink>
              <AppLink href="/contact" variant="muted" size="sm">
                Contact
              </AppLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
