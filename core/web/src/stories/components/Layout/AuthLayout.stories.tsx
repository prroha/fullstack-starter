import type { Meta, StoryObj } from "@storybook/react";
import { AuthLayout } from "@/components/ui/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The AuthLayout component provides a centered card layout for authentication pages
 * such as login, register, and forgot password.
 */
const meta: Meta<typeof AuthLayout> = {
  title: "Components/Layout/AuthLayout",
  component: AuthLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A centered authentication page layout with card, optional logo, title, subtitle, footer, and decorative background pattern.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Page title displayed in the card header",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle/description text",
    },
    maxWidth: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Card width variant",
    },
    showBackgroundPattern: {
      control: "boolean",
      description: "Show decorative background pattern",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleLogo = () => (
  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
    <span className="text-primary-foreground font-bold text-xl">A</span>
  </div>
);

const SampleLoginForm = () => (
  <>
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="Enter your password" />
    </div>
    <Button className="w-full">Sign In</Button>
  </>
);

// Default login layout
export const Default: Story = {
  args: {
    title: "Sign In",
    subtitle: "Enter your credentials to access your account",
    children: <SampleLoginForm />,
    footer: (
      <p>
        Don&apos;t have an account? <a href="#">Sign up</a>
      </p>
    ),
  },
};

// With logo
export const WithLogo: Story = {
  args: {
    title: "Welcome Back",
    subtitle: "Sign in to continue to your dashboard",
    logo: <SampleLogo />,
    children: <SampleLoginForm />,
    footer: (
      <p>
        Don&apos;t have an account? <a href="#">Create one</a>
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "A logo or brand element can be placed above the card.",
      },
    },
  },
};

// With background pattern
export const WithBackgroundPattern: Story = {
  args: {
    title: "Create Account",
    subtitle: "Start your free trial today",
    logo: <SampleLogo />,
    showBackgroundPattern: true,
    children: (
      <>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" placeholder="Create a password" />
        </div>
        <Button className="w-full">Create Account</Button>
      </>
    ),
    footer: (
      <p>
        Already have an account? <a href="#">Sign in</a>
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "The decorative background pattern adds subtle visual depth behind the card.",
      },
    },
  },
};

// Width variants
export const WidthVariants: Story = {
  render: () => (
    <div className="space-y-12">
      {(["sm", "md", "lg"] as const).map((maxWidth) => (
        <AuthLayout
          key={maxWidth}
          title={`Max Width: ${maxWidth}`}
          subtitle="Demonstrates card width"
          maxWidth={maxWidth}
        >
          <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
            Content area ({maxWidth})
          </div>
        </AuthLayout>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The card width can be sm (max-w-sm), md (max-w-md), or lg (max-w-lg).",
      },
    },
  },
};

// Minimal (no footer, no subtitle)
export const Minimal: Story = {
  args: {
    title: "Reset Password",
    children: (
      <>
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" placeholder="you@example.com" />
        </div>
        <Button className="w-full">Send Reset Link</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "AuthLayout works without subtitle or footer for simpler flows.",
      },
    },
  },
};
