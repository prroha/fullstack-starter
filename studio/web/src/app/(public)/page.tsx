import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Eye, Download, Code2, Palette, Shield } from "lucide-react";
import { Button, Container, Card, CardContent, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Build Your SaaS in Days, Not Months",
  description:
    "Starter Studio helps you build production-ready SaaS applications with 112+ UI components, modular features like authentication, payments, and storage. Configure, preview, and download your app.",
  openGraph: {
    title: "Build Your SaaS in Days, Not Months | Starter Studio",
    description:
      "Configure your app by selecting the features you need, preview it live, and download production-ready code. From authentication to payments, we have got you covered.",
  },
};

const features = [
  {
    icon: Code2,
    title: "112+ Components",
    description: "Production-ready React components built with TypeScript and Tailwind CSS.",
  },
  {
    icon: Zap,
    title: "Modular Features",
    description: "Pick only the features you need. Authentication, payments, storage, and more.",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description: "See your app working before you buy. Try all features in action.",
  },
  {
    icon: Download,
    title: "Download & Own",
    description: "Get production-ready code. No vendor lock-in. Own it forever.",
  },
  {
    icon: Palette,
    title: "Customizable",
    description: "Theme everything with CSS variables. Dark mode built-in.",
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description: "SSO, RBAC, audit logging, and security features included.",
  },
];

const stats = [
  { value: "112+", label: "UI Components" },
  { value: "50+", label: "Features" },
  { value: "7", label: "Templates" },
  { value: "5", label: "Pricing Tiers" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <Container>
          <div className="py-20 md:py-32 max-w-4xl mx-auto text-center relative">
            <Badge variant="secondary" className="mb-6">
              Now with Flutter mobile support
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Build Your SaaS in{" "}
              <span className="text-primary">Days, Not Months</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Configure your app by selecting the features you need, preview it live,
              and download production-ready code. From authentication to payments, we&apos;ve got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/configure">
                  Start Configuring
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/showcase">Browse Components</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-b">
        <Container>
          <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for building modern web applications
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} variant="outline">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <Container>
          <div className="py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Browse our component showcase, configure your app, and download production-ready code.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/configure">
                  Configure Your App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
