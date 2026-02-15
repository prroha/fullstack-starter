import type { Meta, StoryObj } from "@storybook/react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useState } from "react";

/**
 * The RichTextEditor component provides a WYSIWYG editing experience with
 * formatting toolbar, keyboard shortcuts, and character/word counting.
 */
const meta: Meta<typeof RichTextEditor> = {
  title: "Components/Forms/RichTextEditor",
  component: RichTextEditor,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A rich text editor with formatting toolbar (bold, italic, underline, headings, lists, links, alignment), keyboard shortcuts, character/word counting, and maxLength support. Supports controlled and uncontrolled modes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when empty",
    },
    disabled: {
      control: "boolean",
      description: "Whether the editor is disabled",
    },
    readOnly: {
      control: "boolean",
      description: "Whether the editor is read-only",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant affecting minimum height",
    },
    showCharacterCount: {
      control: "boolean",
      description: "Whether to show character count",
    },
    showWordCount: {
      control: "boolean",
      description: "Whether to show word count",
    },
    maxLength: {
      control: "number",
      description: "Maximum character limit",
    },
    error: {
      control: "boolean",
      description: "Whether the editor has an error",
    },
    errorMessage: {
      control: "text",
      description: "Error message to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default editor
export const Default: Story = {
  render: function DefaultEditor() {
    const [value, setValue] = useState("");

    return (
      <div className="max-w-2xl">
        <RichTextEditor
          value={value}
          onChange={setValue}
          placeholder="Start writing your content..."
          aria-label="Content editor"
        />
      </div>
    );
  },
};

// With character and word count
export const WithCounts: Story = {
  render: function EditorWithCounts() {
    const [value, setValue] = useState("");

    return (
      <div className="max-w-2xl">
        <RichTextEditor
          value={value}
          onChange={setValue}
          placeholder="Write your article..."
          showCharacterCount
          showWordCount
          aria-label="Article editor"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The editor can display character and word counts below the editing area.",
      },
    },
  },
};

// With max length
export const WithMaxLength: Story = {
  render: function EditorWithMaxLength() {
    const [value, setValue] = useState("");

    return (
      <div className="max-w-2xl">
        <RichTextEditor
          value={value}
          onChange={setValue}
          placeholder="Write a brief description (max 500 characters)..."
          showCharacterCount
          maxLength={500}
          aria-label="Description editor"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Character count with a maximum limit provides visual feedback when approaching or exceeding the limit.",
      },
    },
  },
};

// Read-only mode
export const ReadOnly: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RichTextEditor
        defaultValue="<h2>Welcome to our platform</h2><p>This is a <strong>read-only</strong> preview of the rich text content. The toolbar is hidden and the content cannot be edited.</p><ul><li>Feature one</li><li>Feature two</li><li>Feature three</li></ul>"
        readOnly
        aria-label="Read-only content"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Read-only mode hides the toolbar and prevents editing, useful for previewing content.",
      },
    },
  },
};

// With error state
export const WithError: Story = {
  render: function EditorWithError() {
    const [value, setValue] = useState("");

    return (
      <div className="max-w-2xl">
        <RichTextEditor
          value={value}
          onChange={setValue}
          placeholder="Enter content..."
          error
          errorMessage="Content is required and must be at least 50 characters."
          aria-label="Required content editor"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The editor displays a destructive border and error message when validation fails.",
      },
    },
  },
};
