import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

/**
 * The Checkbox component is used for binary selections in forms.
 * It supports labels, indeterminate state, and error messages.
 */
const meta: Meta<typeof Checkbox> = {
  title: "Components/Forms/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A checkbox component with support for labels, indeterminate state, sizes, and validation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the checkbox is checked",
    },
    indeterminate: {
      control: "boolean",
      description: "Whether the checkbox is in indeterminate state",
    },
    disabled: {
      control: "boolean",
      description: "Disables the checkbox",
    },
    label: {
      control: "text",
      description: "Label text displayed next to the checkbox",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the checkbox",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default checkbox
export const Default: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

// Checked state
export const Checked: Story = {
  args: {
    label: "I agree",
    defaultChecked: true,
  },
};

// Without label
export const WithoutLabel: Story = {
  args: {
    defaultChecked: true,
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="sm" label="Small checkbox" defaultChecked />
      <Checkbox size="md" label="Medium checkbox (default)" defaultChecked />
      <Checkbox size="lg" label="Large checkbox" defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Checkbox comes in three sizes: small, medium (default), and large.",
      },
    },
  },
};

// Indeterminate state
export const Indeterminate: Story = {
  render: function IndeterminateCheckbox() {
    const [_allChecked, setAllChecked] = useState(false);
    const [items, setItems] = useState([
      { id: 1, label: "Item 1", checked: true },
      { id: 2, label: "Item 2", checked: false },
      { id: 3, label: "Item 3", checked: true },
    ]);

    const checkedCount = items.filter((item) => item.checked).length;
    const isIndeterminate = checkedCount > 0 && checkedCount < items.length;
    const isAllChecked = checkedCount === items.length;

    const handleSelectAll = () => {
      const newChecked = !isAllChecked;
      setItems(items.map((item) => ({ ...item, checked: newChecked })));
      setAllChecked(newChecked);
    };

    const handleItemChange = (id: number) => {
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    };

    return (
      <div className="space-y-3">
        <Checkbox
          label="Select all"
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={handleSelectAll}
        />
        <div className="ml-6 space-y-2">
          {items.map((item) => (
            <Checkbox
              key={item.id}
              label={item.label}
              checked={item.checked}
              onChange={() => handleItemChange(item.id)}
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The indeterminate state is useful for parent checkboxes when only some children are selected.",
      },
    },
  },
};

// With error
export const WithError: Story = {
  args: {
    label: "Accept terms and conditions",
    error: "You must accept the terms to continue",
  },
};

// Disabled states
export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  ),
};

// Controlled checkbox
export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = useState(false);

    return (
      <div className="space-y-4">
        <Checkbox
          label="Newsletter subscription"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <p className="text-sm text-muted-foreground">
          Subscribed: {checked ? "Yes" : "No"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Checkbox can be controlled with checked and onChange props.",
      },
    },
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <h3 className="font-medium">Notification Preferences</h3>
      <div className="space-y-3">
        <Checkbox label="Email notifications" defaultChecked />
        <Checkbox label="SMS notifications" />
        <Checkbox label="Push notifications" defaultChecked />
        <Checkbox label="Marketing emails" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of using multiple checkboxes in a form context.",
      },
    },
  },
};
