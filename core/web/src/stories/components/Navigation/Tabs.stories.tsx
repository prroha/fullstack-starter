import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";
import { useState } from "react";

/**
 * The Tabs component organizes content into multiple panels, with only one panel visible at a time.
 * Supports horizontal/vertical orientations and multiple visual variants.
 */
const meta: Meta<typeof Tabs> = {
  title: "Components/Navigation/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A tabbed interface component with TabList, Tab, TabPanels, and TabPanel sub-components. Supports line, enclosed, and soft-rounded variants with horizontal and vertical orientations.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    defaultIndex: {
      control: "number",
      description: "Default selected tab index (uncontrolled)",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Tab orientation",
    },
    variant: {
      control: "select",
      options: ["line", "enclosed", "soft-rounded"],
      description: "Visual variant of the tabs",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default tabs with line variant
export const Default: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>Account</Tab>
        <Tab>Password</Tab>
        <Tab>Notifications</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Account Settings</h3>
            <p className="text-muted-foreground">
              Manage your account details and preferences.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Password</h3>
            <p className="text-muted-foreground">
              Change your password and security settings.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-muted-foreground">
              Configure your notification preferences.
            </p>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};

// Enclosed variant
export const Enclosed: Story = {
  render: () => (
    <Tabs variant="enclosed">
      <TabList>
        <Tab>Overview</Tab>
        <Tab>Analytics</Tab>
        <Tab>Reports</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <p className="text-muted-foreground">Overview content goes here.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">Analytics content goes here.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">Reports content goes here.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The enclosed variant uses a background container to visually group the tabs.",
      },
    },
  },
};

// Soft-rounded variant
export const SoftRounded: Story = {
  render: () => (
    <Tabs variant="soft-rounded">
      <TabList>
        <Tab>All</Tab>
        <Tab>Active</Tab>
        <Tab>Completed</Tab>
        <Tab>Archived</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <p className="text-muted-foreground">Showing all items.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">Showing active items.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">Showing completed items.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">Showing archived items.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The soft-rounded variant uses pill-shaped tabs with a primary-colored active state.",
      },
    },
  },
};

// Vertical orientation
export const Vertical: Story = {
  render: () => (
    <Tabs orientation="vertical">
      <TabList>
        <Tab>General</Tab>
        <Tab>Security</Tab>
        <Tab>Billing</Tab>
        <Tab>Integrations</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">General Settings</h3>
            <p className="text-muted-foreground">
              Configure your general application settings.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Security</h3>
            <p className="text-muted-foreground">
              Manage two-factor authentication and sessions.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Billing</h3>
            <p className="text-muted-foreground">
              View invoices and manage payment methods.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Integrations</h3>
            <p className="text-muted-foreground">
              Connect third-party services and APIs.
            </p>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Vertical tabs display the tab list and panels side by side, useful for settings pages.",
      },
    },
  },
};

// With disabled tab
export const WithDisabledTab: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>Active Tab</Tab>
        <Tab disabled>Disabled Tab</Tab>
        <Tab>Another Tab</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <p className="text-muted-foreground">This tab is active and clickable.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">You should not see this content.</p>
        </TabPanel>
        <TabPanel>
          <p className="text-muted-foreground">This tab is also clickable.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Individual tabs can be disabled to prevent user interaction.",
      },
    },
  },
};

// Controlled tabs
export const Controlled: Story = {
  render: function ControlledTabs() {
    const [index, setIndex] = useState(0);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIndex(0)}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Go to Tab 1
          </button>
          <button
            onClick={() => setIndex(1)}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Go to Tab 2
          </button>
          <button
            onClick={() => setIndex(2)}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Go to Tab 3
          </button>
        </div>
        <Tabs index={index} onChange={setIndex}>
          <TabList>
            <Tab>First</Tab>
            <Tab>Second</Tab>
            <Tab>Third</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <p className="text-muted-foreground">
                Content for tab 1. Current index: {index}
              </p>
            </TabPanel>
            <TabPanel>
              <p className="text-muted-foreground">
                Content for tab 2. Current index: {index}
              </p>
            </TabPanel>
            <TabPanel>
              <p className="text-muted-foreground">
                Content for tab 3. Current index: {index}
              </p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tabs can be controlled externally using the index and onChange props.",
      },
    },
  },
};
