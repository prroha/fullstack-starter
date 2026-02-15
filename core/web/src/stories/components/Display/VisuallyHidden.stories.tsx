import type { Meta, StoryObj } from "@storybook/react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Icon } from "@/components/ui/icon";

/**
 * The VisuallyHidden component hides content visually while keeping it
 * accessible to screen readers and assistive technologies.
 */
const meta: Meta<typeof VisuallyHidden> = {
  title: "Components/Display/VisuallyHidden",
  component: VisuallyHidden,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Hides content visually while keeping it accessible to screen readers. Essential for providing context to assistive technologies without affecting visual layout.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Content to be hidden visually but accessible to screen readers",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default usage
export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The text below is visually hidden but available to screen readers.
        Inspect the DOM to see it:
      </p>
      <div className="p-4 border border-dashed border-border rounded-lg">
        <VisuallyHidden>
          This text is hidden visually but accessible to screen readers.
        </VisuallyHidden>
        <p className="text-sm text-muted-foreground italic">
          (The VisuallyHidden content is here but not visible)
        </p>
      </div>
    </div>
  ),
};

// Icon button with accessible label
export const IconButtonLabel: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        VisuallyHidden is useful for adding labels to icon-only buttons:
      </p>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-md hover:bg-accent" type="button">
          <Icon name="Settings" size="sm" />
          <VisuallyHidden>Settings</VisuallyHidden>
        </button>
        <button className="p-2 rounded-md hover:bg-accent" type="button">
          <Icon name="Bell" size="sm" />
          <VisuallyHidden>Notifications</VisuallyHidden>
        </button>
        <button className="p-2 rounded-md hover:bg-accent" type="button">
          <Icon name="Search" size="sm" />
          <VisuallyHidden>Search</VisuallyHidden>
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Add accessible labels to icon-only buttons without affecting the visual layout.",
      },
    },
  },
};

// Form field context
export const FormContext: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Provide additional context for form fields that screen readers can read:
      </p>
      <div className="space-y-2">
        <label htmlFor="search-field" className="text-sm font-medium">
          Search
        </label>
        <input
          id="search-field"
          type="text"
          className="border border-input rounded-md px-3 py-2 text-sm w-64"
          placeholder="Type to search..."
        />
        <VisuallyHidden>
          Search results will appear below as you type. Use arrow keys to navigate.
        </VisuallyHidden>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Provide additional instructions for screen reader users without cluttering the visual interface.",
      },
    },
  },
};

// Skip navigation link
export const SkipNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Tab into the area below to see the skip link appear (focus-visible):
      </p>
      <div className="relative p-4 border border-border rounded-lg">
        <a
          href="#main-content"
          className="absolute left-2 top-2 -translate-y-full focus:translate-y-0 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm z-50 transition-transform"
        >
          Skip to main content
        </a>
        <nav className="border-b border-border pb-2 mb-2">
          <p className="text-sm font-medium">Navigation area</p>
        </nav>
        <div id="main-content">
          <p className="text-sm">Main content area</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "A common pattern is combining VisuallyHidden with focus-visible styles for skip navigation links.",
      },
    },
  },
};
