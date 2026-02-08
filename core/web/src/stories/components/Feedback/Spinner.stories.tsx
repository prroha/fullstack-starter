import type { Meta, StoryObj } from "@storybook/react";
import { Spinner, SpinnerOverlay } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

/**
 * The Spinner component indicates loading states throughout the application.
 * It comes in multiple sizes and can be used inline or as an overlay.
 */
const meta: Meta<typeof Spinner> = {
  title: "Components/Feedback/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "An animated circular spinner for indicating loading states. Supports multiple sizes and can be used inline or with buttons.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the spinner",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default spinner
export const Default: Story = {
  args: {
    size: "md",
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-sm mt-4">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-sm mt-4">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-sm mt-4">Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Spinner comes in three sizes: small (16px), medium (32px), and large (48px).",
      },
    },
  },
};

// With button
export const WithButton: Story = {
  render: () => (
    <div className="space-y-4">
      <Button disabled>
        <Spinner size="sm" className="mr-2" />
        Loading...
      </Button>
      <div className="flex gap-4">
        <Button variant="secondary" disabled>
          <Spinner size="sm" className="mr-2" />
          Processing
        </Button>
        <Button variant="outline" disabled>
          <Spinner size="sm" className="mr-2" />
          Please wait
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Spinners can be used inside buttons to indicate loading actions.",
      },
    },
  },
};

// Centered loading
export const CenteredLoading: Story = {
  render: () => (
    <div className="flex flex-col items-center justify-center gap-4 h-48 w-64 border rounded-lg">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Common pattern for loading states in content areas.",
      },
    },
  },
};

// Inline loading
export const InlineLoading: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Fetching data</span>
        <Spinner size="sm" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Uploading file</span>
        <Spinner size="sm" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span>Saving changes</span>
        <Spinner size="sm" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Spinners can be used inline with other content.",
      },
    },
  },
};

// Custom colors
export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner size="md" className="border-blue-500 border-t-transparent" />
        <p className="text-sm mt-4">Blue</p>
      </div>
      <div className="text-center">
        <Spinner size="md" className="border-green-500 border-t-transparent" />
        <p className="text-sm mt-4">Green</p>
      </div>
      <div className="text-center">
        <Spinner size="md" className="border-orange-500 border-t-transparent" />
        <p className="text-sm mt-4">Orange</p>
      </div>
      <div className="text-center">
        <Spinner size="md" className="border-purple-500 border-t-transparent" />
        <p className="text-sm mt-4">Purple</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Spinner color can be customized using Tailwind classes.",
      },
    },
  },
};

// Card loading skeleton alternative
export const CardLoading: Story = {
  render: () => (
    <div className="w-64 border rounded-lg overflow-hidden">
      <div className="h-32 bg-muted flex items-center justify-center">
        <Spinner size="md" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of a spinner used in a card loading state.",
      },
    },
  },
};

// Full page overlay (SpinnerOverlay)
export const Overlay: Story = {
  render: () => (
    <div className="relative w-80 h-64 border rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="font-medium">Content behind overlay</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This content is obscured by the loading overlay.
        </p>
      </div>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overlay pattern for blocking loading states.",
      },
    },
  },
};
