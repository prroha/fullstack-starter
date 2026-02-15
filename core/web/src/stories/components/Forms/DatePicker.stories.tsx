import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";

/**
 * The DatePicker component provides a calendar-based date selection interface.
 * Supports date ranges, disabled dates, and various formatting options.
 */
const meta: Meta<typeof DatePicker> = {
  title: "Components/Forms/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A date picker component with a calendar dropdown, keyboard navigation, today button, and clear functionality. Supports min/max dates, disabled dates, and multiple size variants.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text when no date is selected",
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
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    showTodayButton: {
      control: "boolean",
      description: "Show today button in the calendar",
    },
    showClearButton: {
      control: "boolean",
      description: "Show clear button when a date is selected",
    },
    format: {
      control: "text",
      description: "Date format for display (e.g., MM/dd/yyyy)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default date picker
export const Default: Story = {
  render: function DefaultDatePicker() {
    const [date, setDate] = useState<Date | null>(null);

    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          label="Date"
          placeholder="Select a date"
        />
      </div>
    );
  },
};

// With pre-selected date
export const WithValue: Story = {
  render: function PreselectedDatePicker() {
    const [date, setDate] = useState<Date | null>(new Date());

    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          label="Event Date"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A date picker with a pre-selected date value.",
      },
    },
  },
};

// With min and max dates
export const WithDateRange: Story = {
  render: function DateRangePicker() {
    const [date, setDate] = useState<Date | null>(null);
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          label="Appointment Date"
          placeholder="Select a date"
          minDate={minDate}
          maxDate={maxDate}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Only dates within the next 3 months are selectable.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Date selection can be restricted to a specific range using minDate and maxDate.",
      },
    },
  },
};

// With error state
export const WithError: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker
        label="Start Date"
        placeholder="Select start date"
        error="Start date is required"
        required
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The date picker displays an error message below the field when validation fails.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      <DatePicker
        label="Small"
        placeholder="Select date"
        size="sm"
      />
      <DatePicker
        label="Medium (default)"
        placeholder="Select date"
        size="md"
      />
      <DatePicker
        label="Large"
        placeholder="Select date"
        size="lg"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "DatePicker comes in three sizes: small, medium (default), and large.",
      },
    },
  },
};
