"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useZodForm,
} from "@/components/forms";
import { Input, Button, AuthLayout } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

// Auth Logo Component - Key icon for password reset
function AuthLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <svg
          className="h-7 w-7 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
    </div>
  );
}

// Email Sent Icon
function EmailSentLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <svg
          className="h-7 w-7 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm({
    schema: forgotPasswordSchema,
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    try {
      await api.forgotPassword(data.email);
      logger.info("Auth", "Forgot password request submitted", { email: data.email });
      setSubmitted(true);
      toast.success("Check your email", {
        description: "If an account exists, we've sent a password reset link.",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Auth", "Forgot password request failed", { email: data.email, code: err.code });
        setError(err.message);
        toast.error("Request failed", {
          description: err.message,
        });
      } else {
        logger.error("Auth", "Unexpected forgot password error", err);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Request failed", {
          description: errorMessage,
        });
      }
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle={`If an account exists for ${form.getValues("email")}, we've sent a password reset link.`}
        logo={<EmailSentLogo />}
        maxWidth="sm"
        showBackgroundPattern
        footer={
          <p>
            <Link href="/login">Back to sign in</Link>
          </p>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
              className="text-foreground underline-offset-4 hover:underline font-medium"
            >
              try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      logo={<AuthLogo />}
      maxWidth="sm"
      showBackgroundPattern
      footer={
        <p>
          Remember your password?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      }
    >
      <FormErrorBoundary>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/50">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
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
            Send reset link
          </Button>
        </Form>
      </FormErrorBoundary>
    </AuthLayout>
  );
}
