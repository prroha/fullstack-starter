import type { Meta, StoryObj } from "@storybook/react";
import { LoadingWrapper } from "@/components/feedback/loading-wrapper";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * The LoadingWrapper component handles async content loading states
 * with consistent loading and error patterns.
 */
const meta: Meta<typeof LoadingWrapper> = {
  title: "Components/Feedback/LoadingWrapper",
  component: LoadingWrapper,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'A wrapper component for handling async content loading states. Provides consistent loading, error, and content display patterns. Supports "inline", "card", "overlay", and "minimal" variants.',
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isLoading: {
      control: "boolean",
      description: "Whether the content is loading",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    loadingMessage: {
      control: "text",
      description: "Loading message to display",
    },
    variant: {
      control: "select",
      options: ["inline", "card", "overlay", "minimal"],
      description: "Loading variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Spinner size for inline/minimal variants",
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

const SampleContent = () => (
  <div className="p-4 border rounded-lg">
    <h3 className="font-semibold text-foreground">Loaded Content</h3>
    <p className="text-sm text-muted-foreground mt-1">
      This content has loaded successfully.
    </p>
  </div>
);

// Default (loading state)
export const Default: Story = {
  args: {
    isLoading: true,
    loadingMessage: "Loading data...",
    children: <SampleContent />,
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-2">Inline (default)</p>
        <LoadingWrapper isLoading={true} variant="inline" loadingMessage="Loading...">
          <SampleContent />
        </LoadingWrapper>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Card</p>
        <LoadingWrapper isLoading={true} variant="card" loadingMessage="Loading statistics...">
          <SampleContent />
        </LoadingWrapper>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Minimal</p>
        <LoadingWrapper isLoading={true} variant="minimal">
          <SampleContent />
        </LoadingWrapper>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Overlay</p>
        <LoadingWrapper isLoading={true} variant="overlay" loadingMessage="Saving...">
          <SampleContent />
        </LoadingWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Four loading variants: inline (centered spinner with message), card (loading card), minimal (compact spinner), and overlay (spinner over content).",
      },
    },
  },
};

// Error state
export const ErrorState: Story = {
  args: {
    isLoading: false,
    error: "Failed to load data. Please check your connection.",
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: "When an error prop is provided, the error state is displayed instead of content.",
      },
    },
  },
};

// Error with retry
export const ErrorWithRetry: Story = {
  render: function ErrorRetry() {
    const [error, setError] = useState<string | null>("Failed to load data");
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = () => {
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    return (
      <LoadingWrapper
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        loadingMessage="Retrying..."
      >
        <SampleContent />
      </LoadingWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Providing an onRetry callback adds a "Try again" link to the error state.',
      },
    },
  },
};

// Interactive toggle
export const Interactive: Story = {
  render: function InteractiveWrapper() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={isLoading ? "default" : "outline"}
            onClick={() => {
              setIsLoading(true);
              setError(null);
            }}
          >
            Loading
          </Button>
          <Button
            size="sm"
            variant={error ? "default" : "outline"}
            onClick={() => {
              setIsLoading(false);
              setError("Something went wrong");
            }}
          >
            Error
          </Button>
          <Button
            size="sm"
            variant={!isLoading && !error ? "default" : "outline"}
            onClick={() => {
              setIsLoading(false);
              setError(null);
            }}
          >
            Loaded
          </Button>
        </div>
        <LoadingWrapper
          isLoading={isLoading}
          error={error}
          loadingMessage="Loading content..."
        >
          <SampleContent />
        </LoadingWrapper>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Toggle between loading, error, and loaded states to see the transitions.",
      },
    },
  },
};
