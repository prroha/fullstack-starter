import Link from "next/link";
import { Header, HeaderNavLink, Footer } from "@/components/layout";

/**
 * Public pages layout with header and footer.
 * Used for About, FAQ, Terms, Privacy, and other public content pages.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <Header
        logo={
          <span className="text-xl font-bold text-foreground">
            Fullstack Starter
          </span>
        }
        nav={
          <>
            <HeaderNavLink href="/">Home</HeaderNavLink>
            <HeaderNavLink href="/about">About</HeaderNavLink>
            <HeaderNavLink href="/faq">FAQ</HeaderNavLink>
          </>
        }
        actions={
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign In
          </Link>
        }
      />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer
        logo={
          <span className="text-xl font-bold text-foreground">
            Fullstack Starter
          </span>
        }
        copyright={`${currentYear} Your Company. All rights reserved.`}
        links={[
          {
            title: "Product",
            links: [
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
              { label: "FAQ", href: "/faq" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
            ],
          },
        ]}
      >
        Building modern full-stack applications with the best developer experience.
      </Footer>
    </div>
  );
}
