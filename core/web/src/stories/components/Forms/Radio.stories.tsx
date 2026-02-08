import type { Meta, StoryObj } from "@storybook/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { useState } from "react";

/**
 * Radio components for single selection from a list of options.
 * Use RadioGroup for managed radio button groups.
 */
const meta: Meta<typeof RadioGroup> = {
  title: "Components/Forms/Radio",
  component: RadioGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Radio buttons for selecting a single option from a list. Use RadioGroup for managed groups with keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Layout direction of the radio options",
    },
    disabled: {
      control: "boolean",
      description: "Disables all radio buttons",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    label: {
      control: "text",
      description: "Label for the radio group",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const paymentOptions = [
  { value: "card", label: "Credit Card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bank Transfer" },
];

const sizeOptions = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

// Default radio group
export const Default: Story = {
  render: function DefaultRadio() {
    const [value, setValue] = useState("card");

    return (
      <RadioGroup
        name="payment"
        label="Payment Method"
        options={paymentOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// Horizontal orientation
export const Horizontal: Story = {
  render: function HorizontalRadio() {
    const [value, setValue] = useState("md");

    return (
      <RadioGroup
        name="size"
        label="Size"
        options={sizeOptions}
        value={value}
        onChange={setValue}
        orientation="horizontal"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Radio groups can be displayed horizontally.",
      },
    },
  },
};

// With required indicator
export const Required: Story = {
  render: function RequiredRadio() {
    const [value, setValue] = useState("");

    return (
      <RadioGroup
        name="payment-required"
        label="Payment Method"
        options={paymentOptions}
        value={value}
        onChange={setValue}
        required
      />
    );
  },
};

// With error
export const WithError: Story = {
  render: function ErrorRadio() {
    const [value, setValue] = useState("");

    return (
      <RadioGroup
        name="payment-error"
        label="Payment Method"
        options={paymentOptions}
        value={value}
        onChange={setValue}
        required
        error="Please select a payment method"
      />
    );
  },
};

// Disabled group
export const Disabled: Story = {
  render: () => (
    <RadioGroup
      name="payment-disabled"
      label="Payment Method"
      options={paymentOptions}
      value="card"
      disabled
    />
  ),
};

// Partially disabled options
export const PartiallyDisabled: Story = {
  render: function PartiallyDisabledRadio() {
    const [value, setValue] = useState("standard");

    const shippingOptions = [
      { value: "standard", label: "Standard Shipping (3-5 days)" },
      { value: "express", label: "Express Shipping (1-2 days)" },
      { value: "overnight", label: "Overnight Shipping (Not available)", disabled: true },
    ];

    return (
      <RadioGroup
        name="shipping"
        label="Shipping Method"
        options={shippingOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Individual options can be disabled while others remain interactive.",
      },
    },
  },
};

// Standalone Radio
export const StandaloneRadio: Story = {
  render: function StandaloneRadioExample() {
    const [selected, setSelected] = useState("option1");

    return (
      <div className="space-y-2">
        <Radio
          name="standalone"
          value="option1"
          label="Option 1"
          checked={selected === "option1"}
          onChange={() => setSelected("option1")}
        />
        <Radio
          name="standalone"
          value="option2"
          label="Option 2"
          checked={selected === "option2"}
          onChange={() => setSelected("option2")}
        />
        <Radio
          name="standalone"
          value="option3"
          label="Option 3"
          checked={selected === "option3"}
          onChange={() => setSelected("option3")}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "The Radio component can be used standalone without RadioGroup.",
      },
    },
  },
};

// Form example
export const FormExample: Story = {
  render: function FormExampleRadio() {
    const [subscription, setSubscription] = useState("monthly");
    const [tier, setTier] = useState("pro");

    return (
      <div className="space-y-6">
        <RadioGroup
          name="billing"
          label="Billing Cycle"
          options={[
            { value: "monthly", label: "Monthly - $9.99/mo" },
            { value: "yearly", label: "Yearly - $99.99/yr (Save 17%)" },
          ]}
          value={subscription}
          onChange={setSubscription}
        />

        <RadioGroup
          name="tier"
          label="Plan"
          options={[
            { value: "basic", label: "Basic - Essential features" },
            { value: "pro", label: "Pro - Advanced features" },
            { value: "enterprise", label: "Enterprise - Custom solutions" },
          ]}
          value={tier}
          onChange={setTier}
        />

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Selected: {subscription} {tier} plan
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of radio groups used in a form context.",
      },
    },
  },
};
