"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api, Notification } from "@/lib/api";
import { useClickOutside, useEscapeKey, useAsync } from "@/lib/hooks";
import { NotificationItem } from "./notification-item";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Bell, CheckCheck } from "lucide-react";

// =====================================================
// NotificationDropdown Component
// =====================================================

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function NotificationDropdown({
  isOpen,
  onClose,
  className,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Use reusable hooks for click outside and escape key
  const dropdownRef = useClickOutside<HTMLDivElement>(onClose, { enabled: isOpen });
  useEscapeKey(onClose, isOpen);

  // Use async hook for fetching notifications
  const {
    execute: fetchNotifications,
    isLoading,
    error,
  } = useAsync(
    async () => {
      const response = await api.getNotifications({ limit: 10 });
      if (response.success && response.data) {
        setNotifications(response.data.items);
        return response.data.items;
      }
      throw new Error("Failed to load notifications");
    },
    {
      onError: () => {
        // Error is already handled by the hook
      },
    }
  );

  // Fetch notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  async function handleMarkAsRead(id: string) {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  function handleViewAll() {
    onClose();
    router.push("/notifications");
  }

  function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action link if present
    if (notification.data?.actionUrl) {
      onClose();
      router.push(notification.data.actionUrl as string);
    }
  }

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute right-0 top-full mt-2 w-80 md:w-96 z-50",
        "bg-background border border-border rounded-lg shadow-lg",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-destructive">
            {error.message}
            <Button
              variant="link"
              size="sm"
              onClick={() => fetchNotifications()}
              className="block mx-auto mt-2"
            >
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full h-9 text-sm"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}

export { NotificationDropdown };
export type { NotificationDropdownProps };
