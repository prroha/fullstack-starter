"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";
import { EmailVerificationBanner } from "@/components/shared";

/**
 * Protected layout that requires authentication.
 * Redirects to login if user is not authenticated.
 * Shows email verification banner if email is not verified.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isEmailVerified, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {!isEmailVerified && <EmailVerificationBanner email={user?.email ?? undefined} />}
      {children}
    </>
  );
}
