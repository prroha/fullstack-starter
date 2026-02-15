import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components/ui/label";

/**
 * The Label component provides accessible labels for form elements.
 * It supports required indicators and disabled styling.
 */
const meta: Meta<typeof Label> = {
  title: "Components/Forms/Label",
  component: Label,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A form label component with support for required field indicators and disabled state styling.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    htmlFor: {
      control: "text",
      description: "ID of the form element this label is for",
    },
    required: {
      control: "boolean",
      description: "Whether the associated field is required (shows asterisk)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the associated field is disabled (muted style)",
    },
    children: {
      control: "text",
      description: "Label text content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default label
export const Default: Story = {
  args: {
    children: "Email Address",
    htmlFor: "email",
  },
};

// Required label
export const Required: Story = {
  args: {
    children: "Password",
    htmlFor: "password",
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: "When required is true, a red asterisk is displayed after the label text.",
      },
    },
  },
};

// Disabled label
export const Disabled: Story = {
  args: {
    children: "Disabled Field",
    htmlFor: "disabled-field",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled labels appear muted with reduced opacity and a not-allowed cursor.",
      },
    },
  },
};

// All states
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Label htmlFor="default">Default Label</Label>
      <Label htmlFor="required" required>
        Required Label
      </Label>
      <Label htmlFor="disabled" disabled>
        Disabled Label
      </Label>
      <Label htmlFor="required-disabled" required disabled>
        Required & Disabled
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All label states side by side for comparison.",
      },
    },
  },
};
