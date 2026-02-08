"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, SkeletonAuth, AuthLayout } from "@/components/ui";

// Loading Logo Component
function LoadingLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center animate-pulse">
        <svg
          className="h-7 w-7 text-muted-foreground animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
}

// Success Logo Component
function SuccessLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
        <svg
          className="h-7 w-7 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}

// Error Logo Component
function ErrorLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
        <svg
          className="h-7 w-7 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
    </div>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Verify email on mount
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setIsVerifying(false);
        setError("No verification token provided");
        return;
      }

      try {
        const response = await api.verifyEmail(token);
        if (response.data?.verified) {
          setIsSuccess(true);
          setVerifiedEmail(response.data.email);
          logger.info("Auth", "Email verified successfully");
          toast.success("Email verified!", {
            description: "Your email has been verified successfully.",
          });
          // Redirect to home after a short delay
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setError("Failed to verify email");
        }
      } catch (err) {
        if (err instanceof ApiError) {
          logger.warn("Auth", "Email verification failed", { code: err.code });
          setError(err.message);
        } else {
          logger.error("Auth", "Unexpected email verification error", err);
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  // Loading state
  if (isVerifying) {
    return (
      <AuthLayout
        title="Verifying Your Email"
        subtitle="Please wait while we verify your email address."
        logo={<LoadingLogo />}
        maxWidth="sm"
        showBackgroundPattern
      >
        <div className="py-4" />
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout
        title="Email Verified"
        subtitle={
          verifiedEmail
            ? `Your email ${verifiedEmail} has been verified successfully.`
            : "Your email has been verified successfully."
        }
        logo={<SuccessLogo />}
        maxWidth="sm"
        showBackgroundPattern
        footer={
          <p>
            <Link href="/">Click here if you are not redirected</Link>
          </p>
        }
      >
        <p className="text-center text-sm text-muted-foreground py-2">
          Redirecting you to the dashboard...
        </p>
      </AuthLayout>
    );
  }

  // Error state
  return (
    <AuthLayout
      title="Verification Failed"
      subtitle={error || "Unable to verify your email. The link may be invalid or expired."}
      logo={<ErrorLogo />}
      maxWidth="sm"
      showBackgroundPattern
      footer={
        <p>
          Need a new verification link?{" "}
          <Link href="/login">Sign in</Link>{" "}
          and request a new one.
        </p>
      }
    >
      <Link href="/login" className="block">
        <Button className="w-full">Go to sign in</Button>
      </Link>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<SkeletonAuth />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
