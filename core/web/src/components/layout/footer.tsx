import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and description */}
          <div className="space-y-4">
            {logo ?? (
              <span className="text-xl font-bold text-foreground">Logo</span>
            )}
            {children && (
              <p className="text-sm text-muted-foreground">{children}</p>
            )}
          </div>

          {/* Link groups */}
          {links?.map((group, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {copyright ?? defaultCopyright}
          </p>

          {/* Social links */}
          {socials && socials.length > 0 && (
            <div className="flex items-center gap-4">
              {socials.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
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
}

function SimpleFooter({ className, copyright, ...props }: SimpleFooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `${currentYear} Your Company. All rights reserved.`;

  return (
    <footer
      className={cn(
        "w-full border-t border-border bg-background py-6",
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          {copyright ?? defaultCopyright}
        </p>
      </div>
    </footer>
  );
}

export { Footer, SimpleFooter };
export type { FooterProps, FooterLinkGroup, FooterSocialLink, SimpleFooterProps };
