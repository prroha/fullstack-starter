import { Metadata } from "next";
import Link from "next/link";

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
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We are building the future of full-stack development with modern,
            scalable, and developer-friendly solutions.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Our mission is to empower developers and teams to build
              production-ready applications faster without sacrificing quality,
              security, or scalability. We believe that great software should be
              accessible to everyone, and the best way to achieve that is by
              providing robust, well-documented, and easy-to-use tools.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Fullstack Starter represents our commitment to this mission -
              a comprehensive template that includes everything you need to
              launch your next project: authentication, database integration,
              API routes, mobile apps, and more. All built with industry best
              practices and modern technologies.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ValueCard
              icon={
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              }
              title="Quality First"
              description="We believe in shipping high-quality code with comprehensive testing, clean architecture, and thorough documentation."
            />
            <ValueCard
              icon={
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              }
              title="Security by Default"
              description="Security is not an afterthought. Every feature is designed with security best practices from the ground up."
            />
            <ValueCard
              icon={
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              }
              title="Developer Experience"
              description="Great tools should be a joy to use. We prioritize intuitive APIs, helpful error messages, and comprehensive guides."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
            Our Team
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            A passionate group of developers, designers, and problem solvers
            dedicated to making your development journey smoother.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Have questions or want to learn more? We would love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="mailto:hello@example.com"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              hello@example.com
            </a>
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
    <div className="bg-card rounded-lg border border-border p-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
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
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <p className="text-muted-foreground">{role}</p>
    </div>
  );
}
