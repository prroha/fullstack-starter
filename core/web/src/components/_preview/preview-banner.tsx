"use client";

/**
 * Preview Banner
 *
 * Shows a banner at the top of the page when in preview mode.
 *
 * This file is located in _preview/ directory and is excluded from user downloads.
 * In preview mode (NEXT_PUBLIC_PREVIEW_MODE=true), this component is loaded dynamically.
 */

import { usePreview } from "@/lib/_preview/preview-context";

export function PreviewBanner() {
  const { isPreview, tier, enabledFeatures } = usePreview();

  if (!isPreview) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 text-center text-sm">
      <span className="font-medium">Preview Mode</span>
      <span className="mx-2">•</span>
      <span className="capitalize">{tier} Tier</span>
      <span className="mx-2">•</span>
      <span>{enabledFeatures.length} features enabled</span>
    </div>
  );
}
