"use client";

import { Check, Zap } from "lucide-react";
import { Card, CardContent, Badge, Icon } from "@/components/ui";
import { useConfigurator } from "./context";
import { cn } from "@/lib/utils";

export function TemplatePicker() {
  const { templates, selectedTemplate, setTemplate, formatPrice, setFeatures } = useConfigurator();

  const handleSelectTemplate = (templateSlug: string | null) => {
    setTemplate(templateSlug);

    // If a template is selected, set its features
    if (templateSlug) {
      const template = templates.find((t) => t.slug === templateSlug);
      if (template?.includedFeatures) {
        setFeatures(template.includedFeatures);
      }
    }
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Quick Start Templates</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Start with a pre-configured template for your use case
      </p>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {/* No Template Option */}
        <button
          onClick={() => handleSelectTemplate(null)}
          className="text-left"
        >
          <Card
            className={cn(
              "h-full transition-all hover:border-primary/50",
              selectedTemplate === null && "ring-2 ring-primary"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon name="Wrench" size="sm" className="text-muted-foreground" />
                </div>
                {selectedTemplate === null && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <h3 className="font-medium">Custom Build</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Pick and choose individual features
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Templates */}
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.slug;

          return (
            <button
              key={template.slug}
              onClick={() => handleSelectTemplate(template.slug)}
              className="text-left"
            >
              <Card
                className={cn(
                  "h-full transition-all hover:border-primary/50",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon
                        name={template.iconName as any || "Package"}
                        size="sm"
                        className="text-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {template.isFeatured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
