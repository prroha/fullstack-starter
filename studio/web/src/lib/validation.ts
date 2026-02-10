// =====================================================
// Form Validation Utilities
// Simple, composable validators for admin forms
// =====================================================

/**
 * Validators object containing common validation functions
 * Each validator returns an error message if validation fails, null otherwise
 */
export const validators = {
  /**
   * Validates that a field is not empty
   */
  required: (value: string) => (!value?.trim() ? "This field is required" : null),

  /**
   * Validates email format
   */
  email: (value: string) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email address" : null,

  /**
   * Validates URL format (must start with http:// or https://)
   */
  url: (value: string) =>
    value && !/^https?:\/\/.+/.test(value) ? "Invalid URL" : null,

  /**
   * Validates minimum string length
   */
  minLength: (min: number) => (value: string) =>
    value.length < min ? `Must be at least ${min} characters` : null,

  /**
   * Validates maximum string length
   */
  maxLength: (max: number) => (value: string) =>
    value.length > max ? `Must be at most ${max} characters` : null,

  /**
   * Validates slug format (lowercase letters, numbers, and hyphens only)
   */
  slug: (value: string) =>
    !/^[a-z0-9-]+$/.test(value)
      ? "Only lowercase letters, numbers, and hyphens allowed"
      : null,

  /**
   * Validates that a number is positive (>= 0)
   */
  positiveNumber: (value: number) =>
    value < 0 ? "Must be a positive number" : null,

  /**
   * Validates that a number is between 0 and 100 (inclusive)
   */
  percentage: (value: number) =>
    value < 0 || value > 100 ? "Must be between 0 and 100" : null,

  /**
   * Validates that a number is greater than zero
   */
  greaterThanZero: (value: number) =>
    value <= 0 ? "Must be greater than zero" : null,

  /**
   * Validates that a string value can be parsed as a valid number
   */
  numericString: (value: string) =>
    isNaN(parseFloat(value)) ? "Must be a valid number" : null,

  /**
   * Validates that a string value parses to a positive number
   */
  positiveNumericString: (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Must be a positive number";
    return null;
  },
};

/**
 * Validates a value against multiple validators
 * Returns the first error message encountered, or null if all validations pass
 *
 * @param value - The value to validate
 * @param validatorFns - Array of validator functions to apply
 * @returns Error message string or null
 *
 * @example
 * const error = validate(name, validators.required, validators.minLength(2));
 * if (error) {
 *   setErrors({ name: error });
 * }
 */
export const validate = <T>(
  value: T,
  ...validatorFns: ((v: T) => string | null)[]
): string | null => {
  for (const validator of validatorFns) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

/**
 * Type for form errors object
 */
export type FormErrors<T extends string> = Partial<Record<T, string>>;

/**
 * Checks if a form errors object has any errors
 */
export const hasErrors = <T extends string>(errors: FormErrors<T>): boolean => {
  return Object.values(errors).some((error) => error !== null && error !== undefined);
};

/**
 * Clears a specific error from the errors object
 */
export const clearError = <T extends string>(
  errors: FormErrors<T>,
  field: T
): FormErrors<T> => {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
};
