import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "@/components/ui/stepper";
import type { Step } from "@/components/ui/stepper";
import { useState } from "react";

/**
 * The Stepper component displays multi-step workflows with visual progress indicators.
 * Supports horizontal and vertical orientations, linear/non-linear navigation, and custom icons.
 */
const meta: Meta<typeof Stepper> = {
  title: "Components/Navigation/Stepper",
  component: Stepper,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A stepper component for multi-step workflows. Supports horizontal and vertical orientations, linear/non-linear navigation, clickable steps, custom icons, and error states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    activeStep: {
      control: "number",
      description: "Current active step index (0-based)",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Stepper orientation",
    },
    isLinear: {
      control: "boolean",
      description: "Whether navigation is linear (can only go to next step)",
    },
    clickable: {
      control: "boolean",
      description: "Whether steps are clickable",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicSteps: Step[] = [
  { id: "1", label: "Account", description: "Create your account" },
  { id: "2", label: "Profile", description: "Set up your profile" },
  { id: "3", label: "Review", description: "Review and submit" },
];

// Default stepper
export const Default: Story = {
  args: {
    steps: basicSteps,
    activeStep: 1,
  },
};

// Interactive stepper
export const Interactive: Story = {
  render: function InteractiveStepper() {
    const [activeStep, setActiveStep] = useState(0);

    const steps: Step[] = [
      { id: "1", label: "Personal Info", description: "Enter your details" },
      { id: "2", label: "Address", description: "Shipping address" },
      { id: "3", label: "Payment", description: "Add payment method" },
      { id: "4", label: "Confirm", description: "Review your order" },
    ];

    return (
      <div className="space-y-6">
        <Stepper
          steps={steps}
          activeStep={activeStep}
          onStepChange={setActiveStep}
          clickable
        />
        <div className="rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-2">
            Step {activeStep + 1}: {steps[activeStep].label}
          </h3>
          <p className="text-muted-foreground">
            {steps[activeStep].description}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
          >
            Previous
          </button>
          <button
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "An interactive stepper with clickable steps and navigation buttons for a multi-step workflow.",
      },
    },
  },
};

// Vertical orientation
export const Vertical: Story = {
  args: {
    steps: basicSteps,
    activeStep: 1,
    orientation: "vertical",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Vertical steppers are useful when there is more space vertically or for sidebars.",
      },
    },
  },
};

// With error state
export const WithError: Story = {
  args: {
    steps: [
      { id: "1", label: "Account", description: "Create your account" },
      { id: "2", label: "Verification", description: "Verify your email" },
      { id: "3", label: "Complete", description: "Setup complete" },
    ],
    activeStep: 1,
    errorSteps: [1],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Steps can display an error state to indicate validation failures or issues.",
      },
    },
  },
};

// With custom icons
export const WithCustomIcons: Story = {
  args: {
    steps: [
      { id: "1", label: "Cart", description: "Review items", icon: "ShoppingCart" },
      { id: "2", label: "Shipping", description: "Delivery details", icon: "Truck" },
      { id: "3", label: "Payment", description: "Payment method", icon: "CreditCard" },
      { id: "4", label: "Done", description: "Order placed", icon: "Check" },
    ],
    activeStep: 2,
    clickable: true,
    isLinear: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Steps can use custom Lucide icons for more descriptive visual indicators.",
      },
    },
  },
};
