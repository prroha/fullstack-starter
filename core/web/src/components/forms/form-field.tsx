"use client";

import * as React from "react";
import { ControllerProps, FieldValues, FieldPath } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";

// =====================================================
// Pre-composed Form Field Component
// =====================================================

interface FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
  inputProps?: Omit<InputProps, "type" | "placeholder">;
}

function FormFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  type = "text",
  className,
  inputProps,
  ...controllerProps
}: FormFieldInputProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...inputProps}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// =====================================================
// Pre-composed Form Field Textarea Component
// =====================================================

interface FormFieldTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  textareaProps?: Omit<TextareaProps, "placeholder">;
}

function FormFieldTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  className,
  textareaProps,
  ...controllerProps
}: FormFieldTextareaProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Textarea placeholder={placeholder} {...textareaProps} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// =====================================================
// Pre-composed Form Field Select Component (placeholder)
// =====================================================

interface FormFieldSelectOption {
  label: string;
  value: string;
}

interface FormFieldSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options: FormFieldSelectOption[];
  className?: string;
}

function FormFieldSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  options,
  className,
  ...controllerProps
}: FormFieldSelectProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <select
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              {...field}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// =====================================================
// Pre-composed Form Field Checkbox Component
// =====================================================

interface FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
  label: string;
  description?: string;
  className?: string;
}

function FormFieldCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  className,
  ...controllerProps
}: FormFieldCheckboxProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start gap-3", className)}>
          <FormControl>
            <input
              type="checkbox"
              className={cn(
                "h-4 w-4 rounded border border-input bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              checked={field.value}
              onChange={field.onChange}
              ref={field.ref}
              name={field.name}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export {
  FormFieldInput,
  FormFieldTextarea,
  FormFieldSelect,
  FormFieldCheckbox,
};
export type {
  FormFieldInputProps,
  FormFieldTextareaProps,
  FormFieldSelectProps,
  FormFieldSelectOption,
  FormFieldCheckboxProps,
};
