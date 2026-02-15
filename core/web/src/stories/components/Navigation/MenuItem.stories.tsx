import type { Meta, StoryObj } from "@storybook/react";
import { MenuItem } from "@/components/ui/menu-item";
import { Icon } from "@/components/ui/icon";

/**
 * The MenuItem component is used in dropdown menus and action lists.
 * It supports icons, keyboard shortcuts, and destructive styling.
 */
const meta: Meta<typeof MenuItem> = {
  title: "Components/Navigation/MenuItem",
  component: MenuItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A menu action item component with optional icon, keyboard shortcut display, and destructive variant. Used inside dropdown menus and context menus.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Menu item label text",
    },
    shortcut: {
      control: "text",
      description: "Keyboard shortcut to display",
    },
    destructive: {
      control: "boolean",
      description: "Whether the item is a destructive action",
    },
    disabled: {
      control: "boolean",
      description: "Whether the item is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default menu item
export const Default: Story = {
  args: {
    label: "Edit",
    icon: <Icon name="Pencil" size="sm" />,
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
};

// Full menu example
export const MenuExample: Story = {
  render: () => (
    <div className="w-56 bg-popover border border-border rounded-md p-1 shadow-md">
      <MenuItem
        label="Edit"
        icon={<Icon name="Pencil" size="sm" />}
        shortcut="Ctrl+E"
      />
      <MenuItem
        label="Duplicate"
        icon={<Icon name="Copy" size="sm" />}
        shortcut="Ctrl+D"
      />
      <MenuItem
        label="Share"
        icon={<Icon name="Share2" size="sm" />}
      />
      <div className="my-1 h-px bg-border" />
      <MenuItem
        label="Archive"
        icon={<Icon name="Archive" size="sm" />}
      />
      <MenuItem
        label="Delete"
        icon={<Icon name="Trash2" size="sm" />}
        destructive
        shortcut="Del"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "MenuItems are typically used together inside a dropdown menu container with dividers separating groups.",
      },
    },
  },
};

// Destructive variant
export const Destructive: Story = {
  args: {
    label: "Delete item",
    icon: <Icon name="Trash2" size="sm" />,
    destructive: true,
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Destructive items use red text and highlight to indicate danger.",
      },
    },
  },
};

// With keyboard shortcut
export const WithShortcut: Story = {
  args: {
    label: "Save",
    icon: <Icon name="Save" size="sm" />,
    shortcut: "Ctrl+S",
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Keyboard shortcuts are displayed on the right side using the Kbd component.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: "Cannot edit",
    icon: <Icon name="Lock" size="sm" />,
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Disabled items are visually dimmed and cannot be interacted with.",
      },
    },
  },
};
