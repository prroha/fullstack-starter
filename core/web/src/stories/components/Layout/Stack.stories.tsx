import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "@/components/ui/layouts/stack";

/**
 * The Stack component arranges children in a vertical or horizontal layout
 * with configurable spacing, alignment, and optional dividers.
 */
const meta: Meta<typeof Stack> = {
  title: "Components/Layout/Stack",
  component: Stack,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A flex-based layout component for stacking items vertically or horizontally with consistent spacing. Supports alignment, wrapping, and dividers.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    direction: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Stack direction",
    },
    spacing: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl"],
      description: "Gap between items",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch"],
      description: "Cross-axis alignment",
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
      description: "Main-axis alignment",
    },
    wrap: {
      control: "boolean",
      description: "Allow items to wrap",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm font-medium text-center ${className}`}>
    {children}
  </div>
);

// Default vertical stack
export const Default: Story = {
  args: {
    direction: "vertical",
    spacing: "sm",
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
};

// Horizontal stack
export const Horizontal: Story = {
  args: {
    direction: "horizontal",
    spacing: "md",
    align: "center",
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Items arranged in a horizontal row with medium spacing.",
      },
    },
  },
};

// All spacing options
export const SpacingVariants: Story = {
  render: () => (
    <div className="space-y-8">
      {(["none", "xs", "sm", "md", "lg", "xl"] as const).map((spacing) => (
        <div key={spacing}>
          <p className="text-sm font-medium mb-2">
            Spacing: <code className="bg-muted px-1 rounded">{spacing}</code>
          </p>
          <Stack direction="horizontal" spacing={spacing}>
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Stack supports six spacing values: none (0), xs (4px), sm (8px), md (12px), lg (16px), xl (24px).",
      },
    },
  },
};

// With divider
export const WithDivider: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-2">Vertical with divider</p>
        <Stack
          direction="vertical"
          spacing="sm"
          divider={<div className="h-px bg-border" />}
        >
          <Box>Section 1</Box>
          <Box>Section 2</Box>
          <Box>Section 3</Box>
        </Stack>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Horizontal with divider</p>
        <Stack
          direction="horizontal"
          spacing="md"
          align="center"
          divider={<div className="w-px h-8 bg-border" />}
        >
          <Box>Left</Box>
          <Box>Center</Box>
          <Box>Right</Box>
        </Stack>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "An optional divider element can be placed between each child.",
      },
    },
  },
};

// Alignment options
export const Alignment: Story = {
  render: () => (
    <div className="space-y-8">
      {(["start", "center", "end", "stretch"] as const).map((align) => (
        <div key={align}>
          <p className="text-sm font-medium mb-2">
            Align: <code className="bg-muted px-1 rounded">{align}</code>
          </p>
          <Stack direction="horizontal" spacing="sm" align={align} className="h-24 border border-dashed border-border rounded-lg p-2">
            <Box className="h-8">Short</Box>
            <Box className="h-16">Tall</Box>
            <Box className="h-12">Medium</Box>
          </Stack>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cross-axis alignment controls how items align along the perpendicular axis.",
      },
    },
  },
};
