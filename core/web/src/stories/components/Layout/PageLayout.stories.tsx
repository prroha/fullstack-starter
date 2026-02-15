import type { Meta, StoryObj } from "@storybook/react";
import { PageLayout, SidebarToggle } from "@/components/ui/layouts/page-layout";
import { Icon } from "@/components/ui/icon";

/**
 * The PageLayout component provides a flexible page structure with optional header,
 * footer, and sidebar. It supports collapsible sidebar on mobile.
 */
const meta: Meta<typeof PageLayout> = {
  title: "Components/Layout/PageLayout",
  component: PageLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A full-page layout component with optional header, footer, and sidebar. The sidebar supports collapsible mobile behavior with overlay.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    sidebarPosition: {
      control: "select",
      options: ["left", "right"],
      description: "Position of the sidebar",
    },
    sidebarWidth: {
      control: "text",
      description: "Width of the sidebar (CSS value)",
    },
    sidebarCollapsible: {
      control: "boolean",
      description: "Whether the sidebar can collapse on mobile",
    },
    fullWidth: {
      control: "boolean",
      description: "If true, content spans full width without max-width constraint",
    },
    stickyHeader: {
      control: "boolean",
      description: "Whether the header is sticky",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleHeader = () => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
    <div className="flex items-center gap-3">
      <SidebarToggle />
      <h1 className="text-lg font-semibold">My App</h1>
    </div>
    <div className="flex items-center gap-2">
      <Icon name="Bell" size="sm" className="text-muted-foreground" />
      <Icon name="User" size="sm" className="text-muted-foreground" />
    </div>
  </div>
);

const SampleSidebar = () => (
  <div className="p-4 space-y-2">
    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Menu</p>
    {["Dashboard", "Users", "Settings", "Reports"].map((item) => (
      <div
        key={item}
        className="px-3 py-2 rounded-md text-sm hover:bg-accent cursor-pointer"
      >
        {item}
      </div>
    ))}
  </div>
);

const SampleFooter = () => (
  <div className="px-4 py-3 border-t border-border text-center text-sm text-muted-foreground">
    Footer content
  </div>
);

const SampleContent = () => (
  <div className="p-6 space-y-4">
    <h2 className="text-xl font-bold">Page Content</h2>
    <p className="text-muted-foreground">
      This is the main content area of the page layout.
    </p>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-card rounded-lg border">
          <p className="font-medium">Card {i}</p>
          <p className="text-sm text-muted-foreground mt-1">Card content goes here.</p>
        </div>
      ))}
    </div>
  </div>
);

// Default with all sections
export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <PageLayout
        header={<SampleHeader />}
        sidebar={<SampleSidebar />}
        footer={<SampleFooter />}
      >
        <SampleContent />
      </PageLayout>
    </div>
  ),
};

// With right sidebar
export const RightSidebar: Story = {
  render: () => (
    <div className="h-screen">
      <PageLayout
        header={<SampleHeader />}
        sidebar={<SampleSidebar />}
        sidebarPosition="right"
        footer={<SampleFooter />}
      >
        <SampleContent />
      </PageLayout>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The sidebar can be positioned on the right side of the layout.",
      },
    },
  },
};

// Without sidebar
export const WithoutSidebar: Story = {
  render: () => (
    <div className="h-screen">
      <PageLayout
        header={<SampleHeader />}
        footer={<SampleFooter />}
      >
        <SampleContent />
      </PageLayout>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The sidebar is optional. Without it, the content spans the full width.",
      },
    },
  },
};

// Collapsible sidebar
export const CollapsibleSidebar: Story = {
  render: () => (
    <div className="h-screen">
      <PageLayout
        header={<SampleHeader />}
        sidebar={<SampleSidebar />}
        sidebarCollapsible
        footer={<SampleFooter />}
      >
        <SampleContent />
      </PageLayout>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When sidebarCollapsible is true, the sidebar becomes a mobile overlay controlled by a SidebarToggle button in the header.",
      },
    },
  },
};

// Full width content
export const FullWidth: Story = {
  render: () => (
    <div className="h-screen">
      <PageLayout
        header={<SampleHeader />}
        fullWidth
      >
        <SampleContent />
      </PageLayout>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Setting fullWidth removes the max-width constraint on the content area.",
      },
    },
  },
};
