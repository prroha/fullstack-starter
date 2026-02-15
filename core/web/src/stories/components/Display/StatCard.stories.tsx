import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "@/components/ui/stat-card";

/**
 * The StatCard component displays a key metric with optional trend indicator,
 * icon, and interactive behavior. Used in dashboards and analytics pages.
 */
const meta: Meta<typeof StatCard> = {
  title: "Components/Display/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dashboard stat card for displaying key metrics with values, labels, trend indicators, icons, and optional click behavior. Supports multiple color variants and sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "The main value to display",
    },
    label: {
      control: "text",
      description: "Label or title for the stat",
    },
    change: {
      control: "number",
      description: "Change percentage value",
    },
    trend: {
      control: "select",
      options: ["up", "down", "neutral"],
      description: "Trend direction (overrides automatic detection from change)",
    },
    trendLabel: {
      control: "text",
      description: "Custom trend label",
    },
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info"],
      description: "Color variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default stat card
export const Default: Story = {
  args: {
    value: "1,234",
    label: "Total Users",
    change: 12.5,
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <StatCard value="1,234" label="Default" change={5.2} variant="default" />
      <StatCard value="98.5%" label="Uptime" change={0.3} variant="success" />
      <StatCard value="23" label="Warnings" change={-2.1} variant="warning" />
      <StatCard value="3" label="Errors" change={50} variant="error" />
      <StatCard value="847" label="Visitors" change={12} variant="info" />
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "StatCard color variants for different metric types.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      <StatCard value="1,234" label="Small" change={5.2} size="sm" />
      <StatCard value="1,234" label="Medium (default)" change={5.2} size="md" />
      <StatCard value="1,234" label="Large" change={5.2} size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "StatCard in small, medium (default), and large sizes.",
      },
    },
  },
};

// Trend directions
export const Trends: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[600px]">
      <StatCard value="$12,450" label="Revenue" change={12.5} />
      <StatCard value="$8,200" label="Expenses" change={-3.8} />
      <StatCard value="$4,250" label="Balance" change={0} />
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "StatCard automatically determines trend direction from the change value: positive (up), negative (down), or zero (neutral).",
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    value: "",
    label: "",
    isLoading: true,
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "StatCard in loading state displays a skeleton placeholder.",
      },
    },
  },
};
