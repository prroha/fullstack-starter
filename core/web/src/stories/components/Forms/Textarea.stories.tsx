import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/ui/textarea";

/**
 * The Textarea component is used for multi-line text input.
 * It supports character counting and integrates with form validation.
 */
const meta: Meta<typeof Textarea> = {
  title: "Components/Forms/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A multi-line text input component with support for character counting and validation states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disables the textarea",
    },
    showCharacterCount: {
      control: "boolean",
      description: "Shows character count when maxLength is set",
    },
    maxLength: {
      control: "number",
      description: "Maximum character length",
    },
    rows: {
      control: "number",
      description: "Number of visible text lines",
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

// Default textarea
export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="message">
        Message
      </label>
      <Textarea
        id="message"
        placeholder="Type your message here..."
        rows={4}
      />
    </div>
  ),
};

// With character count
export const WithCharacterCount: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Bio (max 160 chars)</label>
        <Textarea
          placeholder="Tell us about yourself..."
          showCharacterCount
          maxLength={160}
          defaultValue="Software developer with a passion for building great user experiences."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (approaching limit)</label>
        <Textarea
          placeholder="Enter description..."
          showCharacterCount
          maxLength={200}
          defaultValue="This is a longer description that is approaching the character limit. You can see the counter changing color as you get closer to the maximum allowed characters."
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When showCharacterCount is enabled with a maxLength, the textarea displays a counter that changes color as you approach the limit.",
      },
    },
  },
};

// Different row heights
export const RowHeights: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">2 rows</label>
        <Textarea placeholder="Short input..." rows={2} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">4 rows (default)</label>
        <Textarea placeholder="Medium input..." rows={4} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">8 rows</label>
        <Textarea placeholder="Long input..." rows={8} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The number of visible rows can be controlled with the rows prop.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
    defaultValue: "This content cannot be edited",
  },
};

// Validation states
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Valid</label>
        <Textarea
          defaultValue="This is a valid message with enough content."
          className="border-green-500 focus-visible:ring-green-500"
        />
        <p className="text-sm text-green-600">Looks good!</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Invalid</label>
        <Textarea
          defaultValue="Too short"
          aria-invalid="true"
        />
        <p className="text-sm text-destructive">
          Message must be at least 50 characters
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Textareas can display validation states using aria-invalid and custom styling.",
      },
    },
  },
};

// Required field
export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="required-textarea">
        Feedback <span className="text-destructive">*</span>
      </label>
      <Textarea
        id="required-textarea"
        placeholder="Please provide your feedback..."
        required
        rows={4}
      />
      <p className="text-sm text-muted-foreground">
        Your feedback helps us improve our service.
      </p>
    </div>
  ),
};
