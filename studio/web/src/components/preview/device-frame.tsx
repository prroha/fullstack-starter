"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DeviceType, DeviceSize } from "@/lib/preview";

interface DeviceFrameProps {
  device: DeviceType;
  size: DeviceSize;
  children: ReactNode;
  className?: string;
}

export function DeviceFrame({
  device,
  size,
  children,
  className,
}: DeviceFrameProps) {
  if (device === "desktop") {
    return (
      <div className={cn("w-full h-full", className)}>
        {children}
      </div>
    );
  }

  const tabletStyles = {
    wrapper: "bg-zinc-800 rounded-[2rem] p-3 shadow-xl",
    screen: "rounded-[1.5rem] overflow-hidden bg-white",
    bezel: "h-4 flex justify-center items-center mb-2",
    camera: "w-2 h-2 rounded-full bg-zinc-600",
    homeButton: "h-4 flex justify-center items-center mt-2",
    homeButtonInner: "w-8 h-1 rounded-full bg-zinc-600",
  };

  const mobileStyles = {
    wrapper: "bg-zinc-900 rounded-[3rem] p-2 shadow-2xl",
    screen: "rounded-[2.5rem] overflow-hidden bg-white relative",
    bezel: "",
    camera: "",
    notch: "absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-10",
    homeIndicator: "absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full",
  };

  const styles = device === "mobile" ? mobileStyles : tabletStyles;

  return (
    <div
      className={cn("inline-block mx-auto", className)}
      style={{ width: size.width }}
    >
      <div className={styles.wrapper}>
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
            width: size.width - (device === "tablet" ? 24 : 16),
            height: size.height - (device === "tablet" ? 80 : 32),
          }}
        >
          {/* Mobile notch */}
          {device === "mobile" && <div className={mobileStyles.notch} />}

          {/* Content */}
          <div className="w-full h-full overflow-auto">
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
