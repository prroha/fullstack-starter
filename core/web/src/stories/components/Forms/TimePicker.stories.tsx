import type { Meta, StoryObj } from "@storybook/react";
import { TimePicker } from "@/components/ui/time-picker";
import type { TimeValue } from "@/components/ui/time-picker";
import { useState } from "react";

/**
 * The TimePicker component provides a time selection dropdown with configurable
 * step intervals, time format, and range constraints.
 */
const meta: Meta<typeof TimePicker> = {
  title: "Components/Forms/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A time picker component with a scrollable dropdown of time options. Supports 12-hour and 24-hour formats, configurable step intervals, min/max time constraints, and keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no time is selected",
    },
    label: {
      control: "text",
      description: "Label for the field",
    },
    disabled: {
      control: "boolean",
      description: "Whether the picker is disabled",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    format: {
      control: "select",
      options: ["12", "24"],
      description: "Time format - 12-hour or 24-hour",
    },
    step: {
      control: "number",
      description: "Step interval in minutes (e.g., 15, 30)",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    showClearButton: {
      control: "boolean",
      description: "Show clear button when a time is selected",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default time picker (12-hour format)
export const Default: Story = {
  render: function DefaultTimePicker() {
    const [time, setTime] = useState<TimeValue | null>(null);

    return (
      <div className="w-64">
        <TimePicker
          value={time}
          onChange={setTime}
          label="Time"
          placeholder="Select a time"
        />
      </div>
    );
  },
};

// 24-hour format
export const TwentyFourHour: Story = {
  render: function TwentyFourHourPicker() {
    const [time, setTime] = useState<TimeValue | null>({ hours: 14, minutes: 30 });

    return (
      <div className="w-64">
        <TimePicker
          value={time}
          onChange={setTime}
          label="Meeting Time"
          format="24"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "The time picker supports 24-hour format display.",
      },
    },
  },
};

// With custom step interval
export const CustomStep: Story = {
  render: function CustomStepPicker() {
    const [time, setTime] = useState<TimeValue | null>(null);

    return (
      <div className="w-64">
        <TimePicker
          value={time}
          onChange={setTime}
          label="Appointment Slot"
          placeholder="Choose a slot"
          step={30}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          30-minute intervals
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The step prop controls the interval between time options. Default is 15 minutes.",
      },
    },
  },
};

// With time range constraint
export const WithTimeRange: Story = {
  render: function TimeRangePicker() {
    const [time, setTime] = useState<TimeValue | null>(null);

    return (
      <div className="w-64">
        <TimePicker
          value={time}
          onChange={setTime}
          label="Business Hours"
          placeholder="Select time"
          minTime={{ hours: 9, minutes: 0 }}
          maxTime={{ hours: 17, minutes: 0 }}
          step={30}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Available: 9:00 AM - 5:00 PM
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Time selection can be restricted to a specific range using minTime and maxTime.",
      },
    },
  },
};

// With error state
export const WithError: Story = {
  render: () => (
    <div className="w-64">
      <TimePicker
        label="Start Time"
        placeholder="Select start time"
        error="Start time is required"
        required
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The time picker displays validation errors below the field.",
      },
    },
  },
};
