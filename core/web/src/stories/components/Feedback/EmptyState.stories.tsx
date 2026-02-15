import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, ShoppingCart, BookOpen } from "lucide-react";

/**
 * The EmptyState component displays a visual placeholder when content
 * is missing, with optional action buttons and predefined variants.
 */
const meta: Meta<typeof EmptyState> = {
  title: "Components/Feedback/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible empty state component for displaying placeholder content when no data is available. Supports custom icons, predefined variants (noData, noResults, noNotifications, error, offline), action buttons, and custom illustrations.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Main title text",
    },
    description: {
      control: "text",
      description: "Descriptive text below the title",
    },
    variant: {
      control: "select",
      options: ["noData", "noResults", "noNotifications", "error", "offline"],
      description: "Predefined variant with built-in icon and styling",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default empty state
export const Default: Story = {
  args: {
    title: "No items yet",
    description: "Get started by creating your first item.",
    action: {
      label: "Create Item",
      onClick: () => alert("Create clicked"),
    },
  },
};

// All predefined variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <EmptyState
        variant="noData"
        title="No data available"
        description="There is no data to display yet."
      />
      <EmptyState
        variant="noResults"
        title="No results found"
        description="Try adjusting your search or filters."
      />
      <EmptyState
        variant="noNotifications"
        title="You're all caught up!"
        description="No new notifications right now."
      />
      <EmptyState
        variant="error"
        title="Something went wrong"
        description="We encountered an error loading this content."
        action={{
          label: "Try Again",
          onClick: () => alert("Retry"),
          variant: "outline",
        }}
      />
      <EmptyState
        variant="offline"
        title="No internet connection"
        description="Please check your connection and try again."
        action={{
          label: "Retry",
          onClick: () => alert("Retry"),
          variant: "outline",
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Five predefined variants with appropriate icons and styling: noData, noResults, noNotifications, error, and offline.",
      },
    },
  },
};

// Custom icons
export const CustomIcons: Story = {
  render: () => (
    <div className="space-y-6">
      <EmptyState
        icon={FileText}
        title="No documents"
        description="Upload or create your first document to get started."
        action={{
          label: "Upload Document",
          onClick: () => alert("Upload"),
        }}
      />
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse our catalog and add items to your cart."
        action={{
          label: "Browse Products",
          onClick: () => alert("Browse"),
        }}
      />
      <EmptyState
        icon={BookOpen}
        title="No courses enrolled"
        description="Explore available courses and start learning today."
        action={{
          label: "Explore Courses",
          onClick: () => alert("Explore"),
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom Lucide icons can be passed to match the content domain.",
      },
    },
  },
};

// With primary and secondary actions
export const WithActions: Story = {
  render: () => (
    <EmptyState
      title="No projects found"
      description="Create a new project or import an existing one to get started."
      action={{
        label: "Create Project",
        onClick: () => alert("Create"),
      }}
      secondaryAction={{
        label: "Import from GitHub",
        onClick: () => alert("Import"),
        variant: "ghost",
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Empty states can include both a primary action button and a secondary action button.",
      },
    },
  },
};

// Minimal (no description, no actions)
export const Minimal: Story = {
  args: {
    title: "Nothing here yet",
    variant: "noData",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A minimal empty state with just a title and variant icon, without description or actions.",
      },
    },
  },
};
