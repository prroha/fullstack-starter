import type { Meta, StoryObj } from "@storybook/react";
import { CopyButton, CopyableText } from "@/components/ui/copy-button";
import { fn } from "@storybook/test";

/**
 * The CopyButton component copies text to the clipboard with visual feedback.
 * Also includes a CopyableText utility component for inline code snippets.
 */
const meta: Meta<typeof CopyButton> = {
  title: "Components/Display/CopyButton",
  component: CopyButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A button that copies specified text to the clipboard. Shows a checkmark animation on success. Available in multiple sizes and variants.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "Text to copy to clipboard",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    variant: {
      control: "select",
      options: ["default", "outline", "ghost"],
      description: "Style variant",
    },
    showLabel: {
      control: "boolean",
      description: "Whether to show a text label",
    },
    label: {
      control: "text",
      description: "Custom label text",
    },
    copiedLabel: {
      control: "text",
      description: "Label text shown after copying",
    },
    copiedDuration: {
      control: "number",
      description: "Duration in ms to show the success state",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default copy button
export const Default: Story = {
  args: {
    text: "Hello, World!",
    variant: "outline",
    size: "md",
    onCopySuccess: fn(),
  },
};

// With label
export const WithLabel: Story = {
  args: {
    text: "npm install @acme/ui",
    showLabel: true,
    label: "Copy",
    copiedLabel: "Copied!",
    variant: "outline",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "When showLabel is true, a text label is displayed next to the icon.",
      },
    },
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["default", "outline", "ghost"] as const).map((variant) => (
        <div key={variant} className="text-center">
          <CopyButton
            text="Copy me"
            variant={variant}
            showLabel
            label={variant}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "CopyButton supports default, outline, and ghost variants.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="text-center">
          <CopyButton text="Copy me" variant="outline" size={size} />
          <p className="text-xs text-muted-foreground mt-2">{size}</p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Three sizes: sm, md, and lg.",
      },
    },
  },
};

// CopyableText component
export const CopyableTextExample: Story = {
  render: () => (
    <div className="space-y-3">
      <CopyableText text="npm install @acme/ui" />
      <CopyableText text="sk-1234567890abcdef" truncate />
      <CopyableText
        text="https://api.example.com/v1/users"
        buttonSize="sm"
        buttonVariant="ghost"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "CopyableText is a convenience component that renders text in a code block with a copy button. Supports truncation for long strings.",
      },
    },
  },
};
