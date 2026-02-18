"use client";

import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings, Share2, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import {
  DeviceToolbar,
  PreviewCanvas,
  FeaturePanel,
  LivePreviewStatus,
  PreviewActions,
} from "@/components/preview";
import {
  useDevicePreview,
  useThemePreview,
  usePreviewSession,
  useLivePreview,
} from "@/lib/preview";
import { parseURLConfig } from "@/lib/config";
import { PREVIEW_FEATURES } from "@/lib/constants";

function PreviewContent() {
  const searchParams = useSearchParams();
  const [copySuccess, setCopySuccess] = useState(false);

  // Parse config from URL - supports both direct params and session token
  const config = useMemo(
    () => parseURLConfig(searchParams),
    [searchParams]
  );

  // Check for preview session token in URL
  const previewToken = searchParams.get("preview");

  // Device & theme state
  const { device, size, setDevice } = useDevicePreview("desktop");
  const { theme, setTheme, resolvedTheme } = useThemePreview("light");

  // Preview session tracking with backend integration
  const {
    session,
    isLoading,
    error,
    startSession,
    endSession,
    loadSessionFromToken
  } = usePreviewSession();

  // Live preview management
  const livePreview = useLivePreview();

  // Determine tier and features from either URL params or loaded session
  const tier = session?.tier || config.tier || "starter";
  const features = session?.features || config.features || [];

  // Ref to always access latest endSession without re-running effect
  const endSessionRef = useRef(endSession);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  // Load session from token if provided, otherwise start from URL params
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      if (previewToken) {
        // Load shared session from token
        await loadSessionFromToken(previewToken);
        // Check if component is still mounted after async operation
        if (!isMounted) return;
      } else if (config.tier || (config.features && config.features.length > 0)) {
        // Start session from URL params
        startSession(config.tier || "starter", config.features || []);
      }
    };

    initSession();

    return () => {
      isMounted = false;
      endSessionRef.current();
    };
  // Only run on mount and when token changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewToken]);

  const handleReset = useCallback(() => {
    setDevice("desktop");
    setTheme("light");
  }, [setDevice, setTheme]);

  const handleOpenExternal = useCallback(() => {
    const params = new URLSearchParams();
    params.set("tier", tier);
    if (features.length > 0) {
      params.set("features", features.join(","));
    }
    const url = `/preview?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [tier, features]);

  const handleSharePreview = useCallback(async () => {
    // If we have a session token, use it for shareable link
    const shareUrl = session?.sessionToken
      ? `${window.location.origin}/preview?preview=${session.sessionToken}`
      : `${window.location.origin}/preview?tier=${tier}&features=${features.join(",")}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy to clipboard");
    }
  }, [session?.sessionToken, tier, features]);

  // Show loading state when loading from token
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading preview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="m-4 mb-0 p-4 rounded-lg border bg-destructive/10 border-destructive/50 text-destructive flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            {error}. You can still use the preview with default settings.
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={handleSharePreview}
          >
            <Share2 className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{copySuccess ? "Copied!" : "Share"}</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-[44px]">
            <Link href={`/configure?tier=${tier}&features=${features.join(",")}`}>
              <Settings className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Edit Configuration</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Live Preview Status */}
      {livePreview.status !== "idle" && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b bg-muted/30">
          <LivePreviewStatus status={livePreview.status} error={livePreview.error} />
          {livePreview.status === "ready" && (
            <PreviewActions
              status={livePreview.status}
              previewUrl={livePreview.previewUrl}
              onLaunch={() => livePreview.launch(tier, features)}
              onStop={livePreview.stop}
              onRestart={() => livePreview.launch(tier, features)}
            />
          )}
        </div>
      )}

      {/* Device Toolbar */}
      <DeviceToolbar
        device={device}
        onDeviceChange={setDevice}
        theme={theme}
        onThemeChange={setTheme}
        onReset={handleReset}
        onOpenExternal={handleOpenExternal}
        onLaunchPreview={() => livePreview.launch(tier, features)}
        livePreviewStatus={livePreview.status}
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
          livePreview={{
            status: livePreview.status,
            previewUrl: livePreview.previewUrl,
          }}
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
