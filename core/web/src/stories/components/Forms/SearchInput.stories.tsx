import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "@/components/ui/search-input";

/**
 * The SearchInput component provides a search field with built-in debouncing,
 * loading state, clear button, and optional keyboard shortcut hint.
 */
const meta: Meta<typeof SearchInput> = {
  title: "Components/Forms/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A search input with built-in debounce, loading spinner, clear button, and keyboard shortcut badge. Supports controlled and uncontrolled modes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant of the search input",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    debounceDelay: {
      control: "number",
      description: "Debounce delay in milliseconds (default: 300)",
    },
    loading: {
      control: "boolean",
      description: "Whether the search is loading",
    },
    shortcutHint: {
      control: "text",
      description: 'Keyboard shortcut hint (e.g., "K" for Cmd+K)',
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    defaultValue: {
      control: "text",
      description: "Initial value for uncontrolled mode",
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

// Default search input
export const Default: Story = {
  args: {
    placeholder: "Search...",
    size: "md",
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <SearchInput size="sm" placeholder="Small search..." />
      <SearchInput size="md" placeholder="Medium search..." />
      <SearchInput size="lg" placeholder="Large search..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "SearchInput is available in small, medium, and large sizes.",
      },
    },
  },
};

// With keyboard shortcut hint
export const WithShortcutHint: Story = {
  args: {
    placeholder: "Search...",
    shortcutHint: "K",
  },
  parameters: {
    docs: {
      description: {
        story: "A keyboard shortcut badge can be displayed when the input is empty.",
      },
    },
  },
};

// Loading state
export const Loading: Story = {
  args: {
    placeholder: "Searching...",
    loading: true,
    defaultValue: "react components",
  },
  parameters: {
    docs: {
      description: {
        story: "A loading spinner replaces the clear button while results are being fetched.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: "Search disabled",
    disabled: true,
  },
};
