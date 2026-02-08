import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";

/**
 * The Table component provides a structured way to display tabular data.
 * It includes components for headers, body, rows, cells, and more.
 */
const meta: Meta<typeof Table> = {
  title: "Components/Display/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A semantic table component with support for headers, footers, selection, and various styling options.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    fullWidth: {
      control: "boolean",
      description: "Whether the table takes full width",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "Active" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "Inactive" },
  { id: 4, name: "Alice Johnson", email: "alice@example.com", role: "Editor", status: "Active" },
  { id: 5, name: "Charlie Brown", email: "charlie@example.com", role: "Viewer", status: "Pending" },
];

// Default table
export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge
                variant={
                  row.status === "Active"
                    ? "success"
                    : row.status === "Inactive"
                    ? "secondary"
                    : "warning"
                }
              >
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// With caption
export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.slice(0, 3).map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tables can include a caption for accessibility and context.",
      },
    },
  },
};

// With footer
export const WithFooter: Story = {
  render: () => {
    const invoices = [
      { id: "INV001", amount: "$250.00", status: "Paid" },
      { id: "INV002", amount: "$150.00", status: "Pending" },
      { id: "INV003", amount: "$350.00", status: "Paid" },
    ];
    const total = "$750.00";

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === "Paid" ? "success" : "warning"}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right font-medium">{total}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Tables can include a footer for totals or summary information.",
      },
    },
  },
};

// With selection
export const WithSelection: Story = {
  render: function SelectableTable() {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const toggleRow = (id: number) => {
      setSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      );
    };

    const toggleAll = () => {
      setSelectedRows((prev) =>
        prev.length === sampleData.length ? [] : sampleData.map((r) => r.id)
      );
    };

    const allSelected = selectedRows.length === sampleData.length;
    const someSelected = selectedRows.length > 0 && !allSelected;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((row) => (
            <TableRow key={row.id} selected={selectedRows.includes(row.id)}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Tables support row selection with checkboxes.",
      },
    },
  },
};

// With actions
export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tables can include action buttons in each row.",
      },
    },
  },
};

// With avatars
export const WithAvatars: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={row.name} size="sm" />
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge
                variant={
                  row.status === "Active"
                    ? "success"
                    : row.status === "Inactive"
                    ? "secondary"
                    : "warning"
                }
              >
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tables can include avatars and more complex cell content.",
      },
    },
  },
};

// Empty state
export const EmptyState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            <p className="text-muted-foreground">No users found</p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tables should handle empty states gracefully.",
      },
    },
  },
};
