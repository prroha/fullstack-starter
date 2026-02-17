import * as React from "react";
import { cn } from "@/lib/utils";
import { AppLink, Text } from "@/components/ui";

// =====================================================
// Footer Component
// =====================================================

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  copyright?: string;
  links?: FooterLinkGroup[];
  socials?: FooterSocialLink[];
}

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

interface FooterSocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function Footer({
  className,
  logo,
  copyright,
  links,
  socials,
  children,
  ...props
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `${currentYear} Your Company. All rights reserved.`;

  return (
    <footer
      className={cn("w-full border-t border-border bg-background", className)}
      {...props}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and description */}
          <div className="space-y-4">
            {logo ?? (
              <Text className="text-xl font-bold">Logo</Text>
            )}
            {children && (
              <Text size="sm" color="muted">{children}</Text>
            )}
          </div>

          {/* Link groups */}
          {links?.map((group, index) => (
            <div key={index} className="space-y-4">
              <Text size="sm" className="font-semibold">
                {group.title}
              </Text>
              <ul className="space-y-2">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <AppLink
                      href={link.href}
                      variant="muted"
                      size="sm"
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <Text size="sm" color="muted">
            {copyright ?? defaultCopyright}
          </Text>

          {/* Social links */}
          {socials && socials.length > 0 && (
            <div className="flex items-center gap-4">
              {socials.map((social, index) => (
                <AppLink
                  key={index}
                  href={social.href}
                  variant="muted"
                  external
                  aria-label={social.label}
                >
                  {social.icon}
                </AppLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// =====================================================
// Simple Footer Component
// =====================================================

interface SimpleFooterProps extends React.HTMLAttributes<HTMLElement> {
  copyright?: string;
  /** Whether to show legal links (About, FAQ, Terms, Privacy) */
  showLegalLinks?: boolean;
}

function SimpleFooter({
  className,
  copyright,
  showLegalLinks = true,
  ...props
}: SimpleFooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `${currentYear} Your Company. All rights reserved.`;

  const legalLinks = [
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

  return (
    <footer
      className={cn(
        "w-full border-t border-border bg-background py-6",
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Text size="sm" color="muted">
            {copyright ?? defaultCopyright}
          </Text>
          {showLegalLinks && (
            <nav className="flex items-center gap-4" aria-label="Legal links">
              {legalLinks.map((link) => (
                <AppLink
                  key={link.href}
                  href={link.href}
                  variant="muted"
                  size="sm"
                >
                  {link.label}
                </AppLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

export { Footer, SimpleFooter };
export type { FooterProps, FooterLinkGroup, FooterSocialLink, SimpleFooterProps };
