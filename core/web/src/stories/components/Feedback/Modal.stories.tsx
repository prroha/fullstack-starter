import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

/**
 * The Modal component displays content in a layer above the page.
 * It includes a backdrop, focus trapping, and keyboard navigation.
 */
const meta: Meta<typeof Modal> = {
  title: "Components/Feedback/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A modal dialog component with backdrop, focus trapping, and accessibility features. Supports multiple sizes and custom footer actions.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    title: {
      control: "text",
      description: "Modal title displayed in the header",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the modal",
    },
    closeOnOverlayClick: {
      control: "boolean",
      description: "Whether clicking the overlay closes the modal",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether pressing Escape closes the modal",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive modal
export const Default: Story = {
  render: function DefaultModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Modal Title"
        >
          <p>This is the modal content. You can put any content here.</p>
        </Modal>
      </>
    );
  },
};

// All sizes
export const Sizes: Story = {
  render: function SizesModal() {
    const [openModal, setOpenModal] = useState<string | null>(null);

    return (
      <>
        <div className="flex gap-4">
          <Button onClick={() => setOpenModal("sm")}>Small</Button>
          <Button onClick={() => setOpenModal("md")}>Medium</Button>
          <Button onClick={() => setOpenModal("lg")}>Large</Button>
        </div>

        <Modal
          isOpen={openModal === "sm"}
          onClose={() => setOpenModal(null)}
          title="Small Modal"
          size="sm"
        >
          <p>This is a small modal (320px max width).</p>
        </Modal>

        <Modal
          isOpen={openModal === "md"}
          onClose={() => setOpenModal(null)}
          title="Medium Modal"
          size="md"
        >
          <p>This is a medium modal (448px max width). This is the default size.</p>
        </Modal>

        <Modal
          isOpen={openModal === "lg"}
          onClose={() => setOpenModal(null)}
          title="Large Modal"
          size="lg"
        >
          <p>This is a large modal (512px max width).</p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Modal comes in three sizes: small (320px), medium (448px), and large (512px).",
      },
    },
  },
};

// With footer
export const WithFooter: Story = {
  render: function FooterModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </div>
          }
        >
          <p>Are you sure you want to proceed with this action?</p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Modals can include a footer for action buttons.",
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
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Item"
          size="sm"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </div>
          }
        >
          <p>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of a confirmation dialog for destructive actions.",
      },
    },
  },
};

// Form modal
export const FormModal: Story = {
  render: function FormModalExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Add New Item</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Add New Item"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Save</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <Input id="name" placeholder="Enter item name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Input id="description" placeholder="Enter description" />
            </div>
          </div>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of a form inside a modal.",
      },
    },
  },
};

// Long content with scroll
export const LongContent: Story = {
  render: function LongContentModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Terms of Service"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Decline
              </Button>
              <Button onClick={() => setIsOpen(false)}>Accept</Button>
            </div>
          }
          bodyClassName="max-h-64 overflow-y-auto"
        >
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((section) => (
              <div key={section}>
                <h4 className="font-medium">Section {section}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                  enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
              </div>
            ))}
          </div>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Modal body can scroll for long content.",
      },
    },
  },
};

// Non-dismissible modal
export const NonDismissible: Story = {
  render: function NonDismissibleModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Complete Required Action"
          closeOnOverlayClick={false}
          closeOnEscape={false}
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button onClick={() => setIsOpen(false)}>Complete Action</Button>
            </div>
          }
        >
          <p>
            This modal cannot be dismissed by clicking outside or pressing
            Escape. You must complete the action to close it.
          </p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Modals can be configured to prevent dismissal via overlay click or Escape key.",
      },
    },
  },
};
