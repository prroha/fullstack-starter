"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserSearchResult } from "@/lib/hooks/use-search";

// =====================================================
// Search Result Item Types
// =====================================================

export type SearchResultType = "user";

interface BaseSearchResultItemProps {
  type: SearchResultType;
  onClick?: () => void;
  className?: string;
}

interface UserSearchResultItemProps extends BaseSearchResultItemProps {
  type: "user";
  result: UserSearchResult;
}

export type SearchResultItemProps = UserSearchResultItemProps;

// =====================================================
// Icons
// =====================================================

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
      className={cn("h-4 w-4", className)}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// =====================================================
// User Search Result Item
// =====================================================

function UserSearchResultItem({
  result,
  onClick,
  className,
}: Omit<UserSearchResultItemProps, "type">) {
  const initials = result.name
    ? result.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : result.email.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/admin/users?search=${encodeURIComponent(result.email)}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "hover:bg-accent focus:bg-accent focus:outline-none",
        "cursor-pointer",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">{initials}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {result.name || "No name"}
          </span>
          {result.role === "ADMIN" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Admin
            </span>
          )}
          {!result.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{result.email}</p>
      </div>

      {/* Icon indicator */}
      <div className="flex-shrink-0">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

// =====================================================
// Main Component
// =====================================================

export function SearchResultItem(props: SearchResultItemProps) {
  switch (props.type) {
    case "user":
      return <UserSearchResultItem {...props} />;
    default:
      return null;
  }
}
