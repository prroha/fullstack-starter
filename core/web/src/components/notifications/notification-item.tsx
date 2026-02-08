"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/lib/api";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Settings,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =====================================================
// NotificationItem Component
// =====================================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
  className?: string;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  INFO: <Info className="h-5 w-5 text-blue-500" />,
  SUCCESS: <CheckCircle className="h-5 w-5 text-green-500" />,
  WARNING: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  ERROR: <XCircle className="h-5 w-5 text-red-500" />,
  SYSTEM: <Settings className="h-5 w-5 text-gray-500" />,
};

const typeColors: Record<NotificationType, string> = {
  INFO: "border-l-blue-500",
  SUCCESS: "border-l-green-500",
  WARNING: "border-l-yellow-500",
  ERROR: "border-l-red-500",
  SYSTEM: "border-l-gray-500",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
  className,
}: NotificationItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 border-l-4 cursor-pointer",
        "hover:bg-accent/50",
        typeColors[notification.type],
        !notification.read && "bg-accent/30",
        compact ? "py-2" : "py-3",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {typeIcons[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm font-medium leading-tight",
              !notification.read && "font-semibold"
            )}
          >
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
        {!compact && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
        )}
      </div>

      {/* Actions (shown on hover, always visible on touch devices) */}
      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity",
          "opacity-50 hover:opacity-100",
          "sm:opacity-0 sm:group-hover:opacity-100",
          "focus-within:opacity-100"
        )}
      >
        {!notification.read && onMarkAsRead && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-7 sm:w-7 focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={handleMarkAsRead}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={handleDelete}
            aria-label="Delete notification"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
}

export { NotificationItem };
export type { NotificationItemProps };
