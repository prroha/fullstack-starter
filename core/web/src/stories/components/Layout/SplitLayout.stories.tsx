import type { Meta, StoryObj } from "@storybook/react";
import { SplitLayout } from "@/components/ui/layouts/split-layout";

/**
 * The SplitLayout component arranges content into two side-by-side panels
 * with configurable ratios, gaps, and responsive stacking behavior.
 */
const meta: Meta<typeof SplitLayout> = {
  title: "Components/Layout/SplitLayout",
  component: SplitLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A two-panel layout with configurable split ratio, gap, divider, and responsive stacking. Supports reversal on mobile and configurable breakpoints.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    ratio: {
      control: "select",
      options: ["50/50", "60/40", "70/30", "40/60", "30/70", "auto"],
      description: "Split ratio between panels",
    },
    gap: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Gap size between panels",
    },
    divider: {
      control: "boolean",
      description: "Show vertical divider line between panels",
    },
    reverseOnMobile: {
      control: "boolean",
      description: "Swap left/right order on mobile",
    },
    stackOnMobile: {
      control: "boolean",
      description: "Stack panels vertically on mobile",
    },
    mobileBreakpoint: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Breakpoint at which to apply mobile layout",
    },
    minHeight: {
      control: "text",
      description: "Minimum height of the layout",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const LeftPanel = ({ label = "Left Panel" }: { label?: string }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 h-full min-h-48">
    <h3 className="font-semibold mb-2">{label}</h3>
    <p className="text-sm text-muted-foreground">
      This is the left panel content area.
    </p>
  </div>
);

const RightPanel = ({ label = "Right Panel" }: { label?: string }) => (
  <div className="bg-accent border border-border rounded-lg p-6 h-full min-h-48">
    <h3 className="font-semibold mb-2">{label}</h3>
    <p className="text-sm text-muted-foreground">
      This is the right panel content area.
    </p>
  </div>
);

// Default 50/50 split
export const Default: Story = {
  args: {
    left: <LeftPanel />,
    right: <RightPanel />,
    ratio: "50/50",
    gap: "md",
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

// All ratio variants
export const RatioVariants: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      {(["50/50", "60/40", "70/30", "40/60", "30/70"] as const).map((ratio) => (
        <div key={ratio}>
          <p className="text-sm font-medium mb-2">
            Ratio: <code className="bg-muted px-1 rounded">{ratio}</code>
          </p>
          <SplitLayout
            left={<LeftPanel label={`Left (${ratio.split("/")[0]}%)`} />}
            right={<RightPanel label={`Right (${ratio.split("/")[1]}%)`} />}
            ratio={ratio}
            gap="sm"
            stackOnMobile={false}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "SplitLayout supports several ratio presets for controlling the relative size of each panel.",
      },
    },
  },
};

// With divider
export const WithDivider: Story = {
  args: {
    left: <LeftPanel />,
    right: <RightPanel />,
    ratio: "50/50",
    gap: "md",
    divider: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "A vertical divider line can be shown between the two panels.",
      },
    },
  },
};

// Content/sidebar pattern
export const ContentSidebar: Story = {
  render: () => (
    <div className="p-6">
      <SplitLayout
        left={
          <div className="space-y-4 p-4">
            <h2 className="text-xl font-bold">Main Content</h2>
            <p className="text-muted-foreground">
              This layout pattern is common for content pages with a sidebar for
              navigation, filters, or related content.
            </p>
            <div className="bg-muted rounded-lg p-4 min-h-64">
              <p className="text-sm text-muted-foreground">Content area</p>
            </div>
          </div>
        }
        right={
          <div className="p-4 space-y-3">
            <h3 className="font-semibold">Sidebar</h3>
            {["Overview", "Details", "Activity", "Settings"].map((item) => (
              <div
                key={item}
                className="px-3 py-2 rounded-md text-sm hover:bg-accent cursor-pointer"
              >
                {item}
              </div>
            ))}
          </div>
        }
        ratio="70/30"
        gap="md"
        divider
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "A common pattern using 70/30 ratio for main content with a sidebar.",
      },
    },
  },
};

// Stacking on mobile with reverse
export const ReverseOnMobile: Story = {
  args: {
    left: <LeftPanel label="Primary (shows second on mobile)" />,
    right: <RightPanel label="Secondary (shows first on mobile)" />,
    ratio: "60/40",
    gap: "md",
    stackOnMobile: true,
    reverseOnMobile: true,
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "When reverseOnMobile is true, the panels swap order when stacked vertically on mobile screens.",
      },
    },
  },
};
