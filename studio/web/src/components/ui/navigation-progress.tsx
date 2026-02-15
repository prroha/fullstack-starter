"use client";

interface NavigationProgressProps {
  navigating: boolean;
  progress: number;
}

/**
 * A thin linear progress bar for route transitions.
 * Place inside a positioned container (sticky/relative) — renders at the bottom.
 */
export function NavigationProgress({ navigating, progress }: NavigationProgressProps) {
  if (!navigating) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10 overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
