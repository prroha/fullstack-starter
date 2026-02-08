import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

/**
 * The Switch component is used for toggle controls, typically for on/off settings.
 * It's more visually prominent than a checkbox for binary choices.
 */
const meta: Meta<typeof Switch> = {
  title: "Components/Forms/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A toggle switch component for binary on/off controls. Supports labels, sizes, and label positioning.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the switch is on",
    },
    disabled: {
      control: "boolean",
      description: "Disables the switch",
    },
    label: {
      control: "text",
      description: "Label text displayed next to the switch",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the switch",
    },
    labelPosition: {
      control: "select",
      options: ["left", "right"],
      description: "Position of the label relative to the switch",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default switch
export const Default: Story = {
  args: {
    label: "Enable notifications",
  },
};

// On state
export const On: Story = {
  args: {
    label: "Enabled",
    checked: true,
  },
};

// Without label
export const WithoutLabel: Story = {
  args: {
    checked: true,
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <Switch size="sm" label="Small switch" checked />
      <Switch size="md" label="Medium switch (default)" checked />
      <Switch size="lg" label="Large switch" checked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Switch comes in three sizes: small, medium (default), and large.",
      },
    },
  },
};

// Label positions
export const LabelPositions: Story = {
  render: () => (
    <div className="space-y-6">
      <Switch label="Label on right (default)" labelPosition="right" checked />
      <Switch label="Label on left" labelPosition="left" checked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Labels can be positioned to the left or right of the switch.",
      },
    },
  },
};

// Disabled states
export const Disabled: Story = {
  render: () => (
    <div className="space-y-6">
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled checked />
    </div>
  ),
};

// Controlled switch
export const Controlled: Story = {
  render: function ControlledSwitch() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="space-y-4">
        <Switch
          label="Dark mode"
          checked={enabled}
          onChange={setEnabled}
        />
        <p className="text-sm text-muted-foreground">
          Dark mode is {enabled ? "enabled" : "disabled"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Switch can be controlled with checked and onChange props.",
      },
    },
  },
};

// Settings panel example
export const SettingsExample: Story = {
  render: function SettingsPanel() {
    const [settings, setSettings] = useState({
      notifications: true,
      email: true,
      sms: false,
      marketing: false,
      analytics: true,
    });

    const updateSetting = (key: keyof typeof settings) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="w-80 space-y-6">
        <h3 className="font-semibold text-lg">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onChange={() => updateSetting("notifications")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Updates</p>
              <p className="text-sm text-muted-foreground">
                Receive email updates
              </p>
            </div>
            <Switch
              checked={settings.email}
              onChange={() => updateSetting("email")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive SMS notifications
              </p>
            </div>
            <Switch
              checked={settings.sms}
              onChange={() => updateSetting("sms")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing</p>
              <p className="text-sm text-muted-foreground">
                Receive marketing emails
              </p>
            </div>
            <Switch
              checked={settings.marketing}
              onChange={() => updateSetting("marketing")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Analytics</p>
              <p className="text-sm text-muted-foreground">
                Share usage analytics
              </p>
            </div>
            <Switch
              checked={settings.analytics}
              onChange={() => updateSetting("analytics")}
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of using switches in a settings panel context.",
      },
    },
  },
};
