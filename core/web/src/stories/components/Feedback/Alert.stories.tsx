import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "@/components/feedback/alert";
import { useState } from "react";

/**
 * The Alert component displays prominent messages to users.
 * It supports multiple variants for different message types.
 */
const meta: Meta<typeof Alert> = {
  title: "Components/Feedback/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A block-level alert component for displaying important messages. Supports multiple variants, titles, custom icons, and dismissible functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "info", "success", "warning", "destructive"],
      description: "Visual variant of the alert",
    },
    title: {
      control: "text",
      description: "Optional title for the alert",
    },
    children: {
      control: "text",
      description: "Alert content",
    },
    onDismiss: {
      action: "dismissed",
      description: "Callback when dismiss button is clicked",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default alert
export const Default: Story = {
  args: {
    children: "This is a default alert message.",
    variant: "default",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default">
        This is a default alert message.
      </Alert>
      <Alert variant="info">
        This is an informational alert message.
      </Alert>
      <Alert variant="success">
        This is a success alert message.
      </Alert>
      <Alert variant="warning">
        This is a warning alert message.
      </Alert>
      <Alert variant="destructive">
        This is a destructive/error alert message.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available alert variants for different message types.",
      },
    },
  },
};

// With titles
export const WithTitles: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Information">
        Please review the following information before proceeding.
      </Alert>
      <Alert variant="success" title="Success!">
        Your changes have been saved successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        This action cannot be undone. Please proceed with caution.
      </Alert>
      <Alert variant="destructive" title="Error">
        Something went wrong. Please try again later.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Alerts can include titles for additional context.",
      },
    },
  },
};

// Dismissible alerts
export const Dismissible: Story = {
  render: function DismissibleAlerts() {
    const [alerts, setAlerts] = useState([
      { id: 1, variant: "info" as const, message: "This alert can be dismissed." },
      { id: 2, variant: "success" as const, message: "Click the X to dismiss this alert." },
      { id: 3, variant: "warning" as const, message: "This warning can also be dismissed." },
    ]);

    const dismissAlert = (id: number) => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };

    return (
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            onDismiss={() => dismissAlert(alert.id)}
          >
            {alert.message}
          </Alert>
        ))}
        {alerts.length === 0 && (
          <p className="text-center text-muted-foreground">
            All alerts dismissed.{" "}
            <button
              className="underline"
              onClick={() =>
                setAlerts([
                  { id: 1, variant: "info", message: "This alert can be dismissed." },
                  { id: 2, variant: "success", message: "Click the X to dismiss this alert." },
                  { id: 3, variant: "warning", message: "This warning can also be dismissed." },
                ])
              }
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
        story: "Alerts can be dismissible by providing an onDismiss callback.",
      },
    },
  },
};

// With custom icons
export const WithCustomIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert
        variant="info"
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      >
        Alert with a custom icon.
      </Alert>
      <Alert
        variant="success"
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      >
        Alert with a custom success icon.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom icons can be provided to override the default variant icons.",
      },
    },
  },
};

// Long content
export const LongContent: Story = {
  render: () => (
    <Alert variant="warning" title="Important Notice">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur.
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: "Alerts handle long content gracefully.",
      },
    },
  },
};

// With links
export const WithLinks: Story = {
  render: () => (
    <Alert variant="info" title="Update Available">
      A new version is available.{" "}
      <a href="#" className="font-medium underline hover:no-underline">
        Click here to update
      </a>
      .
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: "Alerts can contain links for actionable messages.",
      },
    },
  },
};

// Form validation example
export const FormValidation: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="destructive" title="Please fix the following errors:">
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Email address is required</li>
          <li>Password must be at least 8 characters</li>
          <li>Please accept the terms of service</li>
        </ul>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of using alerts for form validation error summaries.",
      },
    },
  },
};
