import { z } from "zod";
import { VALIDATION, ERROR_MESSAGES } from "./constants";

// =====================================================
// Common validation patterns
// =====================================================

const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
  .email(ERROR_MESSAGES.EMAIL_INVALID);

const passwordSchema = z
  .string()
  .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED)
  .min(VALIDATION.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_MIN_LENGTH)
  .regex(
    VALIDATION.PASSWORD_COMPLEXITY_PATTERN,
    ERROR_MESSAGES.PASSWORD_COMPLEXITY
  );

const nameSchema = z
  .string()
  .min(1, ERROR_MESSAGES.NAME_REQUIRED)
  .min(VALIDATION.NAME_MIN_LENGTH, ERROR_MESSAGES.NAME_MIN_LENGTH)
  .max(VALIDATION.NAME_MAX_LENGTH, ERROR_MESSAGES.NAME_MAX_LENGTH)
  .regex(VALIDATION.NAME_PATTERN, ERROR_MESSAGES.NAME_INVALID_CHARS);

// =====================================================
// Login Schema
// =====================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ERROR_MESSAGES.PASSWORD_REQUIRED),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// =====================================================
// Register Schema
// =====================================================

export const registerSchema = z
  .object({
    name: nameSchema.optional().or(z.literal("")),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// =====================================================
// Profile Schema
// =====================================================

export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  bio: z
    .string()
    .max(VALIDATION.BIO_MAX_LENGTH, `Bio must be less than ${VALIDATION.BIO_MAX_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(VALIDATION.PHONE_PATTERN, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// =====================================================
// Update Profile Schema (for profile edit form)
// =====================================================

export const updateProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// =====================================================
// Password Change Schema
// =====================================================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, ERROR_MESSAGES.CURRENT_PASSWORD_REQUIRED),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, ERROR_MESSAGES.CONFIRM_NEW_PASSWORD_REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: ERROR_MESSAGES.PASSWORD_SAME_AS_CURRENT,
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// =====================================================
// Forgot Password Schema
// =====================================================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// =====================================================
// Reset Password Schema
// =====================================================

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// =====================================================
// Contact Form Schema
// =====================================================

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  subject: z
    .string()
    .min(1, "Subject is required")
    .min(3, "Subject must be at least 3 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// =====================================================
// Utility functions
// =====================================================

/**
 * Extract error messages from Zod validation errors
 */
export function getZodErrorMessages(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}

/**
 * Validate data against a schema and return errors or null
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: getZodErrorMessages(result.error) };
}
