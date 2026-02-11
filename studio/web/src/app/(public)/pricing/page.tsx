import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Check, X, Sparkles, ArrowRight } from "lucide-react";
import {
  Button,
  Container,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui";
import { API_CONFIG } from "@/lib/constants";
import type { PricingTier } from "@studio/shared";
import { TIER_ORDER, TIER_INFO, formatDisplayPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing - Starter Studio",
  description:
    "Choose the right plan for your project. From basic templates to enterprise solutions, we have pricing options for developers of all sizes.",
  openGraph: {
    title: "Pricing | Starter Studio",
    description:
      "Flexible pricing for your next SaaS project. Start free, scale as you grow.",
  },
};

// Revalidate pricing data every hour
export const revalidate = 3600;

// Pricing FAQs
const pricingFaqs = [
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers. All payments are processed securely through Stripe.",
  },
  {
    question: "Can I upgrade or downgrade my tier later?",
    answer:
      "Yes! You can upgrade at any time and only pay the difference. For downgrades, contact our support team and we will help you transition smoothly.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a 14-day money-back guarantee. If you are not satisfied with your purchase, contact us within 14 days for a full refund, no questions asked.",
  },
  {
    question: "What is included in lifetime access?",
    answer:
      "Lifetime access means you pay once and own the code forever. You will receive all future updates to the features included in your tier, with no recurring fees.",
  },
  {
    question: "Can I use the code for multiple projects?",
    answer:
      "Yes, the license allows you to use the code in unlimited personal and commercial projects. However, you cannot redistribute or resell the code itself.",
  },
  {
    question: "Do you offer team or enterprise discounts?",
    answer:
      "Yes! We offer volume discounts for teams. Contact us for custom enterprise pricing that includes priority support, custom features, and dedicated onboarding.",
  },
  {
    question: "What support is included?",
    answer:
      "All tiers include access to our documentation and community forum. Pro and higher tiers include email support, while Enterprise includes priority support with dedicated account management.",
  },
  {
    question: "Can I add features later?",
    answer:
      "Absolutely! You can purchase additional features as add-ons at any time. These will be integrated with your existing codebase seamlessly.",
  },
];

// Feature categories for comparison
const featureCategories = [
  {
    name: "Core",
    features: [
      { name: "112+ UI Components", tiers: ["basic", "starter", "pro", "business", "enterprise"] },
      { name: "Dark Mode", tiers: ["basic", "starter", "pro", "business", "enterprise"] },
      { name: "TypeScript", tiers: ["basic", "starter", "pro", "business", "enterprise"] },
      { name: "Tailwind CSS", tiers: ["basic", "starter", "pro", "business", "enterprise"] },
    ],
  },
  {
    name: "Authentication",
    features: [
      { name: "Email/Password Auth", tiers: ["starter", "pro", "business", "enterprise"] },
      { name: "Social Login (Google, GitHub)", tiers: ["starter", "pro", "business", "enterprise"] },
      { name: "Magic Link", tiers: ["pro", "business", "enterprise"] },
      { name: "Multi-factor Auth", tiers: ["business", "enterprise"] },
      { name: "SSO/SAML", tiers: ["enterprise"] },
    ],
  },
  {
    name: "Payments",
    features: [
      { name: "Stripe Integration", tiers: ["pro", "business", "enterprise"] },
      { name: "Subscription Billing", tiers: ["pro", "business", "enterprise"] },
      { name: "One-time Payments", tiers: ["pro", "business", "enterprise"] },
      { name: "Invoicing", tiers: ["business", "enterprise"] },
      { name: "Multi-currency", tiers: ["enterprise"] },
    ],
  },
  {
    name: "Storage & Files",
    features: [
      { name: "File Upload", tiers: ["starter", "pro", "business", "enterprise"] },
      { name: "Image Optimization", tiers: ["pro", "business", "enterprise"] },
      { name: "S3 Integration", tiers: ["business", "enterprise"] },
      { name: "CDN Support", tiers: ["enterprise"] },
    ],
  },
  {
    name: "Mobile",
    features: [
      { name: "Flutter App", tiers: ["pro", "business", "enterprise"] },
      { name: "Push Notifications", tiers: ["business", "enterprise"] },
      { name: "Offline Support", tiers: ["enterprise"] },
    ],
  },
  {
    name: "Enterprise",
    features: [
      { name: "Audit Logging", tiers: ["business", "enterprise"] },
      { name: "Role-based Access", tiers: ["business", "enterprise"] },
      { name: "Custom Domains", tiers: ["enterprise"] },
      { name: "SLA & Priority Support", tiers: ["enterprise"] },
    ],
  },
];

// Fallback pricing data if API fails
const fallbackTiers: PricingTier[] = [
  {
    id: "1",
    slug: "basic",
    name: "Basic",
    description: "UI components and basic templates for simple projects.",
    price: 0,
    includedFeatures: ["ui-components", "dark-mode", "typescript", "tailwind"],
    isPopular: false,
    displayOrder: 0,
    color: "gray",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "starter",
    name: "Starter",
    description: "Everything in Basic plus authentication and file uploads.",
    price: 4900,
    compareAtPrice: 7900,
    includedFeatures: ["auth-email", "auth-social", "file-upload"],
    isPopular: false,
    displayOrder: 1,
    color: "blue",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "pro",
    name: "Pro",
    description: "Full-stack SaaS with payments, subscriptions, and mobile app.",
    price: 14900,
    compareAtPrice: 24900,
    includedFeatures: ["payments-stripe", "subscriptions", "flutter-app"],
    isPopular: true,
    displayOrder: 2,
    color: "purple",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    slug: "business",
    name: "Business",
    description: "Advanced features for growing businesses and teams.",
    price: 29900,
    compareAtPrice: 49900,
    includedFeatures: ["mfa", "invoicing", "audit-logs", "rbac"],
    isPopular: false,
    displayOrder: 3,
    color: "orange",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    slug: "enterprise",
    name: "Enterprise",
    description: "Everything plus SSO, custom domains, and priority support.",
    price: 59900,
    compareAtPrice: 99900,
    includedFeatures: ["sso-saml", "custom-domains", "priority-support"],
    isPopular: false,
    displayOrder: 4,
    color: "red",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Fetch pricing tiers from API
async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/pricing/tiers`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Failed to fetch pricing tiers:", response.statusText);
      return fallbackTiers;
    }

    const data = await response.json();
    const tiers = data.data?.items || data.items || [];

    if (tiers.length === 0) {
      return fallbackTiers;
    }

    return tiers.sort(
      (a: PricingTier, b: PricingTier) => a.displayOrder - b.displayOrder
    );
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    return fallbackTiers;
  }
}

// Get tier color class
function getTierColorClass(tier: PricingTier): string {
  const colorMap: Record<string, string> = {
    gray: "from-gray-500/20 to-gray-600/5",
    blue: "from-blue-500/20 to-blue-600/5",
    purple: "from-purple-500/20 to-purple-600/5",
    orange: "from-orange-500/20 to-orange-600/5",
    red: "from-red-500/20 to-red-600/5",
  };
  return colorMap[tier.color || "gray"] || colorMap.gray;
}

// Get tier border color class
function getTierBorderClass(tier: PricingTier): string {
  if (!tier.isPopular) return "border-border";
  const colorMap: Record<string, string> = {
    gray: "border-gray-500",
    blue: "border-blue-500",
    purple: "border-purple-500",
    orange: "border-orange-500",
    red: "border-red-500",
  };
  return colorMap[tier.color || "purple"] || "border-primary";
}

export default async function PricingPage() {
  const tiers = await getPricingTiers();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <Container>
          <div className="py-16 md:py-24 max-w-3xl mx-auto text-center relative">
            <Badge variant="secondary" className="mb-6">
              One-time purchase, lifetime access
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the tier that fits your needs. Pay once, own forever.
              All tiers include future updates at no extra cost.
            </p>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-20">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {tiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>
        </Container>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 md:py-20 border-t bg-muted/30">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See exactly what is included in each tier
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b border-border font-semibold">
                    Features
                  </th>
                  {TIER_ORDER.map((tierSlug) => {
                    const tier = tiers.find((t) => t.slug === tierSlug);
                    const tierInfo = TIER_INFO[tierSlug];
                    return (
                      <th
                        key={tierSlug}
                        className="text-center p-4 border-b border-border"
                      >
                        <div className="font-semibold">
                          {tier?.name || tierInfo?.name || tierSlug}
                        </div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {tier ? formatDisplayPrice(tier.price) : "-"}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category) => (
                  <Fragment key={`category-${category.name}`}>
                    <tr>
                      <td
                        colSpan={TIER_ORDER.length + 1}
                        className="bg-muted/50 p-3 font-semibold text-sm"
                      >
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="p-4 text-sm">{feature.name}</td>
                        {TIER_ORDER.map((tierSlug) => (
                          <td key={tierSlug} className="p-4 text-center">
                            {feature.tiers.includes(tierSlug) ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison */}
          <div className="lg:hidden space-y-6">
            {tiers.map((tier) => (
              <Card key={tier.id} variant="outline" className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{tier.name}</h3>
                      <p className="text-2xl font-bold">
                        {formatDisplayPrice(tier.price)}
                      </p>
                    </div>
                    {tier.isPopular && (
                      <Badge className="bg-primary">Popular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {featureCategories.map((category) => {
                    const includedFeatures = category.features.filter((f) =>
                      f.tiers.includes(tier.slug)
                    );
                    if (includedFeatures.length === 0) return null;

                    return (
                      <div key={category.name} className="mb-4">
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          {category.name}
                        </h4>
                        <ul className="space-y-1">
                          {includedFeatures.map((feature) => (
                            <li
                              key={feature.name}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                              {feature.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/configure?tier=${tier.slug}`}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 border-t">
        <Container size="md">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We have got answers.
            </p>
          </div>

          <Accordion type="single" collapsible>
            {pricingFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <Container>
          <div className="py-16 md:py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Configure your perfect stack, preview it live, and download
              production-ready code in minutes.
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
    </>
  );
}

// Pricing Card Component
function PricingCard({ tier }: { tier: PricingTier }) {
  const tierInfo = TIER_INFO[tier.slug as keyof typeof TIER_INFO];
  const savings =
    tier.compareAtPrice && tier.compareAtPrice > tier.price
      ? Math.round(((tier.compareAtPrice - tier.price) / tier.compareAtPrice) * 100)
      : null;

  return (
    <Card
      variant="outline"
      className={`relative flex flex-col overflow-hidden ${getTierBorderClass(tier)} ${
        tier.isPopular ? "border-2 shadow-lg" : ""
      }`}
    >
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </div>
        </div>
      )}

      {/* Gradient Header */}
      <div className={`bg-gradient-to-b ${getTierColorClass(tier)} p-6`}>
        <h3 className="text-xl font-bold">{tier.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">
          {tier.description || tierInfo?.description}
        </p>
      </div>

      <CardContent className="flex-1 pt-6">
        {/* Price */}
        <div className="mb-6">
          {tier.compareAtPrice && tier.compareAtPrice > tier.price && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg text-muted-foreground line-through">
                {formatDisplayPrice(tier.compareAtPrice)}
              </span>
              {savings && (
                <Badge variant="success" size="sm">
                  Save {savings}%
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formatDisplayPrice(tier.price)}</span>
            {tier.price > 0 && (
              <span className="text-muted-foreground text-sm">one-time</span>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3">
          {tier.slug === "basic" && (
            <>
              <FeatureItem>112+ UI Components</FeatureItem>
              <FeatureItem>Dark Mode Support</FeatureItem>
              <FeatureItem>TypeScript + Tailwind</FeatureItem>
              <FeatureItem>Basic Templates</FeatureItem>
            </>
          )}
          {tier.slug === "starter" && (
            <>
              <FeatureItem>Everything in Basic</FeatureItem>
              <FeatureItem>Email/Password Auth</FeatureItem>
              <FeatureItem>Social Login</FeatureItem>
              <FeatureItem>File Uploads</FeatureItem>
            </>
          )}
          {tier.slug === "pro" && (
            <>
              <FeatureItem>Everything in Starter</FeatureItem>
              <FeatureItem>Stripe Payments</FeatureItem>
              <FeatureItem>Subscriptions</FeatureItem>
              <FeatureItem>Flutter Mobile App</FeatureItem>
              <FeatureItem>Magic Link Auth</FeatureItem>
            </>
          )}
          {tier.slug === "business" && (
            <>
              <FeatureItem>Everything in Pro</FeatureItem>
              <FeatureItem>Multi-factor Auth</FeatureItem>
              <FeatureItem>Role-based Access</FeatureItem>
              <FeatureItem>Audit Logging</FeatureItem>
              <FeatureItem>Invoicing</FeatureItem>
            </>
          )}
          {tier.slug === "enterprise" && (
            <>
              <FeatureItem>Everything in Business</FeatureItem>
              <FeatureItem>SSO/SAML</FeatureItem>
              <FeatureItem>Custom Domains</FeatureItem>
              <FeatureItem>Priority Support</FeatureItem>
              <FeatureItem>SLA Guarantee</FeatureItem>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-6 px-6">
        <Button
          asChild
          className="w-full"
          variant={tier.isPopular ? "default" : "outline"}
          size="lg"
        >
          <Link href={`/configure?tier=${tier.slug}`}>
            {tier.price === 0 ? "Get Started Free" : "Choose Plan"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Feature Item Component
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-green-500 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
