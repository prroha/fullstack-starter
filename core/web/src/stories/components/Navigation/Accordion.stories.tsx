import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useState } from "react";

/**
 * The Accordion component displays collapsible content sections.
 * Supports single and multiple expansion modes.
 */
const meta: Meta<typeof Accordion> = {
  title: "Components/Navigation/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "An accordion component with AccordionItem, AccordionTrigger, and AccordionContent sub-components. Supports single or multiple item expansion, collapsible behavior, and disabled items.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Whether one or multiple items can be expanded at a time",
    },
    collapsible: {
      control: "boolean",
      description: "Whether the accordion can be fully collapsed",
    },
    defaultValue: {
      control: "text",
      description: "Default expanded item value(s)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default accordion (single mode)
export const Default: Story = {
  render: () => (
    <Accordion defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is your return policy?</AccordionTrigger>
        <AccordionContent>
          We offer a 30-day return policy for all unused items in their original
          packaging. Please contact our support team to initiate a return.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How long does shipping take?</AccordionTrigger>
        <AccordionContent>
          Standard shipping takes 5-7 business days. Express shipping is
          available for 2-3 business day delivery. International orders may take
          10-14 business days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Do you offer gift wrapping?</AccordionTrigger>
        <AccordionContent>
          Yes, we offer gift wrapping for an additional $5 per item. You can
          select this option during checkout.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Multiple expansion mode
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["item-1", "item-3"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Getting Started</AccordionTrigger>
        <AccordionContent>
          Follow our quick start guide to set up your account and begin using
          the platform in minutes.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Configuration</AccordionTrigger>
        <AccordionContent>
          Customize your workspace by navigating to Settings and adjusting your
          preferences.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Advanced Features</AccordionTrigger>
        <AccordionContent>
          Explore automation, integrations, and API access to get the most out
          of the platform.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multiple mode allows expanding more than one item at the same time.",
      },
    },
  },
};

// With disabled item
export const WithDisabledItem: Story = {
  render: () => (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger>Available Section</AccordionTrigger>
        <AccordionContent>
          This section is accessible and can be expanded.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Locked Section (Premium)</AccordionTrigger>
        <AccordionContent>
          This content is locked behind a premium subscription.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Available Section</AccordionTrigger>
        <AccordionContent>
          This section is also accessible and can be expanded.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Individual accordion items can be disabled to prevent user interaction.",
      },
    },
  },
};

// Controlled accordion
export const Controlled: Story = {
  render: function ControlledAccordion() {
    const [value, setValue] = useState<string | string[]>("item-1");

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setValue("item-1")}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Open First
          </button>
          <button
            onClick={() => setValue("item-2")}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Open Second
          </button>
          <button
            onClick={() => setValue("")}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            Close All
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Currently open: {value || "none"}
        </p>
        <Accordion value={value} onValueChange={setValue}>
          <AccordionItem value="item-1">
            <AccordionTrigger>First Section</AccordionTrigger>
            <AccordionContent>
              Content for the first section.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second Section</AccordionTrigger>
            <AccordionContent>
              Content for the second section.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Third Section</AccordionTrigger>
            <AccordionContent>
              Content for the third section.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Accordion can be controlled externally using the value and onValueChange props.",
      },
    },
  },
};

// FAQ example
export const FAQExample: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible>
        <AccordionItem value="faq-1">
          <AccordionTrigger>How do I create an account?</AccordionTrigger>
          <AccordionContent>
            Click the &quot;Sign Up&quot; button in the top right corner of the
            page. Fill in your email address, choose a password, and follow the
            verification steps sent to your email.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>Can I change my subscription plan?</AccordionTrigger>
          <AccordionContent>
            Yes, you can upgrade or downgrade your plan at any time from your
            account settings. Changes will be reflected in your next billing
            cycle.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>Is my data secure?</AccordionTrigger>
          <AccordionContent>
            We use industry-standard encryption and security practices. All data
            is encrypted at rest and in transit. We are SOC 2 Type II compliant.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-4">
          <AccordionTrigger>How do I contact support?</AccordionTrigger>
          <AccordionContent>
            You can reach our support team via email at support@example.com,
            through the in-app chat widget, or by calling our helpline during
            business hours.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Example of an accordion used as an FAQ section with collapsible single-item mode.",
      },
    },
  },
};
