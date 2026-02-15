import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

/**
 * The DataTable component provides a high-level abstraction over the Table component
 * with built-in loading, empty, and pagination states.
 */
const meta: Meta<typeof DataTable> = {
  title: "Components/Display/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A data table component with built-in loading skeletons, empty state messaging, row click handlers, and pagination support. Accepts column definitions and data arrays.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isLoading: {
      control: "boolean",
      description: "Loading state showing skeleton rows",
    },
    emptyMessage: {
      control: "text",
      description: "Message to display when data is empty",
    },
    skeletonRows: {
      control: "number",
      description: "Number of skeleton rows to show when loading",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
}

const sampleUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "active" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "active" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "inactive" },
  { id: "4", name: "Alice Johnson", email: "alice@example.com", role: "Editor", status: "pending" },
  { id: "5", name: "Charlie Brown", email: "charlie@example.com", role: "Viewer", status: "active" },
];

const userColumns: Column<User>[] = [
  {
    key: "name",
    header: "Name",
    render: (user) => <span className="font-medium">{user.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (user) => user.email,
  },
  {
    key: "role",
    header: "Role",
    render: (user) => user.role,
  },
  {
    key: "status",
    header: "Status",
    render: (user) => (
      <Badge
        variant={
          user.status === "active"
            ? "success"
            : user.status === "inactive"
            ? "secondary"
            : "warning"
        }
      >
        {user.status}
      </Badge>
    ),
  },
];

// Default data table
export const Default: Story = {
  render: () => (
    <DataTable
      columns={userColumns}
      data={sampleUsers}
      keyExtractor={(user) => user.id}
    />
  ),
};

// Loading state
export const Loading: Story = {
  render: () => (
    <DataTable
      columns={userColumns}
      data={[]}
      keyExtractor={(user) => user.id}
      isLoading
      skeletonRows={5}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When loading, the DataTable displays skeleton rows with animated placeholders.",
      },
    },
  },
};

// Empty state
export const Empty: Story = {
  render: () => (
    <DataTable
      columns={userColumns}
      data={[]}
      keyExtractor={(user) => user.id}
      emptyMessage="No users found"
      emptyDescription="Try adjusting your search or filters to find what you are looking for."
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When there is no data, a configurable empty state message is displayed.",
      },
    },
  },
};

// Empty with active filters
export const EmptyWithFilters: Story = {
  render: () => (
    <DataTable
      columns={userColumns}
      data={[]}
      keyExtractor={(user) => user.id}
      hasActiveFilters
      onClearFilters={() => alert("Filters cleared")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When filters are active and no results match, a clear filters button is shown.",
      },
    },
  },
};

// With row click
export const WithRowClick: Story = {
  render: function ClickableDataTable() {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        {selected && (
          <p className="text-sm text-muted-foreground">
            Clicked user: {selected}
          </p>
        )}
        <DataTable
          columns={userColumns}
          data={sampleUsers}
          keyExtractor={(user) => user.id}
          onRowClick={(user) => setSelected(user.name)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Rows can be clickable, adding a pointer cursor and triggering a callback on click.",
      },
    },
  },
};
