import type { Meta, StoryObj } from "@storybook/react";
import { Grid, GridItem } from "@/components/ui/layouts/grid";

/**
 * The Grid component provides a responsive CSS Grid layout with configurable
 * columns, gaps, and alignment. Includes GridItem for individual cell control.
 */
const meta: Meta<typeof Grid> = {
  title: "Components/Layout/Grid",
  component: Grid,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A responsive CSS Grid layout component supporting fixed columns, responsive breakpoints, and auto-fit with minimum child width. Use GridItem for individual cell spanning.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    cols: {
      control: "number",
      description: "Number of columns (number or responsive object)",
    },
    gap: {
      control: "select",
      options: ["none", "sm", "md", "lg", "xl"],
      description: "Gap between grid items",
    },
    alignItems: {
      control: "select",
      options: ["start", "center", "end", "stretch"],
      description: "Align items along the block axis",
    },
    justifyItems: {
      control: "select",
      options: ["start", "center", "end", "stretch"],
      description: "Justify items along the inline axis",
    },
    minChildWidth: {
      control: "text",
      description: "Minimum child width for auto-fit grid (e.g., '250px')",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const GridCell = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center text-sm font-medium">
    {children}
  </div>
);

// Default responsive grid
export const Default: Story = {
  args: {
    cols: { sm: 1, md: 2, lg: 3 },
    gap: "md",
    children: (
      <>
        <GridCell>Cell 1</GridCell>
        <GridCell>Cell 2</GridCell>
        <GridCell>Cell 3</GridCell>
        <GridCell>Cell 4</GridCell>
        <GridCell>Cell 5</GridCell>
        <GridCell>Cell 6</GridCell>
      </>
    ),
  },
};

// Fixed column counts
export const FixedColumns: Story = {
  render: () => (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((cols) => (
        <div key={cols}>
          <p className="text-sm font-medium mb-2">
            Columns: <code className="bg-muted px-1 rounded">{cols}</code>
          </p>
          <Grid cols={cols} gap="sm">
            {Array.from({ length: cols * 2 }).map((_, i) => (
              <GridCell key={i}>Cell {i + 1}</GridCell>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grid can use a fixed number of columns across all breakpoints.",
      },
    },
  },
};

// Auto-fit with minimum child width
export const AutoFit: Story = {
  args: {
    minChildWidth: "200px",
    gap: "md",
    children: (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <GridCell key={i}>Auto-fit {i + 1}</GridCell>
        ))}
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Using minChildWidth enables auto-fit behavior where items wrap based on available space, with each item being at least the specified width.",
      },
    },
  },
};

// With GridItem spanning
export const WithGridItemSpans: Story = {
  render: () => (
    <Grid cols={4} gap="sm">
      <GridItem colSpan={2}>
        <GridCell>Span 2 columns</GridCell>
      </GridItem>
      <GridCell>Cell</GridCell>
      <GridCell>Cell</GridCell>
      <GridCell>Cell</GridCell>
      <GridItem colSpan={3}>
        <GridCell>Span 3 columns</GridCell>
      </GridItem>
      <GridItem colSpan={4}>
        <GridCell>Full width (span 4)</GridCell>
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "GridItem allows individual cells to span multiple columns or rows.",
      },
    },
  },
};

// Gap variants
export const GapVariants: Story = {
  render: () => (
    <div className="space-y-8">
      {(["none", "sm", "md", "lg", "xl"] as const).map((gap) => (
        <div key={gap}>
          <p className="text-sm font-medium mb-2">
            Gap: <code className="bg-muted px-1 rounded">{gap}</code>
          </p>
          <Grid cols={3} gap={gap}>
            <GridCell>A</GridCell>
            <GridCell>B</GridCell>
            <GridCell>C</GridCell>
          </Grid>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grid supports five gap sizes: none (0), sm (8px), md (12px), lg (16px), xl (24px).",
      },
    },
  },
};
