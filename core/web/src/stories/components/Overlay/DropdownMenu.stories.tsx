import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import type { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * The DropdownMenu component displays a list of actions or options
 * in a floating menu triggered by a button.
 */
const meta: Meta<typeof DropdownMenu> = {
  title: "Components/Overlay/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dropdown menu component with keyboard navigation, sub-menus, grouped items, dividers, destructive actions, and keyboard shortcut indicators. Supports controlled and uncontrolled modes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: [
        "bottom-start",
        "bottom-end",
        "bottom-center",
        "top-start",
        "top-end",
        "top-center",
      ],
      description: "Position of the menu relative to the trigger",
    },
    closeOnSelect: {
      control: "boolean",
      description: "Whether to close when an item is selected",
    },
    disabled: {
      control: "boolean",
      description: "Whether the menu is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicItems: DropdownMenuContent = [
  { key: "edit", label: "Edit", onClick: () => alert("Edit clicked") },
  { key: "duplicate", label: "Duplicate", onClick: () => alert("Duplicate clicked") },
  { key: "archive", label: "Archive", onClick: () => alert("Archive clicked") },
  { type: "divider", key: "div-1" },
  { key: "delete", label: "Delete", destructive: true, onClick: () => alert("Delete clicked") },
];

// Default dropdown
export const Default: Story = {
  render: () => (
    <div className="p-8">
      <DropdownMenu
        trigger={<Button variant="outline">Actions</Button>}
        content={basicItems}
      />
    </div>
  ),
};

// With shortcuts and icons
export const WithShortcuts: Story = {
  render: () => {
    const items: DropdownMenuContent = [
      {
        key: "new",
        label: "New File",
        shortcut: "Ctrl+N",
        onClick: () => alert("New"),
      },
      {
        key: "open",
        label: "Open",
        shortcut: "Ctrl+O",
        onClick: () => alert("Open"),
      },
      {
        key: "save",
        label: "Save",
        shortcut: "Ctrl+S",
        onClick: () => alert("Save"),
      },
      { type: "divider", key: "div-1" },
      {
        key: "close",
        label: "Close",
        shortcut: "Ctrl+W",
        onClick: () => alert("Close"),
      },
    ];

    return (
      <div className="p-8">
        <DropdownMenu
          trigger={<Button variant="outline">File</Button>}
          content={items}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Menu items can display keyboard shortcuts alongside labels.",
      },
    },
  },
};

// Grouped items
export const GroupedItems: Story = {
  render: () => {
    const items: DropdownMenuContent = [
      {
        type: "group",
        key: "edit-group",
        label: "Edit",
        items: [
          { key: "cut", label: "Cut", shortcut: "Ctrl+X", onClick: () => {} },
          { key: "copy", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
          { key: "paste", label: "Paste", shortcut: "Ctrl+V", onClick: () => {} },
        ],
      },
      {
        type: "group",
        key: "view-group",
        label: "View",
        items: [
          { key: "zoom-in", label: "Zoom In", shortcut: "Ctrl++", onClick: () => {} },
          { key: "zoom-out", label: "Zoom Out", shortcut: "Ctrl+-", onClick: () => {} },
          { key: "reset", label: "Reset Zoom", shortcut: "Ctrl+0", onClick: () => {} },
        ],
      },
    ];

    return (
      <div className="p-8">
        <DropdownMenu
          trigger={<Button variant="outline">Options</Button>}
          content={items}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Menu items can be organized into labeled groups for better structure.",
      },
    },
  },
};

// With disabled items
export const WithDisabledItems: Story = {
  render: () => {
    const items: DropdownMenuContent = [
      { key: "edit", label: "Edit", onClick: () => {} },
      { key: "duplicate", label: "Duplicate", disabled: true, onClick: () => {} },
      { key: "share", label: "Share", onClick: () => {} },
      { type: "divider", key: "div-1" },
      { key: "delete", label: "Delete", destructive: true, disabled: true, onClick: () => {} },
    ];

    return (
      <div className="p-8">
        <DropdownMenu
          trigger={<Button variant="outline">Menu</Button>}
          content={items}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Individual menu items can be disabled to prevent interaction.",
      },
    },
  },
};

// Positions
export const MenuPositions: Story = {
  render: () => (
    <div className="flex gap-8 p-16">
      <DropdownMenu
        trigger={<Button variant="outline">Bottom Start</Button>}
        content={basicItems}
        position="bottom-start"
      />
      <DropdownMenu
        trigger={<Button variant="outline">Bottom End</Button>}
        content={basicItems}
        position="bottom-end"
      />
      <DropdownMenu
        trigger={<Button variant="outline">Top Start</Button>}
        content={basicItems}
        position="top-start"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The menu can be positioned relative to the trigger using the position prop.",
      },
    },
  },
};
