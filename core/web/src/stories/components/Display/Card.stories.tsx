import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

/**
 * The Card component is a container for grouping related content.
 * It supports multiple variants, padding options, and interactive states.
 */
const meta: Meta<typeof Card> = {
  title: "Components/Display/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile container component for grouping content. Supports variants, padding options, and interactive states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "elevated", "ghost"],
      description: "Visual variant of the card",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Padding size for the card",
    },
    interactive: {
      control: "boolean",
      description: "Adds hover effects for clickable cards",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default card
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          Card description goes here. This provides context for the card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Default card with border and shadow</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="outline">
        <CardHeader>
          <CardTitle>Outline</CardTitle>
          <CardDescription>Outline card with transparent background</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Elevated card with larger shadow</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="ghost">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
          <CardDescription>Ghost card with no border or shadow</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available card variants for different use cases.",
      },
    },
  },
};

// Padding options
export const PaddingOptions: Story = {
  render: () => (
    <div className="space-y-4">
      <Card padding="none">
        <p className="p-4 bg-muted/50">padding: none (content has own padding)</p>
      </Card>
      <Card padding="sm">
        <p>padding: sm</p>
      </Card>
      <Card padding="md">
        <p>padding: md</p>
      </Card>
      <Card padding="lg">
        <p>padding: lg</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cards can have different padding sizes.",
      },
    },
  },
};

// Interactive card
export const Interactive: Story = {
  render: () => (
    <Card interactive className="cursor-pointer">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the shadow effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Click me to navigate somewhere.</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Interactive cards have hover effects for clickable elements.",
      },
    },
  },
};

// With bordered header/footer
export const WithBorderedSections: Story = {
  render: () => (
    <Card>
      <CardHeader bordered>
        <CardTitle>Bordered Header</CardTitle>
        <CardDescription>Header with bottom border</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Main content area of the card.</p>
      </CardContent>
      <CardFooter bordered>
        <Button variant="outline" size="sm">Cancel</Button>
        <Button size="sm" className="ml-auto">Save</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Header and footer can have borders for visual separation.",
      },
    },
  },
};

// Content examples
export const ContentExamples: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Stats card */}
      <Card>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-3xl">$45,231.89</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>

      {/* User card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Avatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
              name="John Doe"
              size="lg"
            />
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-muted-foreground">john@example.com</p>
            </div>
            <Badge variant="success" className="ml-auto">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feature card */}
      <Card interactive>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Premium Feature</CardTitle>
            <Badge variant="warning" size="sm">Pro</Badge>
          </div>
          <CardDescription>
            Unlock advanced analytics and reporting tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            <li>Advanced data visualization</li>
            <li>Custom report builder</li>
            <li>Team collaboration tools</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Upgrade Now</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Various examples of card content layouts.",
      },
    },
  },
};

// Card grid
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[500px]">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} interactive>
          <CardHeader>
            <CardTitle className="text-base">Card {i}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Content for card {i}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cards work well in grid layouts.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-auto">
        <Story />
      </div>
    ),
  ],
};
