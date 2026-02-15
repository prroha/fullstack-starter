import type { Meta, StoryObj } from "@storybook/react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

/**
 * The Dialog component displays content in a modal overlay with focus trapping,
 * keyboard navigation, and portal rendering.
 */
const meta: Meta<typeof Dialog> = {
  title: "Components/Overlay/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A fully accessible modal dialog with backdrop, focus trapping, escape key handling, and portal rendering. Supports multiple sizes and composable sub-components (DialogHeader, DialogBody, DialogFooter).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the dialog is open",
    },
    title: {
      control: "text",
      description: "Dialog title (optional, can also use DialogHeader)",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Size variant of the dialog",
    },
    closeOnOverlayClick: {
      control: "boolean",
      description: "Whether clicking the overlay closes the dialog",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether pressing Escape closes the dialog",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default dialog with title prop
export const Default: Story = {
  render: function DefaultDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Dialog Title"
        >
          <DialogBody>
            <p className="text-muted-foreground">
              This is a basic dialog with a title and body content.
            </p>
          </DialogBody>
        </Dialog>
      </>
    );
  },
};

// All sizes
export const Sizes: Story = {
  render: function SizesDialog() {
    const [openSize, setOpenSize] = useState<string | null>(null);

    return (
      <>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setOpenSize("sm")}>Small</Button>
          <Button onClick={() => setOpenSize("md")}>Medium</Button>
          <Button onClick={() => setOpenSize("lg")}>Large</Button>
          <Button onClick={() => setOpenSize("xl")}>XL</Button>
          <Button onClick={() => setOpenSize("full")}>Full</Button>
        </div>

        {(["sm", "md", "lg", "xl", "full"] as const).map((size) => (
          <Dialog
            key={size}
            isOpen={openSize === size}
            onClose={() => setOpenSize(null)}
            title={`${size.toUpperCase()} Dialog`}
            size={size}
          >
            <DialogBody>
              <p className="text-muted-foreground">
                This is a <strong>{size}</strong> sized dialog.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenSize(null)}>
                Close
              </Button>
            </DialogFooter>
          </Dialog>
        ))}
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Dialog supports five size variants: sm, md (default), lg, xl, and full.",
      },
    },
  },
};

// Composable sub-components
export const WithSubComponents: Story = {
  render: function ComposableDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Composable Dialog</Button>
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <h2 className="text-lg font-semibold text-foreground">
              Composable Header
            </h2>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This dialog uses DialogHeader, DialogBody, and DialogFooter
                sub-components for full layout control.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="dialog-name">
                  Name
                </label>
                <Input id="dialog-name" placeholder="Enter your name" />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Save</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use DialogHeader, DialogBody, and DialogFooter for full control over the dialog layout.",
      },
    },
  },
};

// Confirmation dialog
export const ConfirmationDialog: Story = {
  render: function ConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="sm"
        >
          <DialogHeader>
            <h2 className="text-lg font-semibold text-foreground">
              Delete Item
            </h2>
          </DialogHeader>
          <DialogBody>
            <p className="text-muted-foreground">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setIsOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Example of a confirmation dialog for destructive actions.",
      },
    },
  },
};

// Non-dismissible
export const NonDismissible: Story = {
  render: function NonDismissibleDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Non-Dismissible</Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          closeOnOverlayClick={false}
          closeOnEscape={false}
          size="sm"
        >
          <DialogHeader showCloseButton={false}>
            <h2 className="text-lg font-semibold text-foreground">
              Required Action
            </h2>
          </DialogHeader>
          <DialogBody>
            <p className="text-muted-foreground">
              This dialog cannot be dismissed by clicking outside or pressing
              Escape. You must complete the action.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Complete</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Dialogs can be configured to prevent dismissal via overlay click or Escape key, and hide the close button.",
      },
    },
  },
};
