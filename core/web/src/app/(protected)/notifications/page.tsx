"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Notification, NotificationType } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button, Spinner, Badge } from "@/components/ui";
import { NotificationItem } from "@/components/notifications";
import { EmptyState } from "@/components/shared";
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Filter,
  RefreshCw,
} from "lucide-react";

// =====================================================
// Notifications Page
// =====================================================

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type FilterType = "all" | "unread" | NotificationType;

export default function NotificationsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page: number = 1) => {
      try {
        setError(null);

        const params: {
          page: number;
          limit: number;
          read?: boolean;
          type?: NotificationType;
        } = {
          page,
          limit: 20,
        };

        if (filter === "unread") {
          params.read = false;
        } else if (filter !== "all") {
          params.type = filter as NotificationType;
        }

        const response = await api.getNotifications(params);

        if (response.success && response.data) {
          setNotifications(response.data.items);
          setPagination(response.data.pagination);
        }

        logger.debug("Notifications", "Notifications loaded successfully");
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.push("/login");
            return;
          }
          setError(err.message);
          logger.error("Notifications", "Failed to load notifications", err);
        } else {
          setError("Failed to load notifications. Please try again.");
          logger.error("Notifications", "Unexpected error loading notifications", err);
        }
      }
    },
    [filter, router]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  // Refresh notifications
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications(1);
    setIsRefreshing(false);
    toast.success("Notifications refreshed");
  };

  // Mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toast.error("Failed to mark notification as read");
      logger.error("Notifications", "Failed to mark as read", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
      logger.error("Notifications", "Failed to mark all as read", err);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
      logger.error("Notifications", "Failed to delete notification", err);
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) {
      return;
    }

    try {
      await api.deleteAllNotifications();
      setNotifications([]);
      setPagination(null);
      toast.success("All notifications deleted");
    } catch (err) {
      toast.error("Failed to delete all notifications");
      logger.error("Notifications", "Failed to delete all notifications", err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.data?.actionUrl) {
      router.push(notification.data.actionUrl as string);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Filter options
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "INFO", label: "Info" },
    { value: "SUCCESS", label: "Success" },
    { value: "WARNING", label: "Warning" },
    { value: "ERROR", label: "Error" },
    { value: "SYSTEM", label: "System" },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold hover:text-primary">
            My App
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {pagination
                    ? `${pagination.total} notification${pagination.total !== 1 ? "s" : ""}`
                    : "No notifications"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete all
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
                className="flex-shrink-0"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => fetchNotifications(1)}
                className="mt-2 p-0 h-auto"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                filter === "all"
                  ? "You're all caught up! No notifications at the moment."
                  : `No ${filter === "unread" ? "unread" : filter.toLowerCase()} notifications.`
              }
              action={
                filter !== "all"
                  ? {
                      label: "View all notifications",
                      onClick: () => setFilter("all"),
                      variant: "outline",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="border rounded-lg overflow-hidden divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(pagination.page + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center pt-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
