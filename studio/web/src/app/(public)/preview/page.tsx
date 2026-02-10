"use client";

import { useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import {
  DeviceToolbar,
  PreviewCanvas,
  FeaturePanel,
} from "@/components/preview";
import {
  useDevicePreview,
  useThemePreview,
  usePreviewSession,
} from "@/lib/preview";
import { parseURLConfig } from "@/lib/config";
import { PREVIEW_FEATURES } from "@/lib/constants";

function PreviewContent() {
  const searchParams = useSearchParams();

  // Parse config from URL
  const config = useMemo(
    () => parseURLConfig(searchParams),
    [searchParams]
  );

  const tier = config.tier || "starter";
  const features = config.features || [];

  // Device & theme state
  const { device, size, setDevice } = useDevicePreview("desktop");
  const { theme, setTheme, resolvedTheme } = useThemePreview("light");

  // Preview session tracking
  const { startSession, endSession } = usePreviewSession();

  // Stable callback for session management with error handling
  const handleStartSession = useCallback(() => {
    try {
      startSession(tier, features);
    } catch (error) {
      console.error("Failed to start preview session:", error);
    }
  }, [tier, features, startSession]);

  const handleEndSession = useCallback(() => {
    try {
      endSession();
    } catch (error) {
      console.error("Failed to end preview session:", error);
    }
  }, [endSession]);

  // Start session on mount with error handling
  useEffect(() => {
    handleStartSession();
    return () => handleEndSession();
  }, [handleStartSession, handleEndSession]);

  const handleReset = () => {
    setDevice("desktop");
    setTheme("light");
  };

  const handleOpenExternal = () => {
    const url = `/preview/standalone?tier=${tier}&features=${features.join(",")}`;
    window.open(url, "_blank");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-3 sm:px-4 py-2 gap-2 bg-background">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="min-h-[44px]">
            <Link href="/configure">
              <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Configure</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <span className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{tier}</span> tier
            <span className="hidden xs:inline"> with <span className="font-medium text-foreground">{features.length}</span> features</span>
          </span>
        </div>
        <Button asChild variant="outline" size="sm" className="min-h-[44px] self-end sm:self-auto">
          <Link href={`/configure?tier=${tier}&features=${features.join(",")}`}>
            <Settings className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Edit Configuration</span>
            <span className="sm:hidden">Edit</span>
          </Link>
        </Button>
      </div>

      {/* Device Toolbar */}
      <DeviceToolbar
        device={device}
        onDeviceChange={setDevice}
        theme={theme}
        onThemeChange={setTheme}
        onReset={handleReset}
        onOpenExternal={handleOpenExternal}
      />

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas */}
        <PreviewCanvas
          device={device}
          size={size}
          theme={resolvedTheme}
          tier={tier}
          features={features}
        />

        {/* Feature Panel - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <FeaturePanel
            tier={tier}
            features={features}
            allFeatures={PREVIEW_FEATURES}
          />
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
