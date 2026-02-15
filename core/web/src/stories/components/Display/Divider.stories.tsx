import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@/components/ui/divider";

/**
 * The Divider component provides visual separation between content sections.
 * It supports horizontal and vertical orientations, solid and dashed styles, and optional labels.
 */
const meta: Meta<typeof Divider> = {
  title: "Components/Display/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A visual separator component for dividing content sections. Supports horizontal/vertical orientation, solid/dashed variants, and optional centered labels.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Orientation of the divider",
    },
    variant: {
      control: "select",
      options: ["solid", "dashed"],
      description: "Visual variant of the divider",
    },
    label: {
      control: "text",
      description: "Optional label to display in the center",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default horizontal divider
export const Default: Story = {
  args: {
    orientation: "horizontal",
    variant: "solid",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

// Horizontal variants
export const HorizontalVariants: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-md">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Solid (default)</p>
        <Divider variant="solid" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Dashed</p>
        <Divider variant="dashed" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Horizontal dividers in solid and dashed styles.",
      },
    },
  },
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-md">
      <Divider label="OR" />
      <Divider label="Section Break" />
      <Divider label="Continue" variant="dashed" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Dividers with centered labels, commonly used for 'OR' separators in forms.",
      },
    },
  },
};

// Vertical orientation
export const Vertical: Story = {
  render: () => (
    <div className="flex items-center gap-4 h-16">
      <span className="text-sm">Item 1</span>
      <Divider orientation="vertical" />
      <span className="text-sm">Item 2</span>
      <Divider orientation="vertical" variant="dashed" />
      <span className="text-sm">Item 3</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Vertical dividers used to separate inline items.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4 p-6 border rounded-lg">
      <div>
        <h3 className="font-medium">Section One</h3>
        <p className="text-sm text-muted-foreground">Content for the first section.</p>
      </div>
      <Divider />
      <div>
        <h3 className="font-medium">Section Two</h3>
        <p className="text-sm text-muted-foreground">Content for the second section.</p>
      </div>
      <Divider label="OR" />
      <div>
        <h3 className="font-medium">Alternative</h3>
        <p className="text-sm text-muted-foreground">An alternative option below.</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Dividers used within a card to separate content sections.",
      },
    },
  },
};
