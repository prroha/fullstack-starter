"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { getCategories, getCategoryInfo, getComponentsByCategory } from "@/lib/showcase";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  orientation?: "horizontal" | "vertical";
  showCounts?: boolean;
  className?: string;
}

export function CategoryNav({
  orientation = "horizontal",
  showCounts = true,
  className,
}: CategoryNavProps) {
  const pathname = usePathname();
  const categories = getCategories();

  const isActive = (category: string) => {
    return pathname.includes(`/showcase/${category}`);
  };

  const isAllActive = () => {
    return pathname === "/showcase";
  };

  if (orientation === "vertical") {
    return (
      <nav className={cn("space-y-1", className)}>
        <Link
          href="/showcase"
          className={cn(
            "flex items-center justify-between px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors",
            isAllActive()
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <span>All Components</span>
        </Link>

        {categories.map((category) => {
          const info = getCategoryInfo(category);
          const count = getComponentsByCategory(category).length;

          return (
            <Link
              key={category}
              href={`/showcase/${category}`}
              className={cn(
                "flex items-center justify-between px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors",
                isActive(category)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon name={info.icon} size="sm" />
                <span>{info.name}</span>
              </div>
              {showCounts && (
                <span
                  className={cn(
                    "text-xs",
                    isActive(category)
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-2 border-b pb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0",
        className
      )}
    >
      <Link
        href="/showcase"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors whitespace-nowrap",
          isAllActive()
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </Link>

      {categories.map((category) => {
        const info = getCategoryInfo(category);
        const count = getComponentsByCategory(category).length;

        return (
          <Link
            key={category}
            href={`/showcase/${category}`}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              isActive(category)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon name={info.icon} size="sm" />
            <span>{info.name}</span>
            {showCounts && (
              <span
                className={cn(
                  "ml-1 text-xs",
                  isActive(category)
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                ({count})
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
