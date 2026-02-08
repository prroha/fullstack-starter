"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import {
  Form,
  FormFieldInput,
  FormStatusMessage,
  useZodForm,
} from "@/components/forms";
import { Button, AuthLayout, AppLink, Text, Icon } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

// Auth Logo Component - Key icon for password reset
function AuthLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name="KeyRound" size="lg" color="primary" />
      </div>
    </div>
  );
}

// Email Sent Icon
function EmailSentLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name="Mail" size="lg" color="primary" />
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
          <Text as="p" size="sm" color="muted">
            <AppLink href="/login" variant="primary" size="sm">
              Back to sign in
            </AppLink>
          </Text>
        }
      >
        <div className="space-y-4 text-center">
          <Text as="p" size="sm" color="muted">
            Didn&apos;t receive the email? Check your spam folder or{" "}
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
          </Text>
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
        <Text as="p" size="sm" color="muted">
          Remember your password?{" "}
          <AppLink href="/login" variant="primary" size="sm">
            Sign in
          </AppLink>
        </Text>
      }
    >
      <FormErrorBoundary>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FormStatusMessage variant="error" message={error} />

          <FormFieldInput
            control={form.control}
            name="email"
            label="Email"
            required
            type="email"
            placeholder="you@example.com"
            inputProps={{ autoComplete: "email" }}
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
