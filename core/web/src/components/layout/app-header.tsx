"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button, AppLink, Text } from "@/components/ui";
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
          <AppLink
            href="/"
            underline="none"
            className="text-xl font-semibold hover:text-primary"
          >
            My App
          </AppLink>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showThemeToggle && <ThemeToggle variant="dropdown" size="sm" />}

            {isAuthenticated && showNotifications && <NotificationBell />}

            {isAuthenticated && (
              <>
                <Text size="sm" color="muted" className="hidden sm:inline">
                  {user?.email}
                </Text>
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
