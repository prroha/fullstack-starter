"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Puzzle,
  Users,
  Key,
  Ticket,
  Tag,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Loader2,
  Wand2,
} from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { NavigationProgress } from "@/components/ui";
import { useNavigationProgress } from "@/lib/hooks";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/templates", label: "Templates", icon: Package },
  { href: "/admin/features", label: "Features", icon: Puzzle },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/licenses", label: "Licenses", icon: Key },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/generate", label: "Generate", icon: Wand2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// =====================================================
// Auth Guard Component
// =====================================================

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if on login page
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated and not on login page, redirect to login
      if (!isAuthenticated && !isLoginPage) {
        router.replace("/login");
      }
      // If authenticated and on login page, redirect to admin
      // If authenticated but not admin, redirect to home
      if (isAuthenticated && !isLoginPage && user?.role !== 'admin') {
        router.replace("/");
      }

      if (isAuthenticated && isLoginPage) {
        router.replace("/admin");
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If on login page, just render children (login form)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not authenticated (and not on login page), show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Render authenticated layout
  return <>{children}</>;
}

// =====================================================
// Admin Layout Content
// =====================================================

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { navigating, progress, handleLinkClick } = useNavigationProgress();

  // If on login page, render children without the layout
  const isLoginPage = pathname === "/login";
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/admin" className="font-bold text-lg">
            Studio Admin
          </Link>
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="p-4 space-y-1" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => { handleLinkClick(item.href); setSidebarOpen(false); }}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-2 py-1.5 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
          <Link
            href="/"
            onClick={() => handleLinkClick("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to Studio
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background border-b h-16 flex items-center px-4 gap-4 relative" role="banner">
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="main-navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email || "Admin"}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
          <NavigationProgress navigating={navigating} progress={progress} />
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6" role="main" aria-label="Page content">
          {children}
        </main>
      </div>
    </div>
  );
}

// =====================================================
// Admin Layout (Wrapper with Provider)
// =====================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AuthGuard>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
