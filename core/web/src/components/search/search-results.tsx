"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchResultItem } from "./search-result-item";
import type { SearchResults as SearchResultsType } from "@/lib/hooks/use-search";

// =====================================================
// Types
// =====================================================

interface SearchResultsProps {
  results: SearchResultsType;
  onResultClick?: () => void;
  className?: string;
}

interface ResultGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// =====================================================
// Icons
// =====================================================

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
      className={cn("h-4 w-4", className)}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// =====================================================
// Result Group Component
// =====================================================

function ResultGroup({ title, icon, children, className }: ResultGroupProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// =====================================================
// Empty State
// =====================================================

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        No results found
      </h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        No results found for &quot;{query}&quot;. Try searching for something else.
      </p>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function SearchResults({
  results,
  onResultClick,
  className,
}: SearchResultsProps) {
  const hasUsers = results.users && results.users.length > 0;
  const hasResults = hasUsers;

  if (!hasResults) {
    return <EmptyResults query={results.query} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Users Group */}
      {hasUsers && (
        <ResultGroup title="Users" icon={<UsersIcon />}>
          {results.users!.map((user) => (
            <SearchResultItem
              key={user.id}
              type="user"
              result={user}
              onClick={onResultClick}
            />
          ))}
        </ResultGroup>
      )}
    </div>
  );
}
