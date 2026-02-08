"use client";

import * as React from "react";
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
}

function useZodForm<T extends z.ZodType>({
  schema,
  defaultValues,
  mode = "onSubmit",
}: UseZodFormProps<T>) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
    mode,
  });
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
  useZodForm,
  useFormField,
};

export type { FormProps, FormLabelProps, FormDescriptionProps, FormMessageProps, UseZodFormProps };
