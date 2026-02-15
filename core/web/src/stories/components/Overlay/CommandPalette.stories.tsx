import type { Meta, StoryObj } from "@storybook/react";
import { CommandPalette } from "@/components/ui/command-palette";
import type { CommandItem } from "@/components/ui/command-palette";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * The CommandPalette component provides a keyboard-driven command
 * interface with fuzzy search, grouping, and recent items.
 */
const meta: Meta<typeof CommandPalette> = {
  title: "Components/Overlay/CommandPalette",
  component: CommandPalette,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A command palette (Cmd+K / Ctrl+K) with fuzzy search, grouped items, keyboard navigation, recent items, and keyboard shortcut display. Ideal for power-user workflows.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the palette is open",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for search input",
    },
    noResultsText: {
      control: "text",
      description: "Text to show when no results found",
    },
    enableGlobalShortcut: {
      control: "boolean",
      description: "Whether to enable global Cmd+K / Ctrl+K shortcut",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems: CommandItem[] = [
  {
    id: "new-file",
    label: "New File",
    description: "Create a new file",
    shortcut: "Ctrl+N",
    group: "File",
    onSelect: () => alert("New File"),
  },
  {
    id: "open-file",
    label: "Open File",
    description: "Open an existing file",
    shortcut: "Ctrl+O",
    group: "File",
    onSelect: () => alert("Open File"),
  },
  {
    id: "save",
    label: "Save",
    description: "Save the current file",
    shortcut: "Ctrl+S",
    group: "File",
    onSelect: () => alert("Save"),
  },
  {
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    description: "Show or hide the sidebar",
    shortcut: "Ctrl+B",
    group: "View",
    onSelect: () => alert("Toggle Sidebar"),
  },
  {
    id: "toggle-terminal",
    label: "Toggle Terminal",
    description: "Show or hide the terminal",
    shortcut: "Ctrl+`",
    group: "View",
    onSelect: () => alert("Toggle Terminal"),
  },
  {
    id: "settings",
    label: "Settings",
    description: "Open application settings",
    shortcut: "Ctrl+,",
    group: "Preferences",
    onSelect: () => alert("Settings"),
  },
  {
    id: "keyboard-shortcuts",
    label: "Keyboard Shortcuts",
    description: "View all keyboard shortcuts",
    group: "Preferences",
    onSelect: () => alert("Keyboard Shortcuts"),
  },
];

// Default command palette
export const Default: Story = {
  render: function DefaultPalette() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Open Command Palette (Ctrl+K)
        </Button>
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={sampleItems}
          enableGlobalShortcut={false}
        />
      </>
    );
  },
};

// With recent items
export const WithRecentItems: Story = {
  render: function RecentPalette() {
    const [isOpen, setIsOpen] = useState(false);

    const recentItems: CommandItem[] = [
      {
        id: "save",
        label: "Save",
        shortcut: "Ctrl+S",
        group: "File",
        onSelect: () => alert("Save"),
      },
      {
        id: "settings",
        label: "Settings",
        shortcut: "Ctrl+,",
        group: "Preferences",
        onSelect: () => alert("Settings"),
      },
    ];

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Open with Recent Items
        </Button>
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={sampleItems}
          recentItems={recentItems}
          recentLabel="Recently Used"
          enableGlobalShortcut={false}
        />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Recent/frequent items are displayed at the top of the list when no search query is entered.",
      },
    },
  },
};

// Custom placeholder and no results text
export const CustomText: Story = {
  render: function CustomTextPalette() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Open Custom Palette
        </Button>
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={sampleItems}
          placeholder="Search actions..."
          noResultsText="No matching actions found. Try a different search."
          enableGlobalShortcut={false}
        />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Placeholder text and empty state text can be customized.",
      },
    },
  },
};

// With disabled items
export const WithDisabledItems: Story = {
  render: function DisabledPalette() {
    const [isOpen, setIsOpen] = useState(false);

    const itemsWithDisabled: CommandItem[] = [
      ...sampleItems,
      {
        id: "deploy",
        label: "Deploy to Production",
        description: "Requires admin permissions",
        group: "Actions",
        disabled: true,
        onSelect: () => {},
      },
    ];

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Open with Disabled Items
        </Button>
        <CommandPalette
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={itemsWithDisabled}
          enableGlobalShortcut={false}
        />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Individual command items can be disabled to prevent selection.",
      },
    },
  },
};
