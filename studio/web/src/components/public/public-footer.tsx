import Link from "next/link";
import { Layers, Github, Twitter } from "lucide-react";
import { Container } from "@/components/ui";

const footerLinks = {
  product: [
    { href: "/showcase", label: "Components" },
    { href: "/configure", label: "Configurator" },
    { href: "/templates", label: "Templates" },
    { href: "/pricing", label: "Pricing" },
  ],
};

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30" role="contentinfo">
      <Container>
        <div className="py-12 grid gap-8 md:grid-cols-2">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-bold text-lg">Xitolaunch</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Build production-ready fullstack applications with configurable features and live preview.
            </p>
            <div className="flex items-center gap-3" role="list" aria-label="Social media links">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Visit our GitHub page"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <nav aria-labelledby="footer-product-heading">
            <h3 id="footer-product-heading" className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Xitolaunch. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
