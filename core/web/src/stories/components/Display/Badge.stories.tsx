import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";

/**
 * The Badge component is used to highlight status, categories, or counts.
 * It supports multiple color variants and sizes.
 */
const meta: Meta<typeof Badge> = {
  title: "Components/Display/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A small label component for displaying status, categories, or counts. Supports multiple variants and sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "success", "warning"],
      description: "Color variant of the badge",
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size of the badge",
    },
    children: {
      control: "text",
      description: "Badge content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default badge
export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
    size: "default",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available badge variants for different use cases.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badge comes in three sizes: small, default, and large.",
      },
    },
  },
};

// Status badges
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Inactive</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">Archived</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges are commonly used to display status indicators.",
      },
    },
  },
};

// Category badges
export const CategoryBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="default">Technology</Badge>
      <Badge variant="secondary">Design</Badge>
      <Badge variant="outline">Marketing</Badge>
      <Badge variant="secondary">Engineering</Badge>
      <Badge variant="default">Product</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges can be used to categorize or tag content.",
      },
    },
  },
};

// With counts
export const WithCounts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge variant="default">Messages 12</Badge>
      <Badge variant="secondary">Notifications 5</Badge>
      <Badge variant="destructive">Errors 3</Badge>
      <Badge variant="success">Completed 24</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges can include counts or numbers.",
      },
    },
  },
};

// In context examples
export const InContext: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      {/* With heading */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Premium Feature</h3>
        <Badge variant="warning" size="sm">Pro</Badge>
      </div>

      {/* In a list item */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <p className="font-medium">John Doe</p>
          <p className="text-sm text-muted-foreground">john@example.com</p>
        </div>
        <Badge variant="success">Active</Badge>
      </div>

      {/* Multiple tags */}
      <div className="p-3 border rounded-lg">
        <p className="font-medium mb-2">Article Tags</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" size="sm">React</Badge>
          <Badge variant="outline" size="sm">TypeScript</Badge>
          <Badge variant="outline" size="sm">Next.js</Badge>
          <Badge variant="outline" size="sm">Tailwind</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Examples of badges used in different contexts.",
      },
    },
  },
};
