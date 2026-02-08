"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, SkeletonAuth } from "@/components/ui";

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center animate-pulse">
              <svg
                className="w-6 h-6 text-muted-foreground animate-spin"
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
            <h1 className="text-2xl font-bold tracking-tight">Verifying your email...</h1>
            <p className="text-muted-foreground mt-2">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
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
            <h1 className="text-2xl font-bold tracking-tight">Email verified!</h1>
            <p className="text-muted-foreground mt-2">
              {verifiedEmail ? (
                <>
                  Your email <strong>{verifiedEmail}</strong> has been verified successfully.
                </>
              ) : (
                "Your email has been verified successfully."
              )}
            </p>
            <p className="text-muted-foreground mt-2">
              Redirecting you to the dashboard...
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:underline font-medium">
              Click here if you are not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-destructive"
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
          <h1 className="text-2xl font-bold tracking-tight">Verification failed</h1>
          <p className="text-muted-foreground mt-2">
            {error || "Unable to verify your email. The link may be invalid or expired."}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full">Go to sign in</Button>
          </Link>
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need a new verification link?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>{" "}
              and request a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<SkeletonAuth />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
