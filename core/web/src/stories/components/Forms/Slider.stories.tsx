import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "@/components/ui/slider";

/**
 * The Slider component provides a range selection control with single
 * and dual-handle modes, marks, tooltips, and keyboard navigation.
 */
const meta: Meta<typeof Slider> = {
  title: "Components/Forms/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A slider input supporting single value or range selection, with customizable marks, value label tooltips, size and color variants, and full keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    min: {
      control: "number",
      description: "Minimum value",
    },
    max: {
      control: "number",
      description: "Maximum value",
    },
    step: {
      control: "number",
      description: "Step increment",
    },
    defaultValue: {
      control: "number",
      description: "Default value for uncontrolled single slider",
    },
    range: {
      control: "boolean",
      description: "Whether to enable range mode (two handles)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "destructive"],
      description: "Color variant for the filled track and thumb border",
    },
    valueLabelDisplay: {
      control: "select",
      options: ["off", "on", "auto"],
      description: 'Value label display mode: "off", "on" (always), or "auto" (on hover/drag)',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80 py-8 px-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default single slider
export const Default: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    "aria-label": "Volume",
  },
};

// Range slider
export const Range: Story = {
  args: {
    range: true,
    defaultValues: [20, 80],
    min: 0,
    max: 100,
    "aria-label-start": "Min price",
    "aria-label-end": "Max price",
  },
  parameters: {
    docs: {
      description: {
        story: "Range mode uses two handles to select a value range. Handles cannot cross each other.",
      },
    },
  },
};

// With marks
export const WithMarks: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 25,
    marks: [
      { value: 0, label: "0%" },
      { value: 25, label: "25%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
      { value: 100, label: "100%" },
    ],
    "aria-label": "Completion",
  },
  decorators: [
    (Story) => (
      <div className="w-80 pt-8 pb-12 px-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Marks provide labeled tick points along the slider track.",
      },
    },
  },
};

// Color variants
export const Colors: Story = {
  render: () => (
    <div className="space-y-8">
      <Slider defaultValue={60} color="primary" aria-label="Primary" />
      <Slider defaultValue={60} color="secondary" aria-label="Secondary" />
      <Slider defaultValue={60} color="success" aria-label="Success" />
      <Slider defaultValue={60} color="warning" aria-label="Warning" />
      <Slider defaultValue={60} color="destructive" aria-label="Destructive" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The slider track and thumb border color can be customized with color variants.",
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <Slider defaultValue={50} size="sm" aria-label="Small" />
      <Slider defaultValue={50} size="md" aria-label="Medium" />
      <Slider defaultValue={50} size="lg" aria-label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Slider comes in small, medium, and large sizes affecting the track height and thumb size.",
      },
    },
  },
};
