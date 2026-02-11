// =====================================================
// Form Validation Utilities
// Simple, composable validators for Studio admin forms
// =====================================================
//
// This module provides lightweight, composable validation functions
// for form fields in the Studio admin panel.
//
// For Zod-based schema validation, use @/lib/validations instead.
//
// Usage:
//   import { validators, validate } from "@/lib/validation";
//
//   const error = validate(email, validators.required, validators.email);
//   if (error) setErrors({ email: error });
// =====================================================

/** Validator function type - returns error message or null */
export type ValidatorFn<T> = (value: T) => string | null;

/** Higher-order validator that takes config and returns a validator */
export type ValidatorFactory<T, C> = (config: C) => ValidatorFn<T>;

/**
 * Validators object containing common validation functions
 * Each validator returns an error message if validation fails, null otherwise
 */
export const validators = {
  // =====================================================
  // String Validators
  // =====================================================

  /**
   * Validates that a field is not empty
   * Handles null, undefined, and whitespace-only strings
   */
  required: (value: string | null | undefined): string | null =>
    !value?.trim() ? "This field is required" : null,

  /**
   * Validates email format using RFC 5322 simplified pattern
   */
  email: (value: string): string | null => {
    if (!value) return null; // Use required validator for empty check
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? "Invalid email address"
      : null;
  },

  /**
   * Validates URL format (must start with http:// or https://)
   * Returns null for empty values - use required for mandatory URLs
   */
  url: (value: string): string | null => {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:"
        ? null
        : "URL must start with http:// or https://";
    } catch {
      return "Invalid URL format";
    }
  },

  /**
   * Validates minimum string length
   */
  minLength:
    (min: number): ValidatorFn<string> =>
    (value: string): string | null =>
      value && value.length < min ? `Must be at least ${min} characters` : null,

  /**
   * Validates maximum string length
   */
  maxLength:
    (max: number): ValidatorFn<string> =>
    (value: string): string | null =>
      value && value.length > max ? `Must be at most ${max} characters` : null,

  /**
   * Validates string length is within range
   */
  lengthBetween:
    (min: number, max: number): ValidatorFn<string> =>
    (value: string): string | null => {
      if (!value) return null;
      if (value.length < min) return `Must be at least ${min} characters`;
      if (value.length > max) return `Must be at most ${max} characters`;
      return null;
    },

  /**
   * Validates slug format (lowercase letters, numbers, and hyphens only)
   * Must start and end with alphanumeric character
   */
  slug: (value: string): string | null => {
    if (!value) return null;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return "Must be lowercase letters, numbers, and hyphens (e.g., my-slug-123)";
    }
    return null;
  },

  /**
   * Validates that string matches a custom pattern
   */
  pattern:
    (regex: RegExp, message: string): ValidatorFn<string> =>
    (value: string): string | null => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },

  // =====================================================
  // Number Validators
  // =====================================================

  /**
   * Validates that a number is positive (>= 0)
   */
  positiveNumber: (value: number): string | null =>
    typeof value === "number" && !isNaN(value) && value < 0
      ? "Must be a positive number"
      : null,

  /**
   * Validates that a number is greater than zero
   */
  greaterThanZero: (value: number): string | null =>
    typeof value === "number" && !isNaN(value) && value <= 0
      ? "Must be greater than zero"
      : null,

  /**
   * Validates that a number is between 0 and 100 (inclusive)
   */
  percentage: (value: number): string | null => {
    if (typeof value !== "number" || isNaN(value)) return "Must be a valid number";
    if (value < 0 || value > 100) return "Must be between 0 and 100";
    return null;
  },

  /**
   * Validates number is within range (inclusive)
   */
  numberBetween:
    (min: number, max: number): ValidatorFn<number> =>
    (value: number): string | null => {
      if (typeof value !== "number" || isNaN(value)) return "Must be a valid number";
      if (value < min || value > max) return `Must be between ${min} and ${max}`;
      return null;
    },

  /**
   * Validates minimum number value
   */
  minValue:
    (min: number): ValidatorFn<number> =>
    (value: number): string | null =>
      typeof value === "number" && !isNaN(value) && value < min
        ? `Must be at least ${min}`
        : null,

  /**
   * Validates maximum number value
   */
  maxValue:
    (max: number): ValidatorFn<number> =>
    (value: number): string | null =>
      typeof value === "number" && !isNaN(value) && value > max
        ? `Must be at most ${max}`
        : null,

  // =====================================================
  // String-to-Number Validators
  // =====================================================

  /**
   * Validates that a string value can be parsed as a valid number
   */
  numericString: (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? "Must be a valid number" : null;
  },

  /**
   * Validates that a string value parses to a positive number (>= 0)
   */
  positiveNumericString: (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Must be a positive number";
    return null;
  },

  /**
   * Validates that a string value parses to an integer
   */
  integerString: (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (!Number.isInteger(num)) return "Must be a whole number";
    return null;
  },

  // =====================================================
  // Date Validators
  // =====================================================

  /**
   * Validates that a date is in the future
   */
  futureDate: (value: Date | string): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "Invalid date";
    return date > new Date() ? null : "Date must be in the future";
  },

  /**
   * Validates that a date is in the past
   */
  pastDate: (value: Date | string): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "Invalid date";
    return date < new Date() ? null : "Date must be in the past";
  },

  /**
   * Validates that end date is after start date
   */
  dateAfter:
    (startDate: Date | string, fieldName = "start date"): ValidatorFn<Date | string> =>
    (value: Date | string): string | null => {
      if (!value || !startDate) return null;
      const end = value instanceof Date ? value : new Date(value);
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      if (isNaN(end.getTime()) || isNaN(start.getTime())) return "Invalid date";
      return end > start ? null : `Must be after ${fieldName}`;
    },
} as const;

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
export function validate<T>(
  value: T,
  ...validatorFns: Array<(v: T) => string | null>
): string | null {
  for (const validator of validatorFns) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
}

/**
 * Validates multiple fields at once
 * Returns an object with field names as keys and error messages as values
 *
 * @example
 * const errors = validateFields({
 *   name: [name, validators.required, validators.minLength(2)],
 *   email: [email, validators.required, validators.email],
 * });
 */
export function validateFields<T extends Record<string, unknown>>(
  fields: { [K in keyof T]: [T[K], ...Array<(v: T[K]) => string | null>] }
): FormErrors<Extract<keyof T, string>> {
  const errors: FormErrors<Extract<keyof T, string>> = {};

  for (const [field, [value, ...validators]] of Object.entries(fields)) {
    const error = validate(value, ...validators);
    if (error) {
      errors[field as Extract<keyof T, string>] = error;
    }
  }

  return errors;
}

/**
 * Type for form errors object
 */
export type FormErrors<T extends string> = Partial<Record<T, string>>;

/**
 * Checks if a form errors object has any errors
 */
export function hasErrors<T extends string>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some(
    (error) => error !== null && error !== undefined && error !== ""
  );
}

/**
 * Clears a specific error from the errors object
 * Returns a new object (immutable)
 */
export function clearError<T extends string>(
  errors: FormErrors<T>,
  field: T
): FormErrors<T> {
  const { [field]: _, ...rest } = errors;
  return rest as FormErrors<T>;
}

/**
 * Clears multiple errors from the errors object
 * Returns a new object (immutable)
 */
export function clearErrors<T extends string>(
  errors: FormErrors<T>,
  fields: T[]
): FormErrors<T> {
  const newErrors = { ...errors };
  for (const field of fields) {
    delete newErrors[field];
  }
  return newErrors;
}

/**
 * Sets an error for a specific field
 * Returns a new object (immutable)
 */
export function setError<T extends string>(
  errors: FormErrors<T>,
  field: T,
  message: string
): FormErrors<T> {
  return { ...errors, [field]: message };
}

/**
 * Gets the first error message from errors object
 * Useful for displaying a single error summary
 */
export function getFirstError<T extends string>(
  errors: FormErrors<T>
): string | null {
  const values = Object.values(errors) as (string | undefined)[];
  for (const error of values) {
    if (error) return error;
  }
  return null;
}

/**
 * Counts the number of errors
 */
export function countErrors<T extends string>(errors: FormErrors<T>): number {
  return Object.values(errors).filter(
    (error) => error !== null && error !== undefined && error !== ""
  ).length;
}
