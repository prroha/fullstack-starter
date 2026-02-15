"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import {
  Form,
  FormFieldPassword,
  FormStatusMessage,
  useZodForm,
} from "@/components/forms";
import { Button, SkeletonAuth, AuthLayout, AppLink, Text, Icon } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

// Auth Logo Component - Lock icon for reset password
function AuthLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name="Lock" size="lg" color="primary" />
      </div>
    </div>
  );
}

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

// Success Logo Component
function SuccessLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
        <Icon name="Check" size="lg" color="success" />
      </div>
    </div>
  );
}

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
      <AuthLayout
        title="Verifying Reset Link"
        subtitle="Please wait while we verify your request."
        logo={<LoadingLogo />}
        maxWidth="sm"
        showBackgroundPattern
      >
        <div className="py-4" />
      </AuthLayout>
    );
  }

  // Invalid or missing token
  if (!token || !isValidToken) {
    return (
      <AuthLayout
        title="Invalid or Expired Link"
        subtitle="This password reset link is invalid or has expired. Please request a new one."
        logo={<ErrorLogo />}
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
        <AppLink href="/forgot-password" className="block" underline="none">
          <Button className="w-full">Request new reset link</Button>
        </AppLink>
      </AuthLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been reset. Redirecting you to sign in..."
        logo={<SuccessLogo />}
        maxWidth="sm"
        showBackgroundPattern
        footer={
          <Text as="p" size="sm" color="muted">
            <AppLink href="/login" variant="primary" size="sm">
              Click here if you&apos;re not redirected
            </AppLink>
          </Text>
        }
      >
        <div className="py-4" />
      </AuthLayout>
    );
  }

  // Reset form
  return (
    <AuthLayout
      title="Set New Password"
      subtitle={
        tokenEmail
          ? `Enter a new password for ${tokenEmail}`
          : "Enter your new password below"
      }
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

          <FormFieldPassword
            control={form.control}
            name="password"
            label="New Password"
            required
            placeholder="Enter your new password"
            description="Must be at least 8 characters with uppercase, lowercase, and a number."
            autoComplete="new-password"
          />

          <FormFieldPassword
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            required
            placeholder="Confirm your new password"
            autoComplete="new-password"
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
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<SkeletonAuth />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
