import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "@/components/ui/pagination";
import { useState } from "react";

/**
 * The Pagination component provides navigation controls for paginated data.
 * Supports page size selection, item counts, and multiple sizes.
 */
const meta: Meta<typeof Pagination> = {
  title: "Components/Navigation/Pagination",
  component: Pagination,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A pagination component with page navigation, optional first/last buttons, page size selector, and item count display. Supports small, medium, and large sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    page: {
      control: "number",
      description: "Current page (1-indexed)",
    },
    totalPages: {
      control: "number",
      description: "Total number of pages",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    showFirstLast: {
      control: "boolean",
      description: "Show first/last page buttons",
    },
    showPageSizeSelector: {
      control: "boolean",
      description: "Show page size selector",
    },
    showItemCount: {
      control: "boolean",
      description: 'Show "Showing X-Y of Z" text',
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    siblingCount: {
      control: "number",
      description: "Number of siblings to show on each side of current page",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default pagination
export const Default: Story = {
  render: function DefaultPagination() {
    const [page, setPage] = useState(1);

    return (
      <Pagination
        page={page}
        totalPages={10}
        onPageChange={setPage}
      />
    );
  },
};

// With item count and page size selector
export const FullFeatured: Story = {
  render: function FullFeaturedPagination() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalItems = 253;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        showFirstLast
        showPageSizeSelector
        showItemCount
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Full-featured pagination with item count, page size selector, and first/last page buttons.",
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: function SizesPagination() {
    const [pageSm, setPageSm] = useState(3);
    const [pageMd, setPageMd] = useState(3);
    const [pageLg, setPageLg] = useState(3);

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Small</p>
          <Pagination page={pageSm} totalPages={10} onPageChange={setPageSm} size="sm" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Medium (default)</p>
          <Pagination page={pageMd} totalPages={10} onPageChange={setPageMd} size="md" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Large</p>
          <Pagination page={pageLg} totalPages={10} onPageChange={setPageLg} size="lg" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Pagination comes in three sizes: small, medium (default), and large.",
      },
    },
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    page: 5,
    totalPages: 10,
    onPageChange: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Pagination can be disabled to prevent interaction during loading.",
      },
    },
  },
};

// Few pages
export const FewPages: Story = {
  render: function FewPagesPagination() {
    const [page, setPage] = useState(1);

    return (
      <Pagination
        page={page}
        totalPages={3}
        onPageChange={setPage}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "When there are only a few pages, all page numbers are shown without ellipsis.",
      },
    },
  },
};
