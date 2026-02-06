"use client";

import React from "react";
import { PresenceInfo } from "../lib/socket";

// =============================================================================
// Types
// =============================================================================

export type PresenceStatus = PresenceInfo["status"];

export interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  labelPosition?: "left" | "right";
  className?: string;
  pulseOnline?: boolean;
}

export interface UserPresenceProps {
  userId: string;
  name?: string;
  avatarUrl?: string;
  status: PresenceStatus;
  lastSeen?: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

export interface PresenceListProps {
  users: Array<{
    userId: string;
    name?: string;
    avatarUrl?: string;
    status: PresenceStatus;
    lastSeen?: string;
  }>;
  size?: "sm" | "md" | "lg";
  showOffline?: boolean;
  className?: string;
  onUserClick?: (userId: string) => void;
}

// =============================================================================
// Status Configuration
// =============================================================================

const statusConfig: Record<
  PresenceStatus,
  { color: string; bgColor: string; label: string }
> = {
  online: {
    color: "bg-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Online",
  },
  away: {
    color: "bg-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Away",
  },
  busy: {
    color: "bg-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Busy",
  },
  offline: {
    color: "bg-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    label: "Offline",
  },
};

const sizeConfig = {
  sm: {
    dot: "w-2 h-2",
    avatar: "w-8 h-8",
    text: "text-sm",
    gap: "gap-1",
  },
  md: {
    dot: "w-3 h-3",
    avatar: "w-10 h-10",
    text: "text-base",
    gap: "gap-2",
  },
  lg: {
    dot: "w-4 h-4",
    avatar: "w-12 h-12",
    text: "text-lg",
    gap: "gap-3",
  },
};

// =============================================================================
// Presence Indicator Component
// =============================================================================

export function PresenceIndicator({
  status,
  size = "md",
  showLabel = false,
  labelPosition = "right",
  className = "",
  pulseOnline = true,
}: PresenceIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  const dot = (
    <span className="relative flex">
      <span
        className={`${sizes.dot} rounded-full ${config.color}`}
      />
      {pulseOnline && status === "online" && (
        <span
          className={`absolute ${sizes.dot} rounded-full ${config.color} animate-ping opacity-75`}
        />
      )}
    </span>
  );

  if (!showLabel) {
    return <span className={className}>{dot}</span>;
  }

  return (
    <span
      className={`inline-flex items-center ${sizes.gap} ${className}`}
    >
      {labelPosition === "left" && (
        <span className={`${sizes.text} text-gray-600 dark:text-gray-400`}>
          {config.label}
        </span>
      )}
      {dot}
      {labelPosition === "right" && (
        <span className={`${sizes.text} text-gray-600 dark:text-gray-400`}>
          {config.label}
        </span>
      )}
    </span>
  );
}

// =============================================================================
// User Presence Component (Avatar + Indicator)
// =============================================================================

export function UserPresence({
  userId,
  name,
  avatarUrl,
  status,
  lastSeen,
  size = "md",
  showStatus = true,
  className = "",
}: UserPresenceProps) {
  const sizes = sizeConfig[size];
  const config = statusConfig[status];

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayName = name || userId;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex items-center ${sizes.gap} ${className}`}>
      {/* Avatar with indicator */}
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className={`${sizes.avatar} rounded-full object-cover`}
          />
        ) : (
          <div
            className={`${sizes.avatar} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${sizes.text} font-medium text-gray-600 dark:text-gray-300`}
          >
            {initials}
          </div>
        )}
        {/* Status indicator */}
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800 ${
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          } ${config.color}`}
        />
      </div>

      {/* Name and status */}
      {showStatus && (
        <div className="flex flex-col">
          <span className={`${sizes.text} font-medium text-gray-900 dark:text-gray-100`}>
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {status === "offline" && lastSeen
              ? `Last seen ${formatLastSeen(lastSeen)}`
              : config.label}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Presence List Component
// =============================================================================

export function PresenceList({
  users,
  size = "md",
  showOffline = true,
  className = "",
  onUserClick,
}: PresenceListProps) {
  // Sort users: online first, then away, then busy, then offline
  const sortedUsers = [...users].sort((a, b) => {
    const order = { online: 0, away: 1, busy: 2, offline: 3 };
    return order[a.status] - order[b.status];
  });

  // Filter out offline users if needed
  const filteredUsers = showOffline
    ? sortedUsers
    : sortedUsers.filter((u) => u.status !== "offline");

  const onlineCount = users.filter(
    (u) => u.status === "online" || u.status === "away" || u.status === "busy"
  ).length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Online
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {onlineCount} / {users.length}
        </span>
      </div>

      {/* User list */}
      <div className="space-y-1">
        {filteredUsers.map((user) => (
          <div
            key={user.userId}
            onClick={() => onUserClick?.(user.userId)}
            className={`p-2 rounded-lg transition-colors ${
              onUserClick
                ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                : ""
            }`}
          >
            <UserPresence
              userId={user.userId}
              name={user.name}
              avatarUrl={user.avatarUrl}
              status={user.status}
              lastSeen={user.lastSeen}
              size={size}
              showStatus={true}
            />
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No users online
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Presence Badge Component (Compact indicator for headers/toolbars)
// =============================================================================

export interface PresenceBadgeProps {
  onlineCount: number;
  totalCount?: number;
  className?: string;
}

export function PresenceBadge({
  onlineCount,
  totalCount,
  className = "",
}: PresenceBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {onlineCount}
        {totalCount !== undefined && ` / ${totalCount}`}
      </span>
    </div>
  );
}

export default PresenceIndicator;
