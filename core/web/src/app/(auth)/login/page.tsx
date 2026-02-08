"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { loginSchema, type LoginFormData } from "@/lib/validations";
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

// Auth Logo Component
function AuthLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name="Lock" size="lg" color="primary" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      logger.info("Auth", "User logged in successfully", { email: data.email });
      toast.success("Welcome back!", {
        description: "You have been signed in successfully.",
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Auth", "Login failed", { email: data.email, code: err.code });
        setError(err.message);
        toast.error("Login failed", {
          description: err.message,
        });
      } else {
        logger.error("Auth", "Unexpected login error", err);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Login failed", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      logo={<AuthLogo />}
      maxWidth="sm"
      showBackgroundPattern
      footer={
        <div className="space-y-2">
          <Text as="p" size="sm" color="muted">
            Don&apos;t have an account?{" "}
            <AppLink href="/register" variant="primary" size="sm">
              Create account
            </AppLink>
          </Text>
          <Text as="p" size="sm" color="muted">
            <AppLink href="/forgot-password" variant="primary" size="sm">
              Forgot your password?
            </AppLink>
          </Text>
        </div>
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

          <FormFieldInput
            control={form.control}
            name="password"
            label="Password"
            required
            type="password"
            placeholder="Enter your password"
            inputProps={{ autoComplete: "current-password" }}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={form.formState.isSubmitting}
          >
            Sign in
          </Button>
        </Form>
      </FormErrorBoundary>
    </AuthLayout>
  );
}
