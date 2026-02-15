import type { Meta, StoryObj } from "@storybook/react";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";

/**
 * The FieldWrapper component provides a consistent layout for form fields
 * with label, error message, and hint text.
 */
const meta: Meta<typeof FieldWrapper> = {
  title: "Components/Forms/FieldWrapper",
  component: FieldWrapper,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A wrapper for form fields that provides consistent layout with label, error message, and hint text. For react-hook-form usage, prefer FormField components from @/components/forms.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Field label text",
    },
    htmlFor: {
      control: "text",
      description: "Unique ID for the input element (required for accessibility)",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
    },
    hint: {
      control: "text",
      description: "Helper hint text displayed below the input",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default field wrapper with input
export const Default: Story = {
  args: {
    label: "Email Address",
    htmlFor: "email",
    children: <Input id="email" type="email" placeholder="you@example.com" />,
  },
};

// With hint text
export const WithHint: Story = {
  args: {
    label: "Username",
    htmlFor: "username",
    hint: "Must be 3-20 characters, letters and numbers only.",
    children: <Input id="username" placeholder="Enter username..." />,
  },
  parameters: {
    docs: {
      description: {
        story: "Hint text provides additional guidance below the input. It is hidden when an error is displayed.",
      },
    },
  },
};

// Required field
export const Required: Story = {
  args: {
    label: "Password",
    htmlFor: "password",
    required: true,
    children: <Input id="password" type="password" placeholder="Enter password..." />,
  },
  parameters: {
    docs: {
      description: {
        story: "Required fields display an asterisk next to the label.",
      },
    },
  },
};

// With error message
export const WithError: Story = {
  args: {
    label: "Email Address",
    htmlFor: "email-error",
    required: true,
    error: "Please enter a valid email address.",
    children: (
      <Input
        id="email-error"
        type="email"
        placeholder="you@example.com"
        defaultValue="invalid-email"
        aria-invalid="true"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "When an error is present, the label turns red and the error message replaces the hint text.",
      },
    },
  },
};

// All states
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <FieldWrapper label="Default Field" htmlFor="default">
        <Input id="default" placeholder="Default state..." />
      </FieldWrapper>
      <FieldWrapper label="With Hint" htmlFor="hint" hint="This is helpful context.">
        <Input id="hint" placeholder="Has hint text..." />
      </FieldWrapper>
      <FieldWrapper label="Required Field" htmlFor="req" required>
        <Input id="req" placeholder="This is required..." />
      </FieldWrapper>
      <FieldWrapper
        label="Error State"
        htmlFor="err"
        required
        error="This field is required."
      >
        <Input id="err" placeholder="Error state..." aria-invalid="true" />
      </FieldWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All FieldWrapper states shown together for comparison.",
      },
    },
  },
};
