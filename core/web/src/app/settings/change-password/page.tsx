"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import {
  Form,
  FormFieldPassword,
  FormStatusMessage,
  useZodForm,
} from "@/components/forms";
import { Button } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useZodForm({
    schema: changePasswordSchema,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Redirect if not authenticated
  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError(null);
    setSuccess(null);

    try {
      await api.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmNewPassword
      );

      logger.info("Auth", "Password changed successfully");
      setSuccess("Password changed successfully!");
      toast.success("Password changed", {
        description: "Your password has been updated successfully.",
      });
      form.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Auth", "Password change failed", { code: err.code });
        setError(err.message);
        toast.error("Password change failed", {
          description: err.message,
        });
      } else {
        logger.error("Auth", "Unexpected password change error", err);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Password change failed", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
          <p className="text-muted-foreground mt-2">
            Update your password to keep your account secure
          </p>
        </div>

        <FormErrorBoundary>
          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            <FormStatusMessage variant="error" message={error} />
            <FormStatusMessage variant="success" message={success} />

            <FormFieldPassword
              control={form.control}
              name="currentPassword"
              label="Current Password"
              required
              placeholder="Enter your current password"
              autoComplete="current-password"
            />

            <FormFieldPassword
              control={form.control}
              name="newPassword"
              label="New Password"
              required
              placeholder="Enter your new password"
              autoComplete="new-password"
            />

            <FormFieldPassword
              control={form.control}
              name="confirmNewPassword"
              label="Confirm New Password"
              required
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                isLoading={form.formState.isSubmitting}
              >
                Change Password
              </Button>

              <Link
                href="/"
                className="text-center text-sm text-muted-foreground hover:text-foreground "
              >
                Back to Home
              </Link>
            </div>
          </Form>
        </FormErrorBoundary>
      </div>
    </div>
  );
}
