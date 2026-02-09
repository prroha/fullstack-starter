import type { Meta, StoryObj } from "@storybook/react";
import {
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
  DashboardHeader,
} from "@/components/ui/layouts/dashboard-layout";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";

/**
 * The DashboardLayout component provides a complete layout structure for dashboard pages.
 * It includes a responsive sidebar, header, and main content area.
 */
const meta: Meta<typeof DashboardLayout> = {
  title: "Components/Layout/DashboardLayout",
  component: DashboardLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A complete dashboard layout with responsive sidebar, header, and main content area. Includes mobile navigation drawer support.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    sidebarWidth: {
      control: "text",
      description: "Width of the sidebar when expanded",
    },
    sidebarCollapsed: {
      control: "boolean",
      description: "Whether the sidebar is collapsed",
    },
    collapsedWidth: {
      control: "text",
      description: "Width of the sidebar when collapsed",
    },
    showMobileMenu: {
      control: "boolean",
      description: "Whether the mobile menu is open",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample sidebar content
const SampleSidebar = ({ collapsed = false }: { collapsed?: boolean }) => (
  <DashboardSidebar
    logo={
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Icon name="Zap" size="sm" className="text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-semibold">Acme Inc</span>}
      </div>
    }
    footer={
      <div className="flex items-center gap-2">
        <Avatar name="John Doe" size="sm" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
          </div>
        )}
      </div>
    }
  >
    <div className="space-y-1">
      <DashboardNavItem
        icon={<Icon name="House" size="sm" />}
        active
        collapsed={collapsed}
        href="/dashboard"
      >
        Dashboard
      </DashboardNavItem>
      <DashboardNavItem
        icon={<Icon name="Users" size="sm" />}
        collapsed={collapsed}
        href="/users"
      >
        Users
      </DashboardNavItem>
      <DashboardNavItem
        icon={<Icon name="FileText" size="sm" />}
        collapsed={collapsed}
        href="/documents"
      >
        Documents
      </DashboardNavItem>
      <DashboardNavItem
        icon={<Icon name="ChartBar" size="sm" />}
        collapsed={collapsed}
        href="/analytics"
      >
        Analytics
      </DashboardNavItem>
      <DashboardNavItem
        icon={<Icon name="Settings" size="sm" />}
        collapsed={collapsed}
        href="/settings"
      >
        Settings
      </DashboardNavItem>
    </div>
  </DashboardSidebar>
);

// Sample header content
const SampleHeader = () => (
  <DashboardHeader
    left={<h1 className="text-lg font-semibold">Dashboard</h1>}
    right={
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Icon name="Bell" size="sm" />
        </Button>
        <Avatar name="John Doe" size="sm" />
      </div>
    }
  >
    <div />
  </DashboardHeader>
);

// Sample content
const SampleContent = () => (
  <div className="p-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Total Users", value: "2,543", change: "+12.5%" },
        { title: "Revenue", value: "$45,231", change: "+8.2%" },
        { title: "Active Sessions", value: "1,234", change: "+3.1%" },
        { title: "Bounce Rate", value: "32.4%", change: "-2.3%" },
      ].map((stat, i) => (
        <div key={i} className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">{stat.title}</p>
          <p className="text-2xl font-bold mt-1">{stat.value}</p>
          <p className="text-sm text-green-600 mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 p-4 bg-card rounded-lg border min-h-64">
      <h2 className="font-semibold">Main Content Area</h2>
      <p className="text-muted-foreground mt-2">
        This is where your main dashboard content would go.
      </p>
    </div>
  </div>
);

// Default layout
export const Default: Story = {
  render: function DefaultLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    return (
      <div className="h-screen">
        <DashboardLayout
          sidebar={<SampleSidebar collapsed={collapsed} />}
          header={<SampleHeader />}
          sidebarCollapsed={collapsed}
          onSidebarToggle={() => setCollapsed(!collapsed)}
          showMobileMenu={showMobile}
          onMobileMenuToggle={() => setShowMobile(!showMobile)}
        >
          <SampleContent />
        </DashboardLayout>
      </div>
    );
  },
};

// Collapsed sidebar
export const CollapsedSidebar: Story = {
  render: function CollapsedLayout() {
    const [collapsed, setCollapsed] = useState(true);
    const [showMobile, setShowMobile] = useState(false);

    return (
      <div className="h-screen">
        <DashboardLayout
          sidebar={<SampleSidebar collapsed={collapsed} />}
          header={<SampleHeader />}
          sidebarCollapsed={collapsed}
          onSidebarToggle={() => setCollapsed(!collapsed)}
          showMobileMenu={showMobile}
          onMobileMenuToggle={() => setShowMobile(!showMobile)}
        >
          <SampleContent />
        </DashboardLayout>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "The sidebar can be collapsed to save screen space.",
      },
    },
  },
};

// Without header
export const WithoutHeader: Story = {
  render: function NoHeaderLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    return (
      <div className="h-screen">
        <DashboardLayout
          sidebar={<SampleSidebar collapsed={collapsed} />}
          sidebarCollapsed={collapsed}
          onSidebarToggle={() => setCollapsed(!collapsed)}
          showMobileMenu={showMobile}
          onMobileMenuToggle={() => setShowMobile(!showMobile)}
        >
          <SampleContent />
        </DashboardLayout>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "The header is optional and can be omitted.",
      },
    },
  },
};

// Custom sidebar width
export const CustomWidth: Story = {
  render: function CustomWidthLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    return (
      <div className="h-screen">
        <DashboardLayout
          sidebar={<SampleSidebar collapsed={collapsed} />}
          header={<SampleHeader />}
          sidebarWidth="300px"
          collapsedWidth="80px"
          sidebarCollapsed={collapsed}
          onSidebarToggle={() => setCollapsed(!collapsed)}
          showMobileMenu={showMobile}
          onMobileMenuToggle={() => setShowMobile(!showMobile)}
        >
          <SampleContent />
        </DashboardLayout>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Sidebar widths can be customized for expanded and collapsed states.",
      },
    },
  },
};

// Dashboard components showcase
export const ComponentsShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">DashboardSidebar</h3>
        <div className="w-64 border rounded-lg overflow-hidden">
          <SampleSidebar />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">DashboardHeader</h3>
        <div className="border rounded-lg overflow-hidden">
          <SampleHeader />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">DashboardNavItem</h3>
        <div className="w-64 space-y-2">
          <DashboardNavItem
            icon={<Icon name="House" size="sm" />}
            active
          >
            Active Item
          </DashboardNavItem>
          <DashboardNavItem
            icon={<Icon name="Settings" size="sm" />}
          >
            Inactive Item
          </DashboardNavItem>
          <DashboardNavItem
            icon={<Icon name="Bell" size="sm" />}
            collapsed
          >
            Collapsed Item
          </DashboardNavItem>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Individual dashboard layout components can be used separately.",
      },
    },
  },
};
