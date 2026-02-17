"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  Container,
  Button,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardContent,
  Icon,
} from "@/components/ui";
import {
  CodeBlock,
  PropsTable,
  ComponentPreview,
} from "@/components/showcase";
import {
  getComponentBySlug,
  getComponentExamples,
  getCategoryInfo,
  getTierInfo,
  getComponentPreview,
  type ComponentCategory,
} from "@/lib/showcase";

interface ComponentDetailPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export default function ComponentDetailPage({ params }: ComponentDetailPageProps) {
  const { category, slug } = use(params);
  const router = useRouter();

  const component = getComponentBySlug(slug);
  const examples = getComponentExamples(slug);
  const preview = getComponentPreview(slug);

  if (!component || component.category !== category) {
    notFound();
  }

  const categoryInfo = getCategoryInfo(component.category as ComponentCategory);
  const tierInfo = getTierInfo(component.tier);

  return (
    <Container className="py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/showcase" className="hover:text-foreground">
          Showcase
        </Link>
        <span>/</span>
        <Link href={`/showcase/${category}`} className="hover:text-foreground">
          {categoryInfo.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{component.name}</span>
      </nav>

      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {categoryInfo.name}
        </Button>
      </div>

      {/* Component Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          {component.iconName && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Icon name={component.iconName} size="lg" className="text-primary" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{component.name}</h1>
              <div className="flex gap-2">
                {component.isNew && (
                  <Badge variant="success">New</Badge>
                )}
                {component.isPopular && (
                  <Badge variant="secondary">Popular</Badge>
                )}
                {component.tier !== "basic" && (
                  <Badge variant={tierInfo.color}>{tierInfo.name}</Badge>
                )}
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              {component.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {component.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultIndex={0}>
        <TabList className="mb-6">
          <Tab>Examples</Tab>
          <Tab>Props</Tab>
          {component.relatedComponents.length > 0 && (
            <Tab>Related</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Examples Tab */}
          <TabPanel>
            <div className="space-y-6">
              {/* Import */}
              {examples && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Import</h3>
                  <CodeBlock code={examples.import} language="tsx" />
                </div>
              )}

              {/* Basic Usage */}
              {examples?.basic && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {examples.basic.title}
                  </h3>
                  {examples.basic.description && (
                    <p className="text-muted-foreground mb-3">
                      {examples.basic.description}
                    </p>
                  )}
                  <ComponentPreview label={`${component.name} Preview`}>
                    {preview || (
                      <div className="text-center text-muted-foreground">
                        Live preview coming soon
                      </div>
                    )}
                  </ComponentPreview>
                  <div className="mt-4">
                    <CodeBlock
                      code={examples.basic.code}
                      language={examples.basic.language}
                      title="Code"
                    />
                  </div>
                </div>
              )}

              {/* Variant Examples */}
              {examples?.variants?.map((variant, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold mb-3">{variant.title}</h3>
                  {variant.description && (
                    <p className="text-muted-foreground mb-3">
                      {variant.description}
                    </p>
                  )}
                  <CodeBlock
                    code={variant.code}
                    language={variant.language}
                    showLineNumbers
                  />
                </div>
              ))}

              {/* No examples fallback */}
              {!examples && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Code examples for this component are coming soon.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabPanel>

          {/* Props Tab */}
          <TabPanel>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Component Props</h3>
                <PropsTable props={component.props} componentName={component.name} />
              </div>
            </div>
          </TabPanel>

          {/* Related Tab */}
          {component.relatedComponents.length > 0 && (
            <TabPanel>
              <div>
                <h3 className="text-lg font-semibold mb-4">Related Components</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {component.relatedComponents.map((relatedSlug) => {
                    const related = getComponentBySlug(relatedSlug);
                    if (!related) return null;

                    return (
                      <Link
                        key={relatedSlug}
                        href={`/showcase/${related.category}/${related.slug}`}
                      >
                        <Card interactive className="h-full">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                              {related.iconName && (
                                <Icon
                                  name={related.iconName}
                                  size="sm"
                                  className="text-primary"
                                />
                              )}
                              <span className="font-medium">{related.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {related.description}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* CTA */}
      <div className="mt-12 p-6 border rounded-lg bg-muted/30 text-center">
        <h3 className="text-lg font-semibold mb-2">
          Ready to use this component?
        </h3>
        <p className="text-muted-foreground mb-4">
          Configure your app with the features you need and download production-ready code.
        </p>
        <Button asChild>
          <Link href="/configure">
            Start Configuring
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Container>
  );
}
