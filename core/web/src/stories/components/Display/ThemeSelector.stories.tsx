import type { Meta, StoryObj } from "@storybook/react";
import { ThemeSelector } from "@/components/ui/theme-selector";

/**
 * The ThemeSelector component allows users to pick from available color themes.
 * It supports grid, list, and dropdown display variants.
 */
const meta: Meta<typeof ThemeSelector> = {
  title: "Components/Display/ThemeSelector",
  component: ThemeSelector,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A theme picker component that displays available color themes with preview swatches. Supports grid, list, and dropdown layouts with optional descriptions and psychology tags.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["grid", "list", "dropdown"],
      description: "Display variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the selector",
    },
    showDescription: {
      control: "boolean",
      description: "Show theme descriptions",
    },
    showPsychology: {
      control: "boolean",
      description: "Show color psychology text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default grid layout
export const Default: Story = {
  args: {
    variant: "grid",
    size: "md",
    showDescription: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

// List layout
export const ListVariant: Story = {
  args: {
    variant: "list",
    size: "md",
    showDescription: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "List variant shows themes in a vertical list with horizontal layout for each option.",
      },
    },
  },
};

// Dropdown layout
export const DropdownVariant: Story = {
  args: {
    variant: "dropdown",
    size: "md",
    showDescription: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Dropdown variant shows a compact selector that opens to reveal all theme options.",
      },
    },
  },
};

// With psychology text
export const WithPsychology: Story = {
  args: {
    variant: "grid",
    size: "lg",
    showDescription: true,
    showPsychology: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[700px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Enabling showPsychology displays the color psychology description for each theme.",
      },
    },
  },
};

// Small size
export const SmallSize: Story = {
  args: {
    variant: "grid",
    size: "sm",
    showDescription: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Small size with descriptions hidden, useful when space is limited.",
      },
    },
  },
};
