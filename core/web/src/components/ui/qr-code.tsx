"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Download, ImageIcon } from "lucide-react";

// =====================================================
// QRCode Component
// =====================================================
// NOTE: This component requires the 'qrcode' package.
// Install it with: npm install qrcode @types/qrcode
// =====================================================

// We'll use a dynamic import to handle the case where qrcode isn't installed yet
type QRCodeRenderersOptions = {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
};

// =====================================================
// Types
// =====================================================

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type DownloadFormat = "png" | "svg";

interface QRCodeProps {
  /** The data to encode in the QR code */
  value: string;
  /** Size in pixels (default: 200) */
  size?: number;
  /** Error correction level (default: 'M') */
  level?: ErrorCorrectionLevel;
  /** Background color (default: white) */
  bgColor?: string;
  /** Foreground/QR color (default: black) */
  fgColor?: string;
  /** Include quiet zone margin (default: true) */
  includeMargin?: boolean;
  /** Optional logo URL to overlay in center */
  logo?: string;
  /** Size of the center logo in pixels (default: 20% of QR size) */
  logoSize?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show download button (default: false) */
  downloadable?: boolean;
  /** Filename for download (default: 'qrcode') */
  downloadFileName?: string;
  /** Alt text for accessibility */
  alt?: string;
}

// =====================================================
// QRCode Component
// =====================================================

const QRCode = React.forwardRef<HTMLDivElement, QRCodeProps>(
  (
    {
      value,
      size = 200,
      level = "M",
      bgColor = "#ffffff",
      fgColor = "#000000",
      includeMargin = true,
      logo,
      logoSize,
      className,
      downloadable = false,
      downloadFileName = "qrcode",
      alt = "QR Code",
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [logoLoaded, setLogoLoaded] = React.useState(!logo);
    const [logoImage, setLogoImage] = React.useState<HTMLImageElement | null>(null);

    // Calculate logo size (default to 20% of QR size)
    const calculatedLogoSize = logoSize ?? Math.floor(size * 0.2);

    // Load logo image if provided
    React.useEffect(() => {
      if (!logo) {
        setLogoLoaded(true);
        setLogoImage(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLogoImage(img);
        setLogoLoaded(true);
      };
      img.onerror = () => {
        console.warn("Failed to load QR code logo:", logo);
        setLogoLoaded(true);
        setLogoImage(null);
      };
      img.src = logo;
    }, [logo]);

    // Generate QR code
    React.useEffect(() => {
      const generateQR = async () => {
        if (!canvasRef.current || !value || !logoLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
          // Dynamically import qrcode
          const QRCodeLib = await import("qrcode");

          const options: QRCodeRenderersOptions = {
            errorCorrectionLevel: level,
            margin: includeMargin ? 4 : 0,
            width: size,
            color: {
              dark: fgColor,
              light: bgColor,
            },
          };

          await QRCodeLib.toCanvas(canvasRef.current, value, options);

          // Draw logo if provided and loaded
          if (logoImage && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              const logoX = (canvas.width - calculatedLogoSize) / 2;
              const logoY = (canvas.height - calculatedLogoSize) / 2;

              // Draw white background for logo
              const padding = 4;
              ctx.fillStyle = bgColor;
              ctx.fillRect(
                logoX - padding,
                logoY - padding,
                calculatedLogoSize + padding * 2,
                calculatedLogoSize + padding * 2
              );

              // Draw logo
              ctx.drawImage(
                logoImage,
                logoX,
                logoY,
                calculatedLogoSize,
                calculatedLogoSize
              );
            }
          }

          setIsLoading(false);
        } catch (err) {
          console.error("QR code generation error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to generate QR code. Make sure 'qrcode' package is installed."
          );
          setIsLoading(false);
        }
      };

      generateQR();
    }, [
      value,
      size,
      level,
      bgColor,
      fgColor,
      includeMargin,
      logoLoaded,
      logoImage,
      calculatedLogoSize,
    ]);

    // Download handler
    const handleDownload = React.useCallback(
      async (format: DownloadFormat) => {
        if (!canvasRef.current) return;

        try {
          if (format === "png") {
            const dataUrl = canvasRef.current.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${downloadFileName}.png`;
            link.href = dataUrl;
            link.click();
          } else if (format === "svg") {
            // For SVG, we need to regenerate as SVG string
            const QRCodeLib = await import("qrcode");
            const svgString = await QRCodeLib.toString(value, {
              type: "svg",
              errorCorrectionLevel: level,
              margin: includeMargin ? 4 : 0,
              width: size,
              color: {
                dark: fgColor,
                light: bgColor,
              },
            });

            const blob = new Blob([svgString], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${downloadFileName}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error("Download error:", err);
        }
      },
      [value, level, includeMargin, size, fgColor, bgColor, downloadFileName]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex flex-col items-center gap-3",
          className
        )}
      >
        {/* QR Code Container */}
        <div
          className={cn(
            "relative rounded-lg overflow-hidden",
            "border border-border bg-background",
            "shadow-sm"
          )}
          style={{ width: size, height: size }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/10 p-4 text-center">
              <ImageIcon className="h-8 w-8 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={cn(
              "block",
              (isLoading || error) && "invisible"
            )}
            role="img"
            aria-label={alt}
          />
        </div>

        {/* Download Buttons */}
        {downloadable && !error && (
          <div className="flex items-center gap-2">
            <DownloadButton
              format="png"
              onClick={() => handleDownload("png")}
              disabled={isLoading}
            />
            <DownloadButton
              format="svg"
              onClick={() => handleDownload("svg")}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    );
  }
);
QRCode.displayName = "QRCode";

// =====================================================
// DownloadButton Component
// =====================================================

interface DownloadButtonProps {
  format: DownloadFormat;
  onClick: () => void;
  disabled?: boolean;
}

function DownloadButton({ format, onClick, disabled }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
        "bg-secondary text-secondary-foreground",
        "hover:bg-secondary/80 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50"
      )}
      aria-label={`Download as ${format.toUpperCase()}`}
    >
      <Download className="h-3.5 w-3.5" />
      {format.toUpperCase()}
    </button>
  );
}

// =====================================================
// Exports
// =====================================================

export { QRCode };
export type { QRCodeProps, ErrorCorrectionLevel, DownloadFormat };
