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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useZodForm,
  PasswordInput,
} from "@/components/forms";
import { Button } from "@/components/ui";
import { FormErrorBoundary } from "@/components/shared";

// =====================================================
// Icon Component
// =====================================================

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

// =====================================================
// Change Password Page
// =====================================================

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
    <div className="max-w-md mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
        <p className="text-muted-foreground mt-2">
          Update your password to keep your account secure
        </p>
      </div>

      {/* Form */}
      <div className="p-6 rounded-lg border bg-card">
        <FormErrorBoundary>
          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/50">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-500/10 border border-green-500/50">
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Current Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={form.formState.isSubmitting}
              >
                Change Password
              </Button>
            </div>
          </Form>
        </FormErrorBoundary>
      </div>
    </div>
  );
}
