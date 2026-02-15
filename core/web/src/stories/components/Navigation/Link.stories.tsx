import type { Meta, StoryObj } from "@storybook/react";
import { AppLink } from "@/components/ui/link";

/**
 * The AppLink component is a smart link that automatically detects internal vs external URLs.
 * Internal links use Next.js Link; external links open in new tabs.
 */
const meta: Meta<typeof AppLink> = {
  title: "Components/Navigation/Link",
  component: AppLink,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A universal link component that renders as a Next.js Link for internal paths and a regular anchor tag with target='_blank' for external URLs. Supports variant colors, sizes, and underline behaviors.",
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  argTypes: {
    href: {
      control: "text",
      description: "The URL to link to",
    },
    variant: {
      control: "select",
      options: ["default", "muted", "primary", "destructive"],
      description: "Visual color variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Text size variant",
    },
    underline: {
      control: "select",
      options: ["always", "hover", "none"],
      description: "Underline behavior",
    },
    external: {
      control: "boolean",
      description: "Force external link behavior",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default internal link
export const Default: Story = {
  args: {
    href: "/dashboard",
    children: "Go to Dashboard",
    variant: "default",
    size: "md",
    underline: "hover",
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(["default", "muted", "primary", "destructive"] as const).map((variant) => (
        <AppLink key={variant} href="/example" variant={variant}>
          {variant}
        </AppLink>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "AppLink supports four color variants: default, muted, primary, and destructive.",
      },
    },
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-baseline gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <AppLink key={size} href="/example" size={size}>
          {size} link
        </AppLink>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Three text size variants: sm, md (default), and lg.",
      },
    },
  },
};

// Underline behaviors
export const UnderlineBehaviors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(["always", "hover", "none"] as const).map((underline) => (
        <AppLink key={underline} href="/example" underline={underline}>
          Underline: {underline}
        </AppLink>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Underline can be always visible, only on hover, or disabled entirely.",
      },
    },
  },
};

// External link
export const ExternalLink: Story = {
  args: {
    href: "https://example.com",
    children: "Visit Example.com",
    variant: "primary",
  },
  parameters: {
    docs: {
      description: {
        story:
          "URLs starting with http://, https://, mailto:, or tel: are automatically treated as external and open in a new tab with rel='noopener noreferrer'.",
      },
    },
  },
};
