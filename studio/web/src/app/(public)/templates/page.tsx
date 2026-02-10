"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from "@/components/ui";
import { Icon, type IconName } from "@core/components/ui/icon";
import { API_CONFIG } from "@/lib/constants";
import type { Template } from "@studio/shared";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/templates`);
        if (!res.ok) throw new Error("Failed to fetch templates");
        const data = await res.json();
        setTemplates(data.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <Container className="py-20">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Pre-Built Templates
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Jump-start your project with our professionally designed templates.
          Each includes carefully selected features for specific use cases.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const savings = template.compareAtPrice
            ? template.compareAtPrice - template.price
            : 0;

          return (
            <Card
              key={template.id}
              variant="outline"
              className="flex flex-col overflow-hidden"
            >
              {/* Template Header with Color */}
              <div
                className="h-2"
                style={{ backgroundColor: template.color || "#6366f1" }}
              />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {template.iconName && (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${template.color || "#6366f1"}20`,
                        }}
                      >
                        <Icon
                          name={template.iconName as IconName}
                          className="h-5 w-5"
                          style={{ color: template.color || "#6366f1" }}
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {template.tier} tier
                      </p>
                    </div>
                  </div>
                  {template.isFeatured && (
                    <Badge variant="default" size="sm">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {template.shortDescription || template.description}
                </p>

                {/* Included Features Preview */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Includes {template.includedFeatures.length} features
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.includedFeatures.slice(0, 5).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 bg-muted rounded"
                      >
                        {feature.split(".")[1]}
                      </span>
                    ))}
                    {template.includedFeatures.length > 5 && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        +{template.includedFeatures.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-t pt-4">
                {/* Pricing */}
                <div className="flex items-baseline gap-2 w-full">
                  <span className="text-2xl font-bold">
                    ${(template.price / 100).toFixed(0)}
                  </span>
                  {template.compareAtPrice && template.compareAtPrice > template.price && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">
                        ${(template.compareAtPrice / 100).toFixed(0)}
                      </span>
                      <Badge variant="success" size="sm">
                        Save ${(savings / 100).toFixed(0)}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/configure?template=${template.slug}`}>
                      Customize
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/checkout?template=${template.slug}`}>
                      Buy Now
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Something Custom?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Build your own custom configuration with our feature picker.
          Select only what you need.
        </p>
        <Button asChild size="lg">
          <Link href="/configure">
            Build Custom
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Container>
  );
}
