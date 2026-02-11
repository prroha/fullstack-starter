import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertCircle, Package } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Templates - Starter Studio",
  description:
    "Jump-start your project with professionally designed templates. Pre-configured setups for SaaS, e-commerce, dashboards, and more.",
  openGraph: {
    title: "Pre-Built Templates | Starter Studio",
    description:
      "Choose from professionally designed templates with pre-selected features for common use cases. Save hours of configuration time.",
  },
};

// Revalidate template data every hour
export const revalidate = 3600;

// Fallback templates if API fails
const fallbackTemplates: Template[] = [];

// Fetch templates from API
async function getTemplates(): Promise<Template[]> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/templates`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Failed to fetch templates:", response.statusText);
      return fallbackTemplates;
    }

    const data = await response.json();
    return data.data?.items || [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return fallbackTemplates;
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  // Empty state
  if (templates.length === 0) {
    return (
      <Container className="py-20">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Templates Available</h1>
          <p className="text-muted-foreground mb-6">
            Templates are being prepared. In the meantime, you can configure your own custom starter.
          </p>
          <Button asChild>
            <Link href="/configure">
              Build Custom
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
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

// Template Card Component
function TemplateCard({ template }: { template: Template }) {
  const savings = template.compareAtPrice
    ? template.compareAtPrice - template.price
    : 0;

  return (
    <Card variant="outline" className="flex flex-col overflow-hidden">
      {/* Template Header with Color */}
      <div
        className="h-2"
        style={{ backgroundColor: template.color || "#6366f1" }}
        aria-hidden="true"
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
          <div className="flex flex-wrap gap-1" role="list" aria-label="Included features">
            {template.includedFeatures.slice(0, 5).map((feature) => (
              <span
                key={feature}
                role="listitem"
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
}
