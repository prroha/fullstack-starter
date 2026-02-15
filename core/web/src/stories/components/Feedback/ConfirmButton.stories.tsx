import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { fn } from "@storybook/test";

/**
 * The ConfirmButton component requires user confirmation before
 * executing potentially destructive actions.
 */
const meta: Meta<typeof ConfirmButton> = {
  title: "Components/Feedback/ConfirmButton",
  component: ConfirmButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'A button that requires confirmation before executing destructive actions. Supports two patterns: "double-click" (click twice within 3 seconds) and "dialog" (opens a confirmation dialog).',
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    confirmMode: {
      control: "select",
      options: ["double-click", "dialog"],
      description: "Confirmation pattern to use",
    },
    confirmTitle: {
      control: "text",
      description: "Title for dialog mode",
    },
    confirmMessage: {
      control: "text",
      description: "Message for dialog mode",
    },
    confirmLabel: {
      control: "text",
      description: 'Label for confirm button (default: "Confirm")',
    },
    cancelLabel: {
      control: "text",
      description: 'Label for cancel button in dialog mode (default: "Cancel")',
    },
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost"],
      description: "Button variant",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default (double-click mode)
export const Default: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
    onConfirm: fn(),
  },
};

// Double-click mode
export const DoubleClickMode: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click once to see &quot;Are you sure?&quot;, click again within 3 seconds to confirm.
      </p>
      <div className="flex gap-4">
        <ConfirmButton
          variant="destructive"
          onConfirm={() => alert("Item deleted!")}
        >
          Delete Item
        </ConfirmButton>
        <ConfirmButton
          variant="outline"
          onConfirm={() => alert("Action confirmed!")}
        >
          Remove
        </ConfirmButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The default "double-click" mode requires two clicks within 3 seconds to confirm the action. The button changes to "Are you sure?" after the first click.',
      },
    },
  },
};

// Dialog mode
export const DialogMode: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click to open a confirmation dialog before executing the action.
      </p>
      <ConfirmButton
        confirmMode="dialog"
        confirmTitle="Delete Item"
        confirmMessage="Are you sure you want to delete this item? This action cannot be undone."
        variant="destructive"
        onConfirm={() => alert("Item deleted!")}
      >
        Delete Item
      </ConfirmButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The "dialog" mode opens a confirmation dialog with customizable title, message, and button labels.',
      },
    },
  },
};

// Custom labels
export const CustomLabels: Story = {
  render: () => (
    <ConfirmButton
      confirmMode="dialog"
      confirmTitle="Archive Project"
      confirmMessage="This project will be moved to the archive. You can restore it later."
      confirmLabel="Yes, Archive"
      cancelLabel="No, Keep It"
      variant="secondary"
      onConfirm={() => alert("Project archived!")}
    >
      Archive Project
    </ConfirmButton>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The confirm and cancel button labels in dialog mode can be customized.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
    disabled: true,
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: "ConfirmButton respects the disabled prop, preventing any interaction.",
      },
    },
  },
};
