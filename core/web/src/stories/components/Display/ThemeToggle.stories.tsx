import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * The ThemeToggle component provides controls for switching between light, dark,
 * and system color modes. Available in multiple visual variants.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: "Components/Display/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A color mode toggle component with four variants: icon (simple toggle), button (with optional label), segmented (three-way control), and dropdown (menu selector).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["icon", "button", "dropdown", "segmented"],
      description: "Visual variant of the toggle",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the toggle",
    },
    showLabel: {
      control: "boolean",
      description: "Whether to show a text label",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default icon toggle
export const Default: Story = {
  args: {
    variant: "icon",
    size: "md",
  },
};

// Button variant
export const ButtonVariant: Story = {
  args: {
    variant: "button",
    size: "md",
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Button variant shows the current theme icon with an optional text label.",
      },
    },
  },
};

// Segmented control variant
export const SegmentedVariant: Story = {
  args: {
    variant: "segmented",
    size: "md",
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Segmented variant shows all three options (Light, System, Dark) as a radio group.",
      },
    },
  },
};

// Dropdown variant
export const DropdownVariant: Story = {
  args: {
    variant: "dropdown",
    size: "md",
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Dropdown variant opens a menu with all three color mode options.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="text-center">
          <ThemeToggle variant="icon" size={size} />
          <p className="text-xs text-muted-foreground mt-2">{size}</p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "ThemeToggle supports three sizes: sm, md, and lg.",
      },
    },
  },
};
