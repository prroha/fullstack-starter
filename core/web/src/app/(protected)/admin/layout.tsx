"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useFeatureFlags } from "@/lib/feature-flags";
import {
  Spinner,
  DashboardLayout,
  DashboardSidebar,
  DashboardHeader,
  Button,
  AppLink,
  NavLink,
  IconButton,
  Icon,
  Text,
  MenuItem,
  Avatar,
} from "@/components/ui";

// =====================================================
// Navigation Items Configuration
// =====================================================

interface AdminNavItem {
  href: string;
  label: string;
  iconName: "LayoutDashboard" | "ShoppingCart" | "Users" | "Mail" | "Info" | "Bell" | "Ticket" | "FileText" | "Settings" | "ClipboardList";
  exact?: boolean;
  /** Feature slug(s) required for this nav item to be visible */
  feature?: string | string[];
}

const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    iconName: "LayoutDashboard",
    exact: true,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    iconName: "ShoppingCart",
    feature: "payments.stripe",
  },
  {
    href: "/admin/users",
    label: "Users",
    iconName: "Users",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    iconName: "Mail",
  },
  {
    href: "/admin/faqs",
    label: "FAQs",
    iconName: "Info",
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    iconName: "Bell",
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    iconName: "Ticket",
    feature: "payments.stripe",
  },
  {
    href: "/admin/content",
    label: "Content Pages",
    iconName: "FileText",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    iconName: "Settings",
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    iconName: "ClipboardList",
    feature: "security.audit",
  },
];

// =====================================================
// Admin Sidebar Component
// =====================================================

function AdminSidebar({
  collapsed,
  onClose,
}: {
  collapsed: boolean;
  onClose?: () => void;
}) {
  const { hasAnyFeature } = useFeatureFlags();

  const handleNavClick = () => {
    // Close mobile menu when navigating
    onClose?.();
  };

  // Filter nav items based on feature flags
  const visibleNavItems = adminNavItems.filter((item) => {
    if (!item.feature) return true;
    const features = Array.isArray(item.feature) ? item.feature : [item.feature];
    return hasAnyFeature(features);
  });

  return (
    <DashboardSidebar
      logo={
        <AppLink
          href="/admin"
          underline="none"
          className="flex items-center gap-2"
          onClick={handleNavClick}
        >
          <Icon name="Shield" size="md" color="primary" />
          {!collapsed && (
            <Text className="font-semibold">Admin Panel</Text>
          )}
        </AppLink>
      }
      footer={
        <AppLink
          href="/"
          variant="muted"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleNavClick}
        >
          <Icon name="ArrowLeft" size="sm" />
          {!collapsed && <span>Back to App</span>}
        </AppLink>
      }
    >
      <div className="space-y-1">
        {visibleNavItems.map((item) => (
          <div key={item.href} onClick={handleNavClick}>
            <NavLink
              href={item.href}
              label={item.label}
              icon={<Icon name={item.iconName} size="sm" />}
              variant="sidebar"
              exact={item.exact}
            />
          </div>
        ))}
      </div>
    </DashboardSidebar>
  );
}

// =====================================================
// Admin Header Component
// =====================================================

function AdminHeader() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <DashboardHeader
      left={
        <div className="flex items-center gap-2">
          <Text size="sm" color="muted" className="font-medium hidden md:block">
            Admin Dashboard
          </Text>
        </div>
      }
      right={
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <IconButton
            icon={<Icon name="Bell" size="sm" />}
            variant="ghost"
            size="sm"
            aria-label="Notifications"
          />

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <Avatar
                name={user?.name || user?.email || "Admin"}
                size="xs"
              />
              <Text size="sm" className="hidden md:block font-medium">
                {user?.name || user?.email || "Admin"}
              </Text>
            </Button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-md border bg-popover shadow-lg">
                  <div className="p-2 border-b">
                    <Text size="sm" className="font-medium">{user?.name || "Admin"}</Text>
                    <Text size="xs" color="muted">{user?.email}</Text>
                  </div>
                  <div className="p-1" role="menu">
                    <MenuItem
                      icon={<Icon name="User" size="sm" />}
                      label="Profile"
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = "/profile";
                      }}
                    />
                    <MenuItem
                      icon={<Icon name="LogOut" size="sm" />}
                      label="Logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      destructive
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* Empty center area */}
      <div />
    </DashboardHeader>
  );
}

// =====================================================
// Admin Layout Component
// =====================================================

/**
 * Admin layout that requires ADMIN role.
 * Uses DashboardLayout for proper sidebar navigation.
 * Redirects to home if user is not an admin.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Role-based access check
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <Text color="muted">Loading...</Text>
      </div>
    );
  }

  // Access denied (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout
      sidebar={
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onClose={() => setShowMobileMenu(false)}
        />
      }
      header={<AdminHeader />}
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      showMobileMenu={showMobileMenu}
      onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
    >
      <div className="p-4 md:p-6 lg:p-8">{children}</div>
    </DashboardLayout>
  );
}
