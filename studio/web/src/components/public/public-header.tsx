"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Layers } from "lucide-react";
import { useState } from "react";
import { Button, ThemeToggle, Container, NavigationProgress } from "@/components/ui";
import { useNavigationProgress } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/showcase", label: "Components" },
  { href: "/configure", label: "Configure" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigating, progress, handleLinkClick } = useNavigationProgress();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Xitolaunch</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" size="sm" />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/admin" onClick={() => handleLinkClick("/admin")}>Admin</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/configure" onClick={() => handleLinkClick("/configure")}>Start Building</Link>
            </Button>

            {/* Mobile Menu Button - 44px min touch target */}
            <button
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-nav" className="md:hidden border-t bg-background">
          <Container>
            <nav className="flex flex-col py-4 space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => { handleLinkClick(link.href); setMobileMenuOpen(false); }}
                  className={cn(
                    "px-4 py-3 min-h-[44px] flex items-center rounded-md text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/admin" onClick={() => { handleLinkClick("/admin"); setMobileMenuOpen(false); }}>
                    Admin
                  </Link>
                </Button>
                <Button asChild className="min-h-[44px]">
                  <Link href="/configure" onClick={() => { handleLinkClick("/configure"); setMobileMenuOpen(false); }}>
                    Start Building
                  </Link>
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      )}

      <NavigationProgress navigating={navigating} progress={progress} />
    </header>
  );
}
