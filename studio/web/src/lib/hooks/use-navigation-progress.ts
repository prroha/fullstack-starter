"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook that tracks Next.js route transitions and provides
 * a simulated progress value (0–100) for a loading bar.
 *
 * Usage:
 *   const { navigating, progress, startNavigation } = useNavigationProgress();
 *   // Call startNavigation() in link onClick handlers
 *   // The hook auto-completes when pathname changes
 */
export function useNavigationProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearTimer();
    setNavigating(true);
    setProgress(0);

    let current = 0;
    timerRef.current = setInterval(() => {
      current += (90 - current) * 0.1;
      setProgress(Math.min(current, 90));
    }, 100);
  }, [clearTimer]);

  const completeNavigation = useCallback(() => {
    clearTimer();
    setProgress(100);
    setTimeout(() => {
      setNavigating(false);
      setProgress(0);
    }, 200);
  }, [clearTimer]);

  // Detect route change completion
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      completeNavigation();
    }
  }, [pathname, completeNavigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  /** Call in link onClick — only starts if navigating to a different path */
  const handleLinkClick = useCallback(
    (href: string) => {
      if (href !== pathname) {
        startNavigation();
      }
    },
    [pathname, startNavigation]
  );

  return { navigating, progress, startNavigation, handleLinkClick };
}
