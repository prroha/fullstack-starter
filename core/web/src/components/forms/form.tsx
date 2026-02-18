"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  FieldPath,
  Controller,
  ControllerProps,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Lazy-load Button to avoid circular dependency (Button may import form components)
const Button = dynamic(
  () => import("@/components/ui/button").then((mod) => ({ default: mod.Button })),
  { ssr: false }
);

// =====================================================
// Form Root Component
// =====================================================

interface FormProps<TFieldValues extends FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  children: React.ReactNode;
}

function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

// =====================================================
// Form Field Context
// =====================================================

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField must be used within a FormField");
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    name: fieldContext.name,
    ...fieldState,
  };
}

// =====================================================
// Form Item Context
// =====================================================

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

// =====================================================
// Form Item Component
// =====================================================

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function FormItem({ className, children, ...props }: FormItemProps) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

// =====================================================
// Form Label Component
// =====================================================

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

function FormLabel({ className, required, children, ...props }: FormLabelProps) {
  const { error } = useFormField();
  const { id } = React.useContext(FormItemContext) ?? { id: undefined };

  return (
    <label
      htmlFor={id}
      className={cn(
        "text-sm font-medium leading-none",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

// =====================================================
// Form Control Component
// =====================================================

function FormControl({ children }: { children: React.ReactElement }) {
  const { error, name } = useFormField();
  const { id } = React.useContext(FormItemContext) ?? { id: undefined };

  return React.cloneElement(children, {
    id,
    name,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as React.Attributes & Record<string, unknown>);
}

// =====================================================
// Form Description Component
// =====================================================

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormDescription({ className, ...props }: FormDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

// =====================================================
// Form Message Component
// =====================================================

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FormMessage({ className, children, ...props }: FormMessageProps) {
  const { error } = useFormField();
  const { id } = React.useContext(FormItemContext) ?? { id: undefined };
  const message = error?.message ?? children;

  if (!message) {
    return null;
  }

  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {message}
    </p>
  );
}

// =====================================================
// useZodForm Hook
// =====================================================

interface UseZodFormProps<T extends z.ZodType> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  mode?: "onSubmit" | "onChange" | "onBlur" | "onTouched" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
}

function useZodForm<T extends z.ZodType>({
  schema,
  defaultValues,
  // "onBlur" provides immediate feedback when user leaves a field, which is better UX
  // than waiting for form submission. Users see validation errors right away while
  // the context of what they entered is still fresh in their mind.
  mode = "onBlur",
  // "onChange" for reValidateMode clears errors as the user types corrections,
  // providing responsive feedback that their fix is working.
  reValidateMode = "onChange",
}: UseZodFormProps<T>) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
    mode,
    reValidateMode,
  });
}

// =====================================================
// Form Status Message Component (for success/error messages)
// =====================================================

type FormStatusVariant = "error" | "success" | "info" | "warning";

interface FormStatusMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: FormStatusVariant;
  message?: string | null;
  title?: string;
}

const statusVariants: Record<FormStatusVariant, string> = {
  error: "bg-destructive/10 border-destructive/50 text-destructive",
  success: "bg-success/10 border-success/50 text-success",
  info: "bg-primary/10 border-primary/50 text-primary",
  warning: "bg-warning/10 border-warning/50 text-warning",
};

function FormStatusMessage({
  variant,
  message,
  title,
  className,
  children,
  ...props
}: FormStatusMessageProps) {
  const content = message ?? children;

  if (!content) {
    return null;
  }

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "p-3 rounded-md border",
        statusVariants[variant],
        className
      )}
      {...props}
    >
      {title && <p className="text-sm font-medium mb-1">{title}</p>}
      <p className="text-sm">{content}</p>
    </div>
  );
}

// =====================================================
// Form Actions Component (submit + optional cancel)
// =====================================================

interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  fullWidth?: boolean;
  align?: "left" | "center" | "right" | "between";
}

function FormActions({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onCancel,
  fullWidth = false,
  align = "left",
  className,
  children,
  ...props
}: FormActionsProps) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  // If children are provided, render them instead of default buttons
  if (children) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 pt-4",
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 pt-4",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      <Button
        type="submit"
        className={fullWidth ? "w-full" : undefined}
        isLoading={isSubmitting}
      >
        {submitLabel}
      </Button>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormStatusMessage,
  FormActions,
  useZodForm,
  useFormField,
};

export type {
  FormProps,
  FormLabelProps,
  FormDescriptionProps,
  FormMessageProps,
  FormStatusMessageProps,
  FormActionsProps,
  UseZodFormProps,
};
