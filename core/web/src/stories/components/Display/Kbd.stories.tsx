import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "@/components/ui/kbd";

/**
 * The Kbd component renders a keyboard key indicator, useful for
 * displaying keyboard shortcuts and key bindings.
 */
const meta: Meta<typeof Kbd> = {
  title: "Components/Display/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A keyboard key indicator component for displaying keyboard shortcuts and key combinations.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Key label to display",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default key
export const Default: Story = {
  args: {
    children: "K",
  },
};

// Single keys
export const SingleKeys: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>Ctrl</Kbd>
      <Kbd>Alt</Kbd>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Common single key indicators for modifier and special keys.",
      },
    },
  },
};

// Keyboard shortcuts
export const KeyboardShortcuts: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Save</span>
        <Kbd>Ctrl</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>S</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Copy</span>
        <Kbd>Ctrl</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>C</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Search</span>
        <Kbd>Ctrl</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>K</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Undo</span>
        <Kbd>Ctrl</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>Z</Kbd>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Kbd components combined to display common keyboard shortcuts.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <p className="text-sm text-muted-foreground">
        Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to open the command palette.
      </p>
      <p className="text-sm text-muted-foreground">
        Use <Kbd>Esc</Kbd> to close the dialog.
      </p>
      <p className="text-sm text-muted-foreground">
        Navigate with <Kbd>&#8593;</Kbd> and <Kbd>&#8595;</Kbd> arrow keys.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Kbd inline with text to describe keyboard interactions.",
      },
    },
  },
};
