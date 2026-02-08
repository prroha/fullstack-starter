"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "./notification-dropdown";

// =====================================================
// NotificationBell Component
// =====================================================

interface NotificationBellProps {
  className?: string;
  pollInterval?: number; // in milliseconds, default 30s
}

function NotificationBell({
  className,
  pollInterval = 30000,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Fetch unread count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      // Silently fail - don't show errors for background polling
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, pollInterval]);

  // Refresh count when dropdown closes
  const handleDropdownClose = React.useCallback(() => {
    setIsOpen(false);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
              "bg-destructive text-destructive-foreground rounded-full",
              "animate-in zoom-in-50 duration-200"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationDropdown isOpen={isOpen} onClose={handleDropdownClose} />
    </div>
  );
}

export { NotificationBell };
export type { NotificationBellProps };
