import type { Meta, StoryObj } from "@storybook/react";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { fn } from "@storybook/test";

/**
 * The AvatarUpload component provides a drag-and-drop avatar upload interface
 * with preview, validation, and remove functionality.
 */
const meta: Meta<typeof AvatarUpload> = {
  title: "Components/Forms/AvatarUpload",
  component: AvatarUpload,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A circular avatar upload component with drag-and-drop support, file validation (type and size), preview, upload progress, and optional remove button.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the avatar display",
    },
    initials: {
      control: "text",
      description: "Fallback initials when no image is present",
    },
    currentAvatarUrl: {
      control: "text",
      description: "URL of the current avatar image",
    },
    isUploading: {
      control: "boolean",
      description: "Whether an upload is in progress",
    },
    uploadProgress: {
      control: { type: "range", min: 0, max: 100 },
      description: "Upload progress percentage",
    },
    disabled: {
      control: "boolean",
      description: "Whether the component is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUpload = async (_file: File) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

// Default with initials
export const Default: Story = {
  args: {
    initials: "JD",
    onUpload: mockUpload,
    onRemove: fn(),
    size: "lg",
  },
};

// With existing avatar
export const WithExistingAvatar: Story = {
  args: {
    currentAvatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
    initials: "JD",
    onUpload: mockUpload,
    onRemove: fn(),
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "When a current avatar URL is provided, the image is displayed with a remove option.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-start gap-8">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="text-center">
          <AvatarUpload
            initials="AB"
            onUpload={mockUpload}
            size={size}
          />
          <p className="text-xs text-muted-foreground mt-2">{size}</p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "AvatarUpload comes in three sizes: sm (64px), md (96px), and lg (128px).",
      },
    },
  },
};

// Uploading state
export const Uploading: Story = {
  args: {
    initials: "JD",
    onUpload: mockUpload,
    isUploading: true,
    uploadProgress: 65,
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "During upload, a spinner overlay is shown with optional progress percentage.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    initials: "JD",
    onUpload: mockUpload,
    disabled: true,
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "When disabled, the component is visually dimmed and interaction is prevented.",
      },
    },
  },
};
