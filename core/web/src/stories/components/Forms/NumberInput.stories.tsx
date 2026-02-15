import type { Meta, StoryObj } from "@storybook/react";
import { NumberInput } from "@/components/ui/number-input";

/**
 * The NumberInput component provides a numeric input with increment/decrement buttons,
 * keyboard navigation, prefix/suffix support, and value clamping.
 */
const meta: Meta<typeof NumberInput> = {
  title: "Components/Forms/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A numeric input with stepper buttons, min/max clamping, keyboard navigation (Arrow Up/Down), prefix/suffix display, and error state support.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    min: {
      control: "number",
      description: "Minimum allowed value",
    },
    max: {
      control: "number",
      description: "Maximum allowed value",
    },
    step: {
      control: "number",
      description: "Step increment (default: 1)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    error: {
      control: "boolean",
      description: "Whether to show an error state",
    },
    errorMessage: {
      control: "text",
      description: "Error message to display",
    },
    hideButtons: {
      control: "boolean",
      description: "Whether to hide increment/decrement buttons",
    },
    buttonPosition: {
      control: "select",
      options: ["sides", "right"],
      description: 'Button position: "sides" or "right"',
    },
    allowEmpty: {
      control: "boolean",
      description: "Whether to allow empty value (returns undefined)",
    },
    precision: {
      control: "number",
      description: "Number of decimal places",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default number input
export const Default: Story = {
  args: {
    defaultValue: 5,
    min: 0,
    max: 100,
    step: 1,
    "aria-label": "Quantity",
  },
};

// With prefix and suffix
export const WithPrefixSuffix: Story = {
  render: () => (
    <div className="space-y-4">
      <NumberInput
        defaultValue={25}
        min={0}
        max={100}
        prefix="$"
        aria-label="Price"
      />
      <NumberInput
        defaultValue={50}
        min={0}
        max={100}
        suffix="%"
        aria-label="Percentage"
      />
      <NumberInput
        defaultValue={72}
        min={0}
        max={999}
        prefix="$"
        suffix="USD"
        aria-label="Amount in USD"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Prefix and suffix elements provide visual context such as currency symbols or units.",
      },
    },
  },
};

// Button positions
export const ButtonPositions: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">Sides (default)</span>
        <NumberInput
          defaultValue={5}
          min={0}
          max={10}
          buttonPosition="sides"
          aria-label="Sides buttons"
        />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">Right (stacked)</span>
        <NumberInput
          defaultValue={5}
          min={0}
          max={10}
          buttonPosition="right"
          aria-label="Right buttons"
        />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">No buttons</span>
        <NumberInput
          defaultValue={5}
          min={0}
          max={10}
          hideButtons
          aria-label="No buttons"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons can be placed on the sides, stacked on the right, or hidden entirely.',
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <NumberInput size="sm" defaultValue={1} min={0} max={10} aria-label="Small" />
      <NumberInput size="md" defaultValue={5} min={0} max={10} aria-label="Medium" />
      <NumberInput size="lg" defaultValue={10} min={0} max={10} aria-label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "NumberInput comes in small, medium, and large sizes.",
      },
    },
  },
};

// Error state
export const WithError: Story = {
  args: {
    defaultValue: 150,
    min: 0,
    max: 100,
    error: true,
    errorMessage: "Value must be between 0 and 100.",
    "aria-label": "Constrained value",
  },
  parameters: {
    docs: {
      description: {
        story: "The error state highlights the input border and displays an error message below.",
      },
    },
  },
};
