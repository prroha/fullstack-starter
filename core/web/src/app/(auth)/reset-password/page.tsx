"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useZodForm,
} from "@/components/forms";
import { Input, Button, SkeletonAuth } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useZodForm({
    schema: resetPasswordSchema,
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        return;
      }

      try {
        const response = await api.verifyResetToken(token);
        if (response.data?.valid) {
          setIsValidToken(true);
          setTokenEmail(response.data.email || null);
        } else {
          setIsValidToken(false);
        }
      } catch (err) {
        logger.error("Auth", "Token verification failed", err);
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setError(null);
    try {
      await api.resetPassword(token, data.password, data.confirmPassword);
      logger.info("Auth", "Password reset successful");
      setSuccess(true);
      toast.success("Password reset successful!", {
        description: "You can now sign in with your new password.",
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Auth", "Password reset failed", { code: err.code });
        setError(err.message);
        toast.error("Reset failed", {
          description: err.message,
        });
      } else {
        logger.error("Auth", "Unexpected password reset error", err);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Reset failed", {
          description: errorMessage,
        });
      }
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Verifying reset link...</h1>
            <p className="text-muted-foreground mt-2">Please wait while we verify your request.</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !isValidToken) {
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
            <h1 className="text-2xl font-bold tracking-tight">Invalid or expired link</h1>
            <p className="text-muted-foreground mt-2">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/forgot-password" className="block">
              <Button className="w-full">Request new reset link</Button>
            </Link>
            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
            <h1 className="text-2xl font-bold tracking-tight">Password reset successful!</h1>
            <p className="text-muted-foreground mt-2">
              Your password has been reset. Redirecting you to sign in...
            </p>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:underline font-medium">
              Click here if you're not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground mt-2">
            {tokenEmail ? (
              <>
                Enter a new password for <strong>{tokenEmail}</strong>
              </>
            ) : (
              "Enter your new password below"
            )}
          </p>
        </div>

        <FormErrorBoundary>
          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/50">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Must be at least 8 characters with uppercase, lowercase, and a number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={form.formState.isSubmitting}
            >
              Reset password
            </Button>
          </Form>
        </FormErrorBoundary>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<SkeletonAuth />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
