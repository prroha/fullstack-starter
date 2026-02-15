import type { Meta, StoryObj } from "@storybook/react";
import { PasswordInput } from "@/components/forms/password-input";

/**
 * The PasswordInput component wraps the Input component with a
 * show/hide toggle button and optional password strength meter.
 */
const meta: Meta<typeof PasswordInput> = {
  title: "Components/Forms/PasswordInput",
  component: PasswordInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A password input with a visibility toggle button (show/hide) and an optional integrated PasswordStrengthMeter. Built on top of the core Input component.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    showStrength: {
      control: "boolean",
      description: "Whether to show the password strength meter",
    },
    strengthMinLength: {
      control: "number",
      description: "Minimum length for strength evaluation (default: 8)",
    },
    showStrengthRequirements: {
      control: "boolean",
      description: "Whether to show the requirements checklist (default: true)",
    },
    showPasswordLabel: {
      control: "text",
      description: "Aria label for the show password button",
    },
    hidePasswordLabel: {
      control: "text",
      description: "Aria label for the hide password button",
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

// Default password input
export const Default: Story = {
  args: {
    placeholder: "Enter password...",
  },
};

// With strength meter
export const WithStrengthMeter: Story = {
  args: {
    placeholder: "Create a strong password...",
    showStrength: true,
    defaultValue: "MyPass1!",
  },
  parameters: {
    docs: {
      description: {
        story: "When showStrength is enabled, a PasswordStrengthMeter is displayed below the input showing password quality and requirements.",
      },
    },
  },
};

// With strength meter (no requirements)
export const StrengthBarOnly: Story = {
  args: {
    placeholder: "Enter password...",
    showStrength: true,
    showStrengthRequirements: false,
    defaultValue: "Abcdefgh1",
  },
  parameters: {
    docs: {
      description: {
        story: "The strength meter can display only the bar without the requirements checklist.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: "Password disabled",
    disabled: true,
    defaultValue: "secretpassword",
  },
};
