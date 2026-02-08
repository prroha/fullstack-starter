"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications";

// =====================================================
// AppHeader Component
// =====================================================

interface AppHeaderProps {
  className?: string;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  showLogout?: boolean;
}

function AppHeader({
  className,
  showNotifications = true,
  showThemeToggle = true,
  showLogout = true,
}: AppHeaderProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "w-full bg-background border-b border-border sticky top-0 z-40",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-semibold hover:text-primary transition-colors"
          >
            My App
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showThemeToggle && <ThemeToggle variant="dropdown" size="sm" />}

            {isAuthenticated && showNotifications && <NotificationBell />}

            {isAuthenticated && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.email}
                </span>
                {showLogout && (
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
export type { AppHeaderProps };
