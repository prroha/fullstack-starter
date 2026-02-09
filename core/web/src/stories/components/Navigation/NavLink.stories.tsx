import type { Meta, StoryObj } from "@storybook/react";
import { NavLink } from "@/components/ui/nav-link";
import { Icon } from "@/components/ui/icon";

/**
 * The NavLink component is used for navigation links with active state styling.
 * It integrates with Next.js routing to automatically detect active state.
 */
const meta: Meta<typeof NavLink> = {
  title: "Components/Navigation/NavLink",
  component: NavLink,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A navigation link component that automatically styles based on the current route. Supports icons, multiple variants, and exact/prefix matching.",
      },
    },
    // Note: Active state detection requires Next.js router context
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["sidebar", "topnav", "mobile"],
      description: "Visual variant of the nav link",
    },
    href: {
      control: "text",
      description: "The URL path to navigate to",
    },
    label: {
      control: "text",
      description: "The text label for the link",
    },
    exact: {
      control: "boolean",
      description: "Use exact path matching instead of prefix matching",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default nav link
export const Default: Story = {
  args: {
    href: "/dashboard",
    label: "Dashboard",
    variant: "sidebar",
  },
};

// All variants (sidebar style)
export const SidebarVariant: Story = {
  render: () => (
    <div className="w-56 space-y-1 bg-card p-2 rounded-lg border">
      <NavLink
        href="/dashboard"
        label="Dashboard"
        icon={<Icon name="House" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/users"
        label="Users"
        icon={<Icon name="User" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/settings"
        label="Settings"
        icon={<Icon name="Settings" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/analytics"
        label="Analytics"
        icon={<Icon name="ChartBar" size="sm" />}
        variant="sidebar"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sidebar variant is used in dashboard side navigation.",
      },
    },
  },
};

// Top navigation variant
export const TopNavVariant: Story = {
  render: () => (
    <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-lg border">
      <NavLink href="/home" label="Home" variant="topnav" />
      <NavLink href="/products" label="Products" variant="topnav" />
      <NavLink href="/about" label="About" variant="topnav" />
      <NavLink href="/contact" label="Contact" variant="topnav" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Top nav variant is used in horizontal navigation bars.",
      },
    },
  },
};

// Mobile variant
export const MobileVariant: Story = {
  render: () => (
    <div className="w-72 bg-card rounded-lg border">
      <NavLink
        href="/dashboard"
        label="Dashboard"
        icon={<Icon name="House" size="md" />}
        variant="mobile"
      />
      <NavLink
        href="/profile"
        label="Profile"
        icon={<Icon name="User" size="md" />}
        variant="mobile"
      />
      <NavLink
        href="/notifications"
        label="Notifications"
        icon={<Icon name="Bell" size="md" />}
        variant="mobile"
      />
      <NavLink
        href="/settings"
        label="Settings"
        icon={<Icon name="Settings" size="md" />}
        variant="mobile"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile variant is used in mobile navigation drawers.",
      },
    },
  },
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="w-56 space-y-1">
      <NavLink
        href="/dashboard"
        label="Dashboard"
        icon={<Icon name="LayoutDashboard" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/inbox"
        label="Inbox"
        icon={<Icon name="Mail" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/calendar"
        label="Calendar"
        icon={<Icon name="Calendar" size="sm" />}
        variant="sidebar"
      />
      <NavLink
        href="/documents"
        label="Documents"
        icon={<Icon name="FileText" size="sm" />}
        variant="sidebar"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "NavLinks can include icons for better visual context.",
      },
    },
  },
};

// Without icons
export const WithoutIcons: Story = {
  render: () => (
    <div className="w-56 space-y-1">
      <NavLink href="/overview" label="Overview" variant="sidebar" />
      <NavLink href="/reports" label="Reports" variant="sidebar" />
      <NavLink href="/team" label="Team" variant="sidebar" />
      <NavLink href="/billing" label="Billing" variant="sidebar" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "NavLinks can also be used without icons for simpler navigation.",
      },
    },
  },
};

// Nested navigation example
export const NestedNavigation: Story = {
  render: () => (
    <div className="w-56 space-y-1">
      <NavLink
        href="/settings"
        label="Settings"
        icon={<Icon name="Settings" size="sm" />}
        variant="sidebar"
      />
      <div className="ml-6 space-y-1">
        <NavLink
          href="/settings/profile"
          label="Profile"
          variant="sidebar"
          exact
        />
        <NavLink
          href="/settings/security"
          label="Security"
          variant="sidebar"
          exact
        />
        <NavLink
          href="/settings/notifications"
          label="Notifications"
          variant="sidebar"
          exact
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "NavLinks can be nested for hierarchical navigation structures.",
      },
    },
  },
};
