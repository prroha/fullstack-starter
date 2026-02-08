import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

/**
 * The Input component is used for text input fields throughout the application.
 * It supports character counting and integrates with form validation.
 */
const meta: Meta<typeof Input> = {
  title: "Components/Forms/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible text input component with support for character counting, validation states, and various input types.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
      description: "HTML input type",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input",
    },
    showCharacterCount: {
      control: "boolean",
      description: "Shows character count when maxLength is set",
    },
    maxLength: {
      control: "number",
      description: "Maximum character length",
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

// Default input
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

// With label (using wrapper)
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="labeled-input">
        Email Address
      </label>
      <Input id="labeled-input" type="email" placeholder="you@example.com" />
    </div>
  ),
};

// Input types
export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Text</label>
        <Input type="text" placeholder="Enter text..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" placeholder="Enter password..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Number</label>
        <Input type="number" placeholder="0" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <Input type="search" placeholder="Search..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Input supports various HTML input types for different use cases.",
      },
    },
  },
};

// With character count
export const WithCharacterCount: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Username (max 20 chars)</label>
        <Input
          placeholder="Enter username..."
          showCharacterCount
          maxLength={20}
          defaultValue="johndoe"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Bio (approaching limit)</label>
        <Input
          placeholder="Enter bio..."
          showCharacterCount
          maxLength={50}
          defaultValue="This is a longer text that approaches the limit"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When showCharacterCount is enabled with a maxLength, the input displays a counter that changes color as you approach the limit.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
    defaultValue: "Cannot edit this",
  },
};

// Validation states
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Valid</label>
        <Input
          defaultValue="valid@email.com"
          className="border-green-500 focus-visible:ring-green-500"
        />
        <p className="text-sm text-green-600">Email is valid</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Invalid</label>
        <Input
          defaultValue="invalid-email"
          aria-invalid="true"
        />
        <p className="text-sm text-destructive">Please enter a valid email</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Inputs can display validation states using aria-invalid and custom styling.",
      },
    },
  },
};

// With prefix/suffix icons (using wrapper)
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <div className="relative">
          <Icon
            name="Search"
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input placeholder="Search..." className="pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <div className="relative">
          <Icon
            name="Mail"
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input type="email" placeholder="you@example.com" className="pl-10" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icons can be added using a relative positioned wrapper.",
      },
    },
  },
};
