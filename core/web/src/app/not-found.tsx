"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, deleted, or perhaps never existed.
        </p>

        {/* Search suggestion */}
        <form onSubmit={handleSearch} className="mt-6 max-w-sm mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try searching..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              aria-label="Search"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link
              href="/"
              className="text-primary hover:underline underline-offset-2"
            >
              Home
            </Link>
            <Link
              href="/profile"
              className="text-primary hover:underline underline-offset-2"
            >
              Profile
            </Link>
            <Link
              href="/settings"
              className="text-primary hover:underline underline-offset-2"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
