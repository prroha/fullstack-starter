"use client";

import Link from "next/link";
import { Card, CardContent, Badge, Icon } from "@/components/ui";
import type { ComponentMetadata } from "@/lib/showcase";
import { getTierInfo } from "@/lib/showcase";
import { cn } from "@/lib/utils";

interface ComponentCardProps {
  component: ComponentMetadata;
  className?: string;
}

export function ComponentCard({ component, className }: ComponentCardProps) {
  const tierInfo = getTierInfo(component.tier);

  return (
    <Link
      href={`/showcase/${component.category}/${component.slug}`}
      className={cn(
        "block min-h-[120px] rounded-lg",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      aria-label={`View ${component.name} component`}
    >
      <Card
        interactive
        className={cn(
          "h-full transition-all hover:border-primary/50",
          className
        )}
      >
        <CardContent className="p-4 sm:pt-6 sm:px-6">
          <div className="flex items-start justify-between mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
              aria-hidden="true"
            >
              {component.iconName && (
                <Icon name={component.iconName} size="md" className="text-primary" />
              )}
            </div>
            <div className="flex gap-1.5" aria-label="Component badges">
              {component.isNew && (
                <Badge variant="success" className="text-xs">New</Badge>
              )}
              {component.isPopular && (
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              )}
              {component.tier !== "basic" && (
                <Badge variant={tierInfo.color} className="text-xs">
                  {tierInfo.name}
                </Badge>
              )}
            </div>
          </div>

          <h3 className="font-semibold mb-1">{component.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {component.description}
          </p>

          {component.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1" aria-label="Component tags">
              {component.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {component.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{component.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
