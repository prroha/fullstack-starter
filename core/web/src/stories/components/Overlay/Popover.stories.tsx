import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverHeader, PopoverFooter } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

/**
 * The Popover component displays rich content in a floating panel
 * anchored to a trigger element.
 */
const meta: Meta<typeof Popover> = {
  title: "Components/Overlay/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A floating panel component that displays rich content anchored to a trigger element. Supports controlled/uncontrolled modes, multiple positions and alignments, focus trapping, and composable sub-components.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Position of the popover relative to the trigger",
    },
    alignment: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment of the popover along the position axis",
    },
    closeOnClickOutside: {
      control: "boolean",
      description: "Whether to close on click outside",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether to close on Escape key",
    },
    disabled: {
      control: "boolean",
      description: "Whether the popover is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default popover
export const Default: Story = {
  render: () => (
    <div className="p-8">
      <Popover trigger={<Button>Open Popover</Button>}>
        <PopoverContent>
          <p className="text-sm">This is a basic popover with some content.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// Positions
export const Positions: Story = {
  render: () => (
    <div className="flex gap-8 items-center p-24">
      <Popover trigger={<Button variant="outline">Top</Button>} position="top">
        <PopoverContent>
          <p className="text-sm">Popover on top</p>
        </PopoverContent>
      </Popover>
      <Popover trigger={<Button variant="outline">Bottom</Button>} position="bottom">
        <PopoverContent>
          <p className="text-sm">Popover on bottom</p>
        </PopoverContent>
      </Popover>
      <Popover trigger={<Button variant="outline">Left</Button>} position="left">
        <PopoverContent>
          <p className="text-sm">Popover on left</p>
        </PopoverContent>
      </Popover>
      <Popover trigger={<Button variant="outline">Right</Button>} position="right">
        <PopoverContent>
          <p className="text-sm">Popover on right</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover supports four positions: top, bottom (default), left, and right.",
      },
    },
  },
};

// With header and footer
export const WithHeaderAndFooter: Story = {
  render: function HeaderFooterPopover() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Popover
          trigger={<Button>Edit Settings</Button>}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <PopoverHeader>Settings</PopoverHeader>
          <PopoverContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="pop-width">
                  Width
                </label>
                <Input id="pop-width" placeholder="100%" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="pop-height">
                  Height
                </label>
                <Input id="pop-height" placeholder="auto" />
              </div>
            </div>
          </PopoverContent>
          <PopoverFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Apply
            </Button>
          </PopoverFooter>
        </Popover>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use PopoverHeader and PopoverFooter for structured content with actions.",
      },
    },
  },
};

// Controlled mode
export const Controlled: Story = {
  render: function ControlledPopover() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex items-center gap-4 p-8">
        <Popover
          trigger={<Button>Controlled Popover</Button>}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <PopoverContent>
            <p className="text-sm">
              This popover is controlled externally.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">
          State: {isOpen ? "Open" : "Closed"}
        </span>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Popover supports controlled mode via isOpen and onOpenChange props.",
      },
    },
  },
};
