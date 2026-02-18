"use client";

import { usePreviewContext } from "@preview/lib/preview-context";
import { useEffect, useState } from "react";

export function PreviewBanner() {
  const { session } = usePreviewContext();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!session) return;
    const update = () => {
      const diff = new Date(session.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3002";

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Preview Mode</span>
        <span className="opacity-80">
          {session.features.length} features | {session.tier} tier
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="opacity-80">Expires in {timeLeft}</span>
        <a
          href={studioUrl}
          className="underline hover:no-underline opacity-80 hover:opacity-100"
        >
          Back to Configure
        </a>
      </div>
    </div>
  );
}
