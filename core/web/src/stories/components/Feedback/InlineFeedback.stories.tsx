import type { Meta, StoryObj } from "@storybook/react";
import { InlineFeedback } from "@/components/feedback/inline-feedback";
import { useState } from "react";

/**
 * The InlineFeedback component displays lightweight status messages
 * inline with content, suitable for form field feedback or notifications.
 */
const meta: Meta<typeof InlineFeedback> = {
  title: "Components/Feedback/InlineFeedback",
  component: InlineFeedback,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A lightweight inline feedback component for displaying status messages. Lighter weight than Alert, suitable for form field feedback, inline notifications, or status indicators. Supports success, error, warning, and info variants.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "warning", "info"],
      description: "The feedback variant determines styling",
    },
    message: {
      control: "text",
      description: "The message to display",
    },
    show: {
      control: "boolean",
      description: "Whether to show the feedback",
    },
    onDismiss: {
      action: "dismissed",
      description: "Callback when dismiss button is clicked",
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

// Default
export const Default: Story = {
  args: {
    variant: "success",
    message: "Changes saved successfully",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <InlineFeedback variant="success" message="Changes saved successfully" />
      <InlineFeedback variant="error" message="Failed to save changes" />
      <InlineFeedback variant="warning" message="Session expires in 5 minutes" />
      <InlineFeedback variant="info" message="Tip: You can drag and drop files here" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Four variants are available: success (green), error (red), warning (yellow), and info (blue).",
      },
    },
  },
};

// Dismissible
export const Dismissible: Story = {
  render: function DismissibleFeedback() {
    const [showSuccess, setShowSuccess] = useState(true);
    const [showError, setShowError] = useState(true);
    const [showWarning, setShowWarning] = useState(true);

    const allDismissed = !showSuccess && !showError && !showWarning;

    return (
      <div className="space-y-4">
        <InlineFeedback
          variant="success"
          message="Profile updated"
          show={showSuccess}
          onDismiss={() => setShowSuccess(false)}
        />
        <InlineFeedback
          variant="error"
          message="Upload failed"
          show={showError}
          onDismiss={() => setShowError(false)}
        />
        <InlineFeedback
          variant="warning"
          message="Low disk space"
          show={showWarning}
          onDismiss={() => setShowWarning(false)}
        />
        {allDismissed && (
          <p className="text-sm text-muted-foreground text-center">
            All dismissed.{" "}
            <button
              className="underline"
              onClick={() => {
                setShowSuccess(true);
                setShowError(true);
                setShowWarning(true);
              }}
            >
              Reset
            </button>
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Providing an onDismiss callback adds a dismiss button to the feedback.",
      },
    },
  },
};

// Hidden state
export const HiddenState: Story = {
  render: function HiddenFeedback() {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-4">
        <button
          className="text-sm text-primary underline"
          onClick={() => setShow(!show)}
        >
          {show ? "Hide feedback" : "Show feedback"}
        </button>
        <InlineFeedback
          variant="info"
          message="This feedback is conditionally visible"
          show={show}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The show prop controls visibility. When false, the component renders nothing.',
      },
    },
  },
};

// Form field context
export const FormFieldContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
          defaultValue="invalid-email"
          aria-invalid="true"
        />
        <InlineFeedback variant="error" message="Please enter a valid email address" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Username</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
          defaultValue="john_doe"
        />
        <InlineFeedback variant="success" message="Username is available" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Common usage pattern for displaying form field validation messages.",
      },
    },
  },
};
