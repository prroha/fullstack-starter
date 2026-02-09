import type { Meta, StoryObj } from "@storybook/react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * The Icon component provides access to the Lucide icon library.
 * It supports multiple sizes and color variants.
 */
const meta: Meta<typeof Icon> = {
  title: "Components/Display/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A wrapper around Lucide icons with consistent sizing and color support.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: [
        "House",
        "Settings",
        "User",
        "Mail",
        "Bell",
        "Search",
        "Plus",
        "Minus",
        "Check",
        "X",
        "ChevronLeft",
        "ChevronRight",
        "ChevronUp",
        "ChevronDown",
        "ArrowLeft",
        "ArrowRight",
        "Heart",
        "Star",
        "Download",
        "Upload",
        "Trash2",
        "Pencil",
        "Eye",
        "EyeOff",
        "Copy",
        "ExternalLink",
        "Menu",
        "MoreHorizontal",
        "EllipsisVertical",
        "Calendar",
        "Clock",
        "MapPin",
        "Phone",
        "FileText",
        "Folder",
        "Image",
        "Video",
        "Music",
        "CircleAlert",
        "TriangleAlert",
        "Info",
        "CircleQuestionMark",
        "CircleCheck",
        "XCircle",
      ] as IconName[],
      description: "Name of the Lucide icon",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the icon",
    },
    color: {
      control: "select",
      options: ["default", "muted", "primary", "destructive", "success", "warning"],
      description: "Color variant of the icon",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default icon
export const Default: Story = {
  args: {
    name: "House",
    size: "md",
    color: "default",
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="text-center">
        <Icon name="Star" size="xs" />
        <p className="text-xs mt-2">xs (12px)</p>
      </div>
      <div className="text-center">
        <Icon name="Star" size="sm" />
        <p className="text-xs mt-2">sm (16px)</p>
      </div>
      <div className="text-center">
        <Icon name="Star" size="md" />
        <p className="text-xs mt-2">md (20px)</p>
      </div>
      <div className="text-center">
        <Icon name="Star" size="lg" />
        <p className="text-xs mt-2">lg (24px)</p>
      </div>
      <div className="text-center">
        <Icon name="Star" size="xl" />
        <p className="text-xs mt-2">xl (32px)</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icons come in five sizes: xs (12px), sm (16px), md (20px), lg (24px), and xl (32px).",
      },
    },
  },
};

// All colors
export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Icon name="Bell" size="lg" color="default" />
        <p className="text-xs mt-2">Default</p>
      </div>
      <div className="text-center">
        <Icon name="Bell" size="lg" color="muted" />
        <p className="text-xs mt-2">Muted</p>
      </div>
      <div className="text-center">
        <Icon name="Bell" size="lg" color="primary" />
        <p className="text-xs mt-2">Primary</p>
      </div>
      <div className="text-center">
        <Icon name="Bell" size="lg" color="success" />
        <p className="text-xs mt-2">Success</p>
      </div>
      <div className="text-center">
        <Icon name="Bell" size="lg" color="warning" />
        <p className="text-xs mt-2">Warning</p>
      </div>
      <div className="text-center">
        <Icon name="Bell" size="lg" color="destructive" />
        <p className="text-xs mt-2">Destructive</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icons support various color variants for different contexts.",
      },
    },
  },
};

// Common icons
export const CommonIcons: Story = {
  render: () => {
    const icons: IconName[] = [
      "House",
      "Settings",
      "User",
      "Mail",
      "Bell",
      "Search",
      "Plus",
      "Minus",
      "Check",
      "X",
      "Heart",
      "Star",
      "Download",
      "Upload",
      "Trash2",
      "Pencil",
      "Eye",
      "Copy",
      "Menu",
      "Calendar",
    ];

    return (
      <div className="grid grid-cols-5 gap-6">
        {icons.map((name) => (
          <div key={name} className="text-center">
            <Icon name={name} size="lg" />
            <p className="text-xs mt-2 text-muted-foreground">{name}</p>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A collection of commonly used icons.",
      },
    },
  },
};

// Navigation icons
export const NavigationIcons: Story = {
  render: () => {
    const icons: IconName[] = [
      "ChevronLeft",
      "ChevronRight",
      "ChevronUp",
      "ChevronDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "ExternalLink",
      "CornerUpLeft",
    ];

    return (
      <div className="flex items-center gap-6">
        {icons.map((name) => (
          <div key={name} className="text-center">
            <Icon name={name} size="lg" />
            <p className="text-xs mt-2 text-muted-foreground">{name}</p>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Icons for navigation and directional purposes.",
      },
    },
  },
};

// Status icons
export const StatusIcons: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Icon name="CircleCheck" size="lg" color="success" />
        <p className="text-xs mt-2">Success</p>
      </div>
      <div className="text-center">
        <Icon name="CircleAlert" size="lg" color="destructive" />
        <p className="text-xs mt-2">Error</p>
      </div>
      <div className="text-center">
        <Icon name="TriangleAlert" size="lg" color="warning" />
        <p className="text-xs mt-2">Warning</p>
      </div>
      <div className="text-center">
        <Icon name="Info" size="lg" color="primary" />
        <p className="text-xs mt-2">Info</p>
      </div>
      <div className="text-center">
        <Icon name="CircleQuestionMark" size="lg" color="muted" />
        <p className="text-xs mt-2">Help</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icons commonly used for status indicators and alerts.",
      },
    },
  },
};

// With text
export const WithText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="Mail" size="sm" />
        <span>Email</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="Phone" size="sm" />
        <span>Phone</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="MapPin" size="sm" />
        <span>Location</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="Calendar" size="sm" />
        <span>Schedule</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icons are commonly paired with text labels.",
      },
    },
  },
};
