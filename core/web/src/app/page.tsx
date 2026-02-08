"use client";

import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { Spinner, ThemeToggle } from "@/components/ui";

export default function Home() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="dropdown" size="md" />
      </div>

      <h1 className="text-3xl font-bold mb-4">Welcome to Starter Template</h1>

      {isAuthenticated ? (
        <div>
          <p className="mb-4">Hello, {user?.name || user?.email}!</p>
          <div className="flex gap-4">
            <Link
              href="/profile"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={() => {
                logout();
                toast.info("Logged out", {
                  description: "You have been signed out successfully.",
                });
              }}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 border border-primary text-primary rounded hover:bg-primary/10 inline-block transition-colors dark:hover:bg-primary/20"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
