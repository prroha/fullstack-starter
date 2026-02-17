import { Metadata } from "next";
import { Button, Text } from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";
import { CardSection } from "@/components/layout";

export const metadata: Metadata = {
  title: "About Us | Fullstack Starter",
  description:
    "Learn about our mission, team, and the technology behind Fullstack Starter - the modern full-stack application template.",
  openGraph: {
    title: "About Us | Fullstack Starter",
    description:
      "Learn about our mission, team, and the technology behind Fullstack Starter.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Us
          </h1>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto">
            We are building the future of full-stack development with modern,
            scalable, and developer-friendly solutions.
          </Text>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              Our Mission
            </h2>
            <Text size="lg" color="muted" className="mb-6 leading-relaxed">
              Our mission is to empower developers and teams to build
              production-ready applications faster without sacrificing quality,
              security, or scalability. We believe that great software should be
              accessible to everyone, and the best way to achieve that is by
              providing robust, well-documented, and easy-to-use tools.
            </Text>
            <Text size="lg" color="muted" className="leading-relaxed">
              Fullstack Starter represents our commitment to this mission -
              a comprehensive template that includes everything you need to
              launch your next project: authentication, database integration,
              API routes, mobile apps, and more. All built with industry best
              practices and modern technologies.
            </Text>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ValueCard
              icon={<Icon name="Sparkles" size="lg" />}
              title="Quality First"
              description="We believe in shipping high-quality code with comprehensive testing, clean architecture, and thorough documentation."
            />
            <ValueCard
              icon={<Icon name="Lock" size="lg" />}
              title="Security by Default"
              description="Security is not an afterthought. Every feature is designed with security best practices from the ground up."
            />
            <ValueCard
              icon={<Icon name="Users" size="lg" />}
              title="Developer Experience"
              description="Great tools should be a joy to use. We prioritize intuitive APIs, helpful error messages, and comprehensive guides."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
            Our Team
          </h2>
          <Text size="lg" color="muted" className="text-center mb-8 max-w-2xl mx-auto">
            A passionate group of developers, designers, and problem solvers
            dedicated to making your development journey smoother.
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <TeamMember
              name="John Doe"
              role="Founder & CEO"
              initials="JD"
            />
            <TeamMember
              name="Jane Smith"
              role="Lead Developer"
              initials="JS"
            />
            <TeamMember
              name="Mike Johnson"
              role="Mobile Lead"
              initials="MJ"
            />
            <TeamMember
              name="Sarah Wilson"
              role="Design Lead"
              initials="SW"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <Text size="lg" color="muted" className="mb-8 max-w-2xl mx-auto">
            Have questions or want to learn more? We would love to hear from you.
          </Text>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AppLink href="/contact">
              <Button size="lg">Contact Us</Button>
            </AppLink>
            <AppLink href="mailto:hello@example.com">
              <Button variant="outline" size="lg">hello@example.com</Button>
            </AppLink>
          </div>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// Value Card Component
// =====================================================

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <CardSection className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <Text color="muted">{description}</Text>
    </CardSection>
  );
}

// =====================================================
// Team Member Component
// =====================================================

interface TeamMemberProps {
  name: string;
  role: string;
  initials: string;
  imageUrl?: string;
}

function TeamMember({ name, role, initials, imageUrl }: TeamMemberProps) {
  return (
    <div className="text-center">
      <div className="mb-4 mx-auto">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover mx-auto"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Text size="lg" color="primary" className="text-2xl font-bold">{initials}</Text>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <Text color="muted">{role}</Text>
    </div>
  );
}
