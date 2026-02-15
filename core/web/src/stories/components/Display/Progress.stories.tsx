import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";

/**
 * The Progress component indicates completion or loading state.
 * It supports both linear (bar) and circular (spinner-like) variants.
 */
const meta: Meta<typeof Progress> = {
  title: "Components/Display/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A progress indicator component supporting linear and circular variants. Shows determinate progress with a value or indeterminate loading animation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress value (0-100). If undefined, shows indeterminate state.",
    },
    variant: {
      control: "select",
      options: ["linear", "circular"],
      description: "Progress variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    color: {
      control: "select",
      options: ["default", "success", "warning", "error"],
      description: "Color variant",
    },
    showLabel: {
      control: "boolean",
      description: "Show percentage label",
    },
    label: {
      control: "text",
      description: "Custom label (overrides percentage display)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default linear progress
export const Default: Story = {
  args: {
    value: 65,
    variant: "linear",
    size: "md",
    color: "default",
    showLabel: false,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// Linear sizes
export const LinearSizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Small</p>
        <Progress value={60} size="sm" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Medium (default)</p>
        <Progress value={60} size="md" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Large</p>
        <Progress value={60} size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Linear progress bars in small, medium, and large sizes.",
      },
    },
  },
};

// Color variants
export const Colors: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Progress value={75} color="default" showLabel />
      <Progress value={90} color="success" showLabel />
      <Progress value={50} color="warning" showLabel />
      <Progress value={25} color="error" showLabel />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress bars with different color variants for contextual feedback.",
      },
    },
  },
};

// Circular progress
export const Circular: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <Progress variant="circular" value={25} size="sm" />
        <p className="text-xs mt-2 text-muted-foreground">Small</p>
      </div>
      <div className="text-center">
        <Progress variant="circular" value={50} size="md" showLabel />
        <p className="text-xs mt-2 text-muted-foreground">Medium</p>
      </div>
      <div className="text-center">
        <Progress variant="circular" value={75} size="lg" showLabel />
        <p className="text-xs mt-2 text-muted-foreground">Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Circular progress indicators in all sizes with optional percentage labels.",
      },
    },
  },
};

// Indeterminate state
export const Indeterminate: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Linear indeterminate</p>
        <Progress />
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Progress variant="circular" size="sm" />
          <p className="text-xs mt-2 text-muted-foreground">Circular</p>
        </div>
        <div className="text-center">
          <Progress variant="circular" size="md" />
          <p className="text-xs mt-2 text-muted-foreground">Circular</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "When no value is provided, the progress shows an indeterminate loading animation.",
      },
    },
  },
};
