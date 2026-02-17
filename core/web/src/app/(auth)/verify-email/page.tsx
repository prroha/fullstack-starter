"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, SkeletonAuth, AuthLayout, AppLink, Text, Icon } from "@/components/ui";

// Loading Logo Component
function LoadingLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center animate-pulse">
        <Icon name="LoaderCircle" size="lg" color="muted" className="animate-spin" />
      </div>
    </div>
  );
}

// Success Logo Component
function SuccessLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
        <Icon name="Check" size="lg" color="success" />
      </div>
    </div>
  );
}

// Error Logo Component
function ErrorLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
        <Icon name="TriangleAlert" size="lg" color="destructive" />
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
          <Text as="p" size="sm" color="muted">
            <AppLink href="/" variant="primary" size="sm">
              Click here if you are not redirected
            </AppLink>
          </Text>
        }
      >
        <Text as="p" size="sm" color="muted" className="text-center py-2">
          Redirecting you to the dashboard...
        </Text>
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
        <Text as="p" size="sm" color="muted">
          Need a new verification link?{" "}
          <AppLink href="/login" variant="primary" size="sm">
            Sign in
          </AppLink>{" "}
          and request a new one.
        </Text>
      }
    >
      <AppLink href="/login" className="block" underline="none">
        <Button className="w-full">Go to sign in</Button>
      </AppLink>
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
