import type { Meta, StoryObj } from "@storybook/react";
import { QRCode } from "@/components/ui/qr-code";

/**
 * The QRCode component generates QR codes from text or URLs.
 * It supports custom colors, sizes, error correction levels, and optional download buttons.
 */
const meta: Meta<typeof QRCode> = {
  title: "Components/Display/QRCode",
  component: QRCode,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A QR code generator component that renders encoded data as a scannable QR code. Supports custom colors, sizes, error correction levels, center logos, and PNG/SVG download.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "The data to encode in the QR code",
    },
    size: {
      control: { type: "range", min: 100, max: 400, step: 50 },
      description: "Size in pixels",
    },
    level: {
      control: "select",
      options: ["L", "M", "Q", "H"],
      description: "Error correction level",
    },
    bgColor: {
      control: "color",
      description: "Background color",
    },
    fgColor: {
      control: "color",
      description: "Foreground/QR color",
    },
    includeMargin: {
      control: "boolean",
      description: "Include quiet zone margin",
    },
    downloadable: {
      control: "boolean",
      description: "Show download buttons",
    },
    downloadFileName: {
      control: "text",
      description: "Filename for download",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default QR code
export const Default: Story = {
  args: {
    value: "https://example.com",
    size: 200,
    level: "M",
  },
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="text-center">
        <QRCode value="https://example.com" size={100} />
        <p className="text-xs mt-2 text-muted-foreground">100px</p>
      </div>
      <div className="text-center">
        <QRCode value="https://example.com" size={150} />
        <p className="text-xs mt-2 text-muted-foreground">150px</p>
      </div>
      <div className="text-center">
        <QRCode value="https://example.com" size={200} />
        <p className="text-xs mt-2 text-muted-foreground">200px</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "QR codes at different pixel sizes.",
      },
    },
  },
};

// Custom colors
export const CustomColors: Story = {
  render: () => (
    <div className="flex gap-6">
      <QRCode value="https://example.com" fgColor="#1a1a2e" bgColor="#e2e2e2" size={150} />
      <QRCode value="https://example.com" fgColor="#0f3460" bgColor="#e8f4f8" size={150} />
      <QRCode value="https://example.com" fgColor="#6b21a8" bgColor="#faf5ff" size={150} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "QR codes with custom foreground and background colors.",
      },
    },
  },
};

// With download buttons
export const Downloadable: Story = {
  args: {
    value: "https://example.com/download-me",
    size: 200,
    downloadable: true,
    downloadFileName: "my-qrcode",
  },
  parameters: {
    docs: {
      description: {
        story: "QR code with PNG and SVG download buttons.",
      },
    },
  },
};

// Error correction levels
export const ErrorCorrectionLevels: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="text-center">
        <QRCode value="https://example.com" size={150} level="L" />
        <p className="text-xs mt-2 text-muted-foreground">L (7%)</p>
      </div>
      <div className="text-center">
        <QRCode value="https://example.com" size={150} level="M" />
        <p className="text-xs mt-2 text-muted-foreground">M (15%)</p>
      </div>
      <div className="text-center">
        <QRCode value="https://example.com" size={150} level="Q" />
        <p className="text-xs mt-2 text-muted-foreground">Q (25%)</p>
      </div>
      <div className="text-center">
        <QRCode value="https://example.com" size={150} level="H" />
        <p className="text-xs mt-2 text-muted-foreground">H (30%)</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "QR codes with different error correction levels. Higher levels allow more of the code to be damaged while remaining scannable.",
      },
    },
  },
};
