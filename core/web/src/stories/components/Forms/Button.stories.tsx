import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * The Button component is the primary action element used throughout the application.
 * It supports multiple variants, sizes, and loading states.
 */
const meta: Meta<typeof Button> = {
  title: "Components/Forms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile button component with multiple variants and sizes. Supports loading states and can be used with icons.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Visual style variant of the button",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "Size of the button",
    },
    isLoading: {
      control: "boolean",
      description: "Shows a loading spinner and disables the button",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
    children: {
      control: "text",
      description: "Button content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button variants for different use cases.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Icon name="Plus" size="sm" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Button comes in small, default, large, and icon sizes.",
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button isLoading>Loading...</Button>
      <Button isLoading variant="secondary">Processing</Button>
      <Button isLoading variant="outline">Please wait</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Buttons can display a loading spinner to indicate async operations.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button disabled>Disabled</Button>
      <Button disabled variant="secondary">Disabled</Button>
      <Button disabled variant="outline">Disabled</Button>
      <Button disabled variant="destructive">Disabled</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button>
        <Icon name="Plus" size="sm" className="mr-2" />
        Add Item
      </Button>
      <Button variant="secondary">
        <Icon name="Download" size="sm" className="mr-2" />
        Download
      </Button>
      <Button variant="outline">
        <Icon name="Settings" size="sm" className="mr-2" />
        Settings
      </Button>
      <Button variant="destructive">
        <Icon name="Trash2" size="sm" className="mr-2" />
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Buttons can include icons for better visual context.",
      },
    },
  },
};

// Icon-only buttons
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="icon" variant="default">
        <Icon name="Plus" size="sm" />
      </Button>
      <Button size="icon" variant="secondary">
        <Icon name="Edit" size="sm" />
      </Button>
      <Button size="icon" variant="outline">
        <Icon name="MoreVertical" size="sm" />
      </Button>
      <Button size="icon" variant="ghost">
        <Icon name="X" size="sm" />
      </Button>
      <Button size="icon" variant="destructive">
        <Icon name="Trash2" size="sm" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon-only buttons are useful for compact UI elements like toolbars.",
      },
    },
  },
};
