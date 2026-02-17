"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner, ThemeToggle, Button, Text } from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";
import { CardSection } from "@/components/layout";

export default function Home() {
  const router = useRouter();
  const { user: _user, isLoading, isAuthenticated, isAdmin } = useAuth();

  // Redirect authenticated users to appropriate dashboard based on role
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Admins and Super Admins go to admin dashboard
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <Text color="muted">Loading...</Text>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <Text color="muted">Redirecting...</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="dropdown" size="md" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Icon name="Layers" size="xl" color="primary" className="h-16 w-16" />
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary">Starter Template</span>
            </h1>
            <Text size="lg" color="muted" className="max-w-2xl mx-auto">
              A full-stack starter template with authentication, theming, and everything you need to get started quickly.
            </Text>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/login")}>
              Sign In
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/register")}>
              Create Account
            </Button>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-4 pt-8 text-left">
            <CardSection title="Authentication">
              <Text variant="caption" color="muted">
                Secure login, registration, and session management out of the box.
              </Text>
            </CardSection>
            <CardSection title="Theming">
              <Text variant="caption" color="muted">
                Multiple color themes with light/dark mode support.
              </Text>
            </CardSection>
            <CardSection title="Dashboard">
              <Text variant="caption" color="muted">
                User dashboard with profile, settings, and notifications.
              </Text>
            </CardSection>
          </div>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-8 flex items-center gap-4">
          <AppLink href="/about" variant="muted" size="sm">
            About
          </AppLink>
          <AppLink href="/terms" variant="muted" size="sm">
            Terms
          </AppLink>
          <AppLink href="/privacy" variant="muted" size="sm">
            Privacy
          </AppLink>
          <AppLink href="/contact" variant="muted" size="sm">
            Contact
          </AppLink>
        </div>
      </div>
    </div>
  );
}
