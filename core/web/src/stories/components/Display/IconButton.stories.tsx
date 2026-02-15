import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "@/components/ui/icon-button";
import { Icon } from "@/components/ui/icon";

/**
 * The IconButton component is a compact button that displays only an icon.
 * It requires an aria-label for accessibility.
 */
const meta: Meta<typeof IconButton> = {
  title: "Components/Display/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compact icon-only button with variants, sizes, and loading state. Requires an aria-label for screen reader accessibility.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost"],
      description: "Visual variant of the button",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Size of the button",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state showing a spinner",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default icon button
export const Default: Story = {
  args: {
    icon: <Icon name="Plus" size="sm" />,
    "aria-label": "Add item",
    variant: "default",
    size: "md",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["default", "destructive", "outline", "secondary", "ghost"] as const).map(
        (variant) => (
          <div key={variant} className="text-center">
            <IconButton
              icon={<Icon name="Settings" size="sm" />}
              aria-label={`${variant} button`}
              variant={variant}
            />
            <p className="text-xs text-muted-foreground mt-2">{variant}</p>
          </div>
        )
      )}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "IconButton supports default, destructive, outline, secondary, and ghost variants.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="text-center">
          <IconButton
            icon={<Icon name="Heart" size={size === "lg" ? "md" : "sm"} />}
            aria-label={`${size} button`}
            variant="outline"
            size={size}
          />
          <p className="text-xs text-muted-foreground mt-2">{size}</p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Four sizes available: xs (24px), sm (32px), md (36px), lg (40px).",
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    icon: <Icon name="Download" size="sm" />,
    "aria-label": "Download",
    variant: "outline",
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "When isLoading is true, the icon is replaced by a spinner and the button is disabled.",
      },
    },
  },
};

// Common use cases
export const CommonUseCases: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton
        icon={<Icon name="Pencil" size="sm" />}
        aria-label="Edit"
        variant="ghost"
      />
      <IconButton
        icon={<Icon name="Trash2" size="sm" />}
        aria-label="Delete"
        variant="destructive"
      />
      <IconButton
        icon={<Icon name="Copy" size="sm" />}
        aria-label="Copy"
        variant="outline"
      />
      <IconButton
        icon={<Icon name="X" size="sm" />}
        aria-label="Close"
        variant="ghost"
      />
      <IconButton
        icon={<Icon name="MoreVertical" size="sm" />}
        aria-label="More options"
        variant="ghost"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Common icon button use cases: edit, delete, copy, close, and more options.",
      },
    },
  },
};
