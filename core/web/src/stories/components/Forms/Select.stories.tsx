import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "@/components/ui/select";
import { useState } from "react";

/**
 * The Select component provides a dropdown for selecting from a list of options.
 * It supports option groups, labels, and validation states.
 */
const meta: Meta<typeof Select> = {
  title: "Components/Forms/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A native select dropdown with support for option groups, sizes, labels, and error states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the select",
    },
    disabled: {
      control: "boolean",
      description: "Disables the select",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    label: {
      control: "text",
      description: "Label text",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
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

const simpleOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

const countryOptions = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
];

const groupedOptions = [
  {
    label: "North America",
    options: [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
      { value: "mx", label: "Mexico" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "uk", label: "United Kingdom" },
      { value: "de", label: "Germany" },
      { value: "fr", label: "France" },
    ],
  },
  {
    label: "Asia Pacific",
    options: [
      { value: "au", label: "Australia" },
      { value: "jp", label: "Japan" },
      { value: "in", label: "India" },
    ],
  },
];

// Default select
export const Default: Story = {
  args: {
    options: simpleOptions,
    placeholder: "Select an option",
  },
};

// With label
export const WithLabel: Story = {
  args: {
    options: countryOptions,
    label: "Country",
    placeholder: "Select your country",
  },
};

// Required field
export const Required: Story = {
  args: {
    options: countryOptions,
    label: "Country",
    placeholder: "Select your country",
    required: true,
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select
        options={simpleOptions}
        size="sm"
        label="Small"
        placeholder="Select..."
      />
      <Select
        options={simpleOptions}
        size="md"
        label="Medium (default)"
        placeholder="Select..."
      />
      <Select
        options={simpleOptions}
        size="lg"
        label="Large"
        placeholder="Select..."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select comes in three sizes: small, medium (default), and large.",
      },
    },
  },
};

// With option groups
export const WithOptionGroups: Story = {
  args: {
    options: groupedOptions,
    label: "Country",
    placeholder: "Select your country",
  },
  parameters: {
    docs: {
      description: {
        story: "Options can be organized into groups for better organization.",
      },
    },
  },
};

// With error
export const WithError: Story = {
  args: {
    options: countryOptions,
    label: "Country",
    placeholder: "Select your country",
    error: "Please select a country",
    required: true,
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    options: countryOptions,
    label: "Country",
    placeholder: "Select your country",
    disabled: true,
    value: "us",
  },
};

// Controlled select
export const Controlled: Story = {
  render: function ControlledSelect() {
    const [value, setValue] = useState("");

    return (
      <div className="space-y-4">
        <Select
          options={countryOptions}
          label="Country"
          placeholder="Select your country"
          value={value}
          onChange={setValue}
        />
        <p className="text-sm text-muted-foreground">
          Selected value: {value || "None"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Select can be controlled with value and onChange props.",
      },
    },
  },
};
