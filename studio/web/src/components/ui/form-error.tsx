// =====================================================
// Form Error Component
// Displays inline error messages for form fields
// =====================================================

interface FormErrorProps {
  /** The error message to display */
  message?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FormError component for displaying inline validation errors
 * Returns null if no message is provided
 *
 * @example
 * <FormError message={errors.email} />
 */
export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;
  return (
    <p className={`text-sm text-destructive mt-1 ${className}`.trim()} role="alert">
      {message}
    </p>
  );
}
