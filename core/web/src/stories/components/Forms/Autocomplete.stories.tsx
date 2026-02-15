import type { Meta, StoryObj } from "@storybook/react";
import { Autocomplete } from "@/components/ui/autocomplete";

/**
 * The Autocomplete component provides a searchable dropdown input
 * with keyboard navigation, custom filtering, and loading states.
 */
const meta: Meta<typeof Autocomplete> = {
  title: "Components/Forms/Autocomplete",
  component: Autocomplete,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A combobox-style input that filters a list of options as you type. Supports keyboard navigation, custom values, loading states, and error display.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text for the input",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    label: {
      control: "text",
      description: "Label text displayed above the input",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
    },
    allowCustomValue: {
      control: "boolean",
      description: "Whether to allow values not in the options list",
    },
    loading: {
      control: "boolean",
      description: "Whether to show a loading spinner",
    },
    noResultsText: {
      control: "text",
      description: "Text shown when no options match the filter",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Input size variant",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const fruitOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
  { value: "peach", label: "Peach" },
  { value: "strawberry", label: "Strawberry" },
];

// Default autocomplete
export const Default: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Select a fruit...",
    label: "Favorite Fruit",
  },
};

// With string options
export const StringOptions: Story = {
  args: {
    options: ["React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Remix"],
    placeholder: "Select a framework...",
    label: "Framework",
  },
  parameters: {
    docs: {
      description: {
        story: "Options can be provided as simple strings instead of {value, label} objects.",
      },
    },
  },
};

// With custom value allowed
export const AllowCustomValue: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Type or select...",
    label: "Fruit (custom allowed)",
    allowCustomValue: true,
  },
  parameters: {
    docs: {
      description: {
        story: "When allowCustomValue is enabled, users can enter values not present in the options list.",
      },
    },
  },
};

// With error
export const WithError: Story = {
  args: {
    options: fruitOptions,
    placeholder: "Select a fruit...",
    label: "Required Fruit",
    required: true,
    error: "Please select a fruit.",
  },
  parameters: {
    docs: {
      description: {
        story: "Error state with a validation message displayed below the input.",
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    options: [],
    placeholder: "Loading options...",
    label: "Async Options",
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "A loading spinner is displayed while options are being fetched asynchronously.",
      },
    },
  },
};
