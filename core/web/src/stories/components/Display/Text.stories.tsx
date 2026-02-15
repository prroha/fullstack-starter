import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "@/components/ui/text";

/**
 * The Text component provides consistent typography across the application.
 * It supports multiple variants, sizes, colors, and renders as different HTML elements.
 */
const meta: Meta<typeof Text> = {
  title: "Components/Display/Text",
  component: Text,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A typography component for rendering text with consistent styling. Supports body, caption, overline, and code variants.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["body", "caption", "overline", "code"],
      description: "Typography variant",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Size variant",
    },
    color: {
      control: "select",
      options: ["default", "muted", "primary", "destructive"],
      description: "Color variant",
    },
    as: {
      control: "select",
      options: ["p", "span", "div"],
      description: "HTML element to render",
    },
    children: {
      control: "text",
      description: "Text content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default text
export const Default: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
    variant: "body",
    size: "md",
    color: "default",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Text variant="body">Body text - The quick brown fox jumps over the lazy dog.</Text>
      </div>
      <div>
        <Text variant="caption">Caption text - A smaller, secondary text style.</Text>
      </div>
      <div>
        <Text variant="overline">Overline text</Text>
      </div>
      <div>
        <Text variant="code">const greeting = &quot;Hello, World!&quot;;</Text>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available typography variants: body, caption, overline, and code.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-3">
      <Text size="xs">Extra small text (xs)</Text>
      <Text size="sm">Small text (sm)</Text>
      <Text size="md">Medium text (md) - default</Text>
      <Text size="lg">Large text (lg)</Text>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Text comes in four sizes: xs, sm, md (default), and lg.",
      },
    },
  },
};

// All colors
export const Colors: Story = {
  render: () => (
    <div className="space-y-3">
      <Text color="default">Default color text</Text>
      <Text color="muted">Muted color text</Text>
      <Text color="primary">Primary color text</Text>
      <Text color="destructive">Destructive color text</Text>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Text supports four color variants for different emphasis levels.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-4 max-w-md p-6 border rounded-lg">
      <Text variant="overline" color="primary">Category</Text>
      <Text size="lg" as="div">Article Title Goes Here</Text>
      <Text color="muted">
        This is a description paragraph using muted color for secondary information.
      </Text>
      <Text variant="caption" color="muted">
        Published 2 hours ago
      </Text>
      <Text variant="code">npm install my-package</Text>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Text variants used together in a typical content layout.",
      },
    },
  },
};
