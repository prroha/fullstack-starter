import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@/components/ui/avatar";

/**
 * The Avatar component displays user profile images with fallback options.
 * It supports initials, status indicators, and multiple sizes.
 */
const meta: Meta<typeof Avatar> = {
  title: "Components/Display/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A user avatar component with support for images, initials fallback, status indicators, and multiple sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    src: {
      control: "text",
      description: "Image source URL",
    },
    alt: {
      control: "text",
      description: "Alt text for the image",
    },
    name: {
      control: "text",
      description: "Name used to generate initials fallback",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the avatar",
    },
    status: {
      control: "select",
      options: [undefined, "online", "offline", "busy", "away"],
      description: "Status indicator",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default with image
export const Default: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
    alt: "User avatar",
    name: "John Doe",
    size: "md",
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="xs"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="sm"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="md"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="lg"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="xl"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Avatar comes in five sizes: xs, sm, md, lg, and xl.",
      },
    },
  },
};

// With initials fallback
export const WithInitials: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="John Doe" size="md" />
      <Avatar name="Alice Smith" size="md" />
      <Avatar name="Bob" size="md" />
      <Avatar name="Jane Wilson" size="md" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When no image is provided, the avatar displays initials based on the name.",
      },
    },
  },
};

// Default fallback (no image or name)
export const DefaultFallback: Story = {
  args: {
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When neither image nor name is provided, a default user icon is shown.",
      },
    },
  },
};

// With status indicators
export const WithStatus: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Avatar name="John Doe" size="lg" status="online" />
        <p className="text-sm mt-2">Online</p>
      </div>
      <div className="text-center">
        <Avatar name="Alice Smith" size="lg" status="away" />
        <p className="text-sm mt-2">Away</p>
      </div>
      <div className="text-center">
        <Avatar name="Bob Wilson" size="lg" status="busy" />
        <p className="text-sm mt-2">Busy</p>
      </div>
      <div className="text-center">
        <Avatar name="Jane Doe" size="lg" status="offline" />
        <p className="text-sm mt-2">Offline</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Avatars can display status indicators (online, away, busy, offline).",
      },
    },
  },
};

// Status with different sizes
export const StatusSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar name="User" size="xs" status="online" />
      <Avatar name="User" size="sm" status="online" />
      <Avatar name="User" size="md" status="online" />
      <Avatar name="User" size="lg" status="online" />
      <Avatar name="User" size="xl" status="online" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Status indicator size scales with avatar size.",
      },
    },
  },
};

// Image error fallback
export const ImageErrorFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar
        src="https://invalid-url.com/image.jpg"
        name="John Doe"
        size="lg"
      />
      <p className="text-sm text-muted-foreground">
        Falls back to initials when image fails to load
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When an image fails to load, the avatar automatically falls back to initials.",
      },
    },
  },
};

// Avatar group
export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-3">
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="md"
        className="border-2 border-background"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
        name="Alice Smith"
        size="md"
        className="border-2 border-background"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
        name="Bob Wilson"
        size="md"
        className="border-2 border-background"
      />
      <Avatar
        name="+5"
        size="md"
        className="border-2 border-background"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Avatars can be stacked to show a group of users.",
      },
    },
  },
};

// In context - User card
export const UserCard: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4 border rounded-lg w-64">
      <Avatar
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
        name="John Doe"
        size="lg"
        status="online"
      />
      <div>
        <p className="font-medium">John Doe</p>
        <p className="text-sm text-muted-foreground">Software Engineer</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of avatar used in a user card context.",
      },
    },
  },
};
