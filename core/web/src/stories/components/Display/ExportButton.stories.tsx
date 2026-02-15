import type { Meta, StoryObj } from "@storybook/react";
import { ExportButton } from "@/components/ui/export-button";
import { fn } from "@storybook/test";

/**
 * The ExportButton component provides a download/export action with format selection.
 * It supports single-format and multi-format modes with a dropdown selector.
 */
const meta: Meta<typeof ExportButton> = {
  title: "Components/Display/ExportButton",
  component: ExportButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A download/export button with optional format selector dropdown. Handles loading states, success feedback, and error callbacks.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Button label text",
    },
    formats: {
      control: "object",
      description: "Available export formats",
    },
    defaultFormat: {
      control: "select",
      options: ["csv", "json", "xlsx", "pdf"],
      description: "Default export format",
    },
    showFormatSelector: {
      control: "boolean",
      description: "Whether to show the format dropdown",
    },
    showIcon: {
      control: "boolean",
      description: "Whether to show the download icon",
    },
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost"],
      description: "Button style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockExport = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
};

// Default single-format export
export const Default: Story = {
  args: {
    label: "Export",
    onExport: mockExport,
    onSuccess: fn(),
    formats: ["csv"],
    defaultFormat: "csv",
    showIcon: true,
  },
};

// With format selector
export const WithFormatSelector: Story = {
  args: {
    label: "Export",
    onExport: mockExport,
    onSuccess: fn(),
    formats: ["csv", "json", "xlsx", "pdf"],
    defaultFormat: "csv",
    showFormatSelector: true,
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When multiple formats are available and showFormatSelector is true, a split button with a dropdown appears.",
      },
    },
  },
};

// Without icon
export const WithoutIcon: Story = {
  args: {
    label: "Download Report",
    onExport: mockExport,
    showIcon: false,
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        story: "The download icon can be hidden for a simpler text-only button.",
      },
    },
  },
};

// Different variants
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["default", "outline", "secondary", "ghost"] as const).map((variant) => (
        <ExportButton
          key={variant}
          label={variant}
          onExport={mockExport}
          variant={variant}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "ExportButton inherits Button variants: default, outline, secondary, and ghost.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: "Export",
    onExport: mockExport,
    disabled: true,
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: "The export button can be disabled to prevent interaction.",
      },
    },
  },
};
