import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

/**
 * The Tooltip component displays informational text when hovering
 * or focusing on an element.
 */
const meta: Meta<typeof Tooltip> = {
  title: "Components/Overlay/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A tooltip component that displays informational text on hover or focus. Supports multiple positions, variants, arrow indicators, and configurable delay.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description: "The content to display in the tooltip",
    },
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Position of the tooltip relative to the trigger",
    },
    variant: {
      control: "select",
      options: ["dark", "light"],
      description: "Visual variant of the tooltip",
    },
    delay: {
      control: "number",
      description: "Delay in milliseconds before showing the tooltip",
    },
    showArrow: {
      control: "boolean",
      description: "Whether to show the arrow indicator",
    },
    disabled: {
      control: "boolean",
      description: "Whether the tooltip is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default tooltip
export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

// All positions
export const Positions: Story = {
  render: () => (
    <div className="flex gap-8 items-center p-16">
      <Tooltip content="Top tooltip" position="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltip supports four positions: top (default), bottom, left, and right.",
      },
    },
  },
};

// Variants
export const Variants: Story = {
  render: () => (
    <div className="flex gap-8 items-center p-8">
      <Tooltip content="Dark variant (default)" variant="dark">
        <Button variant="outline">Dark</Button>
      </Tooltip>
      <Tooltip content="Light variant" variant="light">
        <Button variant="outline">Light</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltip supports dark (default) and light visual variants.",
      },
    },
  },
};

// Without arrow
export const WithoutArrow: Story = {
  render: () => (
    <div className="flex gap-8 items-center p-8">
      <Tooltip content="With arrow" showArrow={true}>
        <Button variant="outline">With Arrow</Button>
      </Tooltip>
      <Tooltip content="Without arrow" showArrow={false}>
        <Button variant="outline">Without Arrow</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The arrow indicator can be hidden by setting showArrow to false.",
      },
    },
  },
};

// Rich content
export const RichContent: Story = {
  render: () => (
    <div className="p-8">
      <Tooltip
        content={
          <div className="space-y-1">
            <p className="font-medium">Keyboard Shortcut</p>
            <p className="text-xs opacity-80">Press Ctrl+S to save</p>
          </div>
        }
      >
        <Button>Rich Tooltip</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltip content can include rich JSX elements, not just text.",
      },
    },
  },
};
