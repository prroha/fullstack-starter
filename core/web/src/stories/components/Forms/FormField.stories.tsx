import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import { Form, useZodForm } from "@/components/forms/form";
import {
  FormFieldInput,
  FormFieldTextarea,
  FormFieldSelect,
  FormFieldCheckbox,
  FormFieldPassword,
} from "@/components/forms/form-field";
import { useState } from "react";

/**
 * Pre-composed form field components that combine FormField, FormItem, FormLabel,
 * FormControl, FormDescription, and FormMessage into single-line usage.
 */
const meta: Meta = {
  title: "Components/Forms/FormField",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Pre-composed form field components (FormFieldInput, FormFieldTextarea, FormFieldSelect, FormFieldCheckbox, FormFieldPassword) that reduce boilerplate by combining label, control, description, and error message into a single component.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// FormFieldInput
export const InputField: Story = {
  render: function InputFieldStory() {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Please enter a valid email"),
    });

    const form = useZodForm({ schema });
    const [result, setResult] = useState<string | null>(null);

    return (
      <div className="max-w-md">
        <Form form={form} onSubmit={(data) => setResult(JSON.stringify(data, null, 2))}>
          <FormFieldInput
            control={form.control}
            name="name"
            label="Full Name"
            placeholder="John Doe"
            required
            description="Your display name"
          />
          <FormFieldInput
            control={form.control}
            name="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Submit
          </button>
        </Form>
        {result && (
          <pre className="mt-4 p-3 rounded-md bg-muted text-sm">{result}</pre>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormFieldInput wraps an Input with label, description, and error message handling.",
      },
    },
  },
};

// FormFieldTextarea
export const TextareaField: Story = {
  render: function TextareaFieldStory() {
    const schema = z.object({
      message: z.string().min(10, "Message must be at least 10 characters"),
    });

    const form = useZodForm({ schema });

    return (
      <div className="max-w-md">
        <Form form={form} onSubmit={(data) => alert(JSON.stringify(data))}>
          <FormFieldTextarea
            control={form.control}
            name="message"
            label="Message"
            placeholder="Type your message here..."
            required
            description="Minimum 10 characters"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send
          </button>
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormFieldTextarea wraps a Textarea with label, description, and error message handling.",
      },
    },
  },
};

// FormFieldSelect
export const SelectField: Story = {
  render: function SelectFieldStory() {
    const schema = z.object({
      role: z.string().min(1, "Please select a role"),
      department: z.string().min(1, "Please select a department"),
    });

    const form = useZodForm({ schema, defaultValues: { role: "", department: "" } });

    return (
      <div className="max-w-md">
        <Form form={form} onSubmit={(data) => alert(JSON.stringify(data))}>
          <FormFieldSelect
            control={form.control}
            name="role"
            label="Role"
            placeholder="Select a role"
            required
            options={[
              { label: "Admin", value: "admin" },
              { label: "Editor", value: "editor" },
              { label: "Viewer", value: "viewer" },
            ]}
          />
          <FormFieldSelect
            control={form.control}
            name="department"
            label="Department"
            placeholder="Select a department"
            required
            description="Which team are you on?"
            options={[
              { label: "Engineering", value: "engineering" },
              { label: "Design", value: "design" },
              { label: "Marketing", value: "marketing" },
              { label: "Sales", value: "sales" },
            ]}
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormFieldSelect wraps a native select with label, options, and error message handling.",
      },
    },
  },
};

// FormFieldCheckbox
export const CheckboxField: Story = {
  render: function CheckboxFieldStory() {
    const schema = z.object({
      terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
      newsletter: z.boolean().optional(),
    });

    const form = useZodForm({ schema, defaultValues: { terms: false, newsletter: false } });

    return (
      <div className="max-w-md">
        <Form form={form} onSubmit={(data) => alert(JSON.stringify(data))}>
          <FormFieldCheckbox
            control={form.control}
            name="terms"
            label="I accept the terms and conditions"
            description="You must agree before submitting."
          />
          <FormFieldCheckbox
            control={form.control}
            name="newsletter"
            label="Subscribe to newsletter"
            description="Receive weekly updates via email."
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Register
          </button>
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormFieldCheckbox renders a checkbox with label and description, suitable for boolean form fields.",
      },
    },
  },
};

// FormFieldPassword
export const PasswordField: Story = {
  render: function PasswordFieldStory() {
    const schema = z.object({
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

    const form = useZodForm({ schema });

    return (
      <div className="max-w-md">
        <Form form={form} onSubmit={(_) => alert("Password set successfully!")}>
          <FormFieldPassword
            control={form.control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            required
            autoComplete="new-password"
          />
          <FormFieldPassword
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Set Password
          </button>
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormFieldPassword wraps a PasswordInput with show/hide toggle, label, and error message handling.",
      },
    },
  },
};
