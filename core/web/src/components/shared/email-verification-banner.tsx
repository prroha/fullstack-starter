"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface EmailVerificationBannerProps {
  email?: string;
  className?: string;
  onDismiss?: () => void;
}

export function EmailVerificationBanner({
  email,
  className,
  onDismiss,
}: EmailVerificationBannerProps) {
  const [isSending, setIsSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      await api.sendVerificationEmail();
      toast.success("Verification email sent", {
        description: "Please check your inbox for the verification link.",
      });
      logger.info("Auth", "Verification email resent");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error("Failed to send verification email", {
          description: err.message,
        });
        logger.warn("Auth", "Failed to resend verification email", { code: err.code });
      } else {
        toast.error("Failed to send verification email", {
          description: "An unexpected error occurred. Please try again.",
        });
        logger.error("Auth", "Unexpected error resending verification email", err);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Verify your email address.</span>
              {email && (
                <span className="hidden sm:inline">
                  {" "}
                  We sent a verification link to <strong>{email}</strong>.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              isLoading={isSending}
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900"
            >
              Resend email
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-md text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              aria-label="Dismiss"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
