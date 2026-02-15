import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "@/components/ui/rating";

/**
 * The Rating component provides a star-based rating input/display.
 * It supports read-only display, interactive selection, half-star ratings,
 * and custom icons.
 */
const meta: Meta<typeof Rating> = {
  title: "Components/Display/Rating",
  component: Rating,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A star rating component that supports both interactive input and read-only display. Features half-star ratings, keyboard navigation, size variants, and optional numeric value display.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 5, step: 0.5 },
      description: "Current rating value",
    },
    max: {
      control: { type: "number", min: 1, max: 10 },
      description: "Maximum rating value",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    readOnly: {
      control: "boolean",
      description: "Whether the rating is read-only",
    },
    disabled: {
      control: "boolean",
      description: "Whether the rating is disabled",
    },
    allowHalf: {
      control: "boolean",
      description: "Whether half-star ratings are allowed",
    },
    showValue: {
      control: "boolean",
      description: "Whether to show the numeric value",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive rating
export const Default: Story = {
  args: {
    defaultValue: 3,
    size: "md",
  },
};

// Read-only display
export const ReadOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Rating value={5} readOnly />
        <span className="text-sm text-muted-foreground">5 stars</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={4} readOnly />
        <span className="text-sm text-muted-foreground">4 stars</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={3} readOnly />
        <span className="text-sm text-muted-foreground">3 stars</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={2} readOnly />
        <span className="text-sm text-muted-foreground">2 stars</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={1} readOnly />
        <span className="text-sm text-muted-foreground">1 star</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Read-only ratings for displaying existing review scores.",
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Rating value={4} readOnly size="sm" />
        <span className="text-sm text-muted-foreground">Small</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={4} readOnly size="md" />
        <span className="text-sm text-muted-foreground">Medium</span>
      </div>
      <div className="flex items-center gap-3">
        <Rating value={4} readOnly size="lg" />
        <span className="text-sm text-muted-foreground">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Rating in small, medium, and large sizes.",
      },
    },
  },
};

// Half star ratings
export const HalfStars: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Rating value={3.5} readOnly allowHalf showValue />
      </div>
      <div className="flex items-center gap-3">
        <Rating value={4.5} readOnly allowHalf showValue />
      </div>
      <div className="flex items-center gap-3">
        <Rating value={2.5} readOnly allowHalf showValue />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Half-star ratings with the numeric value displayed.",
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      {[
        { name: "Design Quality", rating: 4.5 },
        { name: "Documentation", rating: 3.5 },
        { name: "Performance", rating: 5 },
        { name: "Support", rating: 4 },
      ].map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <span className="text-sm">{item.name}</span>
          <Rating value={item.rating} readOnly allowHalf size="sm" showValue />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Ratings used in a product review summary context.",
      },
    },
  },
};
