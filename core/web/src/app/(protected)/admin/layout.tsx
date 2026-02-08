"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Spinner,
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
  DashboardHeader,
  Button,
} from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

// =====================================================
// Icons
// =====================================================

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

// =====================================================
// Navigation Items Configuration
// =====================================================

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: DashboardIcon,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: UsersIcon,
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: MailIcon,
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: ClipboardListIcon,
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
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close mobile menu when navigating
    onClose?.();
  };

  return (
    <DashboardSidebar
      logo={
        <Link
          href="/admin"
          className="flex items-center gap-2"
          onClick={handleNavClick}
        >
          <ShieldIcon className="h-6 w-6 text-primary" />
          {!collapsed && (
            <span className="font-semibold text-foreground">Admin Panel</span>
          )}
        </Link>
      }
      footer={
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleNavClick}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {!collapsed && <span>Back to App</span>}
        </Link>
      }
    >
      <div className="space-y-1">
        {adminNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <DashboardNavItem
                icon={<item.icon className="h-4 w-4" />}
                active={isActive}
                collapsed={collapsed}
              >
                {item.label}
              </DashboardNavItem>
            </Link>
          );
        })}
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
          <span className="text-sm font-medium text-muted-foreground hidden md:block">
            Admin Dashboard
          </span>
        </div>
      }
      right={
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "A"}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || user?.email || "Admin"}
              </span>
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
                    <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors text-destructive"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Logout
                    </button>
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
        <p className="text-muted-foreground">Loading...</p>
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
