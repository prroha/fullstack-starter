"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DeviceType, DeviceSize } from "@/lib/preview";

interface DeviceFrameProps {
  device: DeviceType;
  size: DeviceSize;
  children: ReactNode;
  className?: string;
  /** Scale down device frame to fit container */
  responsive?: boolean;
}

export function DeviceFrame({
  device,
  size,
  children,
  className,
  responsive = true,
}: DeviceFrameProps) {
  if (device === "desktop") {
    return (
      <div
        className={cn(
          "w-full h-full rounded-lg border border-border overflow-hidden shadow-lg",
          className
        )}
      >
        {/* Desktop browser chrome */}
        <div className="h-8 bg-muted border-b border-border flex items-center px-3 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-background rounded px-4 py-1 text-xs text-muted-foreground max-w-xs truncate">
              localhost:3000
            </div>
          </div>
        </div>
        <div className="w-full h-[calc(100%-2rem)] overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Physical device bezels use neutral grays — these are intentionally
  // hardcoded to simulate real hardware regardless of theme.
  const tabletStyles = {
    wrapper: "bg-neutral-800 rounded-[2rem] p-3 shadow-xl transition-transform",
    screen: "rounded-[1.5rem] overflow-hidden bg-background",
    bezel: "h-4 flex justify-center items-center mb-2",
    camera: "w-2 h-2 rounded-full bg-neutral-600",
    homeButton: "h-4 flex justify-center items-center mt-2",
    homeButtonInner: "w-8 h-1 rounded-full bg-neutral-600",
  };

  const mobileStyles = {
    wrapper: "bg-neutral-900 rounded-[3rem] p-2 shadow-2xl transition-transform",
    screen: "rounded-[2.5rem] overflow-hidden bg-background relative",
    bezel: "",
    camera: "",
    notch: "absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-10",
    homeIndicator: "absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-300 rounded-full",
  };

  const styles = device === "mobile" ? mobileStyles : tabletStyles;

  // Calculate bezel adjustments
  const bezelPadding = device === "tablet" ? 24 : 16;
  const bezelHeight = device === "tablet" ? 80 : 32;
  const screenWidth = size.width - bezelPadding;
  const screenHeight = size.height - bezelHeight;

  return (
    <div
      className={cn(
        "inline-block mx-auto",
        // Responsive scaling: allow device to scale down on smaller screens
        responsive && "max-w-full",
        className
      )}
      style={{
        width: size.width,
        // Use CSS containment for better rendering performance
        contain: "layout style",
      }}
    >
      <div
        className={cn(
          styles.wrapper,
          // Scale down smoothly when container is smaller than device
          responsive && "origin-top scale-[var(--device-scale,1)]"
        )}
        style={{
          // CSS custom property for responsive scaling (can be set via JS if needed)
          ["--device-scale" as string]: 1,
        }}
      >
        {/* Top bezel / Camera */}
        {device === "tablet" && (
          <div className={styles.bezel}>
            <div className={styles.camera} />
          </div>
        )}

        {/* Screen */}
        <div
          className={styles.screen}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
        >
          {/* Mobile notch */}
          {device === "mobile" && <div className={mobileStyles.notch} />}

          {/* Content with safe area padding for mobile */}
          <div
            className={cn(
              "w-full h-full overflow-auto",
              device === "mobile" && "pt-6 pb-5" // Account for notch and home indicator
            )}
          >
            {children}
          </div>

          {/* Mobile home indicator */}
          {device === "mobile" && <div className={mobileStyles.homeIndicator} />}
        </div>

        {/* Bottom bezel / Home button */}
        {device === "tablet" && (
          <div className={tabletStyles.homeButton}>
            <div className={tabletStyles.homeButtonInner} />
          </div>
        )}
      </div>
    </div>
  );
}
