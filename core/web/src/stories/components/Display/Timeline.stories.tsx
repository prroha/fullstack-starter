import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "@/components/ui/timeline";
import type { TimelineItemData } from "@/components/ui/timeline";

/**
 * The Timeline component displays a chronological sequence of events.
 * It supports multiple status colors, sizes, compact mode, and alternating layout.
 */
const meta: Meta<typeof Timeline> = {
  title: "Components/Display/Timeline",
  component: Timeline,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A timeline component for displaying chronological events with status indicators, timestamps, and optional custom content. Supports compact and alternating layout modes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    compact: {
      control: "boolean",
      description: "Compact mode with reduced spacing",
    },
    alternating: {
      control: "boolean",
      description: "Alternating layout (items alternate left/right)",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems: TimelineItemData[] = [
  {
    id: "1",
    title: "Order Placed",
    description: "Your order has been confirmed.",
    timestamp: "Feb 14, 2026 10:30 AM",
    status: "success",
  },
  {
    id: "2",
    title: "Payment Processed",
    description: "Payment of $99.00 was successful.",
    timestamp: "Feb 14, 2026 10:31 AM",
    status: "success",
  },
  {
    id: "3",
    title: "Preparing Shipment",
    description: "Your items are being packed.",
    timestamp: "Feb 14, 2026 2:00 PM",
    status: "info",
  },
  {
    id: "4",
    title: "Out for Delivery",
    description: "Expected delivery by end of day.",
    timestamp: "Feb 15, 2026 9:00 AM",
    status: "warning",
  },
  {
    id: "5",
    title: "Delivered",
    timestamp: "Pending",
    status: "default",
  },
];

// Default timeline
export const Default: Story = {
  args: {
    items: defaultItems,
    size: "md",
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

// All status types
export const StatusTypes: Story = {
  args: {
    items: [
      { id: "1", title: "Success Event", description: "This completed successfully.", status: "success", timestamp: "10:00 AM" },
      { id: "2", title: "Info Event", description: "Informational update.", status: "info", timestamp: "10:15 AM" },
      { id: "3", title: "Warning Event", description: "Something needs attention.", status: "warning", timestamp: "10:30 AM" },
      { id: "4", title: "Error Event", description: "Something went wrong.", status: "error", timestamp: "10:45 AM" },
      { id: "5", title: "Default Event", description: "A neutral event.", status: "default", timestamp: "11:00 AM" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Timeline items with all five status types: success, info, warning, error, and default.",
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => {
    const items: TimelineItemData[] = [
      { id: "1", title: "First Event", description: "Details here.", timestamp: "10:00 AM", status: "success" },
      { id: "2", title: "Second Event", description: "More details.", timestamp: "10:30 AM", status: "info" },
      { id: "3", title: "Third Event", timestamp: "11:00 AM", status: "default" },
    ];

    return (
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-sm text-muted-foreground mb-4">Small</p>
          <Timeline items={items} size="sm" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-4">Medium</p>
          <Timeline items={items} size="md" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-4">Large</p>
          <Timeline items={items} size="lg" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Timeline in small, medium, and large sizes.",
      },
    },
  },
};

// Compact mode
export const Compact: Story = {
  args: {
    items: defaultItems,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Compact mode reduces spacing between timeline items for denser layouts.",
      },
    },
  },
};

// With custom content
export const WithCustomContent: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Pull Request Opened",
        description: "feat: add new dashboard component",
        timestamp: "2 hours ago",
        status: "info",
        content: (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
            <p className="font-medium">+142 -28</p>
            <p className="text-muted-foreground">5 files changed</p>
          </div>
        ),
      },
      {
        id: "2",
        title: "Code Review Approved",
        description: "Reviewed by Jane Smith",
        timestamp: "1 hour ago",
        status: "success",
      },
      {
        id: "3",
        title: "CI/CD Pipeline Running",
        description: "Build and test in progress",
        timestamp: "30 min ago",
        status: "warning",
        content: (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
            <p className="text-muted-foreground">Tests: 142/150 passed</p>
          </div>
        ),
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Timeline items with custom content blocks rendered below the description.",
      },
    },
  },
};
