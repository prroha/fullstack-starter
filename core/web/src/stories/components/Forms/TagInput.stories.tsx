import type { Meta, StoryObj } from "@storybook/react";
import { TagInput } from "@/components/ui/tag-input";
import { useState } from "react";

/**
 * The TagInput component allows users to enter multiple tags with
 * keyboard support, validation, and configurable limits.
 */
const meta: Meta<typeof TagInput> = {
  title: "Components/Forms/TagInput",
  component: TagInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A multi-value tag input that supports adding tags via Enter or comma, removing with Backspace/Delete, keyboard navigation between tags, duplicate prevention, and max tag limits.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no tags are present",
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
    maxTags: {
      control: "number",
      description: "Maximum number of tags allowed",
    },
    allowDuplicates: {
      control: "boolean",
      description: "Whether to allow duplicate tags",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default tag input (interactive)
export const Default: Story = {
  render: function TagInputDefault() {
    const [tags, setTags] = useState<string[]>(["React", "TypeScript"]);
    return (
      <TagInput
        value={tags}
        onChange={setTags}
        label="Technologies"
        placeholder="Add a technology..."
      />
    );
  },
};

// With max tags limit
export const WithMaxTags: Story = {
  render: function TagInputMaxTags() {
    const [tags, setTags] = useState<string[]>(["Design", "Frontend", "Backend"]);
    return (
      <TagInput
        value={tags}
        onChange={setTags}
        label="Skills"
        placeholder="Add a skill..."
        maxTags={5}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "When maxTags is set, the input is disabled once the limit is reached and a counter is displayed.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: function TagInputSizes() {
    const [smTags, setSmTags] = useState<string[]>(["Small"]);
    const [mdTags, setMdTags] = useState<string[]>(["Medium"]);
    const [lgTags, setLgTags] = useState<string[]>(["Large"]);
    return (
      <div className="space-y-4">
        <TagInput value={smTags} onChange={setSmTags} size="sm" label="Small" placeholder="Add tag..." />
        <TagInput value={mdTags} onChange={setMdTags} size="md" label="Medium" placeholder="Add tag..." />
        <TagInput value={lgTags} onChange={setLgTags} size="lg" label="Large" placeholder="Add tag..." />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "TagInput is available in small, medium, and large sizes.",
      },
    },
  },
};

// With error
export const WithError: Story = {
  render: function TagInputError() {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <TagInput
        value={tags}
        onChange={setTags}
        label="Categories"
        required
        error="At least one category is required."
        placeholder="Add a category..."
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Error state with validation message displayed below the input.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  render: function TagInputDisabled() {
    const [tags] = useState<string[]>(["React", "TypeScript", "Next.js"]);
    return (
      <TagInput
        value={tags}
        onChange={() => {}}
        label="Locked Tags"
        disabled
        placeholder="Cannot add tags"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled TagInput prevents adding or removing tags.",
      },
    },
  },
};
