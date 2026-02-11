// =====================================================
// Zod Schema Validations
// =====================================================
//
// Re-exports Zod-based validation schemas from core.
// Use these for complex form validation with React Hook Form
// or for API request/response validation.
//
// For simple field validation, use @/lib/validation instead.
//
// Available exports:
// - loginSchema, LoginFormData
// - registerSchema, RegisterFormData
// - profileSchema, ProfileFormData
// - changePasswordSchema, ChangePasswordFormData
// - forgotPasswordSchema, ForgotPasswordFormData
// - resetPasswordSchema, ResetPasswordFormData
// - contactSchema, ContactFormData
// - getZodErrorMessages(error) - Extract error messages
// - validateWithSchema(schema, data) - Validate data
// =====================================================

export * from "@core/lib/validations";
