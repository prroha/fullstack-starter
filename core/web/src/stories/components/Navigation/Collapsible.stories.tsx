import type { Meta, StoryObj } from "@storybook/react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useState } from "react";

/**
 * The Collapsible component provides a simple show/hide toggle for content sections.
 * Supports controlled and uncontrolled modes with customizable trigger icons.
 */
const meta: Meta<typeof Collapsible> = {
  title: "Components/Navigation/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A collapsible component with CollapsibleTrigger and CollapsibleContent sub-components. Supports controlled/uncontrolled modes, custom icons, and disabled state.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Default open state for uncontrolled mode",
    },
    disabled: {
      control: "boolean",
      description: "Whether the collapsible is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default collapsible (closed)
export const Default: Story = {
  render: () => (
    <div className="w-96">
      <Collapsible>
        <CollapsibleTrigger className="font-semibold py-2">
          Show more details
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-muted-foreground">
          Here are the additional details that were hidden. This content is
          revealed when the user clicks the trigger button above.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

// Default open
export const DefaultOpen: Story = {
  render: () => (
    <div className="w-96">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="font-semibold py-2">
          Advanced Options
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-muted-foreground">
          These advanced options are shown by default. The user can collapse them
          if they are not needed.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The collapsible can start in the open state using the defaultOpen prop.",
      },
    },
  },
};

// With icon on the left
export const IconLeft: Story = {
  render: () => (
    <div className="w-96">
      <Collapsible>
        <CollapsibleTrigger
          iconPosition="left"
          className="font-semibold py-2"
        >
          Click to expand
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 pl-6 text-muted-foreground">
          Content that is revealed when the trigger is clicked. The chevron icon
          is positioned on the left side.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The chevron icon can be placed on the left side of the trigger using iconPosition.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Collapsible disabled>
        <CollapsibleTrigger className="font-semibold py-2">
          Disabled Section
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-muted-foreground">
          This content cannot be toggled because the collapsible is disabled.
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger className="font-semibold py-2">
          Enabled Section
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-muted-foreground">
          This section can be toggled normally.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A disabled collapsible prevents user interaction while maintaining visual structure.",
      },
    },
  },
};

// Controlled collapsible
export const Controlled: Story = {
  render: function ControlledCollapsible() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-96 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1 text-sm rounded-md border border-input hover:bg-muted"
          >
            {isOpen ? "Collapse" : "Expand"} externally
          </button>
          <span className="text-sm text-muted-foreground">
            State: {isOpen ? "open" : "closed"}
          </span>
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="font-semibold py-2 px-3 rounded-md border border-border w-full">
            Controlled Content
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-3 text-muted-foreground">
            This collapsible is controlled externally. You can toggle it using
            either the trigger button or the external button above.
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Collapsible can be controlled externally using open and onOpenChange props.",
      },
    },
  },
};
