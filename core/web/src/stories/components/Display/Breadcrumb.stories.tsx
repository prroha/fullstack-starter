import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

/**
 * The Breadcrumb component shows the user's current location within a
 * navigational hierarchy. Supports collapsing, home icons, and custom separators.
 */
const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Display/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A breadcrumb navigation component for displaying hierarchical page location. Supports custom separators, home icon, item collapsing, and label truncation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    separator: {
      control: "select",
      options: ["/", ">", "chevron"],
      description: "Separator between breadcrumb items",
    },
    showHomeIcon: {
      control: "boolean",
      description: "Show home icon for the first item",
    },
    maxItems: {
      control: "number",
      description: "Maximum items before collapsing with ellipsis",
    },
    maxLabelLength: {
      control: "number",
      description: "Truncate labels longer than this length",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default breadcrumb
export const Default: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Electronics", href: "/products/electronics" },
      { label: "Smartphones" },
    ],
    separator: "chevron",
  },
};

// Separator variants
export const Separators: Story = {
  render: () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Category", href: "/category" },
      { label: "Current Page" },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Chevron (default)</p>
          <Breadcrumb items={items} separator="chevron" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Slash</p>
          <Breadcrumb items={items} separator="/" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Greater than</p>
          <Breadcrumb items={items} separator=">" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Breadcrumbs with different separator styles: chevron, slash, and greater-than.",
      },
    },
  },
};

// With home icon
export const WithHomeIcon: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Settings", href: "/settings" },
      { label: "Profile" },
    ],
    showHomeIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Breadcrumb with a home icon displayed on the first item.",
      },
    },
  },
};

// Collapsed with ellipsis
export const Collapsed: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Electronics", href: "/products/electronics" },
      { label: "Smartphones", href: "/products/electronics/smartphones" },
      { label: "Apple", href: "/products/electronics/smartphones/apple" },
      { label: "iPhone 15 Pro" },
    ],
    maxItems: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "When there are many items, breadcrumbs collapse with an ellipsis button that can be clicked to expand.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-lg">
      <div className="space-y-4 p-4 border rounded-lg">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Users", href: "/dashboard/users" },
            { label: "John Doe" },
          ]}
          showHomeIcon
        />
        <h1 className="text-2xl font-bold">John Doe</h1>
        <p className="text-muted-foreground">User profile and account details.</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Breadcrumb used at the top of a page header for navigation context.",
      },
    },
  },
};
