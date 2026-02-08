"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
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
        <Icon name="UserPlus" size="lg" color="primary" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm({
    schema: registerSchema,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await api.register(data.email, data.password, data.name || undefined);
      logger.info("Auth", "User registered successfully", { email: data.email });
      toast.success("Account created!", {
        description: "Please sign in with your new credentials.",
      });
      router.push("/login?registered=true");
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Auth", "Registration failed", { email: data.email, code: err.code });
        setError(err.message);
        toast.error("Registration failed", {
          description: err.message,
        });
      } else {
        logger.error("Auth", "Unexpected registration error", err);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Registration failed", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Get started with your free account"
      logo={<AuthLogo />}
      maxWidth="sm"
      showBackgroundPattern
      footer={
        <Text as="p" size="sm" color="muted">
          Already have an account?{" "}
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
            name="name"
            label="Name"
            placeholder="John Doe"
            description="This is optional but helps personalize your experience."
            inputProps={{ autoComplete: "name" }}
          />

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
            placeholder="Create a strong password"
            description="Must be at least 8 characters with uppercase, lowercase, and a number."
            inputProps={{ autoComplete: "new-password" }}
          />

          <FormFieldInput
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            required
            type="password"
            placeholder="Confirm your password"
            inputProps={{ autoComplete: "new-password" }}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={form.formState.isSubmitting}
          >
            Create account
          </Button>
        </Form>
      </FormErrorBoundary>
    </AuthLayout>
  );
}
