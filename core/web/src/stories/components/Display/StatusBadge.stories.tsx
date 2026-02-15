import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "@/components/ui/status-badge";

/**
 * The StatusBadge component displays a colored badge with a dot indicator
 * for representing entity states such as active, pending, error, etc.
 */
const meta: Meta<typeof StatusBadge> = {
  title: "Components/Display/StatusBadge",
  component: StatusBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A status indicator badge with dot and color coding. Supports seven status types: active, inactive, pending, success, warning, error, and info.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["active", "inactive", "pending", "success", "warning", "error", "info"],
      description: "Status type that determines the badge color",
    },
    showDot: {
      control: "boolean",
      description: "Whether to show the dot indicator",
    },
    label: {
      control: "text",
      description: "Custom label (overrides default status label)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default status badge
export const Default: Story = {
  args: {
    status: "active",
  },
};

// All statuses
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="success" />
      <StatusBadge status="warning" />
      <StatusBadge status="error" />
      <StatusBadge status="info" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All seven status types with their default labels and colors.",
      },
    },
  },
};

// Without dot
export const WithoutDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatusBadge status="active" showDot={false} />
      <StatusBadge status="pending" showDot={false} />
      <StatusBadge status="error" showDot={false} />
      <StatusBadge status="info" showDot={false} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Status badges without the dot indicator for a more compact look.",
      },
    },
  },
};

// Custom labels
export const CustomLabels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatusBadge status="success" label="Published" />
      <StatusBadge status="warning" label="Draft" />
      <StatusBadge status="error" label="Rejected" />
      <StatusBadge status="pending" label="Under Review" />
      <StatusBadge status="info" label="Scheduled" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Status badges with custom labels to match domain-specific terminology.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-3 w-80">
      {[
        { name: "Production Server", status: "active" as const },
        { name: "Staging Server", status: "warning" as const, label: "Degraded" },
        { name: "Dev Server", status: "inactive" as const },
        { name: "CI Pipeline", status: "pending" as const, label: "Running" },
        { name: "Backup Job", status: "error" as const, label: "Failed" },
      ].map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <span className="text-sm font-medium">{item.name}</span>
          <StatusBadge status={item.status} label={item.label} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Status badges used in a server monitoring list context.",
      },
    },
  },
};
