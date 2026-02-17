import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Name for generating initials fallback */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Status indicator */
  status?: AvatarStatus;
}

// =====================================================
// Helper Functions
// =====================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// =====================================================
// Avatar Component
// =====================================================

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = "",
      name = "",
      size = "md",
      status,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : "";

    const sizes = {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    };

    const textSizes = {
      xs: "text-[10px]",
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-xl",
    };

    const statusSizes = {
      xs: "h-1.5 w-1.5",
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
      xl: "h-4 w-4",
    };

    const statusColors = {
      online: "bg-success",
      offline: "bg-muted-foreground",
      busy: "bg-destructive",
      away: "bg-warning",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex flex-shrink-0 rounded-full overflow-hidden",
          "bg-muted",
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Image */}
        {showImage && (
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Initials fallback */}
        {!showImage && initials && (
          <span
            className={cn(
              "flex items-center justify-center h-full w-full",
              "bg-primary text-primary-foreground font-medium",
              textSizes[size]
            )}
            aria-hidden="true"
          >
            {initials}
          </span>
        )}

        {/* Default fallback (user icon) */}
        {!showImage && !initials && (
          <span
            className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <svg
              className={cn(
                size === "xs" ? "h-3 w-3" :
                size === "sm" ? "h-4 w-4" :
                size === "md" ? "h-5 w-5" :
                size === "lg" ? "h-6 w-6" :
                "h-8 w-8"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
        )}

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-2 border-background",
              statusSizes[size],
              statusColors[status]
            )}
            role="status"
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
