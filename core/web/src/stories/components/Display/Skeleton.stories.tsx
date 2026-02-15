import type { Meta, StoryObj } from "@storybook/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
} from "@/components/ui/skeleton";

/**
 * The Skeleton component provides loading placeholders that mimic the layout
 * of content being loaded. Multiple variants cover common UI patterns.
 */
const meta: Meta<typeof Skeleton> = {
  title: "Components/Display/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Loading placeholder components with pulse and shimmer animations. Includes variants for text, avatars, buttons, images, cards, tables, and lists.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    animation: {
      control: "select",
      options: ["pulse", "shimmer"],
      description: "Animation type for the skeleton",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for sizing",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default skeleton
export const Default: Story = {
  args: {
    className: "h-4 w-64",
    animation: "pulse",
  },
};

// Text skeleton variants
export const TextVariants: Story = {
  render: () => (
    <div className="space-y-8 max-w-md">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Single line</p>
        <SkeletonText />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Multiple lines</p>
        <SkeletonText lines={3} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Multiple lines (last line full width)</p>
        <SkeletonText lines={3} lastLineShort={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "SkeletonText supports single and multi-line text placeholders with configurable last line width.",
      },
    },
  },
};

// Avatar skeleton variants
export const AvatarVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <SkeletonAvatar size="xs" />
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="md" />
        <SkeletonAvatar size="lg" />
        <SkeletonAvatar size="xl" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">With text placeholder</p>
        <SkeletonAvatar withText />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Square shape</p>
        <SkeletonAvatar shape="square" size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "SkeletonAvatar in various sizes, with optional text and shape variants.",
      },
    },
  },
};

// Composite skeletons
export const Composites: Story = {
  render: () => (
    <div className="space-y-8 max-w-lg">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Button skeletons</p>
        <div className="flex gap-4">
          <SkeletonButton size="sm" />
          <SkeletonButton size="md" />
          <SkeletonButton size="lg" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Image skeletons</p>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonImage aspectRatio="video" />
          <SkeletonImage aspectRatio="square" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Card skeleton</p>
        <SkeletonCard />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Button, image, and card skeleton composites for common loading patterns.",
      },
    },
  },
};

// Table and list skeletons
export const TableAndList: Story = {
  render: () => (
    <div className="space-y-8 max-w-lg">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Table skeleton</p>
        <SkeletonTable rows={3} columns={3} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">List skeleton (default)</p>
        <SkeletonList items={3} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">List skeleton (simple)</p>
        <SkeletonList items={3} variant="simple" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Table and list skeleton variants for data-heavy loading states.",
      },
    },
  },
};
