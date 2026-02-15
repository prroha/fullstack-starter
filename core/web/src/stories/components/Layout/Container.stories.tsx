import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "@/components/ui/layouts/container";

/**
 * The Container component provides a centered, width-constrained wrapper for page content.
 * It supports multiple size and padding presets with responsive behavior.
 */
const meta: Meta<typeof Container> = {
  title: "Components/Layout/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A centered content wrapper with configurable max-width and horizontal padding. Useful for constraining page content to readable widths.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "full"],
      description: "Maximum width constraint",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Horizontal padding",
    },
    centered: {
      control: "boolean",
      description: "Whether to center the container with auto margins",
    },
    as: {
      control: "select",
      options: ["div", "section", "main", "article"],
      description: "HTML element to render as",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ContentBlock = ({ label }: { label: string }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
    <p className="text-sm font-medium text-foreground">{label}</p>
  </div>
);

// Default container
export const Default: Story = {
  args: {
    size: "lg",
    padding: "md",
    centered: true,
    children: (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Page Content</h1>
        <p className="text-muted-foreground">
          This content is constrained to a max-width of 1024px (lg) with medium padding.
        </p>
        <ContentBlock label="Content Block" />
      </div>
    ),
  },
};

// All sizes comparison
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 py-8">
      {(["sm", "md", "lg", "xl", "2xl", "full"] as const).map((size) => (
        <Container key={size} size={size} padding="md">
          <div className="bg-accent border border-border rounded-lg p-4">
            <p className="text-sm font-medium">
              Size: <code className="bg-muted px-1 rounded">{size}</code>
            </p>
          </div>
        </Container>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Container supports six size presets: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px), and full (no max-width).",
      },
    },
  },
};

// Padding variants
export const PaddingVariants: Story = {
  render: () => (
    <div className="space-y-6 py-8">
      {(["none", "sm", "md", "lg"] as const).map((padding) => (
        <Container key={padding} size="lg" padding={padding}>
          <div className="bg-accent border border-border rounded-lg p-4">
            <p className="text-sm font-medium">
              Padding: <code className="bg-muted px-1 rounded">{padding}</code>
            </p>
          </div>
        </Container>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal padding can be none, sm, md, or lg. Each is responsive, scaling up at breakpoints.",
      },
    },
  },
};

// Semantic elements
export const SemanticElements: Story = {
  render: () => (
    <div className="space-y-6 py-8">
      <Container as="main" size="lg" padding="md">
        <div className="bg-accent border border-border rounded-lg p-4">
          <p className="text-sm font-medium">
            Rendered as <code className="bg-muted px-1 rounded">&lt;main&gt;</code>
          </p>
        </div>
      </Container>
      <Container as="section" size="lg" padding="md">
        <div className="bg-accent border border-border rounded-lg p-4">
          <p className="text-sm font-medium">
            Rendered as <code className="bg-muted px-1 rounded">&lt;section&gt;</code>
          </p>
        </div>
      </Container>
      <Container as="article" size="lg" padding="md">
        <div className="bg-accent border border-border rounded-lg p-4">
          <p className="text-sm font-medium">
            Rendered as <code className="bg-muted px-1 rounded">&lt;article&gt;</code>
          </p>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The container can be rendered as different semantic HTML elements: div, section, main, or article.",
      },
    },
  },
};

// Not centered
export const NotCentered: Story = {
  args: {
    size: "md",
    padding: "md",
    centered: false,
    children: (
      <div className="bg-accent border border-border rounded-lg p-4">
        <p className="text-sm font-medium">This container is not centered (left-aligned).</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Setting centered to false removes the auto margins, allowing the container to align to the left.",
      },
    },
  },
};
