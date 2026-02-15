"use client";

import { useCallback } from "react";
import { Check, Zap } from "lucide-react";
import { Card, CardContent, Badge, Icon } from "@/components/ui";
import type { IconName } from "@core/components/ui/icon";
import { useConfigurator } from "./context";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  variant?: "compact" | "full";
  onTemplateSelected?: (templateSlug: string | null) => void;
}

export function TemplatePicker({ variant = "compact", onTemplateSelected }: TemplatePickerProps = {}) {
  const { templates, selectedTemplate, setTemplate, formatPrice, setFeatures } = useConfigurator();

  const handleSelectTemplate = useCallback(
    (templateSlug: string | null) => {
      setTemplate(templateSlug);

      // If a template is selected, set its features
      if (templateSlug) {
        const template = templates.find((t) => t.slug === templateSlug);
        if (template?.includedFeatures) {
          setFeatures(template.includedFeatures);
        }
      }

      onTemplateSelected?.(templateSlug);
    },
    [templates, setTemplate, setFeatures, onTemplateSelected]
  );

  if (templates.length === 0) {
    return null;
  }

  const isFullVariant = variant === "full";

  return (
    <div className={isFullVariant ? "" : "mb-6"}>
      <div className={cn("flex items-center gap-2", isFullVariant ? "mb-3" : "mb-4")}>
        <Zap className={cn("text-primary", isFullVariant ? "h-6 w-6" : "h-5 w-5")} />
        <h2 className={isFullVariant ? "text-xl font-bold" : "font-semibold"}>
          {isFullVariant ? "Choose a Starting Point" : "Quick Start Templates"}
        </h2>
      </div>

      <p className={cn("text-muted-foreground", isFullVariant ? "text-base mb-8" : "text-sm mb-4")}>
        {isFullVariant
          ? "Pick a pre-configured template to get started quickly, or build your own from scratch"
          : "Start with a pre-configured template for your use case"}
      </p>

      <div
        className={cn(
          "grid gap-3",
          isFullVariant
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        )}
        role="radiogroup"
        aria-label="Select a template"
      >
        {/* No Template Option */}
        <button
          onClick={() => handleSelectTemplate(null)}
          className="text-left"
          role="radio"
          aria-checked={selectedTemplate === null}
          aria-label="Custom Build - Pick and choose individual features"
        >
          <Card
            className={cn(
              "h-full transition-all hover:border-primary/50",
              selectedTemplate === null && "ring-2 ring-primary"
            )}
          >
            <CardContent className={isFullVariant ? "p-5" : "p-4"}>
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "flex items-center justify-center rounded-lg bg-muted",
                  isFullVariant ? "h-12 w-12" : "h-10 w-10"
                )}>
                  <Icon name="Wrench" size={isFullVariant ? "md" : "sm"} className="text-muted-foreground" aria-hidden="true" />
                </div>
                {selectedTemplate === null && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <h3 className={isFullVariant ? "text-base font-semibold" : "font-medium"}>Custom Build</h3>
              <p className={cn("text-muted-foreground mt-1", isFullVariant ? "text-sm" : "text-xs")}>
                Pick and choose individual features
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Templates */}
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.slug;
          const iconName = (template.iconName || "Package") as IconName;

          return (
            <button
              key={template.slug}
              onClick={() => handleSelectTemplate(template.slug)}
              className="text-left"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${template.name} - ${template.description}, ${template.includedFeatures?.length || 0} features, ${formatPrice(template.price)}`}
            >
              <Card
                className={cn(
                  "h-full transition-all hover:border-primary/50",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <CardContent className={isFullVariant ? "p-5" : "p-4"}>
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn(
                      "flex items-center justify-center rounded-lg bg-primary/10",
                      isFullVariant ? "h-12 w-12" : "h-10 w-10"
                    )}>
                      <Icon
                        name={iconName}
                        size={isFullVariant ? "md" : "sm"}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {template.isFeatured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className={isFullVariant ? "text-base font-semibold" : "font-medium"}>{template.name}</h3>
                  <p className={cn("text-muted-foreground mt-1 line-clamp-2", isFullVariant ? "text-sm" : "text-xs")}>
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      {template.includedFeatures?.length || 0} features
                    </Badge>
                    <span className="font-semibold text-sm">
                      {formatPrice(template.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
