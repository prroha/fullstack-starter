import type { Meta, StoryObj } from "@storybook/react";
import { PasswordStrengthMeter } from "@/components/ui/password-strength";

/**
 * The PasswordStrengthMeter component evaluates password strength
 * and displays a visual indicator with a requirements checklist.
 */
const meta: Meta<typeof PasswordStrengthMeter> = {
  title: "Components/Forms/PasswordStrength",
  component: PasswordStrengthMeter,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A password strength indicator that evaluates passwords against configurable requirements (length, uppercase, lowercase, numbers, special characters) and displays strength as weak, fair, good, or strong.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    password: {
      control: "text",
      description: "The password to evaluate",
    },
    minLength: {
      control: "number",
      description: "Minimum length requirement (default: 8)",
    },
    showRequirements: {
      control: "boolean",
      description: "Whether to show the requirements checklist (default: true)",
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

// Default (empty password)
export const Default: Story = {
  args: {
    password: "",
  },
};

// Weak password
export const Weak: Story = {
  args: {
    password: "abc",
  },
  parameters: {
    docs: {
      description: {
        story: "A weak password meets very few requirements. The bar is red and shows 25% filled.",
      },
    },
  },
};

// Fair password
export const Fair: Story = {
  args: {
    password: "abcdefgh",
  },
  parameters: {
    docs: {
      description: {
        story: "A fair password meets some requirements (e.g., minimum length and lowercase). The bar is orange and 50% filled.",
      },
    },
  },
};

// Good password
export const Good: Story = {
  args: {
    password: "Abcdefgh1",
  },
  parameters: {
    docs: {
      description: {
        story: "A good password meets most requirements. The bar is yellow and 75% filled.",
      },
    },
  },
};

// Strong password
export const Strong: Story = {
  args: {
    password: "Abcdefgh1!",
  },
  parameters: {
    docs: {
      description: {
        story: "A strong password meets all requirements. The bar is green and fully filled.",
      },
    },
  },
};

// Without requirements checklist
export const WithoutRequirements: Story = {
  args: {
    password: "Abcdefgh1",
    showRequirements: false,
  },
  parameters: {
    docs: {
      description: {
        story: "The requirements checklist can be hidden, showing only the strength bar and label.",
      },
    },
  },
};
