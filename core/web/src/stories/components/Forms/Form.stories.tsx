import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";
import {
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
} from "@/components/forms/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

/**
 * The Form component integrates react-hook-form with Zod validation,
 * providing a structured way to build forms with automatic validation and error handling.
 */
const meta: Meta<typeof Form> = {
  title: "Components/Forms/Form",
  component: Form,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A form component built on react-hook-form with Zod schema validation. Includes sub-components for fields, labels, controls, descriptions, error messages, status messages, and form actions.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form
export const Default: Story = {
  render: function BasicForm() {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Please enter a valid email"),
    });

    const form = useZodForm({ schema });
    const [submitted, setSubmitted] = useState<string | null>(null);

    return (
      <div className="max-w-md">
        <Form
          form={form}
          onSubmit={(data) => setSubmitted(JSON.stringify(data, null, 2))}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  We will never share your email with anyone.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions submitLabel="Submit" />
        </Form>
        {submitted && (
          <pre className="mt-4 p-3 rounded-md bg-muted text-sm overflow-auto">
            {submitted}
          </pre>
        )}
      </div>
    );
  },
};

// Form with status messages
export const WithStatusMessages: Story = {
  render: function StatusMessageForm() {
    const schema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
    });

    const form = useZodForm({ schema });
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (data: z.infer<typeof schema>) => {
      // Simulate API call
      if (data.username === "taken") {
        setStatus("error");
      } else {
        setStatus("success");
      }
    };

    return (
      <div className="max-w-md space-y-4">
        {status === "success" && (
          <FormStatusMessage
            variant="success"
            title="Account created"
            message="Your account has been created successfully."
          />
        )}
        {status === "error" && (
          <FormStatusMessage
            variant="error"
            title="Registration failed"
            message='The username "taken" is already in use. Please choose a different one.'
          />
        )}
        <Form form={form} onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Choose a username" {...field} />
                </FormControl>
                <FormDescription>
                  Try typing &quot;taken&quot; to see the error state.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions submitLabel="Create Account" />
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormStatusMessage provides success, error, info, and warning banners for form-level feedback.",
      },
    },
  },
};

// Form with cancel action
export const WithCancelAction: Story = {
  render: function CancelForm() {
    const schema = z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
    });

    const form = useZodForm({ schema });

    return (
      <div className="max-w-md">
        <Form
          form={form}
          onSubmit={(data) => alert(JSON.stringify(data))}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions
            submitLabel="Save"
            cancelLabel="Discard"
            onCancel={() => form.reset()}
            align="right"
          />
        </Form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "FormActions supports a cancel button with customizable label and alignment.",
      },
    },
  },
};

// All status message variants
export const StatusVariants: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <FormStatusMessage
        variant="success"
        title="Success"
        message="Your changes have been saved."
      />
      <FormStatusMessage
        variant="error"
        title="Error"
        message="Something went wrong. Please try again."
      />
      <FormStatusMessage
        variant="info"
        title="Info"
        message="Your trial expires in 7 days."
      />
      <FormStatusMessage
        variant="warning"
        title="Warning"
        message="This action cannot be undone."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "FormStatusMessage supports four variants: success, error, info, and warning.",
      },
    },
  },
};
