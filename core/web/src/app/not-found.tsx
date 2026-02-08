"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Text, Input } from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search or home with query
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg">
        {/* Illustration */}
        <div className="mb-8">
          <svg
            className="w-48 h-48 mx-auto text-muted-foreground/30"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Document with question mark illustration */}
            <rect
              x="50"
              y="30"
              width="100"
              height="130"
              rx="8"
              className="stroke-current"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M70 60h60M70 80h40M70 100h50"
              className="stroke-current"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="135"
              r="25"
              className="stroke-primary fill-primary/10"
              strokeWidth="3"
            />
            <text
              x="100"
              y="145"
              textAnchor="middle"
              className="fill-primary text-2xl font-bold"
              fontSize="32"
            >
              ?
            </text>
            {/* Decorative elements */}
            <circle cx="35" cy="50" r="8" className="fill-primary/20" />
            <circle cx="165" cy="140" r="6" className="fill-primary/15" />
            <circle cx="170" cy="60" r="4" className="fill-primary/10" />
          </svg>
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-bold text-primary mb-2">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>

        {/* Description */}
        <Text color="muted" className="mt-3 max-w-sm mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, deleted, or perhaps never existed.
        </Text>

        {/* Search suggestion */}
        <form onSubmit={handleSearch} className="mt-6 max-w-sm mx-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try searching..."
              aria-label="Search"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label="Search">
              <Icon name="Search" size="sm" />
            </Button>
          </div>
        </form>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => router.push("/")}>
            <Icon name="House" size="sm" className="mr-2" />
            Go Home
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <Icon name="ArrowLeft" size="sm" className="mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful links */}
        <div className="mt-10 pt-6 border-t border-border">
          <Text variant="caption" color="muted" className="mb-3">
            Here are some helpful links:
          </Text>
          <div className="flex flex-wrap gap-4 justify-center">
            <AppLink href="/" variant="primary" size="sm">
              Home
            </AppLink>
            <AppLink href="/profile" variant="primary" size="sm">
              Profile
            </AppLink>
            <AppLink href="/settings" variant="primary" size="sm">
              Settings
            </AppLink>
          </div>
        </div>
      </div>
    </div>
  );
}
