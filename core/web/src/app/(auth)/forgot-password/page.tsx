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
import { Input, Button } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
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
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground mt-2">
              If an account exists for {form.getValues("email")}, we've sent a password reset link.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  form.reset();
                }}
                className="text-primary hover:underline font-medium"
              >
                try again
              </button>
            </p>

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we'll send you a link to reset your password.
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
